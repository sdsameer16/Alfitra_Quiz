import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import moduleRoutes from './routes/modules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Verify required environment variables
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not defined in .env file');
  console.error('Please make sure .env file exists in the server folder with MONGO_URI set');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS with specific origin and credentials support
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://alfitra-quiz.onrender.com'], // Support both Vite ports and production
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS with options
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'QuizMernApp API running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', quizRoutes);
app.use('/api', moduleRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || 'quizmernapp',
    serverSelectionTimeoutMS: 10000, // Increased to 10s
    connectTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'quizmernapp'}`);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('\n❌ MongoDB connection error:', err.message);
    console.error('\n📋 Error details:');
    if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
      console.error('   → DNS/Network issue: Cannot resolve MongoDB Atlas hostname');
      console.error('   → This usually means:');
      console.error('     1. Your IP is not whitelisted in MongoDB Atlas');
      console.error('     2. Network firewall blocking the connection');
      console.error('     3. DNS resolution issues');
    } else if (err.message.includes('authentication failed')) {
      console.error('   → Authentication failed: Check username and password');
    } else if (err.message.includes('timeout')) {
      console.error('   → Connection timeout: Server might be unreachable');
    }
    
    console.error('\n💡 Step-by-step troubleshooting:');
    console.error('\n1. Check MongoDB Atlas Cluster Status:');
    console.error('   → Go to https://cloud.mongodb.com/');
    console.error('   → Check if cluster shows "Paused" - if so, click "Resume"');
    
    console.error('\n2. Whitelist Your IP Address:');
    console.error('   → Go to MongoDB Atlas → Network Access');
    console.error('   → Click "Add IP Address"');
    console.error('   → For testing: Add "0.0.0.0/0" (allows all IPs - NOT for production!)');
    console.error('   → Or add your current IP address');
    
    console.error('\n3. Verify Connection String:');
    console.error('   → Go to MongoDB Atlas → Clusters → Connect');
    console.error('   → Choose "Connect your application"');
    console.error('   → Copy the connection string and update .env file');
    
    console.error('\n4. Check Password Special Characters:');
    console.error('   → If password has @, #, %, etc., URL-encode them');
    console.error('   → @ becomes %40, # becomes %23, etc.');
    
    console.error(`\n📝 Current MONGO_URI: ${process.env.MONGO_URI?.replace(/:[^:@]+@/, ':****@')}`);
    console.error(`📝 DB_NAME: ${process.env.DB_NAME || 'quizmernapp'}`);
    console.error('\n⚠️  Server will not start until MongoDB connection is fixed.\n');
    process.exit(1);
  });


