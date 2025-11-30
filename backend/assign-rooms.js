require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('./models/listing');

const MONGO_URL = process.env.MONGO_URL;

// Function to generate random number between min and max (inclusive)
function getRandomRooms(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function assignRandomRooms() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected to MongoDB');

        // Find all listings
        const listings = await Listing.find({});
        
        console.log(`Found ${listings.length} total listings`);

        if (listings.length === 0) {
            console.log('No listings found in database.');
            await mongoose.connection.close();
            return;
        }

        // Update each listing with random room distribution
        let updated = 0;
        for (const listing of listings) {
            const totalRooms = getRandomRooms(50, 200);
            
            // Distribute rooms randomly: 20-40% single, 40-60% double, 20-30% triple
            const singlePercent = getRandomRooms(20, 40);
            const doublePercent = getRandomRooms(40, 60);
            const triplePercent = 100 - singlePercent - doublePercent;
            
            const singleRooms = Math.floor((totalRooms * singlePercent) / 100);
            const doubleRooms = Math.floor((totalRooms * doublePercent) / 100);
            const tripleRooms = totalRooms - singleRooms - doubleRooms; // Remaining goes to triple
            
            listing.rooms = totalRooms;
            listing.roomTypes = {
                single: singleRooms,
                double: doubleRooms,
                triple: tripleRooms
            };
            
            await listing.save();
            updated++;
            console.log(`✅ Updated "${listing.title}" with ${singleRooms} single, ${doubleRooms} double, ${tripleRooms} triple rooms (Total: ${totalRooms})`);
        }

        console.log(`\n✅ Successfully assigned rooms to ${updated} listings!`);
        
        // Close connection
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error assigning rooms:', error);
        process.exit(1);
    }
}

// Run the script
assignRandomRooms();

