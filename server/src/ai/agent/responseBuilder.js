/**
 * responseBuilder.js
 * Converts raw data (DB results + KB chunks) into human-readable responses.
 * All formatting is done here with zero dependency on any LLM.
 */

const { format, differenceInDays } = require('date-fns');

// ─── Currency & number formatters ─────────────────────────────────────────────
const fmt = (v) => (v != null && v !== '' ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—');
const num = (v, d = 2) => (v != null ? Number(v).toFixed(d) : '—');
const pct = (v) => (v != null ? `${(Number(v) * 100).toFixed(1)}%` : '—');
const lbs = (v) => (v != null ? `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lbs` : '—');
const dt  = (v) => { try { return format(new Date(v), 'dd MMM yyyy'); } catch { return '—'; } };

// ─── Static knowledge response ────────────────────────────────────────────────

function buildStaticResponse(chunks, query) {
  if (!chunks || chunks.length === 0) {
    return `I couldn't find specific documentation on that topic. Try rephrasing your question, or ask about:
• Stair, rail, platform, or kick plate calculations
• How the money flow works (costs → tax → total)
• Workflow stages and project statuses
• Exporting reports (BOM Excel, PDF)
• The suggestion engine for guard rails
• User roles and permissions`;
  }

  // Use the top chunk's document as the primary source
  const topChunk  = chunks[0];
  const otherDocs = [...new Set(chunks.slice(1).map(c => c.docTitle))].join(', ');

  let response = `📖 **${toTitle(topChunk.docTitle)}**\n\n${topChunk.text}`;

  // Add additional relevant chunks if they're from different docs
  const extraChunks = chunks.slice(1).filter(c => c.source !== topChunk.source);
  if (extraChunks.length > 0) {
    response += `\n\n---\n📌 **Also from ${toTitle(extraChunks[0].docTitle)}:**\n${extraChunks[0].text.substring(0, 500)}`;
  }

  response += `\n\n> 📚 Source: ${topChunk.source}`;
  if (otherDocs) response += ` | Related: ${otherDocs}`;

  return response;
}

// ─── Dynamic data responses ────────────────────────────────────────────────────

function buildProjectListResponse(projects, query) {
  if (!projects || projects.length === 0) {
    return '📂 No projects found matching your request. Try searching by project name or number.';
  }

  const lines = projects.map((p, i) => {
    const status = p.workflow_status || p.status || 'NEW';
    const deadline = p.submissionDeadline ? ` · Due ${dt(p.submissionDeadline)}` : '';
    const cost = p.totalCost ? ` · ${fmt(p.totalCost)}` : '';
    return `${i + 1}. **${p.projectName}** (#${p.projectNumber || '—'}) — ${statusBadge(status)}${deadline}${cost}`;
  });

  const header = `📋 **${projects.length} project${projects.length !== 1 ? 's' : ''} found:**\n`;
  return header + lines.join('\n');
}

function buildEstimateSummaryResponse(summaries, query) {
  if (!summaries || summaries.length === 0) {
    return 'Project not found, or you may not have access to it. Make sure you are searching for your own project.';
  }

  const s = summaries[0]; // Primary match

  let response = `## Project: **${s.projectName}** (#${s.projectNumber || '—'})`;
  if (s.customer) response += `\nCustomer: ${s.customer}`;
  response += `\nStatus: ${statusBadge(s.status)}`;
  if (s.deadline) {
    const daysLeft = differenceInDays(new Date(s.deadline), new Date());
    const dueStr = daysLeft < 0 ? `⚠️ ${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`;
    response += ` · Deadline: ${dt(s.deadline)} (${dueStr})`;
  }

  response += `\n\n### 💰 Cost Summary`;
  response += `\n| Item | Value |`;
  response += `\n|------|-------|`;

  if (s.baseSteelCost)   response += `\n| Steel Material     | ${fmt(s.baseSteelCost)} |`;
  if (s.galvanizeCost)   response += `\n| Finish (Galv/PC)   | ${fmt(s.galvanizeCost)} |`;
  if (s.shopLaborCost)   response += `\n| Shop Labor         | ${fmt(s.shopLaborCost)} |`;
  if (s.fieldLaborCost)  response += `\n| Field Labor        | ${fmt(s.fieldLaborCost)} |`;
  if (s.mountingCharges) response += `\n| Mounting/Anchoring | ${fmt(s.mountingCharges)} |`;
  if (s.subtotalWithoutTax) response += `\n| **Subtotal**       | **${fmt(s.subtotalWithoutTax)}** |`;
  if (s.taxAmount)       response += `\n| Tax                | ${fmt(s.taxAmount)} |`;
  response += `\n| **Grand Total**    | **${fmt(s.grandTotal || 0)}** |`;

  response += `\n\n### ⚖️ Steel`;
  response += `\n- Total Weight: **${lbs(s.totalSteelWeight)}**`;
  if (s.totalRisers)   response += `\n- Total Risers: ${s.totalRisers}`;
  if (s.pricePerRiser) response += `\n- Price per Riser: **${fmt(s.pricePerRiser)}**`;
  if (s.totalShopHours) response += `\n- Shop Hours: ${num(s.totalShopHours, 1)} hrs`;
  if (s.totalFieldHours) response += `\n- Field Hours: ${num(s.totalFieldHours, 1)} hrs`;

  if (s.hasLocalPricing) {
    response += `\n\n> ⚙️ This project uses **custom local pricing** overrides.`;
  }

  if (summaries.length > 1) {
    response += `\n\n_Also found ${summaries.length - 1} other matching project(s). Showing the first._`;
  }

  return response;
}

function buildDeadlinesResponse(projects, query) {
  if (!projects || projects.length === 0) {
    return '✅ No upcoming deadlines in the next 7 days. You\'re all caught up!';
  }

  const lines = projects.map(p => {
    const daysLeft = differenceInDays(new Date(p.submissionDeadline), new Date());
    const urgency = daysLeft <= 1 ? '🔴' : daysLeft <= 3 ? '🟡' : '🟢';
    const status = p.workflow_status || p.status;
    return `${urgency} **${p.projectName}** (#${p.projectNumber || '—'}) — Due ${dt(p.submissionDeadline)} (${daysLeft}d) — ${statusBadge(status)}`;
  });

  return `⏰ **Upcoming Deadlines (${projects.length})**\n\n${lines.join('\n')}`;
}

function buildCompanyMetricsResponse(data) {
  if (!data) return 'Unable to retrieve company metrics.';

  const { totals, byStatus, recentProjects } = data;

  let response = `## 📊 Company Overview\n`;
  response += `- **Total Projects:** ${totals?.totalProjects || 0}\n`;
  response += `- **Total Steel Weight:** ${lbs(totals?.totalSteelWeight)}\n`;
  response += `- **Total Estimated Cost:** ${fmt(totals?.totalEstimatedCost)}\n`;
  response += `- **Unique Customers:** ${totals?.uniqueCustomers || 0}\n`;
  response += `- **Active Engineers:** ${totals?.activeEngineers || 0}\n`;

  if (byStatus && Object.keys(byStatus).length > 0) {
    response += `\n### By Status\n`;
    for (const [s, count] of Object.entries(byStatus)) {
      response += `- ${statusBadge(s)}: ${count}\n`;
    }
  }

  if (recentProjects && recentProjects.length > 0) {
    response += `\n### Recent Activity\n`;
    response += recentProjects.map(p =>
      `- **${p.projectName}** (#${p.projectNumber || '—'}) — ${fmt(p.totalCost)} — ${dt(p.updatedAt)}`
    ).join('\n');
  }

  return response;
}

function buildCustomersResponse(customers) {
  if (!customers || customers.length === 0) {
    return 'No customers found. Add customers in Settings → Customer Master.';
  }

  const lines = customers.map((c, i) =>
    `${i + 1}. **${c.companyName}** — ${c.contactName || '—'} — ${c.email || '—'} — ${c.city || ''}, ${c.state || ''}`
  );

  return `👥 **Customers (${customers.length})**\n\n${lines.join('\n')}`;
}

function buildRatesResponse(categories) {
  let response = `## ⚙️ Current System Rates\n`;

  const sections = [
    { key: 'material', label: '📦 Material Rates' },
    { key: 'labor',    label: '👷 Labor Rates' },
    { key: 'mounting', label: '🔩 Mounting Rates' },
    { key: 'factors',  label: '📐 Calculation Factors' },
  ];

  for (const section of sections) {
    const rows = categories[section.key];
    if (!rows || rows.length === 0) continue;
    response += `\n### ${section.label}\n`;
    for (const r of rows) {
      response += `- **${r.key}**: ${r.value}`;
      if (r.description) response += ` _(${r.description})_`;
      response += '\n';
    }
  }

  return response;
}

function buildBlockedResponse(query, reason) {
  if (reason === 'admin_required') {
    return `🔒 That information is only accessible to **admin users**. 

You can view the rates applied to your current estimate in the **Rates Bar** inside each calculation panel, or ask your admin for company-wide metrics.

Is there anything else I can help you with about your own projects or calculations?`;
  }

  return `⚠️ I wasn't able to process that request. Please try rephrasing or ask about your own projects, calculations, or how the app works.`;
}

function buildActivityResponse(data) {
  if (!data) return 'Unable to retrieve activity log.';
  if (data.error) return `⚠️ ${data.message}`;

  const { project, activity } = data;
  let response = `### Activity Log: **${project.projectName}** (#${project.projectNumber || '—'})\n`;

  if (!activity || activity.length === 0) {
    return response + '\nNo activity history recorded for this project yet.';
  }

  response += activity.map(a =>
    `- ${dt(a.changedAt)} — **${a.fromStatus || '—'} → ${a.toStatus}** by ${a.changedByName || a.changedByEmail || 'Unknown'}${a.comment ? ` — "${a.comment}"` : ''}`
  ).join('\n');

  return response;
}

function buildSearchResponse(projects, query) {
  return buildProjectListResponse(projects, query);
}

// ─── Mixed response ────────────────────────────────────────────────────────────

function buildMixedResponse(kbChunks, dbData, query) {
  const parts = [];
  if (kbChunks && kbChunks.length > 0) {
    parts.push(buildStaticResponse(kbChunks, query));
  }
  if (dbData) {
    parts.push('---\n**Your project data:**\n' + dbData);
  }
  return parts.join('\n\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(s = '') {
  const map = {
    NEW: '🆕 New',
    ASSIGNED: '👤 Assigned',
    IN_PROGRESS: '🔄 In Progress',
    REVIEW: '🔍 In Review',
    SUBMITTED: '✅ Submitted',
    OVERDUE: '🔴 Overdue',
  };
  return map[s.toUpperCase().replace(/[ -]/g, '_')] || s;
}

function toTitle(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

module.exports = {
  buildStaticResponse,
  buildProjectListResponse,
  buildEstimateSummaryResponse,
  buildDeadlinesResponse,
  buildCompanyMetricsResponse,
  buildCustomersResponse,
  buildRatesResponse,
  buildBlockedResponse,
  buildActivityResponse,
  buildSearchResponse,
  buildMixedResponse,
};
