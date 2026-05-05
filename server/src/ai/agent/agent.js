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

const { executeTool } = require('../tools/index');
const rb = require('./responseBuilder');
const chatRepo = require('./chatRepository');
const CALCULATION_RULES = require('./calculationRules');
const { classifyQuery, routeToTools } = require('./queryRouter');
const { searchKnowledge } = require('../search/knowledgeSearch');
const { classifySecurity, logSecurityAttempt, getRefusalMessage } = require('./securityClassifier');

// In-memory conversation history (Session cache for faster lookups, but DB is source of truth)
const conversationHistory = new Map();
const MAX_HISTORY = 10; // per session

/**
 * Main agent entry point.
 * 
 * @param {string}  query      - User's message
 * @param {object}  context    - { userId, companyId, role, sessionId, chatId }
 * @returns {Promise<{text: string, tool?: string, source?: string, chatId?: number}>}
 */
async function runAgent(query, context) {
  const { userId, companyId, role, chatId: clientChatId, ip } = context;
  let activeChatId = clientChatId;

  // Basic sanity check
  if (!query || query.trim().length === 0) {
    return { text: 'Please ask me something!' };
  }

  // 1. Ensure a chat exists
  if (!activeChatId) {
    activeChatId = await chatRepo.createChat(userId, query.substring(0, 50) + (query.length > 50 ? '...' : ''));
  } else if (clientChatId) {
    // Check if title needs update (only if it's the default)
    // For now we just use the first message as title inRepo
  }

  // Pre-check for simple greetings
  const GREETINGS = /^(hi|hello|good\s+(morning|afternoon|evening)|hey|thanks|thank\s+you|bye)\b/i;
  if (GREETINGS.test(query.trim())) {
    await chatRepo.addMessage(activeChatId, { role: 'user', content: query });
    const firstName = context.userName ? context.userName.split(' ')[0] : '';
    const greetingText = firstName
      ? `Hey ${firstName}! 👋 How can I help you with CALMISC today?`
      : "Hello! How can I help you with CALMISC today?";

    await chatRepo.addMessage(activeChatId, { role: 'assistant', content: greetingText, intent: 'GREETING' });
    return { text: greetingText, intent: 'GREETING', chatId: activeChatId };
  }

  const UNCLEAR = /^(today|time|date|now|what time|what day)\s*$/i;
  if (UNCLEAR.test(query.trim())) {
    await chatRepo.addMessage(activeChatId, { role: 'user', content: query });
    const unclearText = "I'm not sure what you're looking for. Try asking about estimation calculations, your projects, or how to use a feature.";
    await chatRepo.addMessage(activeChatId, { role: 'assistant', content: unclearText, intent: 'UNCLEAR' });
    return { text: unclearText, intent: 'UNCLEAR', chatId: activeChatId };
  }

  // Save User Message
  await chatRepo.addMessage(activeChatId, { role: 'user', content: query });

  // 2. PRE-FLIGHT SECURITY CHECK
  const security = classifySecurity(query);
  if (security.blocked) {
    await logSecurityAttempt(userId, companyId, query, security.category, ip);
    const refusalText = getRefusalMessage(security.category);

    // Save Assistant Message (Refusal)
    await chatRepo.addMessage(activeChatId, {
      role: 'assistant',
      content: refusalText,
      intent: 'SECURITY_BLOCK'
    });

    return {
      text: refusalText,
      intent: 'SECURITY_BLOCK',
      chatId: activeChatId
    };
  }

  // 3. Perform SMART VALIDATION
  const validationResult = validateCalculationQuery(query);
  if (validationResult.isCalculation && !validationResult.isValid) {
    const responseText = rb.buildClarificationResponse(validationResult.rule, validationResult.missing);
    await chatRepo.addMessage(activeChatId, { role: 'assistant', content: responseText, intent: 'validation' });
    return { text: responseText, chatId: activeChatId, intent: 'validation' };
  }

  // 3. Classify the query
  const classification = classifyQuery(query, role);

  let responseText = '';
  let toolUsed = null;
  let sourceDocs = null;

  try {
    if (validationResult.isCalculation && validationResult.isValid) {
      // Calculation triggered with valid data
      responseText = rb.buildCalculationResponse(validationResult.rule, validationResult.extractedData);
      classification.type = 'CALCULATION';
    }
    else if (classification.type === 'BLOCKED') {
      responseText = rb.buildBlockedResponse(query, classification.reason);

    } else if (classification.type === 'DIRECT') {
      responseText = classification.responseText;

    } else if (classification.type === 'STATIC') {
      const chunks = searchKnowledge(query, 5);
      responseText = rb.buildStaticResponse(chunks, query);
      sourceDocs = chunks.length > 0 ? chunks[0].source : null;

    } else if (classification.type === 'DYNAMIC') {
      const toolRoutes = routeToTools(query, role);
      const results = await executeToolRoutes(toolRoutes, { userId, companyId, role });
      responseText = formatToolResults(toolRoutes, results, query);
      toolUsed = toolRoutes.map(t => t.toolName).join(', ');

    } else if (classification.type === 'MIXED') {
      const chunks = searchKnowledge(query, 3);
      const toolRoutes = routeToTools(query, role);
      const results = await executeToolRoutes(toolRoutes, { userId, companyId, role });

      const dbText = formatToolResults(toolRoutes, results, query);
      responseText = rb.buildMixedResponse(chunks, dbText, query);
      toolUsed = toolRoutes.map(t => t.toolName).join(', ');
      sourceDocs = chunks.length > 0 ? chunks[0].source : null;
    }

  } catch (err) {
    console.error('[Agent Error]', err);
    responseText = `⚠️ I ran into an issue: ${err.message}`;
  }

  // Save Assistant Message
  await chatRepo.addMessage(activeChatId, {
    role: 'assistant',
    content: responseText,
    tool: toolUsed,
    source: sourceDocs,
    intent: classification.type
  });

  return {
    text: responseText,
    tool: toolUsed,
    source: sourceDocs,
    intent: classification.type,
    chatId: activeChatId
  };
}

