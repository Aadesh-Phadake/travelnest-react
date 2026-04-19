/**
 * Test Setup — Shared test infrastructure
 * 
 * Uses mongodb-memory-server for an isolated, in-memory MongoDB instance.
 * No real database is touched during testing.
 * 
 * Provides:
 *   - createTestApp() — Express app configured for testing
 *   - connectDB() / disconnectDB() — Database lifecycle
 *   - createTestUser() — Helper to create authenticated test users
 *   - loginUser() — Helper to get authenticated session agent
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../models/user');

let mongoServer;

/**
 * Connect to in-memory MongoDB.
 */
async function connectDB() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
    console.log('✅ Test DB connected');
}

/**
 * Disconnect and stop in-memory MongoDB.
 */
async function disconnectDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('🔌 Test DB disconnected');
}

/**
 * Clear all collections between tests.
 */
async function clearDB() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

/**
 * Create a fully configured Express app for testing.
 * Mimics the real app.js setup but without MongoDB connection (uses test DB).
 */
function createTestApp() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Session (in-memory for tests)
    app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
    }));

    // Passport
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    // Mount routes
    const listingRouter = require('../routes/listing');
    const userRouter = require('../routes/user');
    const bookingRouter = require('../routes/booking');

    app.use('/listings', listingRouter);
    app.use('/', userRouter);
    app.use('/bookings', bookingRouter);

    // Root route
    app.get('/', (req, res) => {
        res.send('API is running');
    });

    // Error handler
    app.use((err, req, res, next) => {
        const { statusCode = 500, message = 'Something went wrong' } = err;
        res.status(statusCode).json({ error: true, message });
    });

    return app;
}

/**
 * Register a test user and return the user document.
 * 
 * @param {Object} options - User options
 * @param {string} options.username - Username
 * @param {string} options.email - Email
 * @param {string} options.password - Password
 * @param {string} options.role - User role (traveller, manager, admin)
 * @returns {Object} Created user document
 */
async function createTestUser({
    username = 'testuser',
    email = 'test@example.com',
    password = 'password123',
    role = 'traveller'
} = {}) {
    const user = new User({ username, email, role, isApproved: true });
    const registeredUser = await User.register(user, password);
    return registeredUser;
}

/**
 * Create a supertest agent that is logged in as the given user.
 * 
 * @param {Object} app - Express app
 * @param {string} username - Username to login as
 * @param {string} password - Password
 * @returns {Object} Supertest agent with session cookies
 */
async function loginAgent(app, username, password) {
    const supertest = require('supertest');
    const agent = supertest.agent(app);

    await agent
        .post('/login')
        .send({ username, password })
        .expect(200);

    return agent;
}

module.exports = {
    connectDB,
    disconnectDB,
    clearDB,
    createTestApp,
    createTestUser,
    loginAgent,
};
