---
title: User Registration & Authentication
---

# User Registration & Authentication

The platform provides robust user authentication, allowing users and providers to securely create accounts and log in. Role-based access ensures that 'users', 'providers', and 'admins' have appropriate permissions.

## 3.1 Registration Process

New users and providers can register by providing their name, email, password, and selecting their role. Upon successful registration, a JSON Web Token (JWT) is issued for authentication.

![Registration Page Screenshot](https://i.imgur.com/your-registration-screenshot.png) 
*A screenshot of the user registration form on the frontend.*

### Frontend Implementation (`/client/src/pages/RegisterPage.js`)
The `RegisterPage.js` handles the user input and sends a `POST` request to the backend.

```javascript
// Excerpt from /client/src/pages/RegisterPage.js
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
      name,
      email,
      password,
      role,
    });
    localStorage.setItem('userInfo', JSON.stringify(data));
    navigate('/');
  } catch (err) {
    setError(err.response?.data?.message || 'Registration failed');
  }
};