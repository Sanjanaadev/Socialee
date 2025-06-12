// Setup script to create sample data in MongoDB Compass
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Post = require('./models/Post');

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up MongoDB Compass database...');
    
    // Connect to MongoDB
    await connectDB();
    
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
        bio: 'Test user 1 - Photography enthusiast',
        profilePic: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        name: 'Jane Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: hashedPassword,
        bio: 'Test user 2 - Digital artist',
        profilePic: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        name: 'Mike Johnson',
        username: 'mikejohnson',
        email: 'mike@example.com',
        password: hashedPassword,
        bio: 'Test user 3 - Travel blogger',
        profilePic: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        name: 'Sarah Wilson',
        username: 'sarahwilson',
        email: 'sarah@example.com',
        password: hashedPassword,
        bio: 'Test user 4 - Food lover',
        profilePic: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600'
      }
    ];
    
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);
    
    // Create test posts
    console.log('📝 Creating test posts...');
    
    const testPosts = [
      {
        imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Beautiful sunset view! 🌅 #photography #nature',
        author: createdUsers[0]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'City lights at night ✨ #citylife #nightphotography',
        author: createdUsers[1]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Morning coffee ritual ☕ #coffee #morning',
        author: createdUsers[2]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Weekend getaway to the mountains 🏔️ #travel #adventure',
        author: createdUsers[0]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'New art piece finished today 🎨 #art #creative',
        author: createdUsers[1]._id
      },
      {
        imageUrl: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Sunday brunch with friends 🥐 #food #friends',
        author: createdUsers[3]._id
      }
    ];
    
    const createdPosts = await Post.insertMany(testPosts);
    console.log(`✅ Created ${createdPosts.length} test posts`);
    
    // Add some likes and comments
    console.log('❤️ Adding likes and comments...');
    
    // Add likes to posts
    await Post.findByIdAndUpdate(createdPosts[0]._id, {
      $push: { likes: { $each: [createdUsers[1]._id, createdUsers[2]._id] } }
    });
    
    await Post.findByIdAndUpdate(createdPosts[1]._id, {
      $push: { likes: { $each: [createdUsers[0]._id, createdUsers[3]._id] } }
    });
    
    // Add comments to posts
    await Post.findByIdAndUpdate(createdPosts[0]._id, {
      $push: {
        comments: {
          text: 'Amazing shot! 📸',
          author: createdUsers[1]._id,
          createdAt: new Date()
        }
      }
    });
    
    await Post.findByIdAndUpdate(createdPosts[1]._id, {
      $push: {
        comments: {
          text: 'Love the city vibes! 🌃',
          author: createdUsers[2]._id,
          createdAt: new Date()
        }
      }
    });
    
    // Add some followers/following relationships
    console.log('👥 Setting up follow relationships...');
    
    await User.findByIdAndUpdate(createdUsers[0]._id, {
      $push: { following: { $each: [createdUsers[1]._id, createdUsers[2]._id] } }
    });
    
    await User.findByIdAndUpdate(createdUsers[1]._id, {
      $push: { 
        followers: createdUsers[0]._id,
        following: { $each: [createdUsers[0]._id, createdUsers[3]._id] }
      }
    });
    
    await User.findByIdAndUpdate(createdUsers[2]._id, {
      $push: { 
        followers: { $each: [createdUsers[0]._id, createdUsers[1]._id] },
        following: createdUsers[3]._id
      }
    });
    
    await User.findByIdAndUpdate(createdUsers[3]._id, {
      $push: { 
        followers: { $each: [createdUsers[1]._id, createdUsers[2]._id] }
      }
    });
    
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
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('📊 You can now view this data in MongoDB Compass');
    console.log('🔗 Database: socialee');
    console.log('📁 Collections: users, posts');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupDatabase();