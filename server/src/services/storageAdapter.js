/**
 * storageAdapter.js
 *
 * Abstracts local disk vs S3-compatible storage behind a single interface.
 * Switch via env var: STORAGE_BACKEND=local (default) | s3
 *
 * Local  → reads/serves from ./uploads/projects/
 * S3     → multer-s3 writes directly to bucket; serve returns a 15-min signed URL
 *
 * The adapter is a singleton — imported once, shared across routes.
 */

const path      = require('path');
const fs        = require('fs');
const logger    = require('../utils/logger');

// ── Lazy-load S3 deps so the server still boots without them in local mode ──
let s3Client, GetObjectCommand, DeleteObjectCommand, getSignedUrl;

function getS3Client() {
    if (!s3Client) {
        const { S3Client }            = require('@aws-sdk/client-s3');
        const { GetObjectCommand: G, DeleteObjectCommand: D } = require('@aws-sdk/client-s3');
        const { getSignedUrl: GSU }   = require('@aws-sdk/s3-request-presigner');

        GetObjectCommand    = G;
        DeleteObjectCommand = D;
        getSignedUrl        = GSU;

        const cleanEndpoint = process.env.S3_ENDPOINT ? process.env.S3_ENDPOINT.replace(/\/$/, '') : null;

        logger.info('S3 client initialised', {
            endpoint: process.env.S3_ENDPOINT || 'AWS default',
            bucket:   process.env.S3_BUCKET,
            region:   process.env.AWS_REGION || 'auto',
        });

        s3Client = new S3Client({
            region:      process.env.AWS_REGION || 'auto',
            credentials: {
                accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
            // S3-compatible endpoint (Cloudflare R2, MinIO, Backblaze, etc.)
            ...(cleanEndpoint && {
                endpoint:       cleanEndpoint,
                forcePathStyle: true, // Path-style is more reliable for S3-compatible providers
            }),
        });

        logger.info('S3 client initialised', {
            endpoint: process.env.S3_ENDPOINT || 'AWS default',
            bucket:   process.env.S3_BUCKET,
            region:   process.env.AWS_REGION || 'auto',
        });
    }
    return s3Client;
}

// ── Determine active backend ─────────────────────────────────────────────────
const BACKEND = (process.env.STORAGE_BACKEND || 'local').toLowerCase();
const BUCKET  = process.env.S3_BUCKET || '';

logger.info(`Storage backend: ${BACKEND}${BACKEND === 's3' ? ` → bucket: ${BUCKET}` : ''}`);

// ── Public interface ─────────────────────────────────────────────────────────

const adapter = {

    /**
     * Which backend is active.
     * @returns {'local' | 's3'}
     */
    get backend() {
        return BACKEND;
    },

    /**
     * Returns true when S3 is the active backend.
     */
    get isS3() {
        return BACKEND === 's3';
    },

    /**
     * Build the multer storage engine for the active backend.
     * Used by attachmentRoutes when constructing the upload middleware.
     *
     * @param {object} opts
     * @param {function} opts.localDestination  - (req) => absolute directory path
     * @param {function} opts.s3Key             - (req, file) => S3 object key string
     * @returns multer storage instance
     */
    buildStorage({ localDestination, s3Key }) {
        if (BACKEND === 's3') {
            const multerS3 = require('multer-s3');
            return multerS3({
                s3:          getS3Client(),
                bucket:      BUCKET,
                // Never make files public — always gated behind signed URL
                contentType: multerS3.AUTO_CONTENT_TYPE,
                key:         (req, file, cb) => {
                    const key = s3Key(req, file);
                    logger.info('Generating S3 key for upload', { originalName: file.originalname, key });
                    cb(null, key);
                },
                metadata:    (req, file, cb) => {
                    cb(null, {
                        uploadedBy:   String(req.userId || 'unknown'),
                        projectId:    String(req.params.projectId || 'unknown'),
                        originalName: file.originalname,
                    });
                },
            });
        }

        // Local disk storage (default)
        const fsP    = require('fs').promises;
        const multer = require('multer');
        return multer.diskStorage({
            destination: async (req, file, cb) => {
                const dir = localDestination(req);
                try {
                    await fsP.mkdir(dir, { recursive: true });
                    cb(null, dir);
                } catch (err) {
                    cb(err);
                }
            },
            filename: (_req, file, cb) => {
                const suffix   = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                const safeName = file.originalname
                    .replace(/[^a-zA-Z0-9._-]/g, '_')
                    .slice(0, 100);
                cb(null, `${suffix}-${safeName}`);
            },
        });
    },

    /**
     * After multer runs, extract consistent metadata regardless of backend.
     *
     * Local → { storageKey: relative path, filePath: relative URL path }
     * S3    → { storageKey: S3 object key, filePath: '' (no local path) }
     *
     * @param {object} file       - multer file object
     * @param {string} projectId
     * @returns {{ storageKey: string, filePath: string, storedMime: string }}
     */
    extractFileMeta(file, projectId) {
        const storedMime = file.mimetype === 'image/svg+xml' ? 'text/plain' : file.mimetype;

        if (BACKEND === 's3') {
            return {
                storageKey:  file.key,                               // S3 object key
                filePath:    '',                                     // no local path
                filename:    file.key.split('/').pop(),
                storedMime,
            };
        }

        return {
            storageKey:  `/uploads/projects/${projectId}/${file.filename}`,
            filePath:    `/uploads/projects/${projectId}/${file.filename}`,
            filename:    file.filename,
            storedMime,
        };
    },

    /**
     * Get a URL/stream source for serving a file.
     *
     * Local → { type: 'stream', absolutePath }
     * S3    → { type: 'redirect', signedUrl }  (15-minute expiry)
     *
     * @param {object} attachment  - DB row with file_path / storage_key
     * @param {string} disposition - 'inline' | 'attachment'
     * @param {string} filename    - original filename for Content-Disposition
     */
    async getServeSource(attachment, disposition = 'inline', filename) {
        // Determine storage key — prefer storage_key column if present (S3 records),
        // fall back to file_path (legacy local records)
        const storageKey = attachment.storage_key || null;
        const filePath   = attachment.file_path   || null;

        if (BACKEND === 's3' && storageKey) {
            const command = new GetObjectCommand({
                Bucket: BUCKET,
                Key:    storageKey,
                ResponseContentDisposition: `${disposition}; filename="${encodeURIComponent(filename)}"`,
            });
            const signedUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 900 }); // 15 min
            return { type: 'redirect', signedUrl };
        }

        // Local disk (or legacy local records even when backend is now S3)
        const relPath  = (filePath || '').startsWith('/') ? (filePath || '').slice(1) : (filePath || '');
        const absPath  = path.join(__dirname, '../../', relPath);
        return { type: 'stream', absolutePath: absPath };
    },

    /**
     * Delete a file from the active storage.
     * Best-effort — errors are logged but do not throw (DB soft-delete happened first).
     *
     * @param {object} attachment  - DB row
     */
    async deleteFile(attachment) {
        const storageKey = attachment.storage_key || null;
        const filePath   = attachment.file_path   || null;

        if (BACKEND === 's3' && storageKey) {
            try {
                await getS3Client().send(new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key:    storageKey,
                }));
                logger.info('S3 object deleted', { key: storageKey });
            } catch (err) {
                logger.warn('S3 delete failed — object may need manual cleanup', {
                    key:   storageKey,
                    error: err.message,
                });
            }
            return;
        }

        // Local disk
        const relPath = (filePath || '').startsWith('/') ? (filePath || '').slice(1) : (filePath || '');
        const absPath = path.join(__dirname, '../../', relPath);
        fs.unlink(absPath, (err) => {
            if (err && err.code !== 'ENOENT') {
                logger.warn('Disk delete failed — file needs manual cleanup', {
                    path:  absPath,
                    error: err.message,
                });
            }
        });
    },
};

module.exports = adapter;
