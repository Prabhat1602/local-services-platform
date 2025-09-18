# API Reference: Local Services Platform

This document provides a comprehensive reference for all RESTful API endpoints available in the Local Services Platform backend. It details the method, endpoint URL, functionality, required authentication, request body structure, and expected responses for each endpoint.

**Base URL:** `/api`
*(During local development, this would be `http://localhost:5000/api`. In production, it will be your deployed Render backend URL, e.g., `https://your-backend-api.onrender.com/api`.)*

## Authentication

All protected routes require a JSON Web Token (JWT) to be sent in the `Authorization` header as a Bearer token.

**Header:** `Authorization: Bearer <YOUR_JWT_TOKEN>`

## 1. User Authentication & Profile

### `POST /api/users/register`
* **Description:** Registers a new user or provider.
* **Authentication:** None (Public)
* **Request Body:**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "strongpassword123",
      "role": "user" // or "provider"
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "_id": "60a...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "token": "eyJhbGciOiJIUzI1Ni...",
      "providerStatus": "N/A", // If role is user
      "createdAt": "2023-10-27T10:00:00.000Z"
    }
    ```
* **Error Responses:** 400 Bad Request (Missing fields, invalid email, user already exists), 500 Internal Server Error

### `POST /api/users/login`
* **Description:** Authenticates a user and returns a JWT.
* **Authentication:** None (Public)
* **Request Body:**
    ```json
    {
      "email": "john.doe@example.com",
      "password": "strongpassword123"
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60a...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "token": "eyJhbGciOiJIUzI1Ni...",
      "providerStatus": "N/A"
    }
    ```
* **Error Responses:** 400 Bad Request (Invalid credentials), 401 Unauthorized (Invalid password), 500 Internal Server Error

### `GET /api/users/me`
* **Description:** Gets the profile of the authenticated user.
* **Authentication:** Required (User/Provider/Admin)
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60a...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "providerStatus": "N/A",
      "createdAt": "2023-10-27T10:00:00.000Z"
    }
    ```
* **Error Responses:** 401 Unauthorized, 500 Internal Server Error

### `PUT /api/users/profile`
* **Description:** Updates the profile of the authenticated user.
* **Authentication:** Required (User/Provider/Admin)
* **Request Body:**
    ```json
    {
      "name": "John D. updated",
      "email": "new.email@example.com",
      "password": "newstrongpassword" // Optional: only if changing password
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60a...",
      "name": "John D. updated",
      "email": "new.email@example.com",
      "role": "user",
      "token": "eyJhbGciOiJIUzI1Ni...", // New token if email/password changed
      "updatedAt": "2023-10-27T10:30:00.000Z"
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

## 2. Services (Provider Specific)

### `POST /api/services`
* **Description:** Creates a new service listing for the authenticated provider.
* **Authentication:** Required (Provider)
* **Request Body:**
    ```json
    {
      "name": "Plumbing Repair",
      "description": "Expert plumbing services for leaks, clogs, and installations.",
      "category": "Home Repair",
      "price": 75,
      "priceUnit": "hour", // or "fixed", "project"
      "availability": [
        { "day": "Monday", "startTime": "09:00", "endTime": "17:00" },
        { "day": "Wednesday", "startTime": "10:00", "endTime": "18:00" }
      ],
      "location": "Anytown" // or specific areas/zip codes
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "_id": "60b...",
      "provider": "60a...", // Provider's user ID
      "name": "Plumbing Repair",
      "category": "Home Repair",
      "price": 75,
      // ... other service details
      "createdAt": "2023-10-27T11:00:00.000Z"
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 403 Forbidden (Not a provider), 500 Internal Server Error

### `GET /api/services/me`
* **Description:** Retrieves all services listed by the authenticated provider.
* **Authentication:** Required (Provider)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60b...",
        "name": "Plumbing Repair",
        // ... service details
      },
      {
        "_id": "60c...",
        "name": "Emergency Drain Cleaning",
        // ... service details
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not a provider), 500 Internal Server Error

