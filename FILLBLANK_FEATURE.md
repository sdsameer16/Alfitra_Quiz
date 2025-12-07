# Fill-in-the-Blank Question Feature

## Overview
Added a new question type "Fill in the Blanks" that allows participants to answer by entering two numeric values (Surah number and Ayat number). Both answers must be correct to earn marks.

## Changes Made

### 1. Database Models

#### Question Model (`server/models/Question.js`)
- Added `questionType` field with enum values: `'mcq'`, `'fillblank'` (default: `'mcq'`)
- Made `options` and `correctIndex` optional (only required for MCQ)
- Added two new fields:
  - `correctAnswer1`: Stores the correct Surah number
  - `correctAnswer2`: Stores the correct Ayat number

#### Submission Model (`server/models/Submission.js`)
- Made `selectedIndex` optional (only used for MCQ)
- Added two new fields in the answers array:
  - `userAnswer1`: User's Surah number answer
  - `userAnswer2`: User's Ayat number answer

### 2. Backend Routes

#### Question Creation (`server/routes/quiz.js`)
**POST `/admin/questions`**
- Updated to accept `questionType` parameter
- Conditionally stores either MCQ data (options, correctIndex) or fill-blank data (correctAnswer1, correctAnswer2)
- Validates and saves based on question type

#### Quiz Retrieval (`server/routes/quiz.js`)
**GET `/quiz`**
- Updated option shuffling logic to skip fill-blank questions (they don't have options)
- Only shuffles MCQ questions

#### Submission Evaluation (`server/routes/quiz.js`)
**POST `/quiz/submit`**
- Updated to handle both MCQ and fill-blank answers
- For fill-blank: checks if both `userAnswer1` and `userAnswer2` match `correctAnswer1` and `correctAnswer2`
- For MCQ: checks if `selectedIndex` matches `correctIndex`
- Awards marks only when both fill-blank answers are correct

### 3. Admin Interface

#### AdminPage Component (`client/src/components/AdminPage.jsx`)

**State Variables Added:**
- `questionType`: Tracks selected question type ('mcq' or 'fillblank')
- `correctAnswer1`: Stores Surah number for fill-blank questions
- `correctAnswer2`: Stores Ayat number for fill-blank questions
- `answer1Error`: Validation error message for answer1
- `answer2Error`: Validation error message for answer2

**UI Components:**
1. **Question Type Dropdown**
   - Allows admin to select between "Multiple Choice (MCQ)" and "Fill in the Blanks"
   - Default: MCQ

2. **Conditional Rendering**
   - Shows MCQ options when type is 'mcq'
   - Shows two number-only input fields when type is 'fillblank'

3. **Input Validation**
   - Real-time validation using regex `/^\d+$/`
   - Only allows numeric input (no alphabets or spaces)
   - Displays error message if non-numeric input is attempted

4. **Form Submission**
   - Updated `handleAddQuestion` to validate based on question type
   - For MCQ: validates options array
   - For fill-blank: validates both answers are numeric and non-empty
   - Sends appropriate data structure to backend

### 4. Quiz Interface

#### QuizPage Component (`client/src/components/QuizPage.jsx`)

**State Variables Added:**
- `fillBlankAnswers`: Object storing fill-blank responses `{questionId: {answer1, answer2}}`

**Functions Added:**
- `handleFillBlankChange(qid, field, value)`: 
  - Handles input changes for fill-blank fields
  - Validates input is numeric only
  - Updates state with user's answers

**UI Rendering:**
1. **Conditional Question Display**
   - Detects `questionType` property on each question
   - Renders fill-blank inputs for `questionType === 'fillblank'`
   - Renders MCQ options for other types

2. **Fill-blank Input Fields**
   - Two side-by-side input fields
   - Labels: "Surah Number" and "Ayat Number"
   - Styled with proper spacing and borders
   - Disabled when responses are closed

3. **Answer Tracking**
   - Loads existing fill-blank answers from previous submissions
   - Combines MCQ and fill-blank answers when calculating progress
   - Counts fill-blank as answered only when both fields have values

4. **Submission**
   - Updated `handleSave` to combine MCQ and fill-blank answers
   - Sends both answer types in the correct format to backend

### 5. Styling

#### CSS Updates (`client/src/App.css`)

**New Classes:**
- `.fillblank-inputs`: Container for fill-blank input fields
- `.fillblank-field`: Individual field wrapper
- `.error-text`: Error message styling
- Admin-specific styles for better visual separation

**Features:**
- Responsive design (stacks vertically on mobile)
- Focus states with blue border
- Disabled state styling
- Smooth transitions

## Validation Rules

### Admin Side:
1. Question text is required
2. For fill-blank questions:
   - Both Surah and Ayat numbers must be provided
   - Must contain only numeric characters (validated with `/^\d+$/`)
   - No alphabets, spaces, or special characters allowed
   - Real-time validation with error messages

### Participant Side:
1. Only numeric input accepted
2. Both fields must be filled to count as answered
3. Input validation prevents non-numeric characters
4. Cannot submit partial answers

## Scoring Logic

**Fill-in-the-Blank Questions:**
- **1 mark** awarded ONLY if BOTH answers are correct
- **0 marks** if either answer is incorrect or missing
- String comparison is exact (trim applied)
- Case-sensitive matching

**Example:**
```
Question: "Which Surah and Ayat mentions the night of power?"
Correct Answer: Surah = "97", Ayat = "1"

User Answer 1: Surah = "97", Ayat = "1" → ✓ Correct (1 mark)
User Answer 2: Surah = "97", Ayat = "2" → ✗ Incorrect (0 marks)
User Answer 3: Surah = "96", Ayat = "1" → ✗ Incorrect (0 marks)
```

## How to Use

### For Admins:
1. Navigate to Admin Page
2. Select a quiz day
3. Choose "Fill in the Blanks" from the question type dropdown
4. Enter the question text
5. Enter the correct Surah number (numbers only)
6. Enter the correct Ayat number (numbers only)
7. Optionally add reference materials (PDF or URL)
8. Click "Add Question"

### For Participants:
1. Navigate to Quiz Page
2. View fill-blank questions with two input fields
3. Enter Surah number in the first field
4. Enter Ayat number in the second field
5. Save answers (can update until responses close)
6. Submit quiz when ready

## Technical Implementation Details

### Data Flow:

**Question Creation:**
```
Admin UI → Validation → POST /admin/questions → Question.create() → Database
```

**Quiz Taking:**
```
Database → GET /quiz → Shuffle (MCQ only) → Quiz UI → User Input → State Management
```

**Submission:**
```
User Input → Validation → POST /quiz/submit → Evaluation Logic → Score Calculation → Database
```

### Database Schema:

**Question Document (Fill-blank):**
```javascript
{
  _id: ObjectId,
  quizDay: ObjectId,
  text: "Question text",
  questionType: "fillblank",
  correctAnswer1: "97",  // Surah number
  correctAnswer2: "1",   // Ayat number
  section: "Quran",
  referenceType: "pdf",
  // ... other reference fields
}
```

**Submission Answer (Fill-blank):**
```javascript
{
  question: ObjectId,
  userAnswer1: "97",
  userAnswer2: "1",
  isCorrect: true
}
```

## Testing Checklist

- [x] Database schemas updated
- [x] Backend routes handle both question types
- [x] Admin can create fill-blank questions
- [x] Number-only validation works
- [x] Quiz page displays fill-blank inputs
- [x] Participants can answer fill-blank questions
- [x] Submission evaluates both answers correctly
- [x] Progress tracking includes fill-blank answers
- [x] Existing MCQ functionality unaffected
- [x] Mobile responsive styling

## Future Enhancements (Optional)

1. Allow single-field fill-blank questions
2. Add support for text-based fill-blank (not just numbers)
3. Case-insensitive matching option
4. Partial credit for one correct answer
5. Multiple fill-blank fields in one question
6. Auto-complete suggestions for common Surahs

## Compatibility

- Fully backward compatible with existing MCQ questions
- Default question type remains MCQ
- Existing submissions remain unaffected
- No migration required for existing data
