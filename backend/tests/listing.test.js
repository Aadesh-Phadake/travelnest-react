/**
 * Listing API Tests
 * 
 * Tests for hotel listing CRUD and search endpoints.
 * Uses mongodb-memory-server for isolated testing.
 */

const supertest = require('supertest');
const { connectDB, disconnectDB, clearDB, createTestApp, createTestUser, loginAgent } = require('./setup');
const Listing = require('../models/listing');

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

/**
 * Helper: Create a test listing directly in the database.
 */
async function createTestListing(ownerId, overrides = {}) {
    const listing = new Listing({
        title: 'Test Hotel',
        description: 'A beautiful test hotel',
        price: 1500,
        location: 'Mumbai',
        country: 'India',
        owner: ownerId,
        status: 'approved',
        ...overrides
    });
    await listing.save();
    return listing;
}

// ============================================================
// GET /listings — List All
// ============================================================
describe('GET /listings', () => {
    test('should return an array of listings with status 200', async () => {
        const manager = await createTestUser({
            username: 'manager1',
            email: 'mgr@test.com',
            role: 'manager'
        });
        await createTestListing(manager._id);
        await createTestListing(manager._id, { title: 'Second Hotel', location: 'Delhi' });

        const res = await supertest(app).get('/listings');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });

    test('should return empty array when no listings exist', async () => {
        const res = await supertest(app).get('/listings');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    test('should filter by price range', async () => {
        const manager = await createTestUser({
            username: 'mgr2',
            email: 'mgr2@test.com',
            role: 'manager'
        });
        await createTestListing(manager._id, { price: 500 });
        await createTestListing(manager._id, { price: 2500, title: 'Expensive Hotel' });

        const res = await supertest(app).get('/listings?price=0-1000');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].price).toBe(500);
    });
});

// ============================================================
// GET /listings/search
// ============================================================
describe('GET /listings/search', () => {
    test('should search listings by location (partial match)', async () => {
        const manager = await createTestUser({
            username: 'mgr3',
            email: 'mgr3@test.com',
            role: 'manager'
        });
        await createTestListing(manager._id, { location: 'Delhi', title: 'Delhi Palace' });
        await createTestListing(manager._id, { location: 'Mumbai', title: 'Mumbai Resort' });

        // Short query uses regex — partial match
        const res = await supertest(app).get('/listings/search?search=De');

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        // At least one result should match Delhi
        const hasDelhi = res.body.some(l => l.location.includes('Delhi'));
        expect(hasDelhi).toBe(true);
    });

    test('should return empty results for non-matching search', async () => {
        const manager = await createTestUser({
            username: 'mgr4',
            email: 'mgr4@test.com',
            role: 'manager'
        });
        await createTestListing(manager._id);

        const res = await supertest(app).get('/listings/search?search=XYZNonExistent');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });
});

