# Feedback System

A MERN stack application for collecting feedback at different phases of course completion (20%, 50%, and 100%).

## Features

- User registration and authentication
- Three-phase feedback collection (20%, 50%, 100% completion)
- Responsive design
- Progress tracking
- Secure API endpoints

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or Atlas)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/feedback_system
   TOKEN_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
feedback_system/
├── backend/                 # Backend code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json
│
├── frontend/               # Frontend code
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # Reusable components
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components
│       ├── App.js          # Main App component
│       └── index.js        # Entry point
│
└── README.md              # Project documentation
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Feedback

- `POST /api/feedback/submit` - Submit feedback
- `GET /api/feedback/user-feedbacks` - Get user's feedbacks
- `GET /api/feedback/status` - Get feedback submission status

## Environment Variables

### Backend

- `PORT` - Port number for the server (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `TOKEN_SECRET` - Secret key for JWT

## Technologies Used

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Joi for request validation

### Frontend

- React
- React Router for navigation
- Material-UI for UI components
- Formik and Yup for form handling and validation
- Axios for HTTP requests

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
