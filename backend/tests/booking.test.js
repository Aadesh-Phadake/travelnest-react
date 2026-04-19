/**
 * Booking API Tests
 * 
 * Tests for booking creation, checking, and cancellation endpoints.
 * Uses mongodb-memory-server for isolated testing.
 */

const supertest = require('supertest');
const { connectDB, disconnectDB, clearDB, createTestApp, createTestUser, loginAgent } = require('./setup');
const Listing = require('../models/listing');
const Booking = require('../models/booking');

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
 * Helper: Create test listing
 */
async function createTestListing(ownerId, overrides = {}) {
    const listing = new Listing({
        title: 'Booking Test Hotel',
        description: 'Hotel for booking tests',
        price: 2000,
        location: 'Mumbai',
        country: 'India',
        owner: ownerId,
        status: 'approved',
        ...overrides
    });
    await listing.save();
    return listing;
}

/**
 * Helper: Create test booking
 */
async function createTestBooking(userId, listingId, overrides = {}) {
    const booking = new Booking({
        user: userId,
        listing: listingId,
        listingTitle: 'Test Hotel',
        listingLocation: 'Mumbai',
        listingCountry: 'India',
        checkIn: '2026-05-01',
        checkOut: '2026-05-03',
        guests: 2,
        totalAmount: 4000,
        ...overrides
    });
    await booking.save();
    return booking;
}

// ============================================================
// POST /listings/:id/book — Create Booking
// ============================================================
describe('POST /listings/:id/book', () => {
    test('should create a booking successfully', async () => {
        const manager = await createTestUser({
            username: 'hotelmgr',
            email: 'hotel@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'guest1',
            email: 'guest@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);

        const agent = await loginAgent(app, 'guest1', 'password123');

        const res = await agent
            .post(`/listings/${listing._id}/book`)
            .send({
                checkIn: '2026-06-01',
                checkOut: '2026-06-03',
                guests: 2
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/booking/i);
        expect(res.body.booking).toBeDefined();
        expect(res.body.booking.guests).toBe(2);
        expect(res.body.booking.totalAmount).toBeGreaterThan(0);
    });

    test('should reject booking without authentication', async () => {
        const manager = await createTestUser({
            username: 'mgr10',
            email: 'mgr10@test.com',
            role: 'manager'
        });
        const listing = await createTestListing(manager._id);

        const res = await supertest(app)
            .post(`/listings/${listing._id}/book`)
            .send({
                checkIn: '2026-06-01',
                checkOut: '2026-06-03',
                guests: 2
            });

        expect(res.status).toBe(401);
    });

    test('should reject booking with missing check-in/check-out', async () => {
        const manager = await createTestUser({
            username: 'mgr11',
            email: 'mgr11@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'guest2',
            email: 'guest2@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);

        const agent = await loginAgent(app, 'guest2', 'password123');

        const res = await agent
            .post(`/listings/${listing._id}/book`)
            .send({
                guests: 2
                // Missing checkIn and checkOut
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });

    test('should reject booking with invalid guest count', async () => {
        const manager = await createTestUser({
            username: 'mgr12',
            email: 'mgr12@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'guest3',
            email: 'guest3@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);

        const agent = await loginAgent(app, 'guest3', 'password123');

        const res = await agent
            .post(`/listings/${listing._id}/book`)
            .send({
                checkIn: '2026-06-01',
                checkOut: '2026-06-03',
                guests: 10 // Max is 5
            });

        expect(res.status).toBe(400);
    });

    test('should reject booking when checkout is before checkin', async () => {
        const manager = await createTestUser({
            username: 'mgr13',
            email: 'mgr13@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'guest4',
            email: 'guest4@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);

        const agent = await loginAgent(app, 'guest4', 'password123');

        const res = await agent
            .post(`/listings/${listing._id}/book`)
            .send({
                checkIn: '2026-06-05',
                checkOut: '2026-06-03', // Before check-in
                guests: 1
            });

        expect(res.status).toBe(400);
    });

    test('should return 404 for non-existent listing', async () => {
        const traveller = await createTestUser({
            username: 'guest5',
            email: 'guest5@test.com',
            password: 'password123',
            role: 'traveller'
        });

        const agent = await loginAgent(app, 'guest5', 'password123');

        const res = await agent
            .post('/listings/507f1f77bcf86cd799439011/book')
            .send({
                checkIn: '2026-06-01',
                checkOut: '2026-06-03',
                guests: 2
            });

        expect(res.status).toBe(404);
    });
});

// ============================================================
// GET /bookings/check/:id — Check User Booking
// ============================================================
describe('GET /bookings/check/:id', () => {
    test('should return hasBooked: true when user has booked the listing', async () => {
        const manager = await createTestUser({
            username: 'mgr14',
            email: 'mgr14@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'booker1',
            email: 'booker@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);
        await createTestBooking(traveller._id, listing._id);

        const agent = await loginAgent(app, 'booker1', 'password123');

        const res = await agent.get(`/bookings/check/${listing._id}`);

        expect(res.status).toBe(200);
        expect(res.body.hasBooked).toBe(true);
    });

    test('should return hasBooked: false when user has NOT booked the listing', async () => {
        const manager = await createTestUser({
            username: 'mgr15',
            email: 'mgr15@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'nobooker',
            email: 'nobooker@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);
        // No booking created for this user

        const agent = await loginAgent(app, 'nobooker', 'password123');

        const res = await agent.get(`/bookings/check/${listing._id}`);

        expect(res.status).toBe(200);
        expect(res.body.hasBooked).toBe(false);
    });

    test('should return 401 when not authenticated', async () => {
        const res = await supertest(app).get('/bookings/check/507f1f77bcf86cd799439011');

        expect(res.status).toBe(401);
    });
});

// ============================================================
// DELETE /profile/cancel/:id — Cancel Booking
// ============================================================
describe('DELETE /profile/cancel/:id', () => {
    test('should cancel own booking', async () => {
        const manager = await createTestUser({
            username: 'mgr16',
            email: 'mgr16@test.com',
            role: 'manager'
        });
        const traveller = await createTestUser({
            username: 'canceller',
            email: 'cancel@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);
        const booking = await createTestBooking(traveller._id, listing._id);

        const agent = await loginAgent(app, 'canceller', 'password123');

        const res = await agent.delete(`/profile/cancel/${booking._id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/cancel/i);

        // Verify booking is deleted
        const found = await Booking.findById(booking._id);
        expect(found).toBeNull();
    });

    test('should reject cancellation by another user', async () => {
        const manager = await createTestUser({
            username: 'mgr17',
            email: 'mgr17@test.com',
            role: 'manager'
        });
        const owner = await createTestUser({
            username: 'bookowner',
            email: 'bookowner@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const otherUser = await createTestUser({
            username: 'intruder',
            email: 'intruder@test.com',
            password: 'password123',
            role: 'traveller'
        });
        const listing = await createTestListing(manager._id);
        const booking = await createTestBooking(owner._id, listing._id);

        const agent = await loginAgent(app, 'intruder', 'password123');

        const res = await agent.delete(`/profile/cancel/${booking._id}`);

        expect(res.status).toBe(403);
    });

    test('should return 401 when not authenticated', async () => {
        const res = await supertest(app)
            .delete('/profile/cancel/507f1f77bcf86cd799439011');

        expect(res.status).toBe(401);
    });
});
