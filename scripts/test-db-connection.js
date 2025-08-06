const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@') : 'Not found');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Test creating a document
    const testSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = await TestModel.create({
      test: 'Connection test successful'
    });
    
    console.log('✅ Test document created:', testDoc._id);
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Solution: Check your username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Solution: Check your network connection and cluster URL');
    } else if (error.message.includes('Invalid scheme')) {
      console.error('\n💡 Solution: Make sure your connection string starts with mongodb:// or mongodb+srv://');
    }
    
    process.exit(1);
  }
};

testConnection();
