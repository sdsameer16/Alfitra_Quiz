import express from 'express';
import Module from '../models/Module.js';
import QuizDay from '../models/QuizDay.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import ReferenceMaterial from '../models/ReferenceMaterial.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Ensure .env is loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const router = express.Router();

// Configure Cloudinary - will be configured on each request to ensure env vars are loaded
const ensureCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  console.log('Checking Cloudinary env vars:', {
    cloudName: cloudName ? `${cloudName.substring(0, 4)}...` : 'NOT SET',
    apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'NOT SET',
    apiSecret: apiSecret ? 'SET' : 'NOT SET'
  });
  
  if (cloudName && apiKey && apiSecret) {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      console.log('Cloudinary configured successfully');
      return true;
    } catch (err) {
      console.error('Error configuring Cloudinary:', err);
      return false;
    }
  }
  console.warn('Cloudinary not fully configured');
  return false;
};

// Try to configure on module load
ensureCloudinaryConfig();

// Configure multer for memory storage and PDF-only filter
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('Only PDF uploads are allowed'), false);
    }
    cb(null, true);
  },
});

// Helper function to upload PDF to Cloudinary as raw
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('Invalid file object'));
    }

    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return reject(new Error('Only PDF uploads are allowed'));
    }

    console.log('Uploading PDF:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    // Create a safe filename for Cloudinary public_id (remove extension, keep base name)
    const originalName = file.originalname.replace(/\.pdf$/i, '');
    const safeFilename = originalName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const publicId = `quiz-references/${safeFilename}_${timestamp}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'raw',
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Upload successful, URL:', result.secure_url);
          // Include original filename in result
          result.originalFilename = file.originalname;
          resolve(result);
        }
      }
    );

    try {
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      bufferStream.on('error', (err) => {
        console.error('Buffer stream error:', err);
        reject(err);
      });

      uploadStream.on('error', (err) => {
        console.error('Upload stream error:', err);
        reject(err);
      });

      bufferStream.pipe(uploadStream);
    } catch (err) {
      console.error('Stream creation error:', err);
      reject(err);
    }
  });
};

// Helper to normalize PDF URLs (keep Cloudinary secure_url, just switch to raw if needed)
const normalizePdfUrl = (url) => {
  if (!url) return url;
  let fixedUrl = url;
  if (fixedUrl.includes('/image/upload/')) {
    fixedUrl = fixedUrl.replace('/image/upload/', '/raw/upload/');
  }
  // Drop query params
  fixedUrl = fixedUrl.split('?')[0];
  return fixedUrl;
};

// Upload reference PDF for questions (new endpoint)
router.post(
  '/admin/upload-reference',
  authRequired,
  adminRequired,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(400).json({ 
          message: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
        });
      }
      
      if (!ensureCloudinaryConfig()) {
        return res.status(500).json({ 
          message: 'Cloudinary configuration failed. Please check your .env file and restart the server.' 
        });
      }

      const result = await uploadToCloudinary(req.file);
      const fileUrl = normalizePdfUrl(result.secure_url);
      const publicId = result.public_id;

      res.json({ 
        url: fileUrl, 
        publicId,
        originalFilename: req.file.originalname
      });
    } catch (err) {
      console.error('Reference upload error:', err);
      res.status(500).json({ 
        message: `Failed to upload reference PDF: ${err.message || 'Unknown error'}`
      });
    }
  }
);

// Create a new module
router.post('/admin/modules', authRequired, adminRequired, async (req, res) => {
  try {
    const { name, description, section } = req.body;
    const module = await Module.create({
      name,
      description: description || '',
      section,
      createdBy: req.user._id,
    });
    res.status(201).json(module);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create module' });
  }
});

// Get all modules (for participants to view)
router.get('/modules', authRequired, async (req, res) => {
  try {
    const modules = await Module.find().sort({ createdAt: -1 });
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load modules' });
  }
});

// Get all modules (admin)
router.get('/admin/modules', authRequired, adminRequired, async (req, res) => {
  try {
    const modules = await Module.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load modules' });
  }
});

// Get a single module with quiz days
router.get('/admin/modules/:moduleId', authRequired, adminRequired, async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    const quizDays = await QuizDay.find({ module: module._id }).sort({ createdAt: -1 });
    res.json({ module, quizDays });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load module' });
  }
});

// Update module
router.put('/admin/modules/:moduleId', authRequired, adminRequired, async (req, res) => {
  try {
    const { name, description } = req.body;
    const module = await Module.findByIdAndUpdate(
      req.params.moduleId,
      { name, description },
      { new: true }
    );
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json(module);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update module' });
  }
});

// Delete module
router.delete('/admin/modules/:moduleId', authRequired, adminRequired, async (req, res) => {
  try {
    const module = await Module.findByIdAndDelete(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    // Also delete associated quiz days
    await QuizDay.deleteMany({ module: module._id });
    res.json({ message: 'Module deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete module' });
  }
});

// Publish/Unpublish a quiz day
router.put('/admin/quiz-days/:quizDayId/publish', authRequired, adminRequired, async (req, res) => {
  try {
    const { isPublished } = req.body;
    const quizDay = await QuizDay.findByIdAndUpdate(
      req.params.quizDayId,
      { isPublished },
      { new: true }
    );
    if (!quizDay) {
      return res.status(404).json({ message: 'Quiz day not found' });
    }
    res.json(quizDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update publish status' });
  }
});

// Stop/Allow responses for a quiz day
router.put('/admin/quiz-days/:quizDayId/responses', authRequired, adminRequired, async (req, res) => {
  try {
    const { responsesOpen } = req.body;
    const quizDay = await QuizDay.findByIdAndUpdate(
      req.params.quizDayId,
      { responsesOpen },
      { new: true }
    );
    if (!quizDay) {
      return res.status(404).json({ message: 'Quiz day not found' });
    }
    res.json(quizDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update responses status' });
  }
});

// Publish/Unpublish results for a quiz day
router.put('/admin/quiz-days/:quizDayId/publish-results', authRequired, adminRequired, async (req, res) => {
  try {
    const { resultsPublished } = req.body;
    const quizDay = await QuizDay.findByIdAndUpdate(
      req.params.quizDayId,
      { resultsPublished },
      { new: true }
    );
    if (!quizDay) {
      return res.status(404).json({ message: 'Quiz day not found' });
    }
    res.json(quizDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update results status' });
  }
});

// Get evaluation results for a module
router.get('/admin/modules/:moduleId/evaluation', authRequired, adminRequired, async (req, res) => {
  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const quizDays = await QuizDay.find({ module: module._id });
    const quizDayIds = quizDays.map(qd => qd._id);

    // Get all submissions for this module
    const submissions = await Submission.find({ quizDay: { $in: quizDayIds } })
      .populate('user', 'name email')
      .populate('quizDay', 'dateLabel')
      .sort({ createdAt: -1 });

    // Aggregate results by user
    const userResults = {};
    submissions.forEach(sub => {
      const userId = sub.user._id.toString();
      if (!userResults[userId]) {
        userResults[userId] = {
          user: sub.user,
          totalScore: 0,
          totalQuestions: 0,
          quizDaysCompleted: new Set(),
          submissions: [],
        };
      }
      userResults[userId].totalScore += sub.totalScore;
      userResults[userId].totalQuestions += sub.answers.length;
      userResults[userId].quizDaysCompleted.add(sub.quizDay._id.toString());
      userResults[userId].submissions.push(sub);
    });

    // Convert to array and calculate percentages
    const results = Object.values(userResults).map(result => ({
      user: result.user,
      totalScore: result.totalScore,
      totalQuestions: result.totalQuestions,
      quizDaysCompleted: result.quizDaysCompleted.size,
      averageScore: result.totalQuestions > 0 
        ? ((result.totalScore / result.totalQuestions) * 100).toFixed(2) 
        : 0,
      submissions: result.submissions,
    }));

    // Sort by total score descending
    results.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      module,
      quizDays,
      results,
      totalParticipants: results.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load evaluation' });
  }
});

// Upload reference material
router.post(
  '/admin/modules/:moduleId/materials',
  authRequired,
  adminRequired,
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        body: req.body,
        moduleId: req.params.moduleId
      });

      const { title, type, description, url } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const module = await Module.findById(req.params.moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      let fileUrl = url;
      let cloudinaryPublicId = null;

      if (req.file) {
        // Only PDFs are allowed (enforced by multer)
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;
        
        if (!cloudName || !apiKey || !apiSecret) {
          console.error('Cloudinary not configured. Missing:', {
            cloud_name: !cloudName,
            api_key: !apiKey,
            api_secret: !apiSecret
          });
          return res.status(400).json({ 
            message: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
          });
        }
        
        if (!ensureCloudinaryConfig()) {
          return res.status(500).json({ 
            message: 'Cloudinary configuration failed. Please check your .env file and restart the server.' 
          });
        }

        try {
          console.log('Uploading PDF to Cloudinary:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          });
          
          const result = await uploadToCloudinary(req.file);
          fileUrl = normalizePdfUrl(result.secure_url);
          cloudinaryPublicId = result.public_id;

          console.log('Upload successful (raw PDF):', fileUrl);
        } catch (err) {
          console.error('Cloudinary upload error:', err);
          return res.status(500).json({ 
            message: `Failed to upload file to Cloudinary: ${err.message || 'Unknown error'}`
          });
        }
      } else if (!url) {
        return res.status(400).json({ message: 'Please provide a PDF file or a PDF URL' });
      } else {
        // URL provided: ensure it's a PDF URL
        const lowerUrl = url.toLowerCase();
        if (!lowerUrl.endsWith('.pdf')) {
          return res.status(400).json({ message: 'Only PDF URLs are allowed' });
        }
      }

      if (!fileUrl) {
        return res.status(400).json({ message: 'No file URL or URL provided' });
      }

      // Enforce PDFs only
      const materialType = 'pdf';

      // Ensure title has .pdf extension
      let materialTitle = title;
      if (!materialTitle.toLowerCase().endsWith('.pdf')) {
        materialTitle += '.pdf';
      }

      const material = await ReferenceMaterial.create({
        module: module._id,
        title: materialTitle,
        type: materialType,
        url: normalizePdfUrl(fileUrl),
        cloudinaryPublicId,
        originalFilename: req.file ? req.file.originalname : null,
        description: description || '',
        uploadedBy: req.user._id,
      });

      console.log('Material created successfully:', material._id);
      res.status(201).json(material);
    } catch (err) {
      console.error('Upload material error:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({ 
        message: 'Failed to upload material',
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

// Get reference materials for a module
router.get('/modules/:moduleId/materials', authRequired, async (req, res) => {
  try {
    const materials = await ReferenceMaterial.find({ module: req.params.moduleId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    
    // Fix URLs for PDFs (ensure raw path only)
    const materialsWithFixedUrls = materials.map(material => {
      // Only PDFs are supported now
      if (material.url.includes('cloudinary.com')) {
        const fixedUrl = normalizePdfUrl(material.url);
        return { ...material.toObject(), url: fixedUrl };
      }
      return material.toObject();
    });
    
    res.json(materialsWithFixedUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load materials' });
  }
});

// Get all reference materials (for participants home)
router.get('/modules/materials', authRequired, async (req, res) => {
  try {
    const materials = await ReferenceMaterial.find({})
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    const materialsWithFixedUrls = materials.map(material => {
      if (material.url.includes('cloudinary.com')) {
        const fixedUrl = normalizePdfUrl(material.url);
        return { ...material.toObject(), url: fixedUrl };
      }
      return material.toObject();
    });

    res.json(materialsWithFixedUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load materials' });
  }
});

// Delete reference material
router.delete('/admin/materials/:materialId', authRequired, adminRequired, async (req, res) => {
  try {
    const material = await ReferenceMaterial.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Delete from Cloudinary if exists
    if (material.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    await ReferenceMaterial.findByIdAndDelete(req.params.materialId);
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete material' });
  }
});

// Download material with proper headers (proxy endpoint)
router.get('/modules/materials/:materialId/download', authRequired, async (req, res) => {
  try {
    const material = await ReferenceMaterial.findById(req.params.materialId);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Determine filename - make sure it has .pdf extension
    let filename = material.originalFilename || material.title || 'document.pdf';
    // Remove any existing .pdf and add it back to ensure it's there
    filename = filename.replace(/\.pdf$/i, '') + '.pdf';
    
    // Clean the filename
    filename = filename.replace(/[^\w\s.-]/g, '_');

    // For Cloudinary URLs, fetch and stream with proper headers
    if (material.url && material.url.includes('cloudinary.com')) {
      const https = await import('https');
      
      https.default.get(material.url, (cloudinaryResponse) => {
        // Set headers to force download with proper PDF filename
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', cloudinaryResponse.headers['content-length']);
        
        // Pipe the Cloudinary response directly to client
        cloudinaryResponse.pipe(res);
      }).on('error', (err) => {
        console.error('Error fetching from Cloudinary:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to download file from storage' });
        }
      });
    } else {
      // For external URLs, redirect directly
      res.redirect(material.url);
    }
  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to download material' });
    }
  }
});

// Get overall leaderboard across all modules (MUST come before /:moduleId route)
router.get('/admin/leaderboard/all', authRequired, adminRequired, async (req, res) => {
  try {
    // Get all submissions across all modules
    const submissions = await Submission.find({})
      .populate('user', 'name email subjects classes phone age');
    
    // Aggregate scores by user
    const userScores = {};
    submissions.forEach(sub => {
      if (!sub.user) return;
      
      const userId = sub.user._id.toString();
      if (!userScores[userId]) {
        userScores[userId] = {
          userId,
          userName: sub.user.name,
          userEmail: sub.user.email,
          totalScore: 0,
          quizzesTaken: 0
        };
      }
      
      userScores[userId].totalScore += sub.totalScore;
      userScores[userId].quizzesTaken += 1;
    });
    
    // Convert to array and sort by total score (descending)
    const leaderboard = Object.values(userScores)
      .map(user => ({
        ...user,
        averageScore: user.quizzesTaken > 0 ? user.totalScore / user.quizzesTaken : 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    res.json(leaderboard);
  } catch (err) {
    console.error('Overall leaderboard error:', err);
    res.status(500).json({ message: 'Failed to load overall leaderboard' });
  }
});

// Get leaderboard for a module (all participants ranked by total score)
router.get('/admin/leaderboard/:moduleId', authRequired, adminRequired, async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    // Get all quiz days for this module
    const quizDays = await QuizDay.find({ module: moduleId });
    const quizDayIds = quizDays.map(day => day._id);
    
    // Get all submissions for these quiz days
    const submissions = await Submission.find({ 
      quizDay: { $in: quizDayIds } 
    }).populate('user', 'name email subjects classes phone age');
    
    // Aggregate scores by user
    const userScores = {};
    submissions.forEach(sub => {
      if (!sub.user) return;
      
      const userId = sub.user._id.toString();
      if (!userScores[userId]) {
        userScores[userId] = {
          userId,
          userName: sub.user.name,
          userEmail: sub.user.email,
          totalScore: 0,
          quizzesTaken: 0,
          submissions: []
        };
      }
      
      userScores[userId].totalScore += sub.totalScore;
      userScores[userId].quizzesTaken += 1;
    });
    
    // Convert to array and sort by total score (descending)
    const leaderboard = Object.values(userScores)
      .map(user => ({
        ...user,
        averageScore: user.quizzesTaken > 0 ? user.totalScore / user.quizzesTaken : 0
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

// Get participant profile with quiz history
router.get('/admin/participant-profile/:userId', authRequired, adminRequired, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user details
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all submissions for this user with quizDay details including resultsPublished
    const submissions = await Submission.find({ user: userId })
      .populate('quizDay', 'dateLabel resultsPublished')
      .sort({ createdAt: -1 });
    
    res.json({
      ...user.toObject(),
      submissions
    });
  } catch (err) {
    console.error('Participant profile error:', err);
    res.status(500).json({ message: 'Failed to load participant profile' });
  }
});

export default router;