### `PUT /api/services/:id`
* **Description:** Updates a specific service listing owned by the authenticated provider.
* **Authentication:** Required (Provider)
* **Parameters:** `id` (Service ID)
* **Request Body:** (Partial updates are allowed)
    ```json
    {
      "price": 80,
      "description": "Updated plumbing description."
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60b...",
      "name": "Plumbing Repair",
      "price": 80,
      // ... updated service details
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 403 Forbidden (Not owner/provider), 404 Not Found, 500 Internal Server Error

### `DELETE /api/services/:id`
* **Description:** Deletes a specific service listing owned by the authenticated provider.
* **Authentication:** Required (Provider)
* **Parameters:** `id` (Service ID)
* **Success Response (200 OK):**
    ```json
    {
      "message": "Service removed"
    }
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not owner/provider), 404 Not Found, 500 Internal Server Error

## 3. Service Discovery (User & Public)

### `GET /api/services`
* **Description:** Retrieves all available services, with optional filtering and search.
* **Authentication:** Optional (Public)
* **Query Parameters:**
    * `category`: Filter by service category (e.g., `?category=Home Repair`).
    * `location`: Filter by service location (e.g., `?location=Anytown`).
    * `search`: Search by service name or description (e.g., `?search=clean`).
    * `minPrice`, `maxPrice`: Filter by price range.
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60b...",
        "provider": { "_id": "60a...", "name": "Provider A", "averageRating": 4.5 },
        "name": "Plumbing Repair",
        "description": "Expert plumbing services...",
        "category": "Home Repair",
        "price": 75,
        "priceUnit": "hour",
        "averageRating": 4.5,
        "reviewsCount": 10
      }
      // ... more services
    ]
    ```
* **Error Responses:** 500 Internal Server Error

### `GET /api/services/:id`
* **Description:** Retrieves details for a specific service.
* **Authentication:** Optional (Public)
* **Parameters:** `id` (Service ID)
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60b...",
      "provider": { "_id": "60a...", "name": "Provider A", "email": "provider@example.com", "averageRating": 4.5 },
      "name": "Plumbing Repair",
      "description": "Expert plumbing services...",
      "category": "Home Repair",
      "price": 75,
      "priceUnit": "hour",
      "availability": [ /* ... */ ],
      "location": "Anytown",
      "averageRating": 4.5,
      "reviewsCount": 10,
      "createdAt": "2023-10-27T11:00:00.000Z"
    }
    ```
* **Error Responses:** 404 Not Found, 500 Internal Server Error

## 4. Bookings

