# Deployment Guide: Local Services Platform

This document provides a step-by-step guide for deploying the Local Services Platform to its production environments. The frontend is deployed on Vercel, and the backend API is deployed on Render.

## 1. Prerequisites

Before starting the deployment process, ensure you have:

* **GitHub Repository:** Your project code should be hosted on GitHub (or a similar VCS).
* **Vercel Account:** Create an account at [Vercel](https://vercel.com/).
* **Render Account:** Create an account at [Render](https://render.com/).
* **MongoDB Atlas Cluster:** A production-ready MongoDB Atlas cluster is highly recommended for your backend database. Ensure your `MONGO_URI` is correct and accessible from Render.

## 2. Backend Deployment on Render

The backend (Node.js/Express.js) will be deployed on Render, which offers continuous deployment from GitHub.

### Step 2.1: Prepare Your Backend Repository

1.  Ensure your `backend/.env` file is **NOT** committed to your repository. It should be in `backend/.gitignore`.
2.  Make sure your `backend/package.json` has a `start` script (e.g., `"start": "node server.js"`).
3.  Confirm your `server.js` listens on `process.env.PORT` (or a default like `5000`).

### Step 2.2: Create a New Web Service in Render

1.  Log in to your Render dashboard.
2.  Click on **"New"** -> **"Web Service"**.
3.  **Connect Your Repository:** Select your GitHub account and the `local-services-platform` repository. You might need to grant Render access to your repository.
4.  **Configure Web Service:**
    * **Root Directory:** Set this to `backend/` (important\! Render needs to know where your `package.json` is).
    * **Name:** Choose a unique name for your service (e.g., `local-services-api`).
    * **Region:** Select a region close to your users or MongoDB Atlas cluster.
    * **Branch:** `main` (or your primary branch).
    * **Runtime:** `Node`
    * **Build Command:** `npm install` (or `yarn install`)
    * **Start Command:** `npm start` (or `yarn start`)
    * **Instance Type:** Choose a suitable plan (e.g., `Free` for testing, `Starter` for production).
    * **Auto-Deploy:** Set to `Yes` for continuous deployment on every push to your branch.

### Step 2.3: Configure Environment Variables in Render

This is crucial for securing your sensitive data.

1.  Before creating, or immediately after, navigate to your new Render service's **"Environment"** tab.
2.  Add the following environment variables. Ensure the values match your production requirements (e.g., your MongoDB Atlas connection string).
    * `PORT` (e.g., `5000`)
    * `MONGO_URI` (Your MongoDB Atlas connection string)
    * `JWT_SECRET` (A strong, unique secret key for production)
    * `JWT_EXPIRE` (e.g., `30d`)
    * `NODE_ENV` (Set to `production`)
    * `CLIENT_URL` (The deployed URL of your frontend on Vercel, e.g., `https://your-frontend-app.vercel.app`) - **Important for CORS.**
    * *(Add any other variables like `STRIPE_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS` if applicable)*

### Step 2.4: Deploy

1.  Click **"Create Web Service"**. Render will now attempt its first build and deploy.
2.  Monitor the deploy logs in the Render dashboard. Resolve any errors.
3.  Once deployed, Render will provide a public URL for your backend API (e.g., `https://local-services-api.onrender.com`). **Save this URL; you'll need it for the frontend.**

## 3. Frontend Deployment on Vercel

The frontend (React.js) will be deployed on Vercel, which also offers continuous deployment.

### Step 3.1: Prepare Your Frontend Repository

1.  Ensure your `client/.env` file is **NOT** committed. It should be in `client/.gitignore`.
2.  Verify your `client/package.json` includes `react-scripts` in `dependencies` or `devDependencies`.

### Step 3.2: Create a New Project in Vercel

1.  Log in to your Vercel dashboard.
2.  Click on **"Add New..."** -> **"Project"**.
3.  **Import Git Repository:** Select your GitHub account and the `local-services-platform` repository.
4.  **Configure Project:**
    * **Root Directory:** Set this to `client/` (important\! Vercel needs to know where your `package.json` is).
    * **Framework Preset:** Vercel should auto-detect "Create React App" or "Vite" (if you're using Vite). Confirm this is correct.
    * **Build & Output Settings:** Vercel usually handles this automatically for Create React App/Vite. You typically don't need to change `Build Command` or `Output Directory`.
    * **Development Build Settings:** You can usually leave these as default.

### Step 3.3: Configure Environment Variables in Vercel

1.  Before creating, or immediately after, navigate to your new Vercel project's **"Settings"** -> **"Environment Variables"** tab.
2.  Add the following environment variable:
    * **Name:** `REACT_APP_API_URL`
    * **Value:** The **public URL of your deployed backend API from Render** (e.g., `https://local-services-api.onrender.com/api`).
    * **Note:** If you configured CORS on your backend using `CLIENT_URL`, ensure this Vercel deployed URL is added to your `CLIENT_URL` on Render.

### Step 3.4: Deploy

1.  Click **"Deploy"**. Vercel will now attempt its first build and deployment.
2.  Monitor the deploy logs.
3.  Once deployed, Vercel will provide a public URL for your frontend application (e.g., `https://your-frontend-app.vercel.app`).

## 4. Post-Deployment Checks

After both frontend and backend are deployed:

1.  **Test Frontend:** Open your Vercel URL in a browser.
2.  **Test API:** Try registering a new user, logging in, creating a service, or making a test booking.
3.  **Check Logs:** Monitor logs on both Vercel and Render dashboards for any errors.
4.  **CORS:** If you encounter "Access-Control-Allow-Origin" errors, ensure:
    * Your backend's `CLIENT_URL` environment variable on Render correctly includes your Vercel frontend URL.
    * Your backend's CORS middleware is properly configured to use `CLIENT_URL`.
    * *(If multiple client URLs are allowed, ensure your backend's CORS configuration handles arrays or comma-separated values correctly).*

## 5. Troubleshooting Common Deployment Issues

* **"Build Failed" on Vercel/Render:** Check the build logs carefully. Look for missing dependencies, syntax errors, or incorrect build commands.
* **"Cannot connect to MongoDB" on Render:**
    * Verify `MONGO_URI` environment variable on Render is correct and has the right credentials.
    * Check your MongoDB Atlas IP Whitelist (if applicable) to ensure Render's IPs (or `0.0.0.0/0` for testing) are allowed.
* **API calls failing after frontend deployment (but worked locally):**
    * Ensure `REACT_APP_API_URL` on Vercel is set to the **deployed Render backend URL**, not `localhost`.
    * Check backend CORS configuration (see "CORS" above).
* **"Application failed to start" on Render:** Check the `Start Command` and associated logs. Ensure your `package.json` `start` script is correct.

---