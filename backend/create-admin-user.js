require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

async function main() {
  try {
    const MONGO_URL = process.env.MONGO_URL;
    if (!MONGO_URL) {
      console.error('❌ MONGO_URL is not set in your .env file');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const username = 'admin';
    const password = 'Admin@123';
    const email = 'admin@example.com';

    let user = await User.findOne({ username });

    if (user) {
      console.log(`ℹ️ User "${username}" already exists. Updating role to admin and resetting password...`);
      user.role = 'admin';
      await user.setPassword(password);
      await user.save();
      console.log('✅ Existing user promoted to admin and password reset.');
    } else {
      console.log(`ℹ️ Creating new admin user "${username}"...`);
      const newUser = new User({ username, email, role: 'admin' });
      user = await User.register(newUser, password);
      console.log('✅ Admin user created successfully.');
    }

    console.log('\nYou can now log in with:');
    console.log(`  username: ${username}`);
    console.log(`  password: ${password}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  }
}

main();
