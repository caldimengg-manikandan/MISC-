# CAL MISC — Security Policy & Cybersecurity Documentation

**Application:** CAL MISC Steel Estimation Platform  
**Document Version:** 1.0  
**Prepared For:** Client Demo Submission  
**Date:** May 2026  
**Classification:** Confidential

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Architecture Overview](#2-application-architecture-overview)
3. [Authentication & Session Security](#3-authentication--session-security)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [License Integrity & Tamper Prevention](#5-license-integrity--tamper-prevention)
6. [Password Security Policy](#6-password-security-policy)
7. [Data Encryption & Transport Security](#7-data-encryption--transport-security)
8. [File Upload Security](#8-file-upload-security)
9. [Audit Logging & Activity Monitoring](#9-audit-logging--activity-monitoring)
10. [Automated Security Maintenance](#10-automated-security-maintenance)
11. [User Data Safeguarding](#11-user-data-safeguarding)
12. [Infrastructure & Deployment Security](#12-infrastructure--deployment-security)
13. [Security Controls Summary Table](#13-security-controls-summary-table)

---

## 1. Executive Summary

CAL MISC is a role-governed, multi-tenant steel estimation platform built with a **Node.js / Express** backend and a **React** frontend, backed by a **Microsoft SQL Server** database. Security has been designed as a layered defense — no single point of failure grants an attacker access to sensitive data or business logic.

Key security pillars implemented in the application:

- **JWT-based stateless authentication** stored in HttpOnly cookies (not accessible to JavaScript)
- **Single-session enforcement** — logging in from a new device automatically invalidates the previous session
- **Multi-Factor Authentication (MFA)** using TOTP (Google Authenticator compatible)
- **Strict Role-Based Access Control** across all API endpoints
- **License integrity verification** using HMAC-SHA256 cryptographic signatures to prevent tampering
- **Parameterized SQL queries** throughout — SQL injection is structurally impossible
- **File upload hardening** with MIME type, file extension, and magic-byte validation
- **Immutable audit logs** capturing all create / update / delete / login / logout events with IP and User-Agent
- **Automated secret rotation alerting** via scheduled daily checks
- **Sensitive field redaction** from all log outputs

---

## 2. Application Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                     CLIENT (React SPA)                    │
│   Auth tokens stored in HttpOnly cookies only             │
│   Role-aware routing — UI renders per permission level    │
└──────────────────────┬────────────────────────────────────┘
                       │ HTTPS (TLS encrypted)
┌──────────────────────▼────────────────────────────────────┐
│              SERVER (Node.js / Express API)                │
│                                                           │
│  [auth.js] → [requireRole.js] → [licenseCheck.js] → Handler │
│                                                           │
│         Route Handlers → Controllers → Services           │
└──────────────────────┬────────────────────────────────────┘
                       │ Encrypted connection (MSSQL TLS)
┌──────────────────────▼────────────────────────────────────┐
│         Microsoft SQL Server (MISC_DB)                    │
│   Parameterized queries only — no string concatenation    │
│   Tables: users, licenses, audit_logs,                    │
│   superadmin_activity_log, project_attachments            │
└───────────────────────────────────────────────────────────┘
```

**Storage:** File attachments are stored via a unified adapter supporting local disk (`/uploads/projects/`) and cloud S3-compatible storage (Cloudflare R2). All file access requires authentication and ownership verification.

---

## 3. Authentication & Session Security

### 3.1 JWT Token Architecture

All authenticated sessions use **JSON Web Tokens (JWT)** signed with `HS256` using a server-side secret. Tokens are **never exposed to JavaScript** — stored exclusively in `HttpOnly` cookies.

| Token Type | Storage | Expiry | Purpose |
|---|---|---|---|
| Access Token | HttpOnly Cookie (`auth_token`) | 15 minutes | API request authentication |
| Refresh Token | HttpOnly Cookie (`refresh_token`) | 7 days | Silent access token renewal |
| MFA Pending Token | HttpOnly Cookie | Short-lived | Intermediate MFA challenge state |

**Cookie security flags applied on every token issuance:**

| Flag | Value | Security Effect |
|---|---|---|
| `httpOnly` | `true` | Not accessible to browser JS — prevents XSS token theft |
| `sameSite` | `'Strict'` | Blocks CSRF — cookie not sent on cross-site requests |
| `secure` | `true` (production) | HTTPS-only transmission |

### 3.2 Single-Session Enforcement

The system prevents concurrent logins across multiple devices:

1. On each login, a cryptographically random `session_token` is generated and stored in the database
2. This `session_token` is embedded inside the signed JWT
3. On **every authenticated request**, the middleware verifies the JWT's `sessionToken` matches the DB record
4. If a user logs in from a second device, the DB `session_token` is overwritten — all prior sessions are **immediately invalidated**
5. The kicked-out session receives: `"You were signed out because you logged in on another device."`

> **This rule applies to ALL roles including SuperAdmin — no role is exempt from session security.**

### 3.3 Multi-Factor Authentication (MFA)

The application supports **TOTP-based MFA** compatible with Google Authenticator, Authy, and any RFC 6238-compliant app.

**MFA Login Flow:**
1. User completes username + password → receives a short-lived `mfa_pending` JWT
2. User submits 6-digit TOTP code from their authenticator app
3. Server verifies code against the user's stored `mfa_secret` (base32) via `speakeasy`
4. On success, a full access token is issued and session is established
5. Disabling MFA **requires re-verification** of a valid TOTP code — it cannot be turned off without the authenticator

**QR Code onboarding:** Users scan a QR code during setup. The TOTP secret is stored server-side only; the QR image is rendered once and never persisted.

### 3.4 Email OTP for Account Flows

Sensitive account actions (sign-up verification, password reset) use **time-limited email OTP codes:**
- OTP codes have a hard expiry (`otp_expires_at`)
- Expired codes are automatically rejected
- Password reset links use cryptographically random 32-byte hex tokens

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Hierarchy

```
SuperAdmin
    └── Admin (Owner)
            └── Estimator
```

| Role | Scope |
|---|---|
| **SuperAdmin** | Platform-wide. Manages all licenses, admins, and activity logs. Cannot be license-blocked. |
| **Admin / Owner** | Company-level. Manages estimators and projects within their license. |
| **Estimator** | Project-level. Views and works on projects within their admin's company. |

### 4.2 Middleware Chain

Every protected API request passes through a sequential middleware chain before reaching any route handler:

```
Request
  → auth.js          (JWT verify + session token match + fresh DB user fetch)
  → requireRole.js   (Role gate: SuperAdmin / Admin / Estimator)
  → licenseCheck.js  (License active + not expired + signature intact)
  → Route Handler
```

### 4.3 Resource Ownership Guard

For all project and attachment endpoints, a dedicated **`ownershipGuard`** middleware runs a DB query to confirm the user has a legitimate relationship to the resource:

```sql
SELECT 1 FROM projects
WHERE id = @projectId
  AND (
    createdBy             = @userId     OR
    company_id            = @companyId  OR
    owner_admin_id        = @ownerAdminId OR
    assigned_engineer_id  = @userId     OR
    reviewer_id           = @userId
  )
```

A user cannot access data from another company or unrelated project — even with a valid JWT.

### 4.4 SuperAdmin Activity Logging

Every mutation performed by a SuperAdmin is recorded in `superadmin_activity_log`:

| Field | Content |
|---|---|
| `actor_id` | Who performed the action |
| `action` | `CREATE_LICENSE`, `CHANGE_ROLE`, `FORCE_LOGOUT`, `DEACTIVATE_USER`, `RESET_PASSWORD_EMAIL`, etc. |
| `target_id` / `target_type` | What record was affected |
| `detail` | Before/after JSON snapshot |
| `created_at` | Timestamp |

---

## 5. License Integrity & Tamper Prevention

Each license record is protected by an **HMAC-SHA256 cryptographic signature** computed over its critical fields:

```
Payload  = license_key | admin_user_id | license_type | max_estimators | valid_until | is_active
Signature = HMAC-SHA256(Payload, LICENSE_SECRET)
```

On every authenticated request, `licenseCheck.js` calls `verifyLicenseSignature()`:
- Recomputes the expected HMAC from current DB values
- Uses **`crypto.timingSafeEqual()`** for constant-time comparison (prevents timing side-channel attacks)
- If the signature does not match → request is rejected with `403 licenseTampered`

> If anyone directly edits the database to extend a license expiry or increase seat limits, the signature mismatch will be detected and the license will be **automatically invalidated** on the next request.

---

## 6. Password Security Policy

All passwords are enforced server-side before hashing. Weak passwords are rejected at registration and change-password endpoints.

### 6.1 Password Requirements

| Rule | Requirement |
|---|---|
| Minimum Length | **12 characters** |
| Uppercase | At least 1 uppercase letter (A–Z) |
| Lowercase | At least 1 lowercase letter (a–z) |
| Number | At least 1 digit (0–9) |
| Special Character | At least 1 of: `!@#$%^&*-_=+` |
| Common Passwords | Blocked (dictionary check) |

### 6.2 Password Hashing

- All passwords hashed with **bcrypt at cost factor 12** before storage
- Plaintext passwords are never stored, logged, or transmitted
- Password field is stripped from all API responses via `toJSON` / `toObject` transform

### 6.3 Account Lockout

- After **5 consecutive failed login attempts** → account locked for **1 hour**
- `lockUntil` timestamp enforced server-side
- Successful login resets the attempt counter

### 6.4 Password Reset Security

- Reset tokens are **cryptographically random 32-byte hex strings** — not guessable
- Tokens expire after **1 hour**
- Tokens are single-use (consumed on successful reset)
- Reset emails sent to the verified email address on file only

---

## 7. Data Encryption & Transport Security

### 7.1 Data in Transit

- All client–server communication encrypted via **HTTPS / TLS**
- MSSQL connection uses **TLS encryption** (`encrypt: true` in database config)
- Auth tokens are never transmitted as URL query parameters in normal operation

### 7.2 Field-Level Encryption (AES-256-GCM)

The `SecurityUtils` class provides authenticated encryption for sensitive fields:

| Parameter | Value |
|---|---|
| Algorithm | AES-256-GCM |
| IV | 16 random bytes per operation |
| Mode | GCM — provides both confidentiality and integrity |
| Auth Tag | Stored alongside ciphertext; verified on decryption |

### 7.3 SQL Injection Prevention

All database queries use **parameterized inputs**. The database adapter binds all values as typed parameters — no string concatenation is used anywhere to construct SQL queries. This structurally eliminates SQL injection across the entire application.

```javascript
// ALL queries follow this safe pattern:
db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()])
```

---

## 8. File Upload Security

The attachment system implements multiple independent validation layers:

### 8.1 Allowed File Types

| Category | Extensions | MIME Types |
|---|---|---|
| Images | `.png`, `.jpg`, `.jpeg`, `.svg` | `image/png`, `image/jpeg`, `image/svg+xml` |
| Documents | `.pdf` | `application/pdf` |
| Spreadsheets | `.xls`, `.xlsx` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

### 8.2 Multi-Layer Validation (Applied in Order)

1. **File Extension Check** — Extension must be in the allowed set
2. **MIME Type Check** — Declared MIME type must match allowed list
3. **Magic Byte Validation** — Binary content inspected against known file signatures:

| File Type | Magic Bytes |
|---|---|
| JPEG | `FFD8FF` |
| PNG | `89504E47` |
| PDF | `25504446` |
| XLSX | `504B0304` |
| XLS | `D0CF11E0` |

4. **SVG Script Injection Prevention** — SVG files scanned for `<script>` tags; rejected if found
5. **File Size Limit** — Max 200 MB per file; up to 10 files per request

### 8.3 Secure Filename Storage

Uploaded files are stored with opaque, sanitized filenames to prevent path traversal:

```
{timestamp}_{md5_hash}_{randomHex8}_{sanitizedOriginalName}
```

The original filename is preserved in the database for display only — it never maps directly to a filesystem path.

### 8.4 Upload Rate Limiting

- **50 upload requests per 15 minutes per IP address**
- Excess requests receive HTTP `429 Too Many Requests`

---

## 9. Audit Logging & Activity Monitoring

### 9.1 Audit Log System

An **append-only audit log** (`audit_logs` table) records all significant events:

| Action | Trigger |
|---|---|
| `LOGIN` | Successful user logins |
| `LOGIN_FAIL` | Failed login attempts |
| `LOGOUT` | Session terminations |
| `CREATE` | New records created |
| `UPDATE` | Record modifications (before + after JSON) |
| `DELETE` | Record removals |

Each record captures: `user_id`, `action`, `resource`, `record_id`, `before_val`, `after_val`, `ip_address`, `user_agent`, `timestamp`.

### 9.2 Sensitive Field Redaction

Before writing to any log, `sanitizeForLog()` deep-clones and redacts all sensitive keys. The following fields are **always replaced with `[REDACTED]`**:

> `password`, `password_hash`, `token`, `auth_token`, `refresh_token`, `secret`, `jwt_secret`, `license_key`, `otp`, `otp_code`, `session_token`, `encryption_key`, `api_key`

Even in a log breach scenario, no credentials or secrets are ever exposed.

### 9.3 Winston Application Logging

Structured JSON logs written to rotating files via the **Winston** library:

| Log File | Content | Rotation |
|---|---|---|
| `error.log` | Error-level events only | 5 MB max, 5 files retained |
| `combined.log` | Info + above | 5 MB max, 5 files retained |

- In production: console output suppressed; logs go to files only
- All admin access grants and denials logged with userId, email, IP, and endpoint

---

## 10. Automated Security Maintenance

Three scheduled cron jobs run automatically:

| Job | Schedule | Purpose |
|---|---|---|
| **Overdue Project Check** | Daily at 00:00 | Marks expired projects OVERDUE; writes system activity log entries |
| **Deadline Reminder** | Daily at 08:00 | In-app + email notifications for projects due in 1 or 3 days |
| **Secret Rotation Check** | Daily at 09:00 | Alerts SuperAdmins if `SECRETS_LAST_ROTATED` env var is > 90 days old |

The **Secret Rotation Check** enforces a 90-day key rotation compliance policy. When overdue, a **high-priority in-app notification** is pushed to all SuperAdmin accounts.

---

## 11. User Data Safeguarding

### 11.1 Data Collected

| Category | Fields | Purpose |
|---|---|---|
| Identity | Name, Email, Company, Phone | Account identification and communication |
| Authentication | Bcrypt password hash, MFA secret (base32) | Secure login |
| Session | Session token (random, DB-side only) | Single-session enforcement |
| Activity | Last login, login attempt count | Security monitoring and lockout |
| Subscription | License type, valid dates, seat count | Access control |
| Preferences | Theme, measurement unit, notifications | UX personalization |

### 11.2 How Data Is Protected

| Protection | Implementation |
|---|---|
| Passwords never in plain text | bcrypt hash (cost factor 12) stored only |
| Tokens never in plain text | Session tokens are random hex; JWTs stored HttpOnly |
| Sensitive fields stripped from API responses | `toJSON` transform removes `password`, `verificationToken`, `passwordResetToken`, `loginAttempts`, `lockUntil` |
| No PII in logs | Audit logs store user IDs and IPs; sensitive fields always redacted |
| Cross-tenant isolation | All queries filter by `company_id` or `owner_admin_id` — cross-company data leakage is prevented at the query level |
| Account deactivation | `session_token` cleared immediately — all active sessions invalidated |
| Remote force logout | SuperAdmin can invalidate any user's session by clearing their `session_token` |

### 11.3 Data Access Boundaries

| Role | Data Access |
|---|---|
| Estimator | Only projects and data within their admin's company |
| Admin | Only data belonging to users under their license |
| SuperAdmin | User lists and license data for management only — cannot access individual project estimation data |

No user can access another company's data under any authenticated role.

---

## 12. Infrastructure & Deployment Security

### 12.1 Process Management (PM2)

| Setting | Value | Effect |
|---|---|---|
| `autorestart` | `true` | Auto-restarts on crash — prevents downtime exploitation |
| `max_memory_restart` | `1G` | Prevents memory exhaustion / OOM attacks |
| `NODE_ENV` | `production` | Disables debug output and stack trace leakage |
| `watch` | `false` | Filesystem watching disabled in production |

### 12.2 Environment Variable Security

All secrets managed through `.env` — **never committed to source control:**

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | JWT signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `LICENSE_SECRET` | HMAC key for license signatures |
| `ENCRYPTION_KEY` | AES-256 encryption key |
| `HASH_SALT` | General HMAC salt |
| `MSSQL_PASSWORD` | Database credential |
| `SECRETS_LAST_ROTATED` | Date for rotation compliance tracking |

### 12.3 Cloud Storage Security (Cloudflare R2)

- Files stored under structured keys: `projects/{projectId}/{uuid}/{safeName}`
- Direct bucket access is not exposed publicly
- File serving uses **time-limited signed URLs (15-minute TTL)**
- Soft deletes in DB before physical storage deletion — prevents race conditions

### 12.4 HTTP Security Headers

Applied on all file-serving responses:

| Header | Value | Protection |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `Cache-Control` | `private, max-age=3600` | Prevents public caching of user files |
| `Content-Disposition` | set per endpoint | Enforces proper inline/download behavior |

---

## 13. Security Controls Summary Table

| Control Category | Mechanism | Status |
|---|---|---|
| Authentication | JWT (HS256) + HttpOnly Cookies | ✅ Implemented |
| Session Management | Single-session token enforcement (all roles) | ✅ Implemented |
| Multi-Factor Auth | TOTP via speakeasy (RFC 6238) | ✅ Implemented |
| Password Policy | 12+ chars, complexity rules, bcrypt-12 | ✅ Implemented |
| Account Lockout | 5 attempts → 1-hour lock (server-side) | ✅ Implemented |
| Role-Based Access Control | SuperAdmin / Admin / Estimator hierarchy | ✅ Implemented |
| Resource Ownership Guard | Per-request DB ownership check on all project data | ✅ Implemented |
| SQL Injection Prevention | Parameterized queries throughout — no string SQL | ✅ Implemented |
| CSRF Protection | SameSite=Strict cookie flag | ✅ Implemented |
| License Integrity | HMAC-SHA256 signature + timing-safe comparison | ✅ Implemented |
| File Type Validation | Extension + MIME + Magic Bytes + SVG script scan | ✅ Implemented |
| Upload Rate Limiting | 50 requests / 15 min / IP | ✅ Implemented |
| Audit Logging | Append-only log with before/after state + IP + UA | ✅ Implemented |
| Sensitive Field Redaction | Auto-redact in all log output | ✅ Implemented |
| Data Encryption (Transit) | HTTPS + MSSQL TLS | ✅ Implemented |
| Field-Level Encryption | AES-256-GCM for sensitive fields | ✅ Implemented |
| Secret Rotation Monitoring | Daily cron — 90-day compliance threshold | ✅ Implemented |
| Structured Logging | Winston rotating file logs (production) | ✅ Implemented |
| Process Management | PM2 with memory limits + prod env enforcement | ✅ Implemented |
| Cross-Tenant Isolation | company_id / owner_admin_id query filters | ✅ Implemented |
| Remote Session Invalidation | SuperAdmin force-logout and account deactivation | ✅ Implemented |
| Cloud Storage Security | Signed URLs (15-min TTL) + structured key paths | ✅ Implemented |

---

*This document reflects the security controls implemented in the CAL MISC application codebase as of May 2026. All controls are enforced server-side and cannot be bypassed through client-side manipulation.*