### `POST /api/bookings`
* **Description:** Creates a new booking for a service.
* **Authentication:** Required (User)
* **Request Body:**
    ```json
    {
      "service": "60b...", // Service ID
      "provider": "60a...", // Provider User ID
      "scheduledDate": "2023-11-15T14:00:00.000Z", // ISO date string
      "message": "Need a faucet fixed in the kitchen."
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "_id": "60d...",
      "user": "60e...", // User ID
      "service": { "_id": "60b...", "name": "Plumbing Repair" },
      "provider": { "_id": "60a...", "name": "Provider A" },
      "scheduledDate": "2023-11-15T14:00:00.000Z",
      "status": "Pending",
      "createdAt": "2023-10-27T12:00:00.000Z"
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

### `GET /api/bookings/my`
* **Description:** Retrieves all bookings made by the authenticated user.
* **Authentication:** Required (User)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60d...",
        "service": { "_id": "60b...", "name": "Plumbing Repair" },
        "provider": { "_id": "60a...", "name": "Provider A" },
        "scheduledDate": "2023-11-15T14:00:00.000Z",
        "status": "Pending",
        // ...
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 500 Internal Server Error

### `GET /api/bookings/provider`
* **Description:** Retrieves all bookings received by the authenticated provider.
* **Authentication:** Required (Provider)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60d...",
        "user": { "_id": "60e...", "name": "User B" },
        "service": { "_id": "60b...", "name": "Plumbing Repair" },
        "scheduledDate": "2023-11-15T14:00:00.000Z",
        "status": "Pending",
        // ...
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not a provider), 500 Internal Server Error

### `PUT /api/bookings/:id/status`
* **Description:** Updates the status of a specific booking (e.g., 'Confirmed', 'Cancelled', 'Completed').
* **Authentication:** Required (Provider for Confirm/Cancel, User for Cancel, Admin for any)
* **Parameters:** `id` (Booking ID)
* **Request Body:**
    ```json
    {
      "status": "Confirmed" // "Pending", "Confirmed", "Completed", "Cancelled", "Disputed"
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60d...",
      "status": "Confirmed",
      // ... updated booking details
    }
    ```
* **Error Responses:** 400 Bad Request (Invalid status), 401 Unauthorized, 403 Forbidden (Not authorized to change status), 404 Not Found, 500 Internal Server Error

### `PUT /api/bookings/:id/reschedule`
* **Description:** Reschedules a booking.
* **Authentication:** Required (User or Provider)
* **Parameters:** `id` (Booking ID)
* **Request Body:**
    ```json
    {
      "newScheduledDate": "2023-11-20T10:00:00.000Z" // New ISO date string
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60d...",
      "scheduledDate": "2023-11-20T10:00:00.000Z",
      // ... updated booking details
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

### `POST /api/bookings/:id/dispute`
* **Description:** Files a dispute for a completed booking.
* **Authentication:** Required (User)
* **Parameters:** `id` (Booking ID)
* **Request Body:**
    ```json
    {
      "reason": "Service was not performed as described."
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60d...",
      "status": "Disputed",
      "dispute": { "reason": "Service was not performed as described.", "filedAt": "2023-10-27T15:00:00.000Z" }
    }
    ```
* **Error Responses:** 400 Bad Request (Booking not completed), 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

## 5. Reviews

### `POST /api/reviews`
* **Description:** Submits a review for a completed booking.
* **Authentication:** Required (User)
* **Request Body:**
    ```json
    {
      "booking": "60d...", // Booking ID
      "rating": 5, // 1-5
      "comment": "Excellent service, highly recommend!"
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "_id": "60f...",
      "user": "60e...",
      "service": "60b...", // Service ID
      "provider": "60a...", // Provider ID
      "rating": 5,
      "comment": "Excellent service, highly recommend!",
      "createdAt": "2023-10-27T13:00:00.000Z"
    }
    ```
* **Error Responses:** 400 Bad Request (Booking not completed, already reviewed), 401 Unauthorized, 500 Internal Server Error

### `GET /api/services/:id/reviews`
* **Description:** Retrieves all reviews for a specific service.
* **Authentication:** Optional (Public)
* **Parameters:** `id` (Service ID)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60f...",
        "user": { "_id": "60e...", "name": "User B" },
        "rating": 5,
        "comment": "Excellent service!",
        "createdAt": "2023-10-27T13:00:00.000Z"
      }
    ]
    ```
* **Error Responses:** 404 Not Found, 500 Internal Server Error

## 6. Chat

### `GET /api/chat/conversations`
* **Description:** Retrieves a list of all conversations for the authenticated user/provider.
* **Authentication:** Required (User/Provider)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "610...",
        "participants": [ { "_id": "60e...", "name": "User B" }, { "_id": "60a...", "name": "Provider A" } ],
        "lastMessage": { "sender": "60e...", "content": "Are you available next week?", "createdAt": "2023-10-27T14:00:00.000Z" }
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 500 Internal Server Error

### `GET /api/chat/messages/:conversationId`
* **Description:** Retrieves messages for a specific conversation.
* **Authentication:** Required (Participant of conversation)
* **Parameters:** `conversationId` (Conversation ID)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "611...",
        "conversation": "610...",
        "sender": { "_id": "60e...", "name": "User B" },
        "content": "Are you available next week?",
        "createdAt": "2023-10-27T14:00:00.000Z"
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not participant), 404 Not Found, 500 Internal Server Error

### `POST /api/chat/messages`
* **Description:** Sends a new message to an existing conversation.
* **Authentication:** Required (Participant of conversation)
* **Request Body:**
    ```json
    {
      "conversationId": "610...",
      "content": "Yes, I am free on Tuesday afternoon."
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "_id": "612...",
      "conversation": "610...",
      "sender": "60a...",
      "content": "Yes, I am free on Tuesday afternoon.",
      "createdAt": "2023-10-27T14:05:00.000Z"
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

## 7. Notifications

### `GET /api/notifications`
* **Description:** Retrieves all notifications for the authenticated user.
* **Authentication:** Required (User/Provider/Admin)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "613...",
        "user": "60e...",
        "message": "Your booking for Plumbing Repair has been confirmed.",
        "type": "booking_confirmed",
        "read": false,
        "createdAt": "2023-10-27T15:00:00.000Z"
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 500 Internal Server Error

### `PUT /api/notifications/:id/read`
* **Description:** Marks a specific notification as read.
* **Authentication:** Required (User/Provider/Admin)
* **Parameters:** `id` (Notification ID)
* **Success Response (200 OK):**
    ```json
    {
      "_id": "613...",
      "read": true,
      // ... other notification details
    }
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

## 8. Admin Endpoints

*(These endpoints require an authenticated user with the `admin` role.)*

### `GET /api/admin/stats`
* **Description:** Retrieves platform-wide statistics for the admin dashboard.
* **Authentication:** Required (Admin)
* **Success Response (200 OK):**
    ```json
    {
      "totalUsers": 150,
      "totalProviders": 25,
      "totalServices": 80,
      "totalBookings": 300,
      "totalRevenue": 15000.50,
      "averageRating": 4.2
    }
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not admin), 500 Internal Server Error

