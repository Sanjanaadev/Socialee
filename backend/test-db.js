// Test script to verify database connection and create sample data
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Post = require('./models/Post');

const testDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/socialee', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (optional - remove this in production)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Post.deleteMany({});
    
    // Create test users
    console.log('👥 Creating test users...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUsers = [
      {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: hashedPassword,
        bio: 'Test user 1',
        profilePic: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        name: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: hashedPassword,
        bio: 'Test user 2',
        profilePic: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        name: 'Mike Johnson',
        username: 'mikejohnson',
        email: 'mike@example.com',
        password: hashedPassword,
        bio: 'Test user 3',
        profilePic: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600'
      }
    ];
    
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);
    
    // Create test posts
    console.log('📝 Creating test posts...');
    
    const testPosts = [
      {
        imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Beautiful sunset view! 🌅',
        author: createdUsers[0]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'City lights at night ✨',
        author: createdUsers[1]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Morning coffee ☕',
        author: createdUsers[2]._id
      }
    ];
    
    const createdPosts = await Post.insertMany(testPosts);
    console.log(`✅ Created ${createdPosts.length} test posts`);
    
    // Verify data
    console.log('🔍 Verifying data...');
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    
    console.log(`📊 Database contains:`);
    console.log(`   - ${userCount} users`);
    console.log(`   - ${postCount} posts`);
    
    // List all users
    const users = await User.find({}).select('-password');
    console.log('👥 Users in database:');
    users.forEach(user => {
      console.log(`   - ${user.name} (@${user.username}) - ${user.email}`);
    });
    
    // List all posts
    const posts = await Post.find({}).populate('author', 'name username');
    console.log('📝 Posts in database:');
    posts.forEach(post => {
      console.log(`   - "${post.caption}" by ${post.author.name}`);
    });
    
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test
testDatabase();