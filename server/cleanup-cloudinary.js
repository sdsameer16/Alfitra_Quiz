import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteAllResources() {
  try {
    console.log('🔍 Fetching all resources from Cloudinary...');
    
    let totalDeleted = 0;
    
    // Delete all raw resources (PDFs)
    console.log('\n📄 Deleting raw resources (PDFs)...');
    try {
      const rawResources = await cloudinary.api.resources({
        resource_type: 'raw',
        type: 'upload',
        max_results: 500
      });
      
      if (rawResources.resources && rawResources.resources.length > 0) {
        const publicIds = rawResources.resources.map(r => r.public_id);
        const rawResult = await cloudinary.api.delete_resources(publicIds, {
          resource_type: 'raw'
        });
        console.log('✅ Raw resources deleted:', Object.keys(rawResult.deleted || {}).length);
        totalDeleted += Object.keys(rawResult.deleted || {}).length;
      } else {
        console.log('ℹ️  No raw resources found');
      }
    } catch (err) {
      console.log('ℹ️  No raw resources to delete');
    }
    
    // Delete all image resources
    console.log('\n🖼️  Deleting image resources...');
    try {
      const imageResources = await cloudinary.api.resources({
        resource_type: 'image',
        type: 'upload',
        max_results: 500
      });
      
      if (imageResources.resources && imageResources.resources.length > 0) {
        const publicIds = imageResources.resources.map(r => r.public_id);
        const imageResult = await cloudinary.api.delete_resources(publicIds, {
          resource_type: 'image'
        });
        console.log('✅ Image resources deleted:', Object.keys(imageResult.deleted || {}).length);
        totalDeleted += Object.keys(imageResult.deleted || {}).length;
      } else {
        console.log('ℹ️  No image resources found');
      }
    } catch (err) {
      console.log('ℹ️  No image resources to delete');
    }
    
    // Delete all video resources
    console.log('\n🎥 Deleting video resources...');
    try {
      const videoResources = await cloudinary.api.resources({
        resource_type: 'video',
        type: 'upload',
        max_results: 500
      });
      
      if (videoResources.resources && videoResources.resources.length > 0) {
        const publicIds = videoResources.resources.map(r => r.public_id);
        const videoResult = await cloudinary.api.delete_resources(publicIds, {
          resource_type: 'video'
        });
        console.log('✅ Video resources deleted:', Object.keys(videoResult.deleted || {}).length);
        totalDeleted += Object.keys(videoResult.deleted || {}).length;
      } else {
        console.log('ℹ️  No video resources found');
      }
    } catch (err) {
      console.log('ℹ️  No video resources to delete');
    }
    
    console.log('\n✨ Cleanup completed successfully!');
    console.log('Total resources deleted:', totalDeleted);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    if (error.error && error.error.message) {
      console.error('Details:', error.error.message);
    }
  }
}

// Run cleanup
deleteAllResources();
