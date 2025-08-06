const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function inspectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('📱 Connected to MongoDB\n');

    // Get all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 All Collections in database:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    console.log('');

    // Check each collection for message-like data
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🔍 Checking collection: ${collectionName}`);
      
      try {
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        console.log(`   Document count: ${count}`);
        
        if (count > 0) {
          // Get a sample document
          const sample = await mongoose.connection.db.collection(collectionName).findOne();
          console.log(`   Sample document structure:`, Object.keys(sample));
          
          // Check if it looks like messages
          if (sample.text || sample.message || sample.content || sample.body) {
            console.log(`   ⚠️  This looks like message data!`);
            console.log(`   Sample content:`, sample.text || sample.message || sample.content || sample.body);
          }
        }
        console.log('');
      } catch (error) {
        console.log(`   Error reading collection: ${error.message}`);
      }
    }

    await mongoose.disconnect();
    console.log('📱 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

inspectDatabase();
