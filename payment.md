Analyze the RentSphere frontend payment system ONLY.

⚠️ IMPORTANT:
- Frontend changes ONLY.
- Do NOT modify backend.
- Do NOT modify database.
- Backend is trusted.

Goal:
Fix the payment UI logic and role rendering.

Requirements:
- TENANT should see:
  - payment list
  - payment status
  - Pay button/actions

- OWNER/ADMIN should see:
  - payment list
  - payment status
  - tenant payment history
  - NO Pay button
  - NO payment actions

Verify:
- role-based rendering
- dashboard payment sections
- payment components
- conditional buttons/actions
- route protection
- payment API usage
- payment state handling

Detect:
- incorrect role checks
- ADMIN seeing tenant payment actions
- broken conditional rendering
- invalid payment permissions
- duplicated payment UI logic

Provide:
- exact frontend files to edit
- exact code fixes
- corrected conditional rendering
- cleaned role-based UI logic

Focus ONLY on frontend payment visibility and permissions.