// ============================================================
// GET /listings/:id — Single Listing
// ============================================================
describe('GET /listings/:id', () => {
    test('should return a listing by valid ID', async () => {
        const manager = await createTestUser({
            username: 'mgr5',
            email: 'mgr5@test.com',
            role: 'manager'
        });
        const listing = await createTestListing(manager._id);

        const res = await supertest(app).get(`/listings/${listing._id}`);

        expect(res.status).toBe(200);
        expect(res.body.listing).toBeDefined();
        expect(res.body.listing.title).toBe('Test Hotel');
    });

    test('should return 404 for non-existent listing', async () => {
        const fakeId = '507f1f77bcf86cd799439011'; // Valid but non-existent ObjectId

        const res = await supertest(app).get(`/listings/${fakeId}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/not found/i);
    });

    test('should return 500 for invalid ObjectId format', async () => {
        const res = await supertest(app).get('/listings/invalid-id');

        expect(res.status).toBe(500);
    });
});

// ============================================================
// POST /listings — Create (requires manager auth)
// ============================================================
describe('POST /listings', () => {
    test('should create a listing when authenticated as approved manager', async () => {
        await createTestUser({
            username: 'approvedmgr',
            email: 'approved@test.com',
            password: 'password123',
            role: 'manager'
        });

        const agent = await loginAgent(app, 'approvedmgr', 'password123');

        const res = await agent
            .post('/listings')
            .send({
                title: 'New Hotel',
                description: 'A great new hotel',
                price: 2000,
                location: 'Pune',
                country: 'India'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/listed/i);
        expect(res.body.listing).toBeDefined();
        expect(res.body.listing.title).toBe('New Hotel');
        expect(res.body.listing.status).toBe('pending'); // Non-admin = pending
    });

    test('should reject unauthenticated listing creation', async () => {
        const res = await supertest(app)
            .post('/listings')
            .send({
                title: 'Unauthorized Hotel',
                description: 'Should fail',
                price: 1000,
                location: 'Test',
                country: 'Test'
            });

        expect(res.status).toBe(401);
    });

    test('should reject listing creation from traveller role', async () => {
        await createTestUser({
            username: 'traveller1',
            email: 'travel@test.com',
            password: 'password123',
            role: 'traveller'
        });

        const agent = await loginAgent(app, 'traveller1', 'password123');

        const res = await agent
            .post('/listings')
            .send({
                title: 'Traveller Hotel',
                description: 'Should fail',
                price: 1000,
                location: 'Test',
                country: 'Test'
            });

        expect(res.status).toBe(403);
    });

    test('should reject listing with missing required fields', async () => {
        await createTestUser({
            username: 'mgr6',
            email: 'mgr6@test.com',
            password: 'password123',
            role: 'manager'
        });

        const agent = await loginAgent(app, 'mgr6', 'password123');

        const res = await agent
            .post('/listings')
            .send({
                title: 'Incomplete Hotel'
                // Missing: description, price, location, country
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});

// ============================================================
// PUT /listings/:id — Update
// ============================================================
describe('PUT /listings/:id', () => {
    test('should allow owner to update their listing', async () => {
        const manager = await createTestUser({
            username: 'ownermgr',
            email: 'owner@test.com',
            password: 'password123',
            role: 'manager'
        });
        const listing = await createTestListing(manager._id);

        const agent = await loginAgent(app, 'ownermgr', 'password123');

        const res = await agent
            .put(`/listings/${listing._id}`)
            .send({
                title: 'Updated Hotel',
                description: 'Updated description',
                price: 3000,
                location: 'Goa',
                country: 'India'
            });

        expect(res.status).toBe(200);
        expect(res.body.listing.title).toBe('Updated Hotel');
    });

    test('should reject update from non-owner', async () => {
        const manager1 = await createTestUser({
            username: 'owner1',
            email: 'owner1@test.com',
            password: 'password123',
            role: 'manager'
        });
        await createTestUser({
            username: 'other1',
            email: 'other1@test.com',
            password: 'password123',
            role: 'manager'
        });

        const listing = await createTestListing(manager1._id);
        const agent = await loginAgent(app, 'other1', 'password123');

        const res = await agent
            .put(`/listings/${listing._id}`)
            .send({
                title: 'Hacked Title',
                description: 'Should not work',
                price: 1,
                location: 'Hacked',
                country: 'Hacked'
            });

        expect(res.status).toBe(403);
    });
});

// ============================================================
// DELETE /listings/:id
// ============================================================
describe('DELETE /listings/:id', () => {
    test('should allow owner to delete their listing', async () => {
        const manager = await createTestUser({
            username: 'delmgr',
            email: 'del@test.com',
            password: 'password123',
            role: 'manager'
        });
        const listing = await createTestListing(manager._id);

        const agent = await loginAgent(app, 'delmgr', 'password123');

        const res = await agent.delete(`/listings/${listing._id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);

        // Verify deletion
        const found = await Listing.findById(listing._id);
        expect(found).toBeNull();
    });

    test('should reject delete from unauthorized user', async () => {
        const manager = await createTestUser({
            username: 'delowner',
            email: 'delowner@test.com',
            password: 'password123',
            role: 'manager'
        });
        await createTestUser({
            username: 'notowner',
            email: 'notowner@test.com',
            password: 'password123',
            role: 'manager'
        });

        const listing = await createTestListing(manager._id);
        const agent = await loginAgent(app, 'notowner', 'password123');

        const res = await agent.delete(`/listings/${listing._id}`);

        expect(res.status).toBe(403);
    });
});
