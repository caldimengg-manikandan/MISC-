# User Roles — MISC Pro Access Control

## Available Roles

### Estimator
An estimator can:
- Create new projects
- View and edit their own projects (where they are the creator or assigned engineer)
- Run estimations and view full calculation summaries
- Export BOM Excel and PDF reports for their own projects
- View customer records in their company
- Set project-level pricing overrides (local config)
- View their own upcoming deadlines

An estimator CANNOT:
- View other estimators' projects
- Access company-wide metrics or totals
- View or change global system rates (Pricing Settings)
- Manage users or company settings
- Access another company's data

### Admin (Owner)
An admin can do everything an estimator can, plus:
- View ALL projects across the entire company
- Access company-wide metrics (total steel, total costs, project count by status)
- Change global pricing rates in Pricing Settings
- Manage user accounts (add, edit, deactivate users)
- View all customer records
- Assign engineers to projects
- Access the System Admin settings panel
- View full audit activity logs across all projects

## Role Assignment
- Roles are set by the system admin when creating or editing a user account
- A user can only have one role at a time
- The role cannot be changed by the user themselves

## Company Isolation
- Every user belongs to exactly one company
- All data is strictly scoped to the user's company
- An estimator at Company A can NEVER see data from Company B, even if they know a project ID
- This applies to: projects, customers, rates, users, and all reports

## How Roles Affect the AI Assistant
- **Estimator**: The AI can only show the estimator's own projects, deadlines, and calculation details
- **Admin**: The AI can show all company data, metrics, totals across all engineers

## Session and Authentication
- Login with your email and password
- Session token (JWT) expires after a configurable period
- If you see "Session expired" or are redirected to login, simply log in again
- Password reset is available from the login page
