# LoanZone - Server Side

This is the backend API for the LoanZone application, built with Node.js, Express, and MongoDB. It handles user authentication, loan management, payment processing, and email notifications.

## 🚀 Features

- **RESTful API**: Endpoints for Users, Loans, Applications, and Payments.
- **Database**: MongoDB integration for storing application data.
- **Authentication**: JWT (JSON Web Token) verification for secure API access.
- **Role-Based Authorization**: Middleware to protect routes for Admins and Managers.
- **Payment Processing**: Stripe integration for handling application fee payments.
- **Email Service**: Nodemailer integration to send emails from the contact form.
- **Firebase Admin SDK**: Verifies Firebase ID tokens for secure user identification.

## 🛠️ Technologies Used

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- **Payment**: [Stripe](https://stripe.com/)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **Environment Variables**: [Dotenv](https://www.npmjs.com/package/dotenv)
- **CORS**: Cross-Origin Resource Sharing enabled.

## 📦 Dependencies

```json
"dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "firebase-admin": "^13.6.0",
    "mongodb": "^7.0.0",
    "stripe": "^20.0.0",
    "nodemailer": "^6.9.16"
}
```

## 💻 Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AsifAhmedTanjid/LoanZone-server.git
    cd LoanZone-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    DB_USER=your_mongodb_username
    DB_PASSWORD=your_mongodb_password
    STRIPE_SECRET_KEY=your_stripe_secret_key
    EMAIL_USER=your_email_address
    EMAIL_PASS=your_email_app_password
    CLIENT_URL=http://localhost:5173
    ```
    *Note: You also need `loan-zone-firebase-adminsdk.json` for Firebase Admin SDK.*

4.  **Run the server:**
    ```bash
    npm start
    # or for development
    npm run dev
    ```

5.  The server will start on `http://localhost:3000`.

## 🔗 API Endpoints

### Users
- `POST /users`: Create a new user.
- `GET /user/role`: Get the role of the logged-in user.
- `GET /users`: Get all users (Admin only).
- `PATCH /users/:id`: Update a user (Admin only).

### Loans
- `POST /loans`: Create a new loan (Manager only).
- `GET /loans`: Get all loans (supports pagination).
- `GET /loansCount`: Get total count of loans.
- `GET /loans/:id`: Get a single loan by ID.
- `GET /manage-loans/:email`: Get loans created by a specific manager (Manager only).
- `PATCH /loans/:id`: Update a loan (Admin/Manager).
- `DELETE /loans/:id`: Delete a loan (Admin/Manager).

### Applications
- `POST /applications`: Submit a loan application.
- `GET /applications`: Get all applications (Admin only).
- `GET /applications/:email`: Get applications for a specific borrower.
- `DELETE /applications/:id`: Delete an application.
- `GET /manager/applications/:email`: Get applications for loans created by a manager (Manager only).
- `PATCH /applications/:id`: Update application status (Manager only).

### Payments
- `POST /create-checkout-session`: Initiate Stripe payment session.
- `POST /verify-payment`: Verify Stripe payment and update application status.

### Other
- `GET /`: Server health check.
- `POST /send-email`: Send contact email via Nodemailer.

---
*Developed by Asif Ahmed Tanjid*
