/**
 * knowledgeSearch.js
 * Zero-dependency keyword search through the static knowledge base markdown files.
 * 
 * Strategy:
 *   1. Load all .md files from the knowledge/ directory (cached in memory)
 *   2. Split each document into 500-char chunks with 100-char overlap
 *   3. For a query: tokenize → score each chunk by term frequency → return top N
 */

const fs   = require('fs');
const path = require('path');

const KB_DIR = path.join(__dirname, '../knowledge');

// ─── In-memory cache ─────────────────────────────────────────────────────────
let _cache = null; // { chunks: [{text, source, docTitle}] }

function loadKnowledgeBase() {
  if (_cache) return _cache;

  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
  const chunks = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(KB_DIR, file), 'utf8');
    const title   = file.replace('.md', '').replace(/_/g, ' ');
    const docChunks = chunkText(content, 500, 100);

    for (const text of docChunks) {
      chunks.push({ text, source: file, docTitle: title });
    }
  }

  _cache = { chunks };
  return _cache;
}

/**
 * Split text into overlapping chunks.
 * @param {string} text
 * @param {number} chunkSize  Max characters per chunk
 * @param {number} overlap    Characters shared between consecutive chunks
 */
function chunkText(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks.filter(c => c.length > 40); // skip tiny leftover chunks
}

/**
 * Tokenize a string into lowercase words (stop-words removed).
 */
const STOP_WORDS = new Set([
  'the','a','an','is','in','on','at','to','for','of','and','or','but',
  'with','from','this','that','it','as','by','are','was','were','be',
  'has','have','had','do','does','can','will','not','no','if','when',
  'how','what','which','who','where','i','my','your','their','its','our',
  'each','all','any','some','than','then','so','also','get','use','into'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s%$\/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Score a chunk against query tokens using term frequency.
 * Bonus multiplier if all query terms appear (exact match bonus).
 */
function scoreChunk(chunkTokens, queryTokens) {
  let score = 0;
  let matches = 0;

  for (const qt of queryTokens) {
    const count = chunkTokens.filter(ct => ct === qt || ct.startsWith(qt)).length;
    if (count > 0) {
      score += count;
      matches++;
    }
  }

  // Bonus if most query terms matched
  if (queryTokens.length > 0 && matches / queryTokens.length >= 0.6) {
    score *= 1.5;
  }

  return score;
}

/**
 * Search the knowledge base.
 * @param {string} query - raw query string
 * @param {number} topN  - number of chunks to return (default 5)
 * @returns Array of { text, source, docTitle, score }
 */
function searchKnowledge(query, topN = 5) {
  const { chunks } = loadKnowledgeBase();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  const scored = chunks.map(chunk => {
    const chunkTokens = tokenize(chunk.text);
    const score = scoreChunk(chunkTokens, queryTokens);
    return { ...chunk, score };
  });

  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Get the full content of a specific knowledge document by filename.
 */
function getDocument(filename) {
  const filePath = path.join(KB_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * List all knowledge base documents with their titles.
 */
function listDocuments() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => ({
    filename: f,
    title: f.replace('.md', '').replace(/_/g, ' ')
  }));
}

/**
 * Reload the cache (useful after adding new KB documents).
 */
function reloadCache() {
  _cache = null;
  return loadKnowledgeBase();
}

module.exports = { searchKnowledge, getDocument, listDocuments, reloadCache };
