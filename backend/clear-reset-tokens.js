const mongoose = require('mongoose');
const PasswordReset = require('./models/PasswordReset');
require('dotenv').config();

const clearResetTokens = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/socialee', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear all password reset tokens
    console.log('🧹 Clearing all password reset tokens...');
    const result = await PasswordReset.deleteMany({});
    
    console.log(`✅ Cleared ${result.deletedCount} password reset tokens`);
    console.log('🎉 You can now request a new password reset!');
    
  } catch (error) {
    console.error('❌ Error clearing tokens:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

clearResetTokens();