### `GET /api/admin/users`
* **Description:** Retrieves a list of all users on the platform, including provider status.
* **Authentication:** Required (Admin)
* **Query Parameters:**
    * `role`: Filter by role (e.g., `?role=provider`).
    * `status`: Filter by provider status (e.g., `?status=Pending`).
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60a...",
        "name": "Provider A",
        "email": "provider@example.com",
        "role": "provider",
        "providerStatus": "Approved",
        "createdAt": "2023-10-27T08:00:00.000Z"
      },
      {
        "_id": "60e...",
        "name": "User B",
        "email": "user@example.com",
        "role": "user",
        "providerStatus": "N/A",
        "createdAt": "2023-10-27T09:00:00.000Z"
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not admin), 500 Internal Server Error

### `PUT /api/admin/users/:id/status`
* **Description:** Updates the `providerStatus` of a user (typically for approving/rejecting providers).
* **Authentication:** Required (Admin)
* **Parameters:** `id` (User ID)
* **Request Body:**
    ```json
    {
      "status": "Approved" // "Pending", "Approved", "Rejected"
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "_id": "60a...",
      "providerStatus": "Approved",
      // ... other user details
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 403 Forbidden (Not admin), 404 Not Found, 500 Internal Server Error

### `GET /api/admin/bookings`
* **Description:** Retrieves all bookings across the platform.
* **Authentication:** Required (Admin)
* **Query Parameters:** (Optional filters by `status`, `providerId`, `userId`, `serviceId`)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "60d...",
        "user": { "_id": "60e...", "name": "User B" },
        "service": { "_id": "60b...", "name": "Plumbing Repair" },
        "provider": { "_id": "60a...", "name": "Provider A" },
        "scheduledDate": "2023-11-15T14:00:00.000Z",
        "status": "Confirmed",
        "dispute": null,
        "createdAt": "2023-10-27T12:00:00.000Z"
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not admin), 500 Internal Server Error

### `GET /api/admin/feedback`
* **Description:** Retrieves all user feedback/support messages.
* **Authentication:** Required (Admin)
* **Success Response (200 OK):**
    ```json
    [
      {
        "_id": "614...",
        "user": { "_id": "60e...", "name": "User B" }, // or null if guest
        "subject": "App Crash on Booking Page",
        "message": "The app crashes every time I try to confirm a booking.",
        "createdAt": "2023-10-27T16:00:00.000Z"
      }
    ]
    ```
* **Error Responses:** 401 Unauthorized, 403 Forbidden (Not admin), 500 Internal Server Error

## 9. Payments (Placeholder - If Stripe/PayPal Integrated)

### `POST /api/payments/create-checkout-session`
* **Description:** Creates a Stripe Checkout session for a booking.
* **Authentication:** Required (User)
* **Request Body:**
    ```json
    {
      "bookingId": "60d...",
      "amount": 7500, // in cents, e.g., $75.00
      "currency": "usd"
    }
    ```
* **Success Response (200 OK):**
    ```json
    {
      "sessionId": "cs_test_..." // Stripe checkout session ID
    }
    ```
* **Error Responses:** 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

---