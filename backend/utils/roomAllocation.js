const Listing = require('../models/listing');

/**
 * Allocate and reduce rooms based on guest count
 * @param {String} listingId - The listing ID
 * @param {Number} guests - Number of guests (1-5)
 * @returns {Object} - Allocation result with success status and message
 */
async function allocateRooms(listingId, guests) {
    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return { success: false, message: 'Listing not found' };
        }

        // If roomTypes doesn't exist, fall back to legacy rooms field
        if (!listing.roomTypes) {
            // For legacy listings without roomTypes, we can't allocate
            return { success: false, message: 'Room types not configured for this listing' };
        }

        const numGuests = parseInt(guests) || 1;
        const roomTypes = listing.roomTypes || { single: 0, double: 0, triple: 0 };

        // Check availability and allocate rooms based on guest count
        let allocation = {
            single: 0,
            double: 0,
            triple: 0
        };

        let remainingGuests = numGuests;

        // Allocate rooms based on guest count
        if (numGuests === 1) {
            // 1 guest: use 1 single room
            if (roomTypes.single >= 1) {
                allocation.single = 1;
                remainingGuests = 0;
            } else {
                return { success: false, message: 'No single rooms available' };
            }
        } else if (numGuests === 2) {
            // 2 guests: use 1 double room
            if (roomTypes.double >= 1) {
                allocation.double = 1;
                remainingGuests = 0;
            } else {
                return { success: false, message: 'No double rooms available' };
            }
        } else if (numGuests === 3) {
            // 3 guests: use 1 triple room
            if (roomTypes.triple >= 1) {
                allocation.triple = 1;
                remainingGuests = 0;
            } else {
                return { success: false, message: 'No triple rooms available' };
            }
        } else if (numGuests === 4) {
            // 4 guests: use 1 triple + 1 single (3+1=4)
            if (roomTypes.triple >= 1 && roomTypes.single >= 1) {
                allocation.triple = 1;
                allocation.single = 1;
                remainingGuests = 0;
            } else {
                return { success: false, message: 'Not enough rooms available for 4 guests. Need 1 triple and 1 single room.' };
            }
        } else if (numGuests === 5) {
            // 5 guests: use 1 triple + 1 double (3+2=5)
            if (roomTypes.triple >= 1 && roomTypes.double >= 1) {
                allocation.triple = 1;
                allocation.double = 1;
                remainingGuests = 0;
            } else {
                return { success: false, message: 'Not enough rooms available for 5 guests. Need 1 triple and 1 double room.' };
            }
        } else {
            return { success: false, message: 'Invalid number of guests. Maximum 5 guests allowed.' };
        }

        // Check if we have enough rooms
        if (roomTypes.single < allocation.single || 
            roomTypes.double < allocation.double || 
            roomTypes.triple < allocation.triple) {
            return { success: false, message: 'Not enough rooms available' };
        }

        // Reduce rooms from listing
        listing.roomTypes.single = Math.max(0, roomTypes.single - allocation.single);
        listing.roomTypes.double = Math.max(0, roomTypes.double - allocation.double);
        listing.roomTypes.triple = Math.max(0, roomTypes.triple - allocation.triple);

        // Update total rooms count
        const totalRooms = listing.roomTypes.single + listing.roomTypes.double + listing.roomTypes.triple;
        listing.rooms = totalRooms;

        await listing.save();

        return {
            success: true,
            allocation,
            message: `Allocated: ${allocation.single} single, ${allocation.double} double, ${allocation.triple} triple room(s)`
        };
    } catch (error) {
        console.error('Error allocating rooms:', error);
        return { success: false, message: 'Error allocating rooms: ' + error.message };
    }
}

/**
 * Check room availability for a given number of guests
 * @param {String} listingId - The listing ID
 * @param {Number} guests - Number of guests (1-5)
 * @returns {Object} - Availability check result
 */
async function checkRoomAvailability(listingId, guests) {
    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return { available: false, message: 'Listing not found' };
        }

        if (!listing.roomTypes) {
            return { available: false, message: 'Room types not configured' };
        }

        const numGuests = parseInt(guests) || 1;
        const roomTypes = listing.roomTypes;

        // Check availability based on guest count
        if (numGuests === 1) {
            return {
                available: roomTypes.single >= 1,
                message: roomTypes.single >= 1 ? 'Available' : 'No single rooms available'
            };
        } else if (numGuests === 2) {
            return {
                available: roomTypes.double >= 1,
                message: roomTypes.double >= 1 ? 'Available' : 'No double rooms available'
            };
        } else if (numGuests === 3) {
            return {
                available: roomTypes.triple >= 1,
                message: roomTypes.triple >= 1 ? 'Available' : 'No triple rooms available'
            };
        } else if (numGuests === 4) {
            const available = roomTypes.triple >= 1 && roomTypes.single >= 1;
            return {
                available,
                message: available ? 'Available' : 'Need 1 triple and 1 single room'
            };
        } else if (numGuests === 5) {
            const available = roomTypes.triple >= 1 && roomTypes.double >= 1;
            return {
                available,
                message: available ? 'Available' : 'Need 1 triple and 1 double room'
            };
        } else {
            return { available: false, message: 'Invalid number of guests' };
        }
    } catch (error) {
        console.error('Error checking room availability:', error);
        return { available: false, message: 'Error checking availability' };
    }
}

module.exports = {
    allocateRooms,
    checkRoomAvailability
};

