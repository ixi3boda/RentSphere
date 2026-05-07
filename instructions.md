# Full Stack Project Deep Review & Logic Fix Prompt

You are a senior full-stack software architect and code reviewer.

I want you to perform a COMPLETE deep review of my entire full-stack project (frontend + backend) and fix all inconsistencies, broken flows, missing validations, incorrect logic, bad API usage, and frontend/backend mismatches.

## VERY IMPORTANT RULES

- DO NOT change my database schema in any way.
- DO NOT rename database tables or columns.
- DO NOT remove existing features unless they are completely broken.
- DO NOT make random refactors that are unrelated to fixing logic.
- Keep the project architecture/style consistent with the current codebase.
- Preserve all existing business logic unless it is incorrect or insecure.
- Focus on fixing logic, consistency, correctness, security, and API integration.

---

# MAIN REQUIREMENT

## Tenant Dashboard Access & Visibility

Currently, I want visitors/non-authenticated users to also be able to access and view the Tenant Dashboard UI.

Fix the logic so the application behaves correctly and consistently.

Requirements:
- Visitors/guests SHOULD be able to open and view the Tenant Dashboard page.
- Navbar/sidebar/dashboard links should appear correctly for visitors.
- The dashboard should gracefully handle unauthenticated users.
- Public-safe data should still load properly.
- Any actions requiring authentication must still be protected.
- If a visitor tries to perform protected actions (renting, favorites, payments, requests, etc.), redirect them to login or show proper authorization handling.
- Keep role-based restrictions for sensitive operations.
- Ensure frontend and backend logic remain fully consistent.

Examples:
- Visitors can browse/view tenant dashboard content.
- Visitors CANNOT perform tenant-only protected actions.
- Authenticated tenants get full functionality.
- Unauthorized users should receive proper HTTP status codes (`401` or `403`) for protected APIs.

---

# FULL PROJECT REVIEW REQUIREMENTS

Perform a FULL audit of the entire project.

## Backend Review

Carefully inspect:
- Controllers
- Services
- Repositories
- DTOs
- Security configuration
- JWT authentication/authorization
- Validation
- Exception handling
- API responses
- Role permissions
- Business logic
- Entity relationships
- Transaction flow
- API consistency

Check for:
- Broken endpoints
- Incorrect status codes
- Missing validations
- Null pointer risks
- Unsafe logic
- Duplicate logic
- Incorrect authentication flow
- Incorrect role access
- API contract mismatches
- Improper request/response handling
- Missing edge-case handling
- Security issues
- Improper ownership checks
- Missing authorization checks

Make sure:
- Every API is logical and correctly implemented.
- Every endpoint matches frontend expectations.
- All role restrictions are enforced correctly.
- Authentication flow is secure and consistent.
- API naming and behavior are consistent.

---

# Frontend Review

Carefully inspect:
- Routing
- State management
- API integration
- Authentication flow
- Protected routes
- Role-based rendering
- Navbar/sidebar visibility
- Forms
- Error handling
- Loading states
- Data fetching
- Component logic
- Dashboard logic
- Conditional rendering

Check for:
- Incorrect API calls
- Broken UI logic
- Wrong conditional rendering
- State inconsistencies
- Missing authentication checks
- Role leaks
- Improper redirects
- Broken protected routes
- Invalid assumptions
- Unhandled errors
- Duplicate requests
- Infinite re-renders
- Stale state bugs

Make sure:
- Frontend behavior matches backend logic.
- All APIs are consumed correctly.
- Role-based UI is fully secure and consistent.
- Visitors can safely access public tenant dashboard views.
- Protected actions remain secured.
- Unauthorized users are redirected properly when required.

---

# API CONSISTENCY CHECK

Carefully verify ALL frontend/backend integrations:
- Request payloads
- Response payloads
- DTO fields
- Field naming consistency
- Error response formats
- Pagination handling
- Authentication headers
- Token usage
- Route paths
- Query parameters

Fix all mismatches.

DO NOT miss any API.

---

# SECURITY REVIEW

Review and fix:
- JWT validation
- Token parsing
- Authorization logic
- Route protection
- Role enforcement
- Access control
- Ownership validation
- Sensitive endpoint exposure
- Visitor access leaks

Ensure:
- Public endpoints are intentionally public.
- Protected operations remain protected.
- Users cannot access unauthorized resources.
- Role escalation is impossible.

---

# CLEANUP & STABILITY

Also:
- Remove dead/unreachable logic if necessary.
- Fix inconsistent naming if it causes logic issues.
- Improve maintainability where needed WITHOUT unnecessary refactoring.
- Prevent future regressions.
- Add missing defensive checks.
- Ensure loading/error handling is stable.

---

# EXPECTED OUTPUT

While working:
1. Explain each major issue found.
2. Explain why it is wrong.
3. Show the fix applied.
4. Ensure fixes do not break existing functionality.
5. Verify frontend and backend work together correctly after changes.

Prioritize correctness, consistency, and stability over unnecessary optimization.