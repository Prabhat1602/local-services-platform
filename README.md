

# Local Services Platform

## 🚀 Project Overview

The Local Services Platform is a full-stack web application designed to connect users seeking various local services (e.g., plumbing, cleaning, tutoring) with qualified service providers. The platform facilitates service discovery, booking, payment, and real-time communication, aiming to streamline the process of finding and offering local expertise.

This document serves as a comprehensive guide for understanding the project's architecture, technologies, and functionality.

---

## ✨ Key Features

* **User & Provider Authentication:** Secure registration and login system for both users and service providers (JWT-based).
* **Service Listings:** Providers can create, manage, and update detailed service listings including descriptions, pricing, and availability.
* **Service Discovery:** Users can search and browse services by category, location, and other filters.
* **Booking System:** Intuitive calendar-based booking functionality allowing users to schedule services.
* **Real-time Chat:** Integrated Socket.IO for instant messaging between users and providers regarding bookings.
* **Notifications:** Real-time alerts for booking updates, new messages, and other important events.
* **Secure Payments:** Integration with Stripe for secure and efficient payment processing.
* **Reviews & Ratings:** Users can review services they've received, building trust and quality assurance.
* **Admin Dashboard:** A dedicated interface for administrators to manage users, services, bookings, and resolve disputes.

---

## 🛠️ Technologies Used

### Frontend
* **React.js:** For building a dynamic and responsive single-page application user interface.
* **React Router DOM:** For client-side routing.
* **Axios:** For making HTTP requests to the backend API.
* **Socket.IO Client:** For real-time communication with the backend.
* **Tailwind CSS:** For efficient and highly customizable styling.

### Backend
* **Node.js:** The JavaScript runtime environment.
* **Express.js:** A fast, unopinionated, minimalist web framework for Node.js.
* **MongoDB:** A NoSQL database for flexible and scalable data storage.
* **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
* **Socket.IO:** For enabling real-time, bidirectional communication (chat, notifications).
* **JSON Web Tokens (JWT):** For secure user authentication and authorization.
* **Bcrypt.js:** For hashing passwords securely.
* **Stripe API:** For payment gateway integration.
* **Node-Cron:** For scheduling background tasks (e.g., reminder emails).

### Deployment
* **Frontend:** Vercel
* **Backend:** Render

---

## 🏗️ Project Architecture

The project follows a client-server architecture with a clear separation of concerns between the frontend (React.js SPA) and the backend (Node.js/Express API). Communication between the two is primarily via RESTful API calls, supplemented by WebSocket (Socket.IO) for real-time features.

### Frontend Structure

The React application is organized into `components` for reusable UI elements and `pages` for full-view components, managed by `react-router-dom`.

/client
├── public
├── src
│   ├── assets        # Local frontend assets (logos, icons)
│   ├── components    # Reusable UI elements (Navbar, Modals, Buttons)
│   ├── contexts      # React Context for global state (AuthContext)
│   ├── hooks         # Custom React Hooks
│   ├── pages         # Main application views (HomePage, LoginPage, ChatPage)
│   ├── services      # API service calls
│   ├── utils         # Utility functions
│   ├── App.js        # Main application component, routing setup
│   └── index.js      # React app entry point
└── ...


### Backend Structure

The Express.js backend is structured into standard modules for clarity and maintainability.

/server
├── config            # Database connection, environment setup
├── controllers       # Business logic for API endpoints
├── cron              # Scheduled tasks (e.g., reminderJobs.js)
├── middleware        # Authentication, authorization, error handling
├── models            # Mongoose schemas for MongoDB
├── routes            # API endpoint definitions
├── server.js         # Main server file, app initialization, Socket.IO setup
└── ...


---

## 📊 Database Schema (ER Diagram)

Below is an Entity-Relationship (ER) Diagram illustrating the main data models and their relationships within the MongoDB database.



![ER Diagram](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Service%20Booking%20Platform%20ERD.png?raw=true)

---

## 🖥️ User Interface Examples

Here are some screenshots showcasing the user interface of the platform.

### Login Page

*(A brief description of the login form)*
![Login Page](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-LoginPage.png?raw=true)


### Homepage

*(A brief description of what the homepage shows)*
![Homepage](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-homepage.png?raw=true)

### Profile Page

*(A brief description of what the profile page shows)*
![Homepage](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Profile.png?raw=true)


### Chat Interface

*(A brief description of the real-time chat)*
![Chat Interface](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Chat.png?raw=true)

### Service Detail Page

*(A brief description of a service listing)*
![Service Detail Page](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Dashboard.png?raw=true)

### Post Service Page


*(A brief description of a create service page )*
![Post Service Page](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Createservice.png?raw=true)

### Earnings Page


*(A brief description of a Earning Page)*
![Earning Page](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Earnings.png?raw=true)


### Support Page


*(A brief description of a Support Page)*
![Support Page](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Support.png?raw=true)


### Transaction Page


*(A brief description of a Transaction Page)*
![Transaction Page](https://github.com/Prabhat1602/local-services-platform/blob/main/assets/Screenshot-Transaction.png?raw=true)


## ⚙️ Setup and Installation

To run this project locally, follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/Prabhat1602/local-services-platform.git](https://github.com/Prabhat1602/local-services-platform.git)
cd local-services-platform
2. Backend Setup (/server)
Navigate to the server directory and install dependencies:

Bash

cd server
npm install
Create a .env file in the server directory with the following variables:

PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_very_secret_string
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@example.com
MONGO_URI: Your MongoDB connection string (e.g., from MongoDB Atlas).

JWT_SECRET: A strong, random string for signing JWTs.

CLIENT_URL: The URL of your frontend (e.g., http://localhost:3000 for local development).

STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: Your Stripe API keys.

SENDGRID_API_KEY, EMAIL_FROM: For email notifications (if implemented).

Start the backend server:

Bash

npm start
3. Frontend Setup (/client)
Open a new terminal, navigate to the client directory and install dependencies:

Bash

cd ../client
npm install
Create a .env file in the client directory with the following variables:

REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
REACT_APP_API_URL: The URL of your backend API.

REACT_APP_STRIPE_PUBLIC_KEY: Your Stripe publishable key.

Start the frontend development server:

Bash

npm start
Your frontend application should now be accessible at http://localhost:3000.

🤝 Contribution
(Optional section for how others can contribute, bug reports, feature requests)

📄 License
(Optional section for your project's license)

📞 Contact
For any questions or support, please contact [Your Name/Email].


---

### **Remember to:**

1.  **Create the `assets` folder** at the root of your project.
2.  **Place your image files** inside the `assets` folder.
3.  **Push the `assets` folder to GitHub.**
4.  **Get the direct raw content URLs** for each image from GitHub.
5.  **Replace the placeholder URLs** (`https://raw.githubusercontent.com/Prabhat1602/local-services-platform/main/assets/er-diagram.png` etc.) in the `README.md` file with your actual image URLs.
6.  **Add relevant screenshots** for "Homepage," "Login Page," "Chat Interface," and "Service Detail Page" to your `assets` folder. You can add more as needed.