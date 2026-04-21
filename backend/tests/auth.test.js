/**
 * Authentication Tests
 * 
 * Tests for signup, login, logout endpoints.
 * Uses mongodb-memory-server for isolated testing.
 */

const supertest = require('supertest');
const { connectDB, disconnectDB, clearDB, createTestApp, createTestUser } = require('./setup');

let app;

beforeAll(async () => {
    await connectDB();
    app = createTestApp();
});

afterEach(async () => {
    await clearDB();
});

afterAll(async () => {
    await disconnectDB();
});

// ============================================================
// POST /signup
// ============================================================
describe('POST /signup', () => {
    test('should register a new traveller successfully', async () => {
        const res = await supertest(app)
            .post('/signup')
            .send({
                username: 'newuser',
                email: 'newuser@test.com',
                password: 'password123',
                role: 'traveller'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/Welcome/i);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('newuser');
        expect(res.body.user.email).toBe('newuser@test.com');
        expect(res.body.user.role).toBe('traveller');
    });

    test('should register a new manager successfully', async () => {
        const res = await supertest(app)
            .post('/signup')
            .send({
                username: 'manager1',
                email: 'manager@test.com',
                password: 'password123',
                role: 'manager'
            });

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe('manager');
        // Managers should NOT be approved by default
        expect(res.body.user.isApproved).toBe(false);
    });

    test('should reject duplicate username', async () => {
        await createTestUser({ username: 'existing', email: 'a@test.com' });

        const res = await supertest(app)
            .post('/signup')
            .send({
                username: 'existing',
                email: 'b@test.com',
                password: 'password123',
                role: 'traveller'
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });

    test('should reject invalid role', async () => {
        const res = await supertest(app)
            .post('/signup')
            .send({
                username: 'hacker',
                email: 'hack@test.com',
                password: 'password123',
                role: 'admin' // Users cannot self-register as admin
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid/i);
    });

    test('should reject signup without required fields', async () => {
        const res = await supertest(app)
            .post('/signup')
            .send({
                username: 'nopass',
                email: 'nopass@test.com'
                // Missing password and role
            });

        expect(res.status).toBe(400);
    });
});

// ============================================================
// POST /login
// ============================================================
describe('POST /login', () => {
    beforeEach(async () => {
        await createTestUser({
            username: 'loginuser',
            email: 'login@test.com',
            password: 'correctpass'
        });
    });

    test('should login with valid credentials', async () => {
        const res = await supertest(app)
            .post('/login')
            .send({
                username: 'loginuser',
                password: 'correctpass'
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/welcome/i);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('loginuser');
    });

    test('should reject wrong password', async () => {
        const res = await supertest(app)
            .post('/login')
            .send({
                username: 'loginuser',
                password: 'wrongpass'
            });

        expect(res.status).toBe(401);
    });

    test('should reject non-existent user', async () => {
        const res = await supertest(app)
            .post('/login')
            .send({
                username: 'nonexistent',
                password: 'anypass'
            });

        expect(res.status).toBe(401);
    });
});

// ============================================================
// GET /logout
// ============================================================
describe('GET /logout', () => {
    test('should logout successfully', async () => {
        // First create user and login
        await createTestUser({
            username: 'logoutuser',
            email: 'logout@test.com',
            password: 'password123'
        });

        const agent = supertest.agent(app);

        // Login
        await agent
            .post('/login')
            .send({ username: 'logoutuser', password: 'password123' })
            .expect(200);

        // Logout
        const res = await agent.get('/logout');

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/logged out/i);
    });
});

// ============================================================
// GET /me — Current User
// ============================================================
describe('GET /me', () => {
    test('should return current user when authenticated', async () => {
        await createTestUser({
            username: 'meuser',
            email: 'me@test.com',
            password: 'password123'
        });

        const agent = supertest.agent(app);
        await agent
            .post('/login')
            .send({ username: 'meuser', password: 'password123' })
            .expect(200);

        const res = await agent.get('/me');

        expect(res.status).toBe(200);
    });

    test('should return 401 when not authenticated', async () => {
        const res = await supertest(app).get('/me');

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/login/i);
    });
});
