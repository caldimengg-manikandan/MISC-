/**
 * queryRouter.js
 * Classifies an incoming query into one of three categories:
 *   STATIC  — how-to, formula, calculation logic, features → use knowledge base
 *   DYNAMIC — my projects, costs, deadlines, data queries → use DB tools
 *   MIXED   — query needs both (e.g. "what is scrap factor on my project MISC?")
 *   BLOCKED — rate config, other users, unauthorized data
 *
 * Implementation: keyword/regex pattern scoring (no external API needed).
 */

// ─── Pattern definitions ──────────────────────────────────────────────────────

const STATIC_PATTERNS = [
  /\bhow\s+(is|does|do|are|to|can)\b/i,
  /\bwhat\s+is\s+(a|an|the)?\s*(formula|calculation|factor|rate|scrap|galvanize|lbs|weight|cost\s+breakdown|formula|workflow|status|process|step)/i,
  /\b(explain|describe|tell\s+me\s+about|show\s+me\s+how|what\s+does)\b/i,
  /\b(intermediate\s+rail|stringer|riser|tread|pan|grating|kick\s+plate|guardrail|wall\s+rail|grab\s+rail|cane\s+rail)\b/i,
  /\b(scrap\s+factor|tax\s+rate|steel\s+price|labor\s+rate|shop\s+rate|field\s+rate|galvanize|powder\s+coat)\b.*\b(mean|work|calculated|formula|affect|impact)\b/i,
  /\b(formula|equation|calc|calculation|formula|how\s+to\s+calc)\b/i,
  /\bdictionary\b/i,
  /\b(export|bom|excel|pdf|report|print)\b/i,
  /\b(workflow|status|stage|assigned|in\s+progress|review|submitted)\b.*\b(mean|what|work|how)\b/i,
  /\b(suggestion\s+engine|auto.?select|recommend|auto.?fill)\b/i,
  /\b(role|permission|access|estimator|admin|who\s+can)\b/i,
  /\b(add|create|delete|edit)\b.*\b(customer|dictionary|entry|item)\b/i,
  /\bfaq\b/i,
  /\b(pricing\s+setting|system\s+config|config\s+key)\b/i,
  /\b(money\s+flow|cost\s+breakdown|grand\s+total|subtotal|tax\s+amount)\b.*\b(work|calculated)\b/i,
];

