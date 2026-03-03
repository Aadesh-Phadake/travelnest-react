require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');
const cors = require('cors'); // IMPORT CORS
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const errorLogger = require('./utils/logger');

// Models
const User = require('./models/user');

// Routers
const listingRouter = require('./routes/listing');
const reviewRouter = require('./routes/review');
const userRouter = require('./routes/user');
const paymentRouter = require('./routes/payment');
const taxiRouter = require('./routes/taxi');
const bookingRouter = require('./routes/booking');
const adminApiRouter = require('./routes/adminApi');
const managerRouter = require('./routes/manager');
const uploadRouter = require('./routes/upload');
const contactRouter = require('./routes/contact');
const chatRouter = require('./routes/chat');
const walletRouter = require('./routes/wallet');

const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL;

// Middleware setup
// Create write stream for Morgan logs
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs.txt'), { flags: 'a' });
// 1. Allow requests from your React App (Assuming it runs on port 5173 or 3000)
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Support multiple ports
    credentials: true // Essential for maintaining sessions/cookies with React
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
    }
}
main();

// Session store
const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    crypto: { secret: process.env.SECRET || 'defaultsecret' },
    touchAfter: 24 * 3600
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        // secure: true, // Uncomment this when deploying with HTTPS
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionOptions));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global Routes
app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);
app.use('/bookings', bookingRouter);
app.use('/payment', paymentRouter);
app.use('/', taxiRouter);
app.use('/wallet', walletRouter);
app.use('/api/admin', adminApiRouter);
app.use('/manager', managerRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/contact', contactRouter);
app.use('/api/chat', chatRouter);

// Root route
app.get('/', (req, res) => {
    res.send("API is running");
});

// Test route - visit http://localhost:8080/test-error to verify Winston logging
app.get('/test-error', (req, res, next) => {
    next(new Error('This is a test error to verify Winston logging!'));
});

// 404 Handler
app.all('*', (req, res, next) => {
    errorLogger.error({
        message: 'Page Not Found',
        statusCode: 404,
        method: req.method,
        url: req.originalUrl,
    });
    res.status(404).json({ message: 'Page Not Found' });
});

// Error Handler - MUST RETURN JSON NOW, NOT RENDER HTML
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong' } = err;

    // Log error to error logs.txt via Winston
    errorLogger.error({
        message: message,
        statusCode: statusCode,
        method: req.method,
        url: req.originalUrl,
        stack: err.stack
    });

    res.status(statusCode).json({
        error: true,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));