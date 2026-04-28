# MISC Pro Security & Stability Validation Checklist

Use this checklist to manually verify the security hardening and stabilization work performed on the MISC Pro environment.

---

## 🛡️ 1. Authentication & MFA
- [ ] **MFA Setup**: Navigate to Profile Settings. Click "Configure MFA". Scan the QR code with an app (Google Authenticator/Authy) and verify the 6-digit code works.
- [ ] **MFA Enforcement**: Log out and log back in with an Admin account. Verify you are prompted for a TOTP code *after* the password check.
- [ ] **Token Storage**: Open Browser DevTools (`F12`) -> Application -> Local Storage. Verify that `steel_token` exists and is populated after login.
- [ ] **Logout Integrity**: Click Logout. Verify that `steel_token` and `steel_user` are completely cleared from Local Storage.

## 🔒 2. Multi-Tenant Isolation
- [ ] **Note Access**: Try to add a note to a project. Verify it saves successfully.
- [ ] **Cross-User Note Privacy**: Create a note as a regular user. Log in as a different user (not an admin of the same company). Verify you cannot see or edit that note via direct API hits or the UI.
- [ ] **Project Data Leakage**: Attempt to navigate directly to a project URL belonging to another company (e.g., `/project/999`). Verify the system redirects you or shows "Access Denied" (403/404).

## 🚀 3. API & Communication
- [ ] **API Versioning**: Open Network Tab in DevTools. Perform any action (Save project, add note). Verify the request URL starts with `/api/v1/`.
- [ ] **Recursive Path Check**: Verify no requests are hitting malformed paths like `/api/v1/v1/`.
- [ ] **Credentials Check**: In the Network Tab, click on a request to `/api/v1/calculate`. Verify that `withCredentials` is `true` or `credentials: include` is present in the request headers.
- [ ] **Dictionary Loading**: Navigate to the Stair Configuration page. Verify that all dropdowns (Finish, Steel Grade, etc.) populate without 401 errors.

## 📊 4. Module Stability
- [ ] **Stair Calculation**: Open a project, modify a dimension (e.g., Stair Width), and click Save/Calculate. Verify the "Steel Weight" and "Est. Cost" update without console errors.
- [ ] **Project Search**: Use the global search to find a project. Verify the search results appear correctly.
- [ ] **History & Audit**: Open the "History" tab for a project. Verify the timeline of changes is visible.

---

### 🛑 If any check fails:
1. Note the specific error in the Console (Red text).
2. Check the Network Tab for the failing status code (401, 403, 404, or 500).
3. Contact the development agent with the specific error trace.
