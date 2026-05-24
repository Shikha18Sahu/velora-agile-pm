require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Project = require('./models/project');
const Task = require('./models/task');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MONGO_URI is not set in environment variables');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('Data cleared.');

    // 1. Create Test Users
    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpassword123' // Will be hashed automatically by pre-save hook
    });

    const regularUser = await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'userpassword123'
    });

    console.log(`Users created: \n- ${adminUser.email} (password: adminpassword123)\n- ${regularUser.email} (password: userpassword123)`);

    // 2. Create Projects
    console.log('Creating projects...');
    const project1 = await Project.create({
      name: 'Acme Website Redesign',
      description: 'Revamp the corporate website with modern glassmorphism design and responsive grid layout.',
      owner: adminUser._id,
      key: 'ACME',
      members: [
        { user: adminUser._id, role: 'Admin' },
        { user: regularUser._id, role: 'Member' }
      ]
    });

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Build a cross-platform mobile app for customer check-in and loyalty program tracking.',
      owner: adminUser._id,
      key: 'MOB',
      members: [
        { user: adminUser._id, role: 'Admin' }
      ]
    });

    const project3 = await Project.create({
      name: 'Marketing Campaign 2026',
      description: 'Coordinate resources and create materials for the Q3 product release marketing campaign.',
      owner: regularUser._id,
      key: 'MKT',
      members: [
        { user: regularUser._id, role: 'Admin' },
        { user: adminUser._id, role: 'Member' }
      ]
    });

    console.log(`Projects created: "${project1.name}", "${project2.name}", "${project3.name}"`);

    // 3. Create Tasks
    console.log('Creating tasks...');
    
    // Tasks for Project 1 (Acme Website Redesign)
    const task1 = await Task.create({
      title: 'Design homepage mockups',
      description: 'Create high-fidelity Figma designs for the homepage showing both light and dark mode versions.',
      priority: 'high',
      status: 'done',
      project: project1._id,
      assignee: adminUser._id,
      key: 'ACME-1'
    });

    const task2 = await Task.create({
      title: 'Setup Vite and Tailwind CSS',
      description: 'Configure the frontend project structure with Vite, React, PostCSS and Tailwind CSS.',
      priority: 'medium',
      status: 'done',
      project: project1._id,
      assignee: regularUser._id,
      key: 'ACME-2'
    });

    const task3 = await Task.create({
      title: 'Implement Navigation Header',
      description: 'Create a responsive glassmorphic navbar with smooth animations for mobile drawer toggle.',
      priority: 'medium',
      status: 'in_progress',
      project: project1._id,
      assignee: regularUser._id,
      key: 'ACME-3'
    });

    const task4 = await Task.create({
      title: 'Integrate Auth Context',
      description: 'Connect login and registration views with the backend JWT endpoints and set up route guarding.',
      priority: 'high',
      status: 'todo',
      project: project1._id,
      assignee: adminUser._id,
      key: 'ACME-4'
    });

    const task5 = await Task.create({
      title: 'Write API Documentation',
      description: 'Draft the postman collection or markdown docs outlining all API paths, request bodies and responses.',
      priority: 'low',
      status: 'todo',
      project: project1._id,
      assignee: null,
      key: 'ACME-5'
    });

    await Project.findByIdAndUpdate(project1._id, { taskCounter: 5 });

    // Tasks for Project 2 (Mobile App Development)
    const task6 = await Task.create({
      title: 'Set up push notifications',
      description: 'Integrate Firebase Cloud Messaging (FCM) to trigger remote alerts for user updates.',
      priority: 'high',
      status: 'todo',
      project: project2._id,
      assignee: adminUser._id,
      key: 'MOB-1'
    });

    const task7 = await Task.create({
      title: 'Create App Store assets',
      description: 'Export icons, splash screens, and app preview screenshots for store listing submissions.',
      priority: 'low',
      status: 'done',
      project: project2._id,
      assignee: adminUser._id,
      key: 'MOB-2'
    });

    await Project.findByIdAndUpdate(project2._id, { taskCounter: 2 });

    // Tasks for Project 3 (Marketing Campaign 2026)
    const task8 = await Task.create({
      title: 'Draft press release',
      description: 'Write the official press release highlighting the key enhancements of the upcoming release.',
      priority: 'medium',
      status: 'in_progress',
      project: project3._id,
      assignee: regularUser._id,
      key: 'MKT-1'
    });

    const task9 = await Task.create({
      title: 'Schedule social media posts',
      description: 'Create and queue teaser graphics and captions on Twitter, LinkedIn, and Instagram platforms.',
      priority: 'low',
      status: 'todo',
      project: project3._id,
      assignee: regularUser._id,
      key: 'MKT-2'
    });

    const task10 = await Task.create({
      title: 'Budget approval signoff',
      description: 'Present the campaign cost breakdowns to management and secure authorization for ad spends.',
      priority: 'high',
      status: 'done',
      project: project3._id,
      assignee: adminUser._id,
      key: 'MKT-3'
    });

    await Project.findByIdAndUpdate(project3._id, { taskCounter: 3 });

    console.log('10 Sample Tasks successfully created across projects.');
    console.log('Seeding completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
