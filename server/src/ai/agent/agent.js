/**
 * agent.js
 * Main RAG agent orchestrator. No external API needed.
 * 
 * Flow:
 *   1. Receive query + user context (userId, companyId, role)
 *   2. Classify query intent → STATIC / DYNAMIC / MIXED / BLOCKED
 *   3. STATIC: search knowledge base → format response
 *   4. DYNAMIC: run DB tool(s) → format response
 *   5. MIXED: do both → merge response
 *   6. BLOCKED: return polite denial message
 */

const { classifyQuery, routeToTools } = require('./queryRouter');
const { searchKnowledge }             = require('../search/knowledgeSearch');
const { executeTool }                 = require('../tools/index');
const rb                              = require('./responseBuilder');

// In-memory conversation history (per session) — keyed by sessionId
const conversationHistory = new Map();
const MAX_HISTORY = 10; // per session

/**
 * Main agent entry point.
 * 
 * @param {string}  query      - User's message
 * @param {object}  context    - { userId, companyId, role, sessionId }
 * @returns {Promise<{text: string, tool?: string, source?: string}>}
 */
async function runAgent(query, context) {
  const { userId, companyId, role, sessionId = 'default' } = context;

  // Basic sanity check
  if (!query || query.trim().length === 0) {
    return { text: 'Please ask me something! I can help with calculations, project data, workflow, and more.' };
  }

  // Append query to session history
  appendHistory(sessionId, { role: 'user', content: query });

  // 1. Classify the query
  const classification = classifyQuery(query, role);

  let responseText = '';
  let toolUsed     = null;
  let sourceDocs   = null;

  try {
    if (classification.type === 'BLOCKED') {
      responseText = rb.buildBlockedResponse(query, classification.reason);

    } else if (classification.type === 'STATIC') {
      // Knowledge base search
      const chunks = searchKnowledge(query, 5);
      responseText = rb.buildStaticResponse(chunks, query);
      sourceDocs   = chunks.length > 0 ? chunks[0].source : null;

    } else if (classification.type === 'DYNAMIC') {
      // DB tool execution
      const toolRoutes = routeToTools(query, role);
      const results    = await executeToolRoutes(toolRoutes, { userId, companyId, role });
      responseText = formatToolResults(toolRoutes, results, query);
      toolUsed     = toolRoutes.map(t => t.toolName).join(', ');

    } else if (classification.type === 'MIXED') {
      // Both: search KB + run DB tools
      const chunks     = searchKnowledge(query, 3);
      const toolRoutes = routeToTools(query, role);
      const results    = await executeToolRoutes(toolRoutes, { userId, companyId, role });

      const dbText = formatToolResults(toolRoutes, results, query);
      responseText = rb.buildMixedResponse(chunks, dbText, query);
      toolUsed     = toolRoutes.map(t => t.toolName).join(', ');
      sourceDocs   = chunks.length > 0 ? chunks[0].source : null;
    }

  } catch (err) {
    if (err.message && err.message.startsWith('ACCESS_DENIED')) {
      responseText = rb.buildBlockedResponse(query, 'access_denied');
    } else {
      console.error('[Agent Error]', err);
      responseText = `⚠️ I ran into an issue retrieving that data: ${err.message}. Please try again or rephrase your question.`;
    }
  }

  // Append bot response to session history
  appendHistory(sessionId, { role: 'assistant', content: responseText });

  return {
    text:     responseText,
    tool:     toolUsed,
    source:   sourceDocs,
    intent:   classification.type,
  };
}

/**
 * Execute all tool routes and collect results.
 */
async function executeToolRoutes(toolRoutes, ctx) {
  const results = {};
  await Promise.all(
    toolRoutes.map(async ({ toolName, params }) => {
      try {
        results[toolName] = await executeTool(toolName, { ...ctx, params });
      } catch (err) {
        results[toolName] = { error: true, message: err.message };
      }
    })
  );
  return results;
}

/**
 * Map tool results to the appropriate response builder.
 */
function formatToolResults(toolRoutes, results, query) {
  const primaryTool = toolRoutes[0]?.toolName;
  const data = results[primaryTool];

  if (!data || (data.error)) {
    if (data?.message?.startsWith('ACCESS_DENIED')) {
      return rb.buildBlockedResponse(query, 'access_denied');
    }
    return `⚠️ ${data?.message || 'Unable to retrieve data for this query.'}`;
  }

  switch (primaryTool) {
    case 'get_estimate_summary':  return rb.buildEstimateSummaryResponse(data, query);
    case 'get_project_detail':    return rb.buildEstimateSummaryResponse(data, query);
    case 'get_my_projects':       return rb.buildProjectListResponse(data, query);
    case 'get_upcoming_deadlines': return rb.buildDeadlinesResponse(data, query);
    case 'get_company_metrics':   return rb.buildCompanyMetricsResponse(data);
    case 'get_customers':         return rb.buildCustomersResponse(data);
    case 'get_rates':             return rb.buildRatesResponse(data);
    case 'get_activity_log':      return rb.buildActivityResponse(data);
    case 'search_projects':       return rb.buildSearchResponse(data, query);
    default:
      return `Data retrieved: ${JSON.stringify(data).substring(0, 300)}`;
  }
}

// ─── Session history management ───────────────────────────────────────────────

function appendHistory(sessionId, message) {
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, []);
  }
  const history = conversationHistory.get(sessionId);
  history.push({ ...message, timestamp: new Date().toISOString() });

  // Keep only last MAX_HISTORY messages
  if (history.length > MAX_HISTORY * 2) {
    history.splice(0, history.length - MAX_HISTORY * 2);
  }
}

function getHistory(sessionId) {
  return conversationHistory.get(sessionId) || [];
}

function clearHistory(sessionId) {
  conversationHistory.delete(sessionId);
}

module.exports = { runAgent, getHistory, clearHistory };
