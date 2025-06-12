const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/socialee';
    
    // Clear any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState}`);
    
    // Log connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;

  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('🔍 Full error:', err);
    
    // If connection fails, try to start without MongoDB for development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running in development mode without MongoDB');
      console.log('💡 Make sure MongoDB is installed and running on your system');
      console.log('📖 Installation guide: https://docs.mongodb.com/manual/installation/');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;