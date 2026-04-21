import { Router, Request, Response } from 'express';
import { sql } from 'mssql';
import { getPool } from '../database';
import { authenticateUser } from '../middleware/auth';

const router = Router();

/**
 * GET /api/dashboard/metrics
 * Fetch all dashboard KPIs: total projects, revenue, estimation time, completion rate
 */
router.get('/metrics', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const pool = getPool();

    // Query 1: Project counts and revenue
    const projectMetrics = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) as totalProjects,
          COUNT(CASE WHEN status = 'NEW' THEN 1 END) as newProjects,
          ISNULL(SUM(CASE WHEN status IN ('SUBMITTED', 'APPROVED') THEN total_cost ELSE 0 END), 0) as revenuePipeline,
          ISNULL(SUM(CASE WHEN status = 'APPROVED' THEN total_cost ELSE 0 END), 0) as approvedRevenue,
          ISNULL(AVG(CASE WHEN status != 'NEW' THEN DATEDIFF(minute, created_at, updated_at) END), 0) as avgEstimationMinutes
        FROM projects
        WHERE userId = @userId
      `);

    // Query 2: Project status distribution
    const statusDistribution = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          status,
          COUNT(*) as count
        FROM projects
        WHERE userId = @userId
        GROUP BY status
      `);

    // Query 3: Completion rate (approved / total)
    const completionRate = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status IN ('APPROVED', 'SUBMITTED') THEN 1 END) as completed
        FROM projects
        WHERE userId = @userId AND created_at >= DATEADD(day, -30, GETDATE())
      `);

    // Query 4: Monthly revenue trend (last 3 months)
    const monthlyRevenue = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          FORMAT(created_at, 'MMM yyyy') as month,
          COUNT(*) as projectCount,
          ISNULL(SUM(CASE WHEN status IN ('SUBMITTED', 'APPROVED') THEN total_cost ELSE 0 END), 0) as revenue
        FROM projects
        WHERE userId = @userId AND created_at >= DATEADD(month, -3, GETDATE())
        GROUP BY FORMAT(created_at, 'MMM yyyy')
        ORDER BY created_at DESC
      `);

    const metrics = projectMetrics.recordset[0];
    const statuses = statusDistribution.recordset;
    const completion = completionRate.recordset[0];
    const monthly = monthlyRevenue.recordset;

    const completionPercentage = completion.total > 0 
      ? Math.round((completion.completed / completion.total) * 100)
      : 0;

    res.json({
      kpis: {
        totalProjects: metrics.totalProjects,
        revenuePipeline: metrics.revenuePipeline,
        approvedRevenue: metrics.approvedRevenue,
        avgEstimationMinutes: Math.round(metrics.avgEstimationMinutes),
        completionRate: completionPercentage,
      },
      statusDistribution: {
        new: statuses.find((s: any) => s.status === 'NEW')?.count || 0,
        inProgress: statuses.find((s: any) => s.status === 'IN_PROGRESS')?.count || 0,
        submitted: statuses.find((s: any) => s.status === 'SUBMITTED')?.count || 0,
        approved: statuses.find((s: any) => s.status === 'APPROVED')?.count || 0,
      },
      monthlyTrend: monthly,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

/**
 * GET /api/dashboard/alerts
 * Fetch actionable alerts: pending approvals, approaching deadlines, stale estimates
 */
router.get('/alerts', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const pool = getPool();

    // Query 1: Pending approvals (submitted > 3 days)
    const pendingApprovals = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) as count,
          MAX(DATEDIFF(day, updated_at, GETDATE())) as maxDaysWaiting
        FROM projects
        WHERE userId = @userId 
          AND status = 'SUBMITTED'
          AND DATEDIFF(day, updated_at, GETDATE()) >= 3
      `);

    // Query 2: Approaching deadlines (< 7 days to deadline)
    const approachingDeadlines = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) as count
        FROM projects
        WHERE userId = @userId 
          AND status IN ('NEW', 'IN_PROGRESS')
          AND deadline IS NOT NULL
          AND DATEDIFF(day, GETDATE(), deadline) BETWEEN 1 AND 7
      `);

    // Query 3: Configuration issues (scrap factor or labor rates need review)
    const configReview = await pool
      .request()
      .query(`
        SELECT
          COUNT(*) as count
        FROM system_config
        WHERE config_key IN ('scrap_factor_pct', 'labor_rate_shop', 'labor_rate_field')
          AND last_updated < DATEADD(day, -30, GETDATE())
      `);

    // Query 4: Stale estimates (in progress for > 5 days)
    const staleEstimates = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) as count
        FROM projects
        WHERE userId = @userId 
          AND status = 'IN_PROGRESS'
          AND DATEDIFF(day, created_at, GETDATE()) >= 5
      `);

    // Query 5: High variance projects (quotes differ from estimation by >10%)
    const highVariance = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          COUNT(*) as count
        FROM projects p
        WHERE userId = @userId 
          AND p.approved_cost IS NOT NULL
          AND p.total_cost IS NOT NULL
          AND ABS((p.approved_cost - p.total_cost) / p.total_cost) > 0.1
      `);

    const alerts = [];

    const pending = pendingApprovals.recordset[0];
    if (pending.count > 0) {
      alerts.push({
        type: 'urgent',
        title: `${pending.count} estimates pending approval`,
        description: `Waiting for ${pending.maxDaysWaiting}+ days`,
        count: pending.count,
        actionLabel: 'Review pending',
      });
    }

    const deadlines = approachingDeadlines.recordset[0];
    if (deadlines.count > 0) {
      alerts.push({
        type: 'warning',
        title: `${deadlines.count} projects approaching deadline`,
        description: 'Less than 7 days remaining',
        count: deadlines.count,
        actionLabel: 'View deadlines',
      });
    }

    const stale = staleEstimates.recordset[0];
    if (stale.count > 0) {
      alerts.push({
        type: 'warning',
        title: `${stale.count} estimates in progress for 5+ days`,
        description: 'Consider completing or clarifying scope',
        count: stale.count,
        actionLabel: 'View stale',
      });
    }

    const variance = highVariance.recordset[0];
    if (variance.count > 0) {
      alerts.push({
        type: 'info',
        title: `${variance.count} projects with 10%+ price variance`,
        description: 'Check estimation accuracy',
        count: variance.count,
        actionLabel: 'Review variance',
      });
    }

    const config = configReview.recordset[0];
    if (config.count > 0) {
      alerts.push({
        type: 'info',
        title: 'Configuration review recommended',
        description: 'Labor rates or scrap factors haven\'t been updated in 30+ days',
        actionLabel: 'Review settings',
      });
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/dashboard/pipeline
 * Fetch pipeline funnel data: new → in_progress → submitted → approved
 * Includes conversion rates and avg time per stage
 */
router.get('/pipeline', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const pool = getPool();

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          status,
          COUNT(*) as count,
          ISNULL(AVG(DATEDIFF(day, created_at, 
            CASE 
              WHEN status = 'APPROVED' THEN approved_date
              WHEN status = 'SUBMITTED' THEN submitted_date
              WHEN status = 'IN_PROGRESS' THEN GETDATE()
              ELSE created_at
            END)), 0) as avgDaysInStage
        FROM projects
        WHERE userId = @userId
        GROUP BY status
        ORDER BY 
          CASE status
            WHEN 'NEW' THEN 1
            WHEN 'IN_PROGRESS' THEN 2
            WHEN 'SUBMITTED' THEN 3
            WHEN 'APPROVED' THEN 4
            ELSE 5
          END
      `);

    const stages = result.recordset;
    const total = stages.reduce((sum: number, s: any) => sum + s.count, 0);

    const pipeline = stages.map((stage: any) => ({
      status: stage.status,
      count: stage.count,
      percentage: total > 0 ? Math.round((stage.count / total) * 100) : 0,
      avgDaysInStage: Math.round(stage.avgDaysInStage),
    }));

    res.json({ pipeline });
  } catch (error) {
    console.error('Dashboard pipeline error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline data' });
  }
});

/**
 * GET /api/dashboard/module-health
 * Fetch per-module insights: usage, avg quote time, common parameters
 */
router.get('/module-health', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const pool = getPool();

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          estimation_type as module,
          COUNT(*) as usageCount,
          ISNULL(AVG(DATEDIFF(minute, created_at, updated_at)), 0) as avgEstimationMinutes,
          ISNULL(AVG(CASE WHEN status IN ('SUBMITTED', 'APPROVED') THEN total_cost ELSE 0 END), 0) as avgQuoteValue,
          ISNULL(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) as approvedCount
        FROM projects
        WHERE userId = @userId AND estimation_type IS NOT NULL
        GROUP BY estimation_type
        ORDER BY usageCount DESC
      `);

    const moduleHealth = result.recordset.map((module: any) => ({
      module: module.module || 'Unknown',
      usage: module.usageCount,
      avgEstimationMinutes: Math.round(module.avgEstimationMinutes),
      avgQuoteValue: Math.round(module.avgQuoteValue),
      approvalRate: module.usageCount > 0 
        ? Math.round((module.approvedCount / module.usageCount) * 100)
        : 0,
    }));

    res.json({ moduleHealth });
  } catch (error) {
    console.error('Module health error:', error);
    res.status(500).json({ error: 'Failed to fetch module health' });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Fetch recent projects for quick access on dashboard
 */
router.get('/recent-activity', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const pool = getPool();

    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 6
          id,
          project_name,
          customer_name,
          estimation_type as module,
          status,
          total_cost,
          updated_at,
          DATEDIFF(hour, updated_at, GETDATE()) as hoursAgo
        FROM projects
        WHERE userId = @userId
        ORDER BY updated_at DESC
      `);

    const recentActivity = result.recordset.map((project: any) => ({
      id: project.id,
      name: project.project_name,
      customer: project.customer_name,
      module: project.module,
      status: project.status,
      cost: project.total_cost,
      hoursAgo: project.hoursAgo,
    }));

    res.json({ recentActivity });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

export default router;
