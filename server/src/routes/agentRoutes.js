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

const { runAgent, getHistory, clearHistory } = require('../ai/agent/agent');
const authMiddleware = require('../middleware/auth');

/**
 * POST /api/agent/chat
 * Body: { message: string, sessionId?: string }
 * Returns SSE stream: data: {"text":"...", "done": true/false}
 */
router.post('/chat', authMiddleware, async (req, res) => {
  const { message, sessionId: clientSessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  if (message.trim().length > 1000) {
    return res.status(400).json({ success: false, error: 'Message too long (max 1000 chars)' });
  }

  // Build user context from the auth middleware
  const context = {
    userId:    req.userId,
    companyId: req.companyId,
    role:      req.userRole || req.user?.role || 'estimator',
    sessionId: clientSessionId || `user_${req.userId}`,
  };

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // For nginx
  res.flushHeaders();

  // Send "thinking" status immediately
  sendSSE(res, { status: 'thinking', text: '' });

  try {
    const result = await runAgent(message.trim(), context);

    // Simulate token streaming by sending the response in chunks
    const text   = result.text || '';
    const chunks = splitIntoChunks(text, 40); // ~40 chars per chunk

    for (let i = 0; i < chunks.length; i++) {
      sendSSE(res, {
        status: 'streaming',
        text:   chunks[i],
        done:   false,
      });
      // Small delay to simulate streaming effect
      await sleep(18);
    }

    // Final done event with metadata
    sendSSE(res, {
      status: 'done',
      text:   '',
      done:   true,
      tool:   result.tool   || null,
      source: result.source || null,
      intent: result.intent || null,
    });

  } catch (err) {
    console.error('[AgentRoutes] Error:', err);
    sendSSE(res, {
      status: 'error',
      text: '⚠️ Something went wrong. Please try again.',
      done: true,
    });
  } finally {
    res.end();
  }
});

/**
 * GET /api/agent/history
 * Returns the conversation history for the current user session.
 */
router.get('/history', authMiddleware, (req, res) => {
  const sessionId = `user_${req.userId}`;
  const history   = getHistory(sessionId);
  res.json({ success: true, history });
});

/**
 * POST /api/agent/clear
 * Clears the conversation history for the current session.
 */
router.post('/clear', authMiddleware, (req, res) => {
  const sessionId = `user_${req.userId}`;
  clearHistory(sessionId);
  res.json({ success: true, message: 'Conversation cleared.' });
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
