import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ReferenceMaterial from './models/ReferenceMaterial.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function cleanupDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all reference materials
    console.log('\n🗑️  Deleting all reference materials from database...');
    const result = await ReferenceMaterial.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} reference materials from database`);

    console.log('\n✨ Database cleanup completed successfully!');
    
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error.message);
    process.exit(1);
  }
}

cleanupDatabase();
