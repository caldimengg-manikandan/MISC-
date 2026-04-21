/**
 * tools/index.js
 * Centralized tool registry. Maps tool names → functions, with role metadata.
 */

const get_my_projects       = require('./get_my_projects');
const get_project_detail    = require('./get_project_detail');
const get_estimate_summary  = require('./get_estimate_summary');
const search_projects       = require('./search_projects');
const get_upcoming_deadlines = require('./get_upcoming_deadlines');
const get_company_metrics   = require('./get_company_metrics');
const get_customers         = require('./get_customers');
const get_rates             = require('./get_rates');
const get_activity_log      = require('./get_activity_log');

// Tool registry — each tool has metadata for access control
const TOOL_REGISTRY = {
  get_my_projects: {
    fn: get_my_projects,
    roles: ['admin', 'owner', 'estimator'],
    description: 'List projects (estimator: own only, admin: all company)',
  },
  get_project_detail: {
    fn: get_project_detail,
    roles: ['admin', 'owner', 'estimator'],
    description: 'Get full project details including estimationResult',
  },
  get_estimate_summary: {
    fn: get_estimate_summary,
    roles: ['admin', 'owner', 'estimator'],
    description: 'Get cost/weight/labor breakdown for a project',
  },
  search_projects: {
    fn: search_projects,
    roles: ['admin', 'owner', 'estimator'],
    description: 'Fuzzy search projects by name, number, or customer',
  },
  get_upcoming_deadlines: {
    fn: get_upcoming_deadlines,
    roles: ['admin', 'owner', 'estimator'],
    description: 'Get projects with deadlines in the next N days',
  },
  get_company_metrics: {
    fn: get_company_metrics,
    roles: ['admin', 'owner'],          // ADMIN ONLY
    description: 'Company-wide aggregate metrics (admin only)',
  },
  get_customers: {
    fn: get_customers,
    roles: ['admin', 'owner', 'estimator'],
    description: 'List customers in the company',
  },
  get_rates: {
    fn: get_rates,
    roles: ['admin', 'owner'],           // ADMIN ONLY
    description: 'Get global system pricing rates (admin only)',
  },
  get_activity_log: {
    fn: get_activity_log,
    roles: ['admin', 'owner', 'estimator'],
    description: 'Recent workflow activity for a project (own projects for estimator)',
  },
};

/**
 * Execute a tool by name with the given context and params.
 * Throws ACCESS_DENIED if the user role is not permitted.
 */
async function executeTool(toolName, { userId, companyId, role, params }) {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    throw new Error(`UNKNOWN_TOOL: Tool "${toolName}" does not exist.`);
  }

  // Role check at the dispatcher level (secondary check; tools also check internally)
  const normalizedRole = (role || 'estimator').toLowerCase();
  if (!tool.roles.includes(normalizedRole)) {
    throw new Error(`ACCESS_DENIED: Your role (${role}) cannot use the "${toolName}" tool.`);
  }

  return tool.fn({ userId, companyId, role: normalizedRole, params });
}

module.exports = { TOOL_REGISTRY, executeTool };
