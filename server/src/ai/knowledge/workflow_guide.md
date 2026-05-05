# Workflow Guide — CALMISC Project Lifecycle

## Project Status Stages
Every project in CALMISC moves through these stages in order:

1. **NEW** — Project created, not yet assigned to an engineer
2. **ASSIGNED** — Engineer has been assigned to the project
3. **IN_PROGRESS** — Estimator is actively working on the estimation
4. **REVIEW** — Estimation is complete and under internal review
5. **SUBMITTED** — Estimate has been sent to the customer

## How to Progress a Project

### NEW → ASSIGNED
- Admin assigns an engineer using the "Assign Engineer" action in the Workflow bar
- The system records the assignment and sends a notification

### ASSIGNED → IN_PROGRESS
- Estimator opens the project and begins entering data in the Estimation Module
- Clicking "Run Estimation" marks significant progress
- Can also be manually updated via the Workflow action bar

### IN_PROGRESS → REVIEW
- Estimator clicks "Mark as Review" in the Workflow Action bar
- Admin or senior engineer reviews the calculation summary
- Can request changes back to IN_PROGRESS

### REVIEW → SUBMITTED
- Admin approves and clicks "Submit to Customer"
- Final totals are locked
- Project status changes to SUBMITTED

## Workflow Action Bar
Located just below the page header on every project page:
- Shows current status with colored badge
- Shows available next actions as buttons
- Shows history of status transitions

## Notifications
- Engineer receives notification when assigned
- Estimator receives notification when project moves to Review
- Admin receives notification when estimator marks complete

## Overdue Projects
- If a project's submission deadline passes and status is not SUBMITTED, it is marked OVERDUE
- Overdue projects appear in a special filter on the Dashboard
- Deadline is set in the Project Detail page (Submission Deadline field)

## Editing After Submission
- SUBMITTED projects are read-only by default
- Admin can reopen a project (moves back to REVIEW status)
- All status history is preserved in the audit log

## Tips
- To quickly find all projects in a specific status, use the Dashboard filter or Projects list filter
- Use "Assign Engineer" early to ensure the estimator gets notified immediately
- Set the Submission Deadline when creating the project to enable deadline tracking
