const mongoose = require('mongoose');
require('dotenv').config();

const checkSetup = async () => {
  console.log('🔍 Checking Socialee Backend Setup...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   MONGO_URI: ${process.env.MONGO_URI || 'Not set (using default)'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set (using default)'}`);
  console.log(`   PORT: ${process.env.PORT || '5000 (default)'}\n`);
  
  // Check MongoDB connection
  console.log('🔄 Testing MongoDB connection...');
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/socialee';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}\n`);
    
    // Test basic operations
    console.log('🧪 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`     - ${col.name}`));
    
    console.log('\n✅ All checks passed! Backend is ready to use.');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error(`   Error: ${error.message}`);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure MongoDB is installed and running');
    console.log('   2. Check if MongoDB service is started');
    console.log('   3. Verify the connection string in .env file');
    console.log('   4. Try running: brew services start mongodb-community (macOS)');
    console.log('   5. Or: sudo systemctl start mongod (Linux)');
    console.log('   6. Or: net start MongoDB (Windows)');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkSetup();