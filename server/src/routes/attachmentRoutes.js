/**
 * attachmentRoutes.js
 *
 * Hardened attachment API — supports both local disk and S3-compatible storage.
 * Active backend is controlled by: STORAGE_BACKEND=local (default) | s3
 *
 * Auth + licenseCheck applied globally at server.js — not repeated here.
 *
 * Endpoints:
 *   GET    /:projectId/attachments                        — list (paginated, filterable)
 *   POST   /:projectId/attachments                        — upload 1-10 files
 *   GET    /:projectId/attachments/:id/serve              — inline preview (signed URL or stream)
 *   GET    /:projectId/attachments/:id/download           — force-download
 *   DELETE /:projectId/attachments/:id                    — soft-delete + storage cleanup
 */

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const { query } = require('../config/mssql');
const logger    = require('../utils/logger');
const storage   = require('../services/storageAdapter');  // ← unified local/S3 adapter
const resolveOwnerAdminId = require('../utils/resolveOwnerAdminId');
const rateLimit = require('express-rate-limit');

// ── Rate Limiting ─────────────────────────────────────────────────────────────

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 uploads per window
    message: { success: false, error: 'Too many uploads from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Allowed Types ─────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.xls', '.xlsx']);

// ── Magic-byte validation (no new deps — pure Node Buffer) ───────────────────

function validateMagicBytes(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.svg') {
        const head = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }).slice(0, 600);
        if (!head.includes('<svg') && !head.includes('<?xml')) throw new Error('SVG content invalid');
        if (/<script/i.test(head)) throw new Error('SVG contains disallowed <script> element');
        return;
    }

    const buf = Buffer.alloc(4);
    const fd  = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    const hex = buf.toString('hex').toLowerCase();

    const signatures = {
        'ffd8ff':   ['.jpg', '.jpeg'],
        '89504e47': ['.png'],
        '47494638': ['.gif'],
        '25504446': ['.pdf'],
        '504b0304': ['.xlsx', '.docx', '.pptx', '.zip'], // Common PKZIP-based formats
        '504b0506': ['.xlsx', '.docx', '.pptx', '.zip'], // Empty zip
        '504b0708': ['.xlsx', '.docx', '.pptx', '.zip'], // Spanned zip
        'd0cf11e0': ['.xls', '.doc', '.ppt'],           // Legacy OLE formats
    };
    const matched = signatures[hex] || signatures[hex.slice(0, 6)];
    if (matched && !matched.includes(ext)) {
        logger.warn(`Validation mismatch: File ${ext} has magic bytes ${hex}`);
        throw new Error(`Magic bytes (${hex}) do not match declared extension (${ext})`);
    }
}

// ── Multer setup (delegates storage engine to adapter) ───────────────────────

const multerStorage = storage.buildStorage({
    // Local mode: destination directory per project
    localDestination: (req) =>
        path.join(__dirname, '../../uploads/projects', String(req.params.projectId || 'unknown')),

    // S3 mode: structured object key  projects/{projectId}/{uuid}/{safeName}
    s3Key: (req, file) => {
        const uid      = crypto.randomUUID();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
        return `projects/${req.params.projectId}/${uid}/${safeName}`;
    },
});

const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
        return cb(new Error('Invalid file type. Allowed: SVG, PNG, JPG, PDF, XLS, XLSX'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage:  multerStorage,
    limits:   { fileSize: 200 * 1024 * 1024, files: 10 },
    fileFilter,
});

// ── Ownership Guard ───────────────────────────────────────────────────────────

async function ownershipGuard(req, res, next) {
    try {
        const { projectId } = req.params;
        const { userId, companyId, userRole } = req;

        logger.info(`Ownership check: ${req.method} project ${projectId}`, { userId, role: userRole });

        if (!projectId || !userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Superadmin bypasses check
        if (userRole === 'superadmin') return next();

        // Use the centralized resolver to find the owning admin ID for this user/tenant
        const ownerAdminId = await resolveOwnerAdminId(req);

        // Access Rule: User can see attachments if:
        // 1. They are the creator (userId)
        // 2. They belong to the owning company (companyId)
        // 3. They are the assigned engineer or reviewer
        const [rows] = await query(
            `SELECT 1 AS ok FROM projects
             WHERE id = @projectId
               AND (createdBy = @userId 
                    OR company_id = @companyId 
                    OR owner_admin_id = @ownerAdminId
                    OR assigned_engineer_id = @userId 
                    OR reviewer_id = @userId)`,
            { projectId, userId, companyId, ownerAdminId }
        );

        if (!rows || rows.length === 0) {
            logger.warn('Attachment ownership check failed', { userId, projectId, companyId });
            return res.status(403).json({ success: false, error: 'Access denied to this project' });
        }

        next();
    } catch (err) {
        logger.error('ownershipGuard error', { error: err.message });
        res.status(500).json({ success: false, error: 'Server error during access validation' });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /:projectId/attachments
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:projectId/attachments', ownershipGuard, async (req, res) => {
    try {
        const { projectId } = req.params;
        const limit         = Math.min(parseInt(req.query.limit) || 100, 200);
        const type          = req.query.type;  // 'image' | 'document'

        let typeClause = '';
        if (type === 'image')    typeClause = `AND mime_type LIKE 'image/%'`;
        if (type === 'document') typeClause = `AND mime_type NOT LIKE 'image/%'`;

        const [rows] = await query(
            `SELECT TOP (@limit)
                 id,
                 original_name  AS file_name,
                 file_path,
                 storage_key,
                 mime_type      AS file_type,
                 file_size,
                 createdAt
             FROM project_attachments
             WHERE projectId  = @projectId
               AND (is_deleted = 0 OR is_deleted IS NULL)
               ${typeClause}
             ORDER BY createdAt DESC`,
            { projectId, limit }
        );

        res.json({ success: true, data: rows, count: rows.length });
    } catch (error) {
        logger.error('Error fetching attachments', {
            projectId: req.params.projectId,
            error: error.message,
        });
        res.status(500).json({ success: false, error: 'Failed to fetch attachments' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:projectId/attachments
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// POST /:projectId/attachments
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:projectId/attachments', uploadLimiter, ownershipGuard, upload.array('files', 10), async (req, res) => {
    const { projectId } = req.params;
    const { userId }    = req;
    const files         = req.files;

    if (!files || files.length === 0) {
        logger.warn('Upload attempt with no files', { projectId, userId });
        return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    logger.info(`Processing ${files.length} uploads for project ${projectId}`, { userId });

    const uploaded = [];
    const failed   = [];

    await Promise.allSettled(
        files.map(async (file) => {
            try {
                logger.info(`Validating file: ${file.originalname}`, { size: file.size, mime: file.mimetype });

                // Magic-byte validation (local only — S3 files aren't on disk)
                if (!storage.isS3) {
                    validateMagicBytes(file.path);
                }

                // Pull consistent metadata from the adapter
                const { storageKey, filePath, filename, storedMime } =
                    storage.extractFileMeta(file, projectId);
                
                logger.info(`Saving metadata to DB: ${filename}`, { storageKey });

                const ownerAdminId = await resolveOwnerAdminId(req);
                const [result] = await query(
                    `INSERT INTO project_attachments
                         (projectId, userId, filename, original_name, mime_type,
                          file_path, storage_key, file_size, company_id, owner_admin_id)
                     OUTPUT
                         INSERTED.id,
                         INSERTED.original_name AS file_name,
                         INSERTED.file_path,
                         INSERTED.storage_key,
                         INSERTED.mime_type     AS file_type,
                         INSERTED.file_size
                     VALUES
                         (@projectId, @userId, @filename, @originalName, @mimeType,
                          @filePath, @storageKey, @fileSize, @companyId, @ownerAdminId)`,
                    {
                        projectId,
                        userId,
                        filename:     filename,
                        originalName: file.originalname,
                        mimeType:     storedMime,
                        filePath:     filePath,
                        storageKey:   storageKey,
                        fileSize:     file.size,
                        companyId:    req.companyId,
                        ownerAdminId: ownerAdminId
                    }
                );

                if (result && result.length > 0) uploaded.push(result[0]);

            } catch (fileErr) {
                // Clean up local disk file if DB failed; S3 orphans are cheap
                if (!storage.isS3 && file.path) fs.unlink(file.path, () => {});
                logger.warn('File upload rejected', {
                    filename: file.originalname, projectId, reason: fileErr.message,
                });
                failed.push({ name: file.originalname, reason: fileErr.message });
            }
        })
    );

    if (uploaded.length === 0 && failed.length > 0) {
        return res.status(422).json({
            success: false,
            error: 'All uploaded files failed validation',
            failed,
        });
    }

    res.status(201).json({
        success: true,
        data: uploaded,
        ...(failed.length > 0 && { warnings: failed }),
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /:projectId/attachments/:attachmentId/serve
// Local  → stream file with auth headers
// S3     → 302 redirect to 15-minute signed URL
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:projectId/attachments/:attachmentId/serve', ownershipGuard, async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        const [rows] = await query(
            `SELECT id, original_name, file_path, storage_key, mime_type, file_size
             FROM project_attachments
             WHERE id          = @attachmentId
               AND projectId   = @projectId
               AND (is_deleted = 0 OR is_deleted IS NULL)`,
            { attachmentId, projectId }
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Attachment not found' });
        }

        const att    = rows[0];
        const source = await storage.getServeSource(att, 'inline', att.original_name);

        if (source.type === 'redirect') {
            // S3: send signed URL — browser follows redirect directly to S3
            return res.redirect(302, source.signedUrl);
        }

        // Local: stream through Express
        if (!fs.existsSync(source.absolutePath)) {
            logger.warn('Attachment file missing from disk', { attachmentId, path: source.absolutePath });
            return res.status(404).json({ success: false, error: 'File not found on server' });
        }

        const servedMime = (att.mime_type === 'image/svg+xml' || att.mime_type === 'text/plain')
            ? 'text/plain' : (att.mime_type || 'application/octet-stream');

        res.setHeader('Content-Type',           servedMime);
        res.setHeader('Content-Disposition',    `inline; filename="${encodeURIComponent(att.original_name)}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control',          'private, max-age=3600');

        fs.createReadStream(source.absolutePath).pipe(res);

    } catch (error) {
        logger.error('Error serving attachment', {
            attachmentId: req.params.attachmentId,
            error: error.message,
        });
        res.status(500).json({ success: false, error: 'Failed to serve file' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /:projectId/attachments/:attachmentId/download
// Force-download (Content-Disposition: attachment)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:projectId/attachments/:attachmentId/download', ownershipGuard, async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        const [rows] = await query(
            `SELECT id, original_name, file_path, storage_key, mime_type
             FROM project_attachments
             WHERE id          = @attachmentId
               AND projectId   = @projectId
               AND (is_deleted = 0 OR is_deleted IS NULL)`,
            { attachmentId, projectId }
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Attachment not found' });
        }

        const att    = rows[0];
        const source = await storage.getServeSource(att, 'attachment', att.original_name);

        if (source.type === 'redirect') {
            return res.redirect(302, source.signedUrl);
        }

        if (!fs.existsSync(source.absolutePath)) {
            return res.status(404).json({ success: false, error: 'File not found on server' });
        }

        res.setHeader('Content-Disposition',    `attachment; filename="${encodeURIComponent(att.original_name)}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');

        fs.createReadStream(source.absolutePath).pipe(res);

    } catch (error) {
        logger.error('Error downloading attachment', {
            attachmentId: req.params.attachmentId,
            error: error.message,
        });
        res.status(500).json({ success: false, error: 'Failed to download file' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /:projectId/attachments/bulk-delete
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:projectId/attachments/bulk-delete', ownershipGuard, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { attachmentIds } = req.body;

        if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
            return res.status(400).json({ success: false, error: 'No attachment IDs provided' });
        }

        // Fetch records to ensure they exist and belong to the project
        const [attachments] = await query(
            `SELECT id, file_path, storage_key FROM project_attachments 
             WHERE projectId = @projectId AND id IN (${attachmentIds.map((_, i) => `@id${i}`).join(',')})
               AND (is_deleted = 0 OR is_deleted IS NULL)`,
            { projectId, ...attachmentIds.reduce((acc, id, i) => ({ ...acc, [`id${i}`]: id }), {}) }
        );

        if (!attachments || attachments.length === 0) {
            return res.status(404).json({ success: false, error: 'No matching attachments found' });
        }

        // Step 1: Soft delete in DB
        await query(
            `UPDATE project_attachments SET is_deleted = 1 
             WHERE projectId = @projectId AND id IN (${attachmentIds.map((_, i) => `@id${i}`).join(',')})`,
            { projectId, ...attachmentIds.reduce((acc, id, i) => ({ ...acc, [`id${i}`]: id }), {}) }
        );

        // Step 2: Delete from storage (async)
        attachments.forEach(att => {
            storage.deleteFile(att).catch(err => logger.warn('Bulk delete storage error', { id: att.id, error: err.message }));
        });

        logger.info('Bulk attachments deleted', { count: attachments.length, projectId, userId: req.userId });
        res.json({ success: true, message: `${attachments.length} attachments deleted` });
    } catch (error) {
        logger.error('Bulk delete error', { projectId: req.params.projectId, error: error.message });
        res.status(500).json({ success: false, error: 'Failed to perform bulk delete' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /:projectId/attachments/:attachmentId
// Soft-delete in DB → delete from storage (best-effort)
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/:projectId/attachments/:attachmentId', ownershipGuard, async (req, res) => {
    try {
        const { projectId, attachmentId } = req.params;

        const [rows] = await query(
            `SELECT id, file_path, storage_key
             FROM project_attachments
             WHERE id          = @attachmentId
               AND projectId   = @projectId
               AND (is_deleted = 0 OR is_deleted IS NULL)`,
            { attachmentId, projectId }
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Attachment not found' });
        }

        // Step 1 — soft-delete in DB (instant, reversible, no race condition)
        await query(
            `UPDATE project_attachments SET is_deleted = 1
             WHERE id = @attachmentId AND projectId = @projectId`,
            { attachmentId, projectId }
        );

        // Step 2 — delete from storage (async, best-effort via adapter)
        await storage.deleteFile(rows[0]);

        logger.info('Attachment deleted', { attachmentId, projectId, userId: req.userId });
        res.json({ success: true, message: 'Attachment deleted' });

    } catch (error) {
        logger.error('Error deleting attachment', {
            attachmentId: req.params.attachmentId,
            error: error.message,
        });
        res.status(500).json({ success: false, error: 'Failed to delete attachment' });
    }
});

module.exports = router;
