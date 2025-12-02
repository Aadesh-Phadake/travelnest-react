require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/booking');
const Listing = require('./models/listing');
const User = require('./models/user');

async function main() {
  try {
    const MONGO_URL = process.env.MONGO_URL;
    if (!MONGO_URL) {
      console.error('❌ MONGO_URL is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Find bookings without commission or with zero commission
    const bookings = await Booking.find({
      $or: [
        { platformCommission: { $exists: false } },
        { platformCommission: 0 },
      ],
    })
      .populate('listing')
      .populate('user');

    console.log(`ℹ️ Found ${bookings.length} bookings to backfill`);

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    let updatedCount = 0;

    for (const booking of bookings) {
      const listing = booking.listing && booking.listing.price ? booking.listing : null;
      if (!listing) {
        console.log(`⚠️ Skipping booking ${booking._id}: listing not populated or has no price`);
        continue;
      }

      const checkInDate = parseDate(booking.checkIn);
      const checkOutDate = parseDate(booking.checkOut);
      if (!checkInDate || !checkOutDate) {
        console.log(`⚠️ Skipping booking ${booking._id}: invalid dates`);
        continue;
      }

      const millisPerDay = 1000 * 60 * 60 * 24;
      const nights = Math.ceil((checkOutDate - checkInDate) / millisPerDay);
      if (!Number.isFinite(nights) || nights <= 0) {
        console.log(`⚠️ Skipping booking ${booking._id}: non-positive nights (${nights})`);
        continue;
      }

      const numGuests = booking.guests || 1;
      let baseAmount = listing.price * nights;
      if (numGuests > 2) {
        const additionalGuestFee = (numGuests - 2) * 500 * nights;
        baseAmount += additionalGuestFee;
      }

      // Approximate membership at booking time using current membership expiry
      const user = booking.user;
      let isActiveMemberAtBooking = false;
      if (user && user.isMember && user.membershipExpiresAt) {
        const expires = new Date(user.membershipExpiresAt);
        const bookingCreatedAt = booking.createdAt || new Date();
        if (!Number.isNaN(expires.getTime()) && expires > bookingCreatedAt) {
          isActiveMemberAtBooking = true;
        }
      }

      const serviceFee = isActiveMemberAtBooking ? 0 : Math.round(baseAmount * 0.1);

      booking.platformCommission = serviceFee;
      await booking.save();
      updatedCount += 1;
    }

    console.log(`✅ Backfill complete. Updated ${updatedCount} bookings.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Backfill error:', err);
    process.exit(1);
  }
}

main();