/**
 * Validation logic for calculation rules.
 */
function validateCalculationQuery(query) {
  const normalized = query.toLowerCase();

  const hasNumbers = /\d/.test(normalized);
  const isExplicitAction = /\b(calculate|compute)\b/.test(normalized);

  if (!hasNumbers && !isExplicitAction) {
    return { isCalculation: false };
  }

  // Find matching rule
  const ruleKey = Object.keys(CALCULATION_RULES).find(key => {
    const rule = CALCULATION_RULES[key];
    return normalized.includes('calculate') && normalized.includes(key.toLowerCase().replace('_', ' '));
  }) || (normalized.includes('scrap') ? 'SCRAP' : null);

  if (!ruleKey) return { isCalculation: false };

  const rule = CALCULATION_RULES[ruleKey];
  const extractedData = {};
  const missing = [];

  // Very basic extraction logic
  const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:lbs|pounds|weight)/);
  if (weightMatch) extractedData.weight = parseFloat(weightMatch[1]);

  const widthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|width|wide)/);
  if (widthMatch) extractedData.width = parseFloat(widthMatch[1]);

  const riserMatch = normalized.match(/(\d+)\s*(?:risers|steps)/);
  if (riserMatch) extractedData.numRisers = parseInt(riserMatch[1]);

  // Check requirements
  rule.required_params.forEach(p => {
    if (extractedData[p] === undefined) missing.push(p);
  });

  return {
    isCalculation: true,
    isValid: missing.length === 0,
    rule,
    extractedData,
    missing
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
    case 'get_estimate_summary': return rb.buildEstimateSummaryResponse(data, query);
    case 'get_project_detail': return rb.buildEstimateSummaryResponse(data, query);
    case 'get_my_projects': return rb.buildProjectListResponse(data, query);
    case 'get_upcoming_deadlines': return rb.buildDeadlinesResponse(data, query);
    case 'get_company_metrics': return rb.buildCompanyMetricsResponse(data);
    case 'get_customers': return rb.buildCustomersResponse(data);
    case 'get_rates': return rb.buildRatesResponse(data);
    case 'get_activity_log': return rb.buildActivityResponse(data);
    case 'search_projects': return rb.buildSearchResponse(data, query);
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

async function getChatThreads(userId) {
  return chatRepo.getRecentChats(userId);
}

async function getThreadHistory(chatId) {
  return chatRepo.getChatHistory(chatId);
}

async function deleteThread(chatId) {
  return chatRepo.deleteChat(chatId);
}

function clearHistory(sessionId) {
  conversationHistory.delete(sessionId);
}

module.exports = {
  runAgent,
  getHistory,
  clearHistory,
  getChatThreads,
  getThreadHistory,
  deleteThread
};
