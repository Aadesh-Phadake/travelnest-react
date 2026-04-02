const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TravelNest API',
            version: '1.0.0',
            description: 'API documentation for the TravelNest hotel booking platform',
        },
        servers: [
            {
                url: 'http://localhost:8080',
                description: 'Development server',
            },
        ],
        tags: [
            { name: 'Authentication', description: 'Signup, login and logout' },
            { name: 'Profile', description: 'User profile management' },
            { name: 'Membership', description: 'Membership activation and management' },
            { name: 'Listings', description: 'Hotel listings CRUD' },
            { name: 'Reviews', description: 'Listing reviews' },
            { name: 'Bookings', description: 'Booking operations' },
            { name: 'Payments', description: 'Payment and checkout' },
            { name: 'Taxis', description: 'Taxi booking services' },
            { name: 'Wallet', description: 'Wallet and reward points' },
            { name: 'Admin', description: 'Admin dashboard APIs' },
            { name: 'Manager', description: 'Hotel manager dashboard APIs' },
            { name: 'Upload', description: 'File and image uploads' },
            { name: 'Contact', description: 'Contact messages' },
            { name: 'Chat', description: 'Booking chat between traveler and manager' },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
