import express from 'express';
import QuizDay from '../models/QuizDay.js';
import Question from '../models/Question.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = express.Router();

// Get all published quiz days for participants (home page)
router.get('/quiz-days/all', authRequired, async (req, res) => {
  try {
    const days = await QuizDay.find({ isPublished: true })
      .populate('module', 'name')
      .sort({ createdAt: -1 });
    
    // Add acceptingResponses field based on responsesOpen
    const daysWithStatus = days.map(day => ({
      ...day.toObject(),
      acceptingResponses: day.responsesOpen !== false
    }));
    
    res.json(daysWithStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quiz days' });
  }
});

// Get published quiz days for a specific module
router.get('/quiz-days/module/:moduleId', authRequired, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const days = await QuizDay.find({ 
      module: moduleId,
      isPublished: true 
    })
      .populate('module', 'name')
      .sort({ createdAt: -1 });
    
    // Add acceptingResponses field based on responsesOpen
    const daysWithStatus = days.map(day => ({
      ...day.toObject(),
      acceptingResponses: day.responsesOpen !== false
    }));
    
    res.json(daysWithStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quiz days for module' });
  }
});

// Admin: create or update a quiz day
router.post('/admin/quiz-days', authRequired, adminRequired, async (req, res) => {
  try {
    const { id, moduleId, dateLabel, isActive } = req.body;
    let quizDay;
    if (id) {
      quizDay = await QuizDay.findByIdAndUpdate(
        id,
        { dateLabel, isActive },
        { new: true }
      );
    } else {
      if (!moduleId) {
        return res.status(400).json({ message: 'Module ID is required' });
      }
      quizDay = await QuizDay.create({ 
        module: moduleId,
        dateLabel, 
        isActive: isActive !== undefined ? isActive : true,
        isPublished: false,
        responsesOpen: true,
      });
    }
    res.json(quizDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save quiz day' });
  }
});

// Admin: list quiz days (with optional module filter)
router.get('/admin/quiz-days', authRequired, adminRequired, async (req, res) => {
  try {
    const { moduleId } = req.query;
    const query = moduleId ? { module: moduleId } : {};
    const days = await QuizDay.find(query)
      .populate('module', 'name')
      .sort({ createdAt: -1 });
    res.json(days);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quiz days' });
  }
});

// Admin: create a question
router.post('/admin/questions', authRequired, adminRequired, async (req, res) => {
  try {
    const { 
      quizDayId, 
      text, 
      questionType = 'mcq',
      options, 
      correctIndex,
      correctAnswer1,
      correctAnswer2,
      referenceType = 'none',
      referencePdfUrl = '',
      referencePdfPublicId = '',
      referenceUrl = '',
      referenceTitle = ''
    } = req.body;
    
    const questionData = {
      quizDay: quizDayId,
      text,
      questionType,
      referenceType,
      referencePdfUrl,
      referencePdfPublicId,
      referenceUrl,
      referenceTitle,
    };

    // Add type-specific fields
    if (questionType === 'mcq') {
      questionData.options = options;
      questionData.correctIndex = correctIndex;
    } else if (questionType === 'fillblank') {
      questionData.correctAnswer1 = correctAnswer1;
      questionData.correctAnswer2 = correctAnswer2;
    }
    
    const q = await Question.create(questionData);
    res.status(201).json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create question' });
  }
});

// Helper function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// User: get questions for a quiz day (only published quizzes)
router.get('/quiz', authRequired, async (req, res) => {
  try {
    const { quizDayId } = req.query;
    let quizDay;
    if (quizDayId) {
      quizDay = await QuizDay.findOne({ 
        _id: quizDayId, 
        isPublished: true,
        isActive: true 
      });
    } else {
      quizDay = await QuizDay.findOne({ 
        isPublished: true,
        isActive: true 
      }).sort({ createdAt: -1 });
    }
    if (!quizDay) {
      return res.status(404).json({ message: 'No published quiz found' });
    }
    
    // Populate module
    await quizDay.populate('module');
    
    const questions = await Question.find({ quizDay: quizDay._id }).lean();
    
    // Shuffle options for MCQ questions only
    const questionsWithShuffledOptions = questions.map((q) => {
      if (q.questionType === 'fillblank') {
        // Return fill-blank questions as-is
        return q;
      }
      
      // Shuffle MCQ options
      const originalOptions = [...q.options];
      const originalCorrectIndex = q.correctIndex;
      const shuffledOptions = shuffleArray(originalOptions);
      // Find where the correct answer moved to after shuffling
      const correctAnswer = originalOptions[originalCorrectIndex];
      const newCorrectIndex = shuffledOptions.findIndex(opt => opt === correctAnswer);
      
      return {
        ...q,
        options: shuffledOptions,
        correctIndex: newCorrectIndex, // Update to new position after shuffle
      };
    });
    
    // Check for existing submission
    const submission = await Submission.findOne({
      user: req.user._id,
      quizDay: quizDay._id,
    }).populate('answers.question');
    
    res.json({ quizDay, questions: questionsWithShuffledOptions, submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load quiz' });
  }
});

// User: submit or update answers
router.post('/quiz/submit', authRequired, async (req, res) => {
  try {
    const { quizDayId, answers, timeTakenSeconds } = req.body;
    const quizDay = await QuizDay.findById(quizDayId);
    if (!quizDay) {
      return res.status(400).json({ message: 'Invalid quiz day' });
    }

    // Check if responses are still open
    if (!quizDay.responsesOpen) {
      return res.status(403).json({ message: 'Responses are closed for this quiz' });
    }

    // Check if quiz is published
    if (!quizDay.isPublished) {
      return res.status(403).json({ message: 'Quiz is not published' });
    }

    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let sectionScores = { Quran: 0, Seerat: 0 };
    let totalScore = 0;
    const answerDocs = answers.map((a) => {
      const q = questionMap.get(a.questionId);
      if (!q) return null;
      
      let isCorrect = false;
      let answerDoc = {
        question: q._id,
        isCorrect: false,
      };
      
      if (q.questionType === 'fillblank') {
        // Check fill-blank answer (both must be correct)
        isCorrect = a.userAnswer1?.trim() === q.correctAnswer1 && 
                   a.userAnswer2?.trim() === q.correctAnswer2;
        answerDoc.userAnswer1 = a.userAnswer1 || '';
        answerDoc.userAnswer2 = a.userAnswer2 || '';
        answerDoc.isCorrect = isCorrect;
      } else {
        // MCQ answer
        isCorrect = a.selectedIndex === q.correctIndex;
        answerDoc.selectedIndex = a.selectedIndex;
        answerDoc.isCorrect = isCorrect;
      }
      
      if (isCorrect) {
        sectionScores[q.section] += 1;
        totalScore += 1;
      }
      
      return answerDoc;
    }).filter(Boolean);

    // Check if submission already exists
    let submission = await Submission.findOne({
      user: req.user._id,
      quizDay: quizDay._id,
    });

    if (submission) {
      // Update existing submission
      submission.answers = answerDocs;
      submission.sectionScores = sectionScores;
      submission.totalScore = totalScore;
      submission.timeTakenSeconds = timeTakenSeconds || submission.timeTakenSeconds;
      submission.lastUpdated = new Date();
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        user: req.user._id,
        quizDay: quizDay._id,
        answers: answerDocs,
        sectionScores,
        totalScore,
        timeTakenSeconds: timeTakenSeconds || 0,
        lastUpdated: new Date(),
      });
    }

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// User: previous quiz data (profile view)
router.get('/me/submissions', authRequired, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate('quizDay', 'dateLabel resultsPublished')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load submissions' });
  }
});

// Admin: get participants for a specific quiz day
router.get('/admin/participants/:quizDayId', authRequired, adminRequired, async (req, res) => {
  try {
    const { quizDayId } = req.params;
    const submissions = await Submission.find({ quizDay: quizDayId })
      .populate('user', 'name email')
      .sort({ totalScore: -1, timeTakenSeconds: 1 });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load participants' });
  }
});

// Admin: leaderboard (overall or for a specific quiz day)
router.get('/admin/leaderboard', authRequired, adminRequired, async (req, res) => {
  try {
    const { quizDayId } = req.query;
    
    let query = {};
    if (quizDayId) {
      query.quizDay = quizDayId;
    }
    
    // Aggregate to get total scores per user across all days (or specific day)
    const leaderboard = await Submission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$totalScore' },
          totalTime: { $sum: '$timeTakenSeconds' },
          submissionCount: { $sum: 1 }
        }
      },
      { $sort: { totalScore: -1, totalTime: 1 } },
      { $limit: 100 }
    ]);
    
    // Populate user details
    const userIds = leaderboard.map(item => item._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    const leaderboardWithUsers = leaderboard.map(item => ({
      _id: item._id,
      name: userMap.get(item._id.toString())?.name || 'Unknown',
      email: userMap.get(item._id.toString())?.email || '',
      totalScore: item.totalScore,
      totalTime: item.totalTime,
      submissionCount: item.submissionCount
    }));
    
    res.json(leaderboardWithUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

export default router;


