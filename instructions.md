# Full Project Consistency & Architecture Review Prompt

You are a senior full-stack software architect and code reviewer.  
I want you to perform a COMPLETE audit and refactor review of my entire full-stack project.

## Main Goal
Fix all inconsistencies between frontend and backend while keeping the project architecture clean, logical, maintainable, and production-ready.

---

# VERY IMPORTANT RULES

- DO NOT change the database schema itself.
- DO NOT rename database tables or columns.
- DO NOT modify SQL schema definitions unless absolutely required for runtime compatibility.
- You MAY adjust:
  - backend logic
  - DTOs
  - API contracts
  - frontend integration
  - validation
  - state handling
  - naming consistency
  - response structures
  - service logic
  - controller logic
  - frontend models/interfaces/types
  - API calls
  - error handling
  - route logic
  - authentication flow
  - business logic consistency

---

# Required Tasks

## 1. Full Backend Review

Review ALL backend layers carefully:
- Controllers
- Services
- Repositories
- DTOs
- Entities/Models
- Validation
- Security/Auth
- Exception handling
- API routes
- HTTP methods
- Request/response structures

Check for:
- incorrect logic
- inconsistent naming
- missing validations
- duplicated logic
- bad architecture
- broken API design
- inconsistent response bodies
- incorrect status codes
- nullable issues
- missing edge-case handling
- incorrect business flow
- poor separation of concerns

Fix everything logically.

---

## 2. Full Frontend Review

Review ALL frontend code carefully:
- API integration
- State management
- Forms
- Components
- Pages
- Hooks
- Services/API files
- Routing
- Authentication flow
- Protected routes
- Role-based rendering
- Data rendering
- Error handling
- Loading states
- UI logic

Check for:
- incorrect API usage
- wrong field names
- mismatched DTO fields
- stale state bugs
- inconsistent naming
- duplicated requests
- broken forms
- invalid assumptions
- incorrect response parsing
- hardcoded values
- inconsistent user flows
- improper async handling

Fix everything logically.

---

## 3. API Contract Verification (VERY IMPORTANT)

Review EVERY SINGLE API in the project.

For each API:
- Verify frontend request matches backend request DTO.
- Verify frontend response handling matches backend response structure.
- Verify endpoint paths are correct.
- Verify HTTP methods are correct.
- Verify authentication requirements are correct.
- Verify role restrictions are correct.
- Verify validation rules are consistent.
- Verify query/path/body parameters are correct.
- Verify null handling and optional fields are correct.

DO NOT MISS ANY API.

Create consistency between:
- backend DTOs
- frontend interfaces/types
- frontend forms
- frontend rendering
- API responses

---

## 4. Business Logic Validation

Ensure the entire project flow is logical.

Examples:
- Property creation/update flow
- Authentication flow
- Enrollment/renting/payment/request flow
- Favorites/bookmarks flow
- Role permissions
- Admin actions
- User ownership checks
- Status transitions
- Error cases
- Unauthorized access prevention

Fix any illogical or inconsistent behavior.

---

## 5. Naming & Structure Consistency

Standardize naming across the entire project:
- DTO names
- API names
- variable names
- response fields
- frontend types
- services
- routes
- folder structure

Examples:
- camelCase consistency
- singular/plural consistency
- response naming consistency
- ID naming consistency

---

## 6. Cleanup & Refactoring

Improve code quality without changing project functionality.

Allowed improvements:
- remove dead code
- remove duplicate code
- simplify logic
- improve readability
- improve maintainability
- improve modularity
- improve reusable components/services
- improve validation structure
- improve error handling

BUT:
- preserve existing features
- preserve database schema
- preserve core architecture unless necessary

---

## 7. Final Deliverables

After review:
1. Apply all fixes directly.
2. Explain every major issue found.
3. Explain why each fix was necessary.
4. List all changed files.
5. Highlight any dangerous logic bugs found.
6. Highlight any frontend/backend mismatch found.
7. Highlight any security concerns found.
8. Provide recommendations for future scalability.

---

# Review Style

Be EXTREMELY strict and thorough.
Act like a senior engineer reviewing production code before deployment.

Do NOT skip files.
Do NOT assume things work.
Trace actual data flow end-to-end:

Frontend → API → Service → Repository → Database → Response → Frontend Rendering

Review the ENTIRE project systematically.