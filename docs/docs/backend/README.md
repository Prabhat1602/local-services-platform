# Backend Development Guide

This document provides detailed information for developers working on the Local Services Platform's backend Node.js and Express.js API. It covers project structure, database interaction, API design, authentication, and key middleware.

## 1. Project Structure (`backend/`)

The `backend/` directory organizes the server-side logic and API endpoints.

* `config/`: Contains configuration files, primarily `db.js` for MongoDB connection.
* `controllers/`: Houses the business logic for handling API requests. Each controller typically corresponds to a resource (e.g., `userController.js`, `bookingController.js`). Functions here interact with models and send responses.
* `middleware/`: Contains middleware functions that execute before route handlers. This includes authentication (`authMiddleware.js`), authorization (`adminMiddleware.js`), and error handling (`errorMiddleware.js`).
* `models/`: Defines Mongoose schemas and models for the MongoDB database (e.g., `User.js`, `Service.js`, `Booking.js`).
* `routes/`: Defines the API endpoints using `express.Router()`. Each route file typically corresponds to a resource and links to controller functions (e.g., `userRoutes.js`, `serviceRoutes.js`).
* `utils/`: Contains utility functions such as JWT token generation (`generateToken.js`), API error handling, or other helpers.
* `server.js`: The main entry point of the backend application, responsible for setting up the Express app, connecting to the database, configuring middleware, and defining base routes.

## 2. Database Interaction (MongoDB & Mongoose)

The application uses **MongoDB** as its NoSQL database, with **Mongoose** for object data modeling.

* **Connection (`config/db.js`):** Establishes the connection to MongoDB using the `MONGO_URI` environment variable.
* **Models (`models/`):**
    * Mongoose schemas define the structure, data types, and validations for documents within MongoDB collections.
    * Each schema is compiled into a Model, which provides an interface for interacting with the corresponding collection (e.g., `User.find()`, `Service.create()`).
    * Common Mongoose features like `pre` hooks (for password hashing), virtuals, and population are used.

**Example Model (`models/User.js`):**

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'provider', 'admin'], default: 'user' },
    // ... other fields like providerStatus if applicable
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
```

## 3. API Design & Endpoints

* **RESTful Principles:** Endpoints generally follow RESTful conventions (e.g., `GET /api/users` for all users, `GET /api/users/:id` for a single user, `POST /api/users` for creating a user).
* **Routing (`routes/`):**
    * Each resource (e.g., users, services, bookings) has its own route file.
    * Routes specify the HTTP method (`get`, `post`, `put`, `delete`) and the corresponding controller function to execute.
    * Middleware functions are chained before controller functions to handle authentication, authorization, or other pre-processing.

**Example Route (`routes/userRoutes.js`):**

```javascript
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
```

## 4. Authentication & Authorization (JWT)

* **JSON Web Tokens (JWT):** Used for stateless authentication.
* **Login Flow:**
    1.  User sends credentials (`email`, `password`) to a login endpoint.
    2.  Backend verifies credentials.
    3.  If valid, a JWT is generated using `JWT_SECRET` and user `_id`, then sent back to the client.
* **Protected Routes (`middleware/authMiddleware.js`):**
    1.  The `protect` middleware extracts the JWT from the `Authorization: Bearer <token>` header.
    2.  It verifies the token's authenticity and expiration using `JWT_SECRET`.
    3.  If valid, the user's information (fetched from the database using the `_id` from the token payload) is attached to the `req.user` object, and the request proceeds to the next middleware/controller.
    4.  If invalid, a 401 (Unauthorized) error is returned.
* **Admin Authorization (`middleware/adminMiddleware.js`):**
    1.  The `admin` middleware is used *after* `protect`.
    2.  It checks `req.user.role === 'admin'`.
    3.  If the user is not an admin, a 403 (Forbidden) error is returned.

## 5. Middleware

Middleware functions are crucial for request processing before reaching the final route handler.

* **`express.json()` and `express.urlencoded()`:** For parsing request bodies.
* **`cors()`:** Enables Cross-Origin Resource Sharing, allowing the frontend to make requests to the backend from a different domain/port.
* **`authMiddleware.js` (`protect`):** Authenticates users via JWT.
* **`adminMiddleware.js` (`admin`):** Authorizes users based on their `admin` role.
* **`errorMiddleware.js` (`errorHandler`):** A custom error-handling middleware that catches errors thrown by route handlers and formats them into a consistent JSON error response. This prevents uncaught exceptions from crashing the server and provides meaningful feedback to the client.

## 6. Error Handling

* **Asynchronous Handler Wrapping:** Route handlers that perform asynchronous operations are often wrapped in a utility (e.g., `express-async-handler` or a custom `asyncHandler` function) to automatically catch exceptions and pass them to the error-handling middleware.
* **Custom Error Classes:** For specific API errors (e.g., `NotFoundError`, `BadRequestError`), custom error classes can be used to provide more granular control over HTTP status codes and messages.
* **Global Error Middleware:** The `errorMiddleware.js` handles all errors passed to `next()` or thrown in async handlers, providing a consistent error response structure (status code, message, stack trace in development).

## 7. Real-time Communication (Socket.IO)

* **Integration with Express:** Socket.IO is integrated alongside the Express server in `server.js`.
* **Events:**
    * **Backend Emits:** Emits events for real-time updates (e.g., `new_message`, `booking_updated`, `notification`) to connected clients.
    * **Backend Listens:** Listens for events from clients (e.g., `send_message`, `join_chat`).
* **Usage:** Primarily used for the chat functionality and real-time notifications. Users can join specific chat rooms (e.g., based on booking ID) to receive relevant messages.

## 8. Development & Deployment

* **Local Development:**
    * Ensure MongoDB is running (local or Atlas).
    * Set `MONGO_URI`, `JWT_SECRET`, etc., in `backend/.env`.
    * Run `npm start` (or `yarn start`).
* **Deployment (Render):**
    * Refer to the `docs/DEPLOYMENT.md` for detailed steps.
    * Environment variables are configured directly on the Render dashboard.
    * Ensure build and start commands are correctly set.

---
