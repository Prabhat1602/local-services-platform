# Frontend Development Guide

This document provides detailed information for developers working on the Local Services Platform's frontend React application. It covers architecture, conventions, state management, API interaction, and best practices.

## 1. Project Structure (`client/src`)

The `client/src` directory is the heart of the frontend application.

* `assets/`: Stores static assets like images, icons, and fonts.
* `components/`: Reusable UI components that are generally stateless or manage their own small state, and can be used across multiple pages (e.g., `Navbar`, `StatCard`, `BookingCard`).
* `pages/`: Top-level components that represent specific views or routes in the application (e.g., `HomePage`, `AdminDashboardPage`, `ProfilePage`). These often orchestrate data fetching and compose multiple `components`.
* `contexts/`: (If used) Contains React Context API providers and consumers for global state management (e.g., `AuthContext`, `SocketContext`).
* `hooks/`: (If used) Custom React Hooks for encapsulating reusable logic (e.g., `useAuth`, `useSocket`).
* `services/`: (If used) Modules dedicated to interacting with the backend API (e.g., `authService.js`, `bookingService.js`). This helps centralize API logic.
* `utils/`: Utility functions or helpers that don't belong to a specific component or service (e.g., date formatters, validation helpers).
* `App.js`: The main application component that sets up routing and global layouts.
* `index.js`: The entry point of the React application, where the root component (`App`) is rendered.
* `index.css`: Contains global styles, utility classes, and custom CSS for various components that aren't styled inline.

## 2. State Management

The frontend primarily uses **React's built-in state management features**:

* **`useState`:** For component-local state.
* **`useReducer`:** For more complex component state logic, often as an alternative to `useState` when state transitions are intricate.
* **`useContext`:** For global state that needs to be accessed by many components without prop-drilling (e.g., user authentication status, socket connection).

**Best Practices:**
* Keep component state as local as possible.
* Lift state up only when necessary for multiple components to share it.
* Avoid prop-drilling by using `useContext` for truly global data.

## 3. Routing

Routing is managed using **`react-router-dom`**.

* **`App.js`:** Defines the main routes of the application.
* **`BrowserRouter`:** Wraps the entire application for client-side routing.
* **`Routes` and `Route` components:** Define path-to-component mappings.
* **`PrivateRoute`:** A custom wrapper component (likely in `components/` or `utils/`) that checks for user authentication (e.g., `token` in `localStorage`). If not authenticated, it redirects to `/login`.
* **`AdminRoute`:** A custom wrapper component similar to `PrivateRoute` but also checks if the authenticated user has an `admin` role. If not an admin, it redirects (e.g., to `/login` or a dedicated unauthorized page).

**Example Route Structure in `App.js`:**

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'; // Or wherever it resides
import AdminRoute from './components/AdminRoute';    // Or wherever it resides
// ... other page imports

function App() {
  return (
    <Router>
      <Navbar /> {/* Global Navbar */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected User Routes */}
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/bookings" element={<PrivateRoute><MyBookingsPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><AllBookingsPage /></AdminRoute>} />
        {/* ... other admin routes */}

        <Route path="*" element={<NotFoundPage />} /> {/* 404 handler */}
      </Routes>
      <Footer /> {/* Global Footer */}
    </Router>
  );
}
```

## 4. API Interaction

API requests to the backend are handled using **`axios`**.

* **Configuration:** `axios` instances can be configured with base URLs and headers.
* **Authorization:** All authenticated API requests must include a `Authorization: Bearer <token>` header, where `<token>` is retrieved from `localStorage`. This is often managed via a `config` object passed to `axios` calls or an `axios` interceptor.
* **Error Handling:**
    * `try...catch` blocks are used around `axios` calls to handle network errors and HTTP error responses (e.g., 400, 401, 404, 500).
    * Error messages from the backend (`err.response.data.message`) should be captured and displayed to the user.
    * For 401/403 errors, typically redirect to the login page.

**Example API Call Pattern:**

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

export const fetchAllBookings = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/admin/bookings`, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    // Handle error (e.g., throw, return specific error object)
    throw error;
  }
};
```

## 5. Styling

The frontend uses **Plain CSS**, defined primarily in `client/src/index.css`.

* **Global Styles:** Basic `body`, `h1`, `p`, etc., styles are in `index.css`.
* **Component-Specific Classes:** Unique class names are defined in `index.css` and applied to components (e.g., `.booking-card`, `.chat-container`, `.admin-dashboard-container`).
* **Utility Classes:** Some general utility classes (e.g., `.btn`, `.status-badge`) are also in `index.css` for consistent styling.
* **No CSS Modules or Styled Components:** Currently, a utility-first approach with global CSS is used.

## 6. Authentication Flow

1.  **Login/Register:** User submits credentials to backend API.
2.  **JWT Reception:** Backend sends back a JSON Web Token (JWT) on successful authentication.
3.  **Token Storage:** The JWT and `userInfo` (user ID, name, email, role) are stored in `localStorage` in the browser.
4.  **Protected Routes:** `PrivateRoute` and `AdminRoute` check for the presence and validity of the token/role in `localStorage` before rendering protected content.
5.  **API Requests:** The stored token is attached as an `Authorization: Bearer <token>` header for all protected API calls.
6.  **Logout:** Removes the token and `userInfo` from `localStorage` and redirects to the login page.

## 7. Common Pitfalls & Best Practices

* **`useEffect` Dependencies:** Always include all variables (props, state, functions) that your `useEffect` hook depends on in its dependency array. If a function is redefined on every render, wrap it in `useCallback`.
* **`useCallback` for Functions:** Memoize functions (especially API calls or event handlers) that are passed down to child components or are dependencies of `useEffect` to prevent unnecessary re-renders.
* **`localStorage` Safety:** Always use optional chaining (`?.`) when accessing properties of objects retrieved from `localStorage` (`JSON.parse(localStorage.getItem('userInfo'))?.token`) as `JSON.parse(null)` returns `null`.
* **Error Boundaries:** Consider implementing React Error Boundaries for gracefully handling rendering errors in parts of your UI, preventing the entire app from crashing.
* **Loading States:** Always manage loading states (`isLoading`, `setLoading(true/false)`) for asynchronous operations to provide feedback to the user.
* **Input Handling:** For forms, use controlled components where form elements' values are driven by React state.
* **Key Props in Lists:** Provide a unique `key` prop for each item when rendering lists of elements (e.g., `map()`) to help React efficiently update the UI.
* **CORS Issues:** If encountering CORS errors, double-check your backend's CORS configuration and ensure the frontend `REACT_APP_API_URL` is correct.
* **Dead Code Removal:** Regularly clean up unused imports, variables, and components.

---