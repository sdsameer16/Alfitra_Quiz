import { useState, useEffect } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const API_BASE = 'https://alfitra-quiz.onrender.com/api';

export default function AdminPage() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleSection, setModuleSection] = useState('Quran');
  
  const [days, setDays] = useState([]);
  const [dateLabel, setDateLabel] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [participants, setParticipants] = useState([]);
  
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [correctOption, setCorrectOption] = useState('');
  const [otherOptions, setOtherOptions] = useState(['', '', '']);
  const [correctAnswer1, setCorrectAnswer1] = useState('');
  const [correctAnswer2, setCorrectAnswer2] = useState('');
  const [answer1Error, setAnswer1Error] = useState('');
  const [answer2Error, setAnswer2Error] = useState('');
  const [referenceType, setReferenceType] = useState('none');
  const [referenceFile, setReferenceFile] = useState(null);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceTitle, setReferenceTitle] = useState('');
  
  const [materials, setMaterials] = useState([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('pdf');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialFile, setMaterialFile] = useState(null);
  
  const [evaluationData, setEvaluationData] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('qm_token');

  const loadModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/modules`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include'
      });
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading modules:', err);
      setError('Failed to load modules');
    }
  };

  const loadDays = async (moduleId) => {
    if (!moduleId) {
      setDays([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/quiz-days?moduleId=${moduleId}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include'
      });
      const data = await res.json();
      setDays(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading days:', err);
      setError('Failed to load quiz days');
      setDays([]);
    }
  };

  const loadMaterials = async (moduleId) => {
    if (!moduleId) return;
    try {
      const res = await fetch(`${API_BASE}/modules/${moduleId}/materials`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'include'
      });
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  const handleDownload = async (materialId, title) => {
    try {
      const response = await fetch(`${API_BASE}/modules/materials/${materialId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      loadDays(selectedModule);
      loadMaterials(selectedModule);
    } else {
      setDays([]);
      setMaterials([]);
    }
  }, [selectedModule]);

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: moduleName, 
          description: moduleDescription,
          section: moduleSection 
        }),
      });
      if (!res.ok) throw new Error('Failed to create module');
      setModuleName('');
      setModuleDescription('');
      setModuleSection('Quran');
      setSuccess('Module created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadModules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateDay = async (e) => {
    e.preventDefault();
    if (!selectedModule) {
      setError('Please select a module first');
      return;
    }
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/quiz-days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ moduleId: selectedModule, dateLabel }),
      });
      if (!res.ok) throw new Error('Failed to create quiz day');
      setDateLabel('');
      setSuccess('Quiz day created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadDays(selectedModule);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublish = async (quizDayId, isPublished) => {
    try {
      const res = await fetch(`${API_BASE}/admin/quiz-days/${quizDayId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished }),
      });
      if (!res.ok) throw new Error('Failed to update publish status');
      setSuccess(isPublished ? 'Quiz published!' : 'Quiz unpublished!');
      setTimeout(() => setSuccess(''), 3000);
      loadDays(selectedModule);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleResponses = async (quizDayId, responsesOpen) => {
    try {
      const res = await fetch(`${API_BASE}/admin/quiz-days/${quizDayId}/responses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responsesOpen }),
      });
      if (!res.ok) throw new Error('Failed to update responses status');
      setSuccess(responsesOpen ? 'Responses opened!' : 'Responses closed!');
      setTimeout(() => setSuccess(''), 3000);
      loadDays(selectedModule);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublishResults = async (quizDayId, resultsPublished) => {
    try {
      const res = await fetch(`${API_BASE}/admin/quiz-days/${quizDayId}/publish-results`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resultsPublished }),
      });
      if (!res.ok) throw new Error('Failed to update results status');
      setSuccess(resultsPublished ? 'Results published!' : 'Results unpublished!');
      setTimeout(() => setSuccess(''), 3000);
      loadDays(selectedModule);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedDay) {
      setError('Please select a quiz day first');
      return;
    }

    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    // Validate based on question type
    if (questionType === 'mcq') {
      if (!correctOption.trim()) {
        setError('Correct option is required for MCQ');
        return;
      }
      const allOptions = [correctOption, ...otherOptions.filter(opt => opt.trim())];
      if (allOptions.length < 2) {
        setError('At least 2 options are required for MCQ');
        return;
      }
    } else if (questionType === 'fillblank') {
      if (!correctAnswer1.trim()) {
        setError('Surah number is required');
        return;
      }
      if (!correctAnswer2.trim()) {
        setError('Ayat number is required');
        return;
      }
      if (!/^\d+$/.test(correctAnswer1.trim())) {
        setError('Surah number must contain only numbers');
        return;
      }
      if (!/^\d+$/.test(correctAnswer2.trim())) {
        setError('Ayat number must contain only numbers');
        return;
      }
    }

    try {
      setIsLoading(true);
      
      let referencePdfUrl = '';
      let referencePdfPublicId = '';
      
      // Upload reference PDF if provided
      if (referenceType === 'pdf' && referenceFile) {
        const formData = new FormData();
        formData.append('file', referenceFile);
        
        const uploadRes = await fetch(`${API_BASE}/admin/upload-reference`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload reference PDF');
        const uploadData = await uploadRes.json();
        referencePdfUrl = uploadData.url;
        referencePdfPublicId = uploadData.publicId;
      }

      // Prepare request body based on question type
      let requestBody = {
        quizDayId: selectedDay,
        text: questionText.trim(),
        questionType,
        referenceType,
        referencePdfUrl,
        referencePdfPublicId,
        referenceUrl: referenceType === 'url' ? referenceUrl : '',
        referenceTitle: (referenceType === 'pdf' || referenceType === 'url') ? referenceTitle : '',
      };

      if (questionType === 'mcq') {
        const allOptions = [correctOption, ...otherOptions.filter(opt => opt.trim())];
        requestBody.options = allOptions;
        requestBody.correctIndex = 0;
      } else if (questionType === 'fillblank') {
        requestBody.correctAnswer1 = correctAnswer1.trim();
        requestBody.correctAnswer2 = correctAnswer2.trim();
      }

      const res = await fetch(`${API_BASE}/admin/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add question');

      // Reset form
      setQuestionText('');
      setQuestionType('mcq');
      setCorrectOption('');
      setOtherOptions(['', '', '']);
      setCorrectAnswer1('');
      setCorrectAnswer2('');
      setAnswer1Error('');
      setAnswer2Error('');
      setReferenceType('none');
      setReferenceFile(null);
      setReferenceUrl('');
      setReferenceTitle('');
      setSuccess('Question added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!selectedModule) {
      setError('Please select a module first');
      return;
    }
    setError('');
    
    const formData = new FormData();
    formData.append('title', materialTitle);
    formData.append('type', materialType);
    formData.append('description', materialDescription);
    if (materialFile) {
      formData.append('file', materialFile);
    } else if (materialUrl) {
      formData.append('url', materialUrl);
    } else {
      setError('Please provide either a file or URL');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/modules/${selectedModule}/materials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to upload material');
      }
      
      setMaterialTitle('');
      setMaterialUrl('');
      setMaterialDescription('');
      setMaterialFile(null);
      setSuccess('Material uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      loadMaterials(selectedModule);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload material');
    }
  };

  const handleEvaluation = async () => {
    if (!selectedModule) {
      setError('Please select a module first');
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/admin/modules/${selectedModule}/evaluation`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load evaluation');
      const data = await res.json();
      setEvaluationData(data);
      setShowEvaluation(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = async (quizDayId) => {
    if (!quizDayId) {
      setParticipants([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/participants/${quizDayId}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (!res.ok) {
        setParticipants([]);
        return;
      }
      const data = await res.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading participants:', err);
      setParticipants([]);
    }
  };

  const handleAddOption = () => {
    setOtherOptions([...otherOptions, '']);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...otherOptions];
    newOptions[index] = value;
    setOtherOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    setOtherOptions(otherOptions.filter((_, i) => i !== index));
  };

  if (showEvaluation && evaluationData) {
    return (
      <div className="admin-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Evaluation: {evaluationData.module.name}</h2>
          <button onClick={() => setShowEvaluation(false)}>Back</button>
        </div>
        <div className="evaluation-stats">
          <p>Total Participants: {evaluationData.totalParticipants}</p>
          <p>Total Quiz Days: {evaluationData.quizDays.length}</p>
        </div>
        <div className="evaluation-results">
          <h3>Results</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Email</th>
                <th>Total Score</th>
                <th>Average %</th>
                <th>Quiz Days Completed</th>
              </tr>
            </thead>
            <tbody>
              {evaluationData.results.map((result, index) => (
                <tr key={result.user._id}>
                  <td>{index + 1}</td>
                  <td>{result.user.name}</td>
                  <td>{result.user.email}</td>
                  <td>{result.totalScore} / {result.totalQuestions}</td>
                  <td>{result.averageScore}%</td>
                  <td>{result.quizDaysCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>
      
      <div className="admin-section">
        <h3>Module Management</h3>
        <div className="card">
          <form onSubmit={handleCreateModule}>
            <select
              value={moduleSection}
              onChange={(e) => setModuleSection(e.target.value)}
              required
            >
              <option value="Quran">Quran</option>
              <option value="Seerat">Seerat</option>
            </select>
            <input
              type="text"
              placeholder="Module name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              required
            />
            <textarea
              placeholder="Module description"
              value={moduleDescription}
              onChange={(e) => setModuleDescription(e.target.value)}
            />
            <button type="submit">Create Module</button>
          </form>
        </div>
        
        <div className="card">
          <label>Select Module:</label>
          <select 
            value={selectedModule} 
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <option value="">Select a module</option>
            {modules.map((module) => (
              <option key={module._id} value={module._id}>
                {module.name}
              </option>
            ))}
          </select>
          {selectedModule && (
            <button onClick={handleEvaluation} style={{ marginTop: '1rem' }}>
              Evaluation
            </button>
          )}
        </div>
      </div>

      {selectedModule && (
        <>
          <div className="admin-section">
            <h3>Quiz Day Management</h3>
            <div className="card">
              <form onSubmit={handleCreateDay}>
                <input
                  type="text"
                  placeholder="Date label (e.g., 'Day 1', 'January 1, 2023')"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  required
                />
                <button type="submit">Create Quiz Day</button>
              </form>
            </div>

            <div className="card">
              <h4>Quiz Days</h4>
              {days.map((day) => (
                <div key={day._id} style={{ 
                  padding: '0.5rem', 
                  margin: '0.5rem 0', 
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{day.dateLabel}</span>
                  <div>
                    <button 
                      onClick={() => handlePublish(day._id, !day.isPublished)}
                      style={{ 
                        marginRight: '0.5rem',
                        backgroundColor: day.isPublished ? '#dc2626' : '#22c55e'
                      }}
                    >
                      {day.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      onClick={() => handleToggleResponses(day._id, !day.responsesOpen)}
                      style={{ 
                        marginRight: '0.5rem',
                        backgroundColor: day.responsesOpen ? '#dc2626' : '#22c55e'
                      }}
                    >
                      {day.responsesOpen ? 'Stop Responses' : 'Allow Responses'}
                    </button>
                    <button 
                      onClick={() => handlePublishResults(day._id, !day.resultsPublished)}
                      style={{ 
                        backgroundColor: day.resultsPublished ? '#f59e0b' : '#3b82f6'
                      }}
                    >
                      {day.resultsPublished ? 'Hide Results' : 'Publish Results'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#1f2937', mb: 2 }}>
              Add Questions
            </Typography>
            <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Box component="form" onSubmit={handleAddQuestion} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select Quiz Day</InputLabel>
                    <Select
                      value={selectedDay}
                      label="Select Quiz Day"
                      onChange={(e) => {
                        setSelectedDay(e.target.value);
                        loadParticipants(e.target.value);
                      }}
                    >
                      <MenuItem value="">Select a quiz day</MenuItem>
                      {days.map((day) => (
                        <MenuItem key={day._id} value={day._id}>
                          {day.dateLabel}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth disabled={!selectedDay}>
                    <InputLabel>Reference Type</InputLabel>
                    <Select
                      value={referenceType}
                      label="Reference Type"
                      onChange={(e) => setReferenceType(e.target.value)}
                    >
                      <MenuItem value="none">No Reference</MenuItem>
                      <MenuItem value="pdf">PDF Reference</MenuItem>
                      <MenuItem value="url">URL Reference</MenuItem>
                    </Select>
                  </FormControl>

                  {referenceType !== 'none' && (
                    <TextField
                      fullWidth
                      label="Reference Title"
                      placeholder="Enter reference title"
                      value={referenceTitle}
                      onChange={(e) => setReferenceTitle(e.target.value)}
                      disabled={!selectedDay}
                    />
                  )}

                  {referenceType === 'pdf' && (
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={!selectedDay}
                      sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.5 }}
                    >
                      {referenceFile ? referenceFile.name : 'Upload PDF Reference'}
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={(e) => setReferenceFile(e.target.files[0])}
                      />
                    </Button>
                  )}

                  {referenceType === 'url' && (
                    <TextField
                      fullWidth
                      label="Reference URL"
                      type="url"
                      placeholder="https://example.com"
                      value={referenceUrl}
                      onChange={(e) => setReferenceUrl(e.target.value)}
                      disabled={!selectedDay}
                    />
                  )}

                  <TextField
                    fullWidth
                    label="Question Text"
                    placeholder="Enter your question here"
                    multiline
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    disabled={!selectedDay}
                    required
                  />

                  <FormControl fullWidth disabled={!selectedDay}>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={questionType}
                      label="Question Type"
                      onChange={(e) => {
                        setQuestionType(e.target.value);
                        setAnswer1Error('');
                        setAnswer2Error('');
                      }}
                    >
                      <MenuItem value="mcq">Multiple Choice (MCQ)</MenuItem>
                      <MenuItem value="fillblank">Fill in the Blanks</MenuItem>
                    </Select>
                  </FormControl>

                  {questionType === 'mcq' ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Correct Answer"
                        placeholder="Enter the correct answer"
                        value={correctOption}
                        onChange={(e) => setCorrectOption(e.target.value)}
                        disabled={!selectedDay}
                        required
                        sx={{ mb: 2 }}
                      />

                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Incorrect Options
                      </Typography>
                      {otherOptions.map((opt, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                          <TextField
                            fullWidth
                            placeholder={`Incorrect option ${i + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(i, e.target.value)}
                            disabled={!selectedDay}
                            size="small"
                          />
                          {otherOptions.length > 1 && (
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveOption(i)}
                              disabled={!selectedDay}
                              sx={{ flexShrink: 0 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Box>
                      ))}

                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddOption}
                        disabled={!selectedDay || otherOptions.length >= 5}
                        sx={{ mt: 1 }}
                      >
                        Add Option
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Surah Number"
                            placeholder="Enter Surah number"
                            value={correctAnswer1}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                setCorrectAnswer1(value);
                                setAnswer1Error('');
                              } else {
                                setAnswer1Error('Only numbers are allowed');
                              }
                            }}
                            disabled={!selectedDay}
                            required
                            error={!!answer1Error}
                            helperText={answer1Error}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Ayat Number"
                            placeholder="Enter Ayat number"
                            value={correctAnswer2}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d+$/.test(value)) {
                                setCorrectAnswer2(value);
                                setAnswer2Error('');
                              } else {
                                setAnswer2Error('Only numbers are allowed');
                              }
                            }}
                            disabled={!selectedDay}
                            required
                            error={!!answer2Error}
                            helperText={answer2Error}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!selectedDay || !questionText.trim() || isLoading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      },
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Add Question'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </div>

          <div className="admin-section">
            <h3>Reference Materials</h3>
            <div className="card">
              <form onSubmit={handleUploadMaterial}>
                <input
                  type="text"
                  placeholder="PDF title"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  required
                />
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0.5rem' }}>
                  Only PDF uploads are allowed.
                </p>
                <input
                  type="file"
                  onChange={(e) => setMaterialFile(e.target.files[0])}
                  accept=".pdf"
                />
                <input
                  type="text"
                  placeholder="Or enter PDF URL"
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                />
                <button type="submit">Upload PDF</button>
              </form>
            </div>

            <div className="card">
              <h4>Uploaded Materials</h4>
              {materials.map((material) => (
                <div key={material._id} style={{ 
                  padding: '0.5rem', 
                  margin: '0.5rem 0', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}>
                  <strong>{material.title}</strong> ({material.type})
                  <p>{material.description}</p>
                  <button 
                    onClick={() => handleDownload(material._id, material.title)}
                    style={{ 
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3>Participants</h3>
            <div className="card">
              <select 
                value={selectedDay} 
                onChange={(e) => loadParticipants(e.target.value)}
              >
                <option value="">Select a quiz day</option>
                {days.map((day) => (
                  <option key={day._id} value={day._id}>
                    {day.dateLabel}
                  </option>
                ))}
              </select>
              
              {participants.length > 0 && (
                <div className="participants-list" style={{ marginTop: '1rem' }}>
                  <div className="participant-header">
                    <span>Name</span>
                    <span>Quran</span>
                    <span>Seerat</span>
                    <span>Total</span>
                  </div>
                  {participants.map((p) => (
                    <div key={p._id} className="participant-row">
                      <span>{p.user?.name || 'Unknown'}</span>
                      <span>{p.sectionScores?.Quran || 0}</span>
                      <span>{p.sectionScores?.Seerat || 0}</span>
                      <span>{p.totalScore || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mx: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2, mx: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
    </div>
  );
}
