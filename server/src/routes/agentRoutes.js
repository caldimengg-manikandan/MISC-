/**
 * agentRoutes.js
 * Express routes for the MISC Pro AI assistant.
 *
 * POST /api/agent/chat     — Main chat endpoint (SSE streaming)
 * GET  /api/agent/history  — Get session conversation history
 * POST /api/agent/clear    — Clear session history
 */

const express = require('express');
const router  = express.Router();

const { 
  runAgent, 
  getChatThreads, 
  getThreadHistory, 
  deleteThread 
} = require('../ai/agent/agent');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/agent/chat
 * Body: { message: string, chatId?: number }
 */
router.post('/chat', authMiddleware, async (req, res) => {
  const { message, chatId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const context = {
    userId:    req.userId,
    companyId: req.companyId,
    role:      req.userRole || req.user?.role || 'estimator',
    chatId:    chatId || null
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sendSSE(res, { status: 'thinking', text: '' });

  try {
    const result = await runAgent(message.trim(), context);

    const text   = result.text || '';
    const chunks = splitIntoChunks(text, 50);

    for (let i = 0; i < chunks.length; i++) {
      sendSSE(res, {
        status: 'streaming',
        text:   chunks[i],
        done:   false,
      });
      await sleep(15);
    }

    sendSSE(res, {
      status: 'done',
      text:   '',
      done:   true,
      chatId: result.chatId,
      tool:   result.tool   || null,
      source: result.source || null,
      intent: result.intent || null,
    });

  } catch (err) {
    console.error('[AgentRoutes] Error:', err);
    sendSSE(res, {
      status: 'error',
      text: '⚠️ Something went wrong.',
      done: true,
    });
  } finally {
    res.end();
  }
});

/**
 * GET /api/agent/threads
 * List recent chat threads
 */
router.get('/threads', authMiddleware, async (req, res) => {
  try {
    const threads = await getChatThreads(req.userId);
    res.json({ success: true, threads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/agent/threads/:id
 * Get history for a specific thread
 */
router.get('/threads/:id', authMiddleware, async (req, res) => {
  try {
    const history = await getThreadHistory(req.params.id);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/agent/threads/:id
 * Delete a thread
 */
router.delete('/threads/:id', authMiddleware, async (req, res) => {
  try {
    await deleteThread(req.params.id);
    res.json({ success: true, message: 'Thread deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendSSE(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (_) { /* stream closed */ }
}

function splitIntoChunks(text, chunkSize = 40) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    // Try to break at a space boundary for clean streaming
    let end = Math.min(i + chunkSize, text.length);
    if (end < text.length) {
      const spaceIdx = text.lastIndexOf(' ', end);
      if (spaceIdx > i) end = spaceIdx + 1;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = router;
