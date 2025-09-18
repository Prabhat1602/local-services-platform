# Development Guidelines: Local Services Platform

This document outlines general guidelines, best practices, coding standards, and common workflows for developers working on the Local Services Platform. Adhering to these guidelines ensures code consistency, maintainability, and efficient collaboration across the team.

## 1. General Principles

* **Readability:** Write code that is easy to understand, even by someone unfamiliar with the codebase.
* **Maintainability:** Design and implement features with future changes and bug fixes in mind.
* **Modularity:** Break down complex problems into smaller, manageable, and reusable units.
* **Testability:** Write code that can be easily tested, and include tests where appropriate.
* **Performance:** Be mindful of performance implications, especially for critical paths and database operations.
* **Security:** Always consider security implications, especially when handling user data, authentication, and API endpoints.

## 2. Coding Standards & Conventions

### 2.1 Naming Conventions

* **Variables/Functions:** `camelCase` (e.g., `userName`, `getUserProfile`).
* **Constants:** `UPPER_SNAKE_CASE` (e.g., `API_URL`, `JWT_SECRET`).
* **React Components:** `PascalCase` (e.g., `UserProfile`, `AdminDashboardPage`).
* **Files:**
    * `PascalCase.js` for React components (e.g., `UserProfile.js`).
    * `camelCase.js` for utility files, middleware, controllers, routes, models (e.g., `userController.js`, `authMiddleware.js`).
* **CSS Classes:** `kebab-case` (e.g., `admin-dashboard-container`, `btn-primary`).

### 2.2 Formatting

* **Indentation:** 2 spaces (no tabs).
* **Line Endings:** LF (Unix style).
* **Quotes:** Single quotes (`'`) for strings in JavaScript, double quotes (`"`) for JSX attributes.
* **Semicolons:** Use semicolons at the end of statements.
* **Line Length:** Aim for a maximum of 120 characters per line.

### 2.3 Comments

* Use comments to explain *why* certain decisions were made, not just *what* the code does (the code should be self-documenting for the "what").
* Complex algorithms or business logic should have inline comments.
* JSDoc style comments are encouraged for functions, especially API endpoints or reusable utilities, to describe parameters, return values, and side effects.

### 2.4 Code Structure

* **Imports:** Group imports by type (React, external libraries, local components, local utilities), separated by blank lines. Alphabetize within groups.
* **Exports:** Prefer named exports for most modules; use default exports sparingly (e.g., for `App.js` or main components).

## 3. Version Control (Git) Workflow

* **Branching Model:** Use a feature-branch workflow.
    * `main` (or `master`) branch is always deployable.
    * Create new branches from `main` for each new feature or bug fix (e.g., `feature/add-chat`, `bugfix/fix-login-redirect`).
    * Avoid direct commits to `main`.
* **Commit Messages:**
    * Follow Conventional Commits specification (or a similar clear pattern).
    * **Format:** `<type>(<scope>): <subject>`
        * **Type:** `feat` (new feature), `fix` (bug fix), `docs` (documentation only), `style` (code formatting), `refactor` (code restructuring), `test` (adding tests), `chore` (maintenance, build tools), `perf` (performance improvement).
        * **Scope (Optional):** Indicate affected part (e.g., `(frontend)`, `(backend-auth)`, `(admin-dashboard)`).
        * **Subject:** Concise, imperative mood (e.g., `feat: Add real-time chat functionality`).
* **Pull Requests (PRs):**
    * Always open a PR for merging feature branches into `main`.
    * Provide a clear description of the changes, motivation, and any relevant issue numbers.
    * Request reviews from at least one other developer.
    * Ensure all automated tests pass before merging.
    * Resolve all comments and merge conflicts.

## 4. Frontend Specific Guidelines (React)

* **Functional Components & Hooks:** Prefer functional components with React Hooks over class components for new development.
* **Component Composition:** Favor composition over inheritance. Break down large components into smaller, focused ones.
* **Prop Drilling:** Minimize prop drilling. Use `React.Context` or global state solutions (if implemented) for widely used data.
* **`useEffect` Discipline:**
    * Understand the `useEffect` dependency array thoroughly. Missing dependencies lead to stale closures or infinite loops.
    * Empty dependency array (`[]`) means it runs once after initial render.
    * No dependency array means it runs on every render.
    * Always clean up side effects (subscriptions, timers) by returning a cleanup function.
* **Memoization (`useMemo`, `useCallback`, `React.memo`):** Use these hooks judiciously to optimize performance by preventing unnecessary re-renders, especially for expensive computations or when passing functions/objects as props.
* **Conditional Rendering:** Handle loading states, error states, and empty data gracefully with clear UI feedback.
* **Accessibility (a11y):** Strive to make components accessible by using semantic HTML, ARIA attributes, and keyboard navigation.

## 5. Backend Specific Guidelines (Node.js/Express)

* **API Design:** Adhere to RESTful principles (resources, HTTP methods, status codes).
* **Separation of Concerns:**
    * **Routes:** Define endpoint paths and link to controller actions. Keep them lean.
    * **Controllers:** Handle request/response, validate data, interact with services/models, and implement business logic.
    * **Models:** Define database schemas and handle data persistence logic.
    * **Middleware:** For cross-cutting concerns like authentication, authorization, logging, error handling.
* **Error Handling:**
    * Use `try...catch` for synchronous code.
    * Use a global error-handling middleware (`errorMiddleware.js`) to catch and format errors consistently.
    * Utilize `express-async-handler` (or a similar wrapper) for async route handlers to automatically catch promises rejections.
* **Validation:** Implement input validation on the backend for all incoming data to prevent security vulnerabilities and ensure data integrity.
* **Security:**
    * Never store raw passwords; always hash them (e.g., `bcrypt.js`).
    * Sanitize all user inputs to prevent XSS and SQL Injection (though less critical with MongoDB/Mongoose, still good practice for general input).
    * Properly configure CORS (as detailed in `docs/DEPLOYMENT.md`).
    * Validate JWT tokens on every protected request.
    * Implement rate-limiting for authentication endpoints.

## 6. Testing

* **Unit Tests:** Test individual functions, components, and models in isolation.
* **Integration Tests:** Test the interaction between multiple units (e.g., API endpoint -> controller -> model -> database).
* **End-to-End (E2E) Tests:** (Optional, but recommended for critical user flows) Test the application from a user's perspective, simulating browser interactions.
* **Tools:**
    * **Frontend:** Jest, React Testing Library.
    * **Backend:** Jest (or Mocha/Chai), Supertest for API testing.
* **Running Tests:**
    * Frontend: `cd client && npm test`
    * Backend: `cd backend && npm test`
* **Before Merging:** Ensure all tests pass on your feature branch.

## 7. Tooling & Development Environment

* **Linters (ESLint):** Use ESLint with a consistent configuration (e.g., Airbnb or Standard JS) to enforce code style and catch potential errors early. Configure it to run automatically on save.
* **Formatters (Prettier):** Use Prettier to automatically format code for consistency. Integrate with your IDE and potentially pre-commit hooks.
* **IDE:** Visual Studio Code is recommended with relevant extensions (ESLint, Prettier, React/Node snippets).
* **Debugging:** Learn to use your IDE's debugger for both frontend (browser dev tools) and backend (Node.js debugger).

---