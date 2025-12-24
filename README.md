# College Fee Payment System - Backend

This constitutes the backend API for the College Fee Payment System, designed to handle fee management, student data, payment processing (via Razorpay), and role-based access control for multiple administrative departments.

## 🛠 Tech Stack

- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateway**: Razorpay
- **Security**: bcryptjs (Password Hashing), cors, dotenv

## 📂 Project Structure

```
backend/
├── config/             # Database connection configuration
├── controllers/        # Business logic for API endpoints
├── middlewares/        # Custom middlewares (Auth, Error handling)
├── models/             # Mongoose schemas (User, Student, Payment, etc.)
├── routes/             # API route definitions
├── utils/              # Utility functions (Email, etc.)
├── index.js            # Server entry point
├── seeder.js           # Database seeder script
└── verify_razorpay.js  # Payment verification utility
```

## 🚀 Setup & Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the `backend` root with the following variables:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret
    ```

3.  **Seed Database (First Run Only)**
    Initializes default users (Admin, Registrar, etc.).
    ```bash
    npm run data:import
    ```

4.  **Run Server**
    *   **Development**:
        ```bash
        npm run dev
        ```
    *   **Production**:
        ```bash
        npm start
        ```

 

> **Note**: Change these passwords immediately in a production environment.

## 📡 API Endpoints

### Authentication (`/api/auth`)
*   `POST /login` - Login user and receive JWT.

### Student (`/api/students`) - *Protected (Student only)*
*   `GET /profile` - Get current student's full profile and fee records.
*   `GET /eligibility` - Check exam eligibility status based on dues.

### Admin (`/api/admin`) - *Protected (Admin/Principal)*
*   `GET /config` - Get system configuration.
*   `POST /config/gov-fee` - Set government quota fee (Admin only).
*   `GET /students/search` - Search for students by USN or name.
*   `POST /students` - Create a new student (Admin only).
*   `PUT /students/:usn/fees` - Update specific fee records for a student.
*   `POST /notifications` - Create exam notification (Admin/Exam Head).
*   `PUT /notifications/:id` - Update exam notification.
*   `GET /notifications` - List all exam notifications.
*   `GET /stats` - Get dashboard statistics (Admin/Principal/Exam Head).

### Payment (`/api/payments`) - *Protected (Student)*
*   `POST /create-order` - Create a Razorpay order.
*   `POST /verify` - Verify Razorpay payment signature.
*   `GET /key` - Get Razorpay public key.
*   `GET /my-history` - Get logged-in student's payment history.

### Transport (`/api/transport`) - *Protected (Transport/Admin)*
*   `GET /students/search` - Search students for transport details.
*   `PUT /students/:usn` - Update transport fee status.

### Registrar (`/api/registrar`) - *Protected (Registrar/Admin)*
*   `POST /students` - Create new student.
*   `POST /reset-password` - Reset a user's password.

## 💾 Database Models

### User
Stores authentication details (Username, Password, Role). Roles: `student`, `admin`, `principal`, `exam_head`, `transport_dept`, `registrar`.

### Student
Links to a `User` and stores academic and fee details.
*   **Fields**: `usn`, `department`, `year`, `quota`, `feeRecords` (Ledger), `collegeFeeDue`, `transportFeeDue`.
*   **feeRecords**: Array tracking detailed fee history (College/Transport payments per semester).

### ExamNotification
Stores exam fee details, deadlines, and penalty structures.

### Payment
Logs all successful Razorpay transactions linked to a student.
