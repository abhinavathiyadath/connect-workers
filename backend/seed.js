const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('./models/User');
const WorkerProfile = require('./models/WorkerProfile');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.');

    // Clear existing data
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await WorkerProfile.deleteMany({});
    await Booking.deleteMany({});
    await Notification.deleteMany({});
    console.log('Collections cleared.');

    // Hash a common password for all test accounts
    const commonPassword = await bcrypt.hash('password123', 10);

    // 1. Seed Users
    console.log('Seeding users...');
    const usersData = [
      // Admin
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: commonPassword,
        role: 'admin',
      },

      // Customers
      {
        name: 'Ramesh Kumar',
        email: 'ramesh@example.com',
        password: commonPassword,
        role: 'customer',
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        password: commonPassword,
        role: 'customer',
      },
      {
        name: 'Sunita Verma',
        email: 'sunita@example.com',
        password: commonPassword,
        role: 'customer',
      },
      {
        name: 'Amit Patel',
        email: 'amit@example.com',
        password: commonPassword,
        role: 'customer',
      },

      // Workers
      {
        name: 'Rajesh Plumber',
        email: 'rajesh@example.com',
        password: commonPassword,
        role: 'worker',
      },
      {
        name: 'Suresh Electrician',
        email: 'suresh@example.com',
        password: commonPassword,
        role: 'worker',
      },
      {
        name: 'Mahesh Carpenter',
        email: 'mahesh@example.com',
        password: commonPassword,
        role: 'worker',
      },
      {
        name: 'Anita Painter',
        email: 'anita@example.com',
        password: commonPassword,
        role: 'worker',
      },
      {
        name: 'Vikram Mason',
        email: 'vikram@example.com',
        password: commonPassword,
        role: 'worker',
      },
      {
        name: 'Deepa Gardener',
        email: 'deepa@example.com',
        password: commonPassword,
        role: 'worker',
      },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`Created ${createdUsers.length} users.`);

    // Helper lookup map for user IDs by email
    const userMap = {};
    createdUsers.forEach((u) => {
      userMap[u.email] = u._id;
    });

    // 2. Seed Worker Profiles
    console.log('Seeding worker profiles...');
    const workerProfilesData = [
      {
        userId: userMap['rajesh@example.com'],
        skill: 'Plumber',
        village: 'Rampur',
        location: { lat: 28.6139, lng: 77.209 },
        price: 350,
        availabilitySlots: ['09:00 AM - 11:00 AM', '02:00 PM - 04:00 PM'],
        rating: 4.8,
        totalRatings: 12,
        totalBookings: 15,
        isApproved: true,
      },
      {
        userId: userMap['suresh@example.com'],
        skill: 'Electrician',
        village: 'Chandpur',
        location: { lat: 28.625, lng: 77.218 },
        price: 400,
        availabilitySlots: ['10:00 AM - 01:00 PM', '03:00 PM - 06:00 PM'],
        rating: 4.6,
        totalRatings: 8,
        totalBookings: 10,
        isApproved: true,
      },
      {
        userId: userMap['mahesh@example.com'],
        skill: 'Carpenter',
        village: 'Rampur',
        location: { lat: 28.618, lng: 77.21 },
        price: 500,
        availabilitySlots: ['08:00 AM - 12:00 PM'],
        rating: 4.9,
        totalRatings: 20,
        totalBookings: 22,
        isApproved: true,
      },
      {
        userId: userMap['anita@example.com'],
        skill: 'Painter',
        village: 'Sundarpur',
        location: { lat: 28.63, lng: 77.225 },
        price: 450,
        availabilitySlots: ['09:00 AM - 01:00 PM', '02:00 PM - 05:00 PM'],
        rating: 4.5,
        totalRatings: 5,
        totalBookings: 6,
        isApproved: true,
      },
      {
        userId: userMap['vikram@example.com'],
        skill: 'Mason',
        village: 'Chandpur',
        location: { lat: 28.605, lng: 77.2 },
        price: 600,
        availabilitySlots: ['09:00 AM - 05:00 PM'],
        rating: 4.7,
        totalRatings: 15,
        totalBookings: 18,
        isApproved: true,
      },
      {
        userId: userMap['deepa@example.com'],
        skill: 'Gardener',
        village: 'Rampur',
        location: { lat: 28.621, lng: 77.215 },
        price: 300,
        availabilitySlots: ['07:00 AM - 11:00 AM'],
        rating: 0,
        totalRatings: 0,
        totalBookings: 0,
        isApproved: false, // Pending worker for admin approval testing
      },
    ];

    const createdProfiles = await WorkerProfile.insertMany(workerProfilesData);
    console.log(`Created ${createdProfiles.length} worker profiles.`);

    // 3. Seed Bookings
    console.log('Seeding bookings...');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const bookingsData = [
      {
        customerId: userMap['ramesh@example.com'],
        workerId: userMap['rajesh@example.com'],
        date: tomorrow,
        timeSlot: '09:00 AM - 11:00 AM',
        status: 'confirmed',
      },
      {
        customerId: userMap['priya@example.com'],
        workerId: userMap['suresh@example.com'],
        date: nextWeek,
        timeSlot: '10:00 AM - 01:00 PM',
        status: 'pending',
      },
      {
        customerId: userMap['sunita@example.com'],
        workerId: userMap['mahesh@example.com'],
        date: yesterday,
        timeSlot: '08:00 AM - 12:00 PM',
        status: 'completed',
        rating: 5,
        review: 'Excellent carpentry work! Fixed the cabinet doors quickly.',
      },
      {
        customerId: userMap['amit@example.com'],
        workerId: userMap['anita@example.com'],
        date: threeDaysAgo,
        timeSlot: '02:00 PM - 05:00 PM',
        status: 'completed',
        rating: 4,
        review: 'Good job painting the living room wall. Punctual and clean.',
      },
    ];

    const createdBookings = await Booking.insertMany(bookingsData);
    console.log(`Created ${createdBookings.length} bookings.`);

    // 4. Seed Notifications
    console.log('Seeding notifications...');
    const notificationsData = [
      {
        userId: userMap['admin@example.com'],
        message: 'New worker profile registered (Deepa Gardener) pending approval.',
        type: 'approval',
        isRead: false,
      },
      {
        userId: userMap['ramesh@example.com'],
        message: 'Your booking with Rajesh Plumber has been confirmed.',
        type: 'booking',
        isRead: true,
      },
      {
        userId: userMap['rajesh@example.com'],
        message: 'You have a confirmed booking with Ramesh Kumar for tomorrow at 09:00 AM - 11:00 AM.',
        type: 'booking',
        isRead: false,
      },
      {
        userId: userMap['suresh@example.com'],
        message: 'New booking request received from Priya Sharma.',
        type: 'booking',
        isRead: false,
      },
      {
        userId: userMap['mahesh@example.com'],
        message: 'Sunita Verma rated your service 5 stars!',
        type: 'rating',
        isRead: true,
      },
    ];

    const createdNotifications = await Notification.insertMany(notificationsData);
    console.log(`Created ${createdNotifications.length} notifications.`);

    console.log('\n--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
    console.log('All seeded user accounts share the password: password123\n');
    console.log('Seeded Accounts:');
    console.log('• Admin:     admin@example.com');
    console.log('• Customers: ramesh@example.com, priya@example.com, sunita@example.com, amit@example.com');
    console.log('• Workers:   rajesh@example.com (Plumber), suresh@example.com (Electrician), mahesh@example.com (Carpenter), anita@example.com (Painter), vikram@example.com (Mason), deepa@example.com (Gardener - Pending)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