const DYNAMIC_PATTERNS = [
  /\b(my|our)\s+(project|estimate|job|work|deadline)\b/i,
  /\bproject\s+(named?|number|#|called|id)\s+\S+/i,
  /\bshow\s+(me)?\s+my\s+project/i,
  /\b(total\s+cost|estimated\s+cost|grand\s+total|how\s+much)\b.*\b(project|job|estimate)\b/i,
  /\b(steel\s+weight|lbs|pounds)\s+.*\b(project|job)\b/i,
  /\b(deadline|due\s+date|overdue|upcoming)\b/i,
  /\b(status\s+of|how\s+is)\b.*\b(project|job|estimate)\b/i,
  /\bhow\s+many\s+(projects|jobs|estimates)\b/i,
  /\b(list|show|find|get)\s+(all|my)?\s*(project|estimate|job)s?\b/i,
  /\b(customer|client)\s*(list|records|info|data)\b/i,
  /\b(last|recent|latest)\s+(project|update|activity)\b/i,
  /\b(search|find)\s+(project|estimate)\b/i,
  /\b(assigned|in\s+review|in\s+progress|submitted|new)\s+(project|estimate)s?\b/i,
  /\b(riser\s+count|shop\s+hours|field\s+hours|price\s+per\s+riser)\b.*\bproject\b/i,
];

const ADMIN_ONLY_PATTERNS = [
  /\b(company.?(wide|total|all|overall|across|metrics|summary))\b/i,
  /\b(all\s+engineers?|all\s+estimators?|everyone's|team.?wide)\b/i,
  /\b(system\s+(rate|config|price)|current\s+steel\s+price|global\s+rate)\b/i,
  /\buser\s+(list|management|email|account)\b/i,
  /\b(how\s+many\s+projects\s+(do|does)\s+we|company\s+project\s+count)\b/i,
];

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * @param {string} query
 * @param {string} role - 'admin' | 'owner' | 'estimator'
 * @returns {{ type: 'STATIC'|'DYNAMIC'|'MIXED'|'BLOCKED', reason: string, adminRequired: boolean }}
 */
function classifyQuery(query, role) {
  const isAdmin = role === 'admin' || role === 'owner';
  const normalizedRole = (role || 'estimator').toLowerCase();

  // Check admin-only queries first
  const adminRequired = ADMIN_ONLY_PATTERNS.some(p => p.test(query));
  if (adminRequired && !isAdmin) {
    return {
      type: 'BLOCKED',
      reason: 'admin_required',
      adminRequired: true
    };
  }

  const isStatic  = STATIC_PATTERNS.some(p => p.test(query));
  const isDynamic = DYNAMIC_PATTERNS.some(p => p.test(query)) || adminRequired;

  if (isStatic && isDynamic) {
    return { type: 'MIXED', reason: 'both_signals', adminRequired };
  }
  if (isDynamic) {
    return { type: 'DYNAMIC', reason: 'data_query', adminRequired };
  }
  if (isStatic) {
    return { type: 'STATIC', reason: 'knowledge_query', adminRequired };
  }

  // Ambiguous — try STATIC first as a safe default
  return { type: 'STATIC', reason: 'ambiguous_default', adminRequired: false };
}

/**
 * Choose the best DB tool(s) for a DYNAMIC query.
 * Returns array of { toolName, params }
 */
function routeToTools(query, role) {
  const tools = [];

  // Project detail / estimate queries
  if (/\b(cost|price|total|weight|lbs|riser|shop\s*hour|field\s*hour|steel|estimate|estimation)\b/i.test(query)) {
    // Extract project name/number from query
    const nameMatch = query.match(/project\s+(?:named?\s+)?["""']?([A-Za-z0-9\s\-#\.]+?)["""']?(?:\?|$|\s+(?:is|has|cost|total|weight|the|a|an|–|--))/i);
    const numMatch  = query.match(/#(\w+)/);
    const params = {};
    if (nameMatch) params.projectName = nameMatch[1].trim();
    if (numMatch)  params.projectNumber = numMatch[1];
    tools.push({ toolName: 'get_estimate_summary', params });
  }

  // Deadline queries
  if (/\b(deadline|due|overdue|upcoming)\b/i.test(query)) {
    const daysMatch = query.match(/(\d+)\s*day/i);
    tools.push({ toolName: 'get_upcoming_deadlines', params: { days: daysMatch ? parseInt(daysMatch[1]) : 7 } });
  }

  // Project listing
  if (/\b(list|show|how\s+many|all\s+project|all\s+estimate|recent\s+project)\b/i.test(query)) {
    const statusMatch = query.match(/\b(new|assigned|in.?progress|review|submitted|overdue)\b/i);
    const params = {};
    if (statusMatch) params.status = statusMatch[1].toUpperCase().replace('-', '_').replace(' ', '_');
    tools.push({ toolName: 'get_my_projects', params });
  }

  // Search query
  if (/\b(search|find)\b/i.test(query)) {
    const termMatch = query.match(/(?:search|find)\s+(?:for\s+)?["']?([A-Za-z0-9\s\-#]+?)["']?(?:\?|$)/i);
    if (termMatch) tools.push({ toolName: 'search_projects', params: { query: termMatch[1].trim() } });
  }

  // Company metrics (admin only, checked upstream)
  if (/\b(company.?wide|overall|total\s+across|all\s+engineers?|metrics)\b/i.test(query)) {
    tools.push({ toolName: 'get_company_metrics', params: {} });
  }

  // Customers
  if (/\b(customer|client)\b/i.test(query)) {
    tools.push({ toolName: 'get_customers', params: {} });
  }

  // Rates (admin only, checked upstream)
  if (/\b(rate|price|config|system.?config)\b/i.test(query) && /\b(current|global|what\s+is)\b/i.test(query)) {
    tools.push({ toolName: 'get_rates', params: {} });
  }

  // Activity log
  if (/\b(activity|history|log|changes?|audit)\b/i.test(query)) {
    const nameMatch = query.match(/project\s+(?:named?\s+)?["""']?([A-Za-z0-9\s\-#\.]+?)["""']?/i);
    const params = {};
    if (nameMatch) params.projectName = nameMatch[1].trim();
    tools.push({ toolName: 'get_activity_log', params });
  }

  // Fallback if nothing matched: list projects
  if (tools.length === 0) {
    tools.push({ toolName: 'get_my_projects', params: {} });
  }

  // Deduplicate by toolName
  const seen = new Set();
  return tools.filter(t => {
    if (seen.has(t.toolName)) return false;
    seen.add(t.toolName);
    return true;
  });
}

module.exports = { classifyQuery, routeToTools };
