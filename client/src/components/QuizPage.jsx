import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://alfitra-quiz.onrender.com/api';

export default function QuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fillBlankAnswers, setFillBlankAnswers] = useState({}); // Store {questionId: {answer1, answer2}}
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [responsesOpen, setResponsesOpen] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [showMaterials, setShowMaterials] = useState(false);
  const [viewingReference, setViewingReference] = useState(null);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('qm_token');
        const res = await fetch(`${API_BASE}/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load quiz');
        setQuiz(data);
        
        // Load reference materials if module exists
        if (data.quizDay?.module) {
          loadMaterials(data.quizDay.module);
        }
        
        // Check if responses are open
        if (data.quizDay) {
          setResponsesOpen(data.quizDay.responsesOpen !== false);
        }
        
        // Load existing submission if available
        if (data.submission) {
          const existingAnswers = {};
          const existingFillBlank = {};
          data.submission.answers.forEach(ans => {
            if (ans.selectedIndex !== undefined && ans.selectedIndex !== null) {
              // MCQ answer
              existingAnswers[ans.question] = ans.selectedIndex;
            } else if (ans.userAnswer1 !== undefined && ans.userAnswer2 !== undefined) {
              // Fill-blank answer
              existingFillBlank[ans.question] = {
                answer1: ans.userAnswer1,
                answer2: ans.userAnswer2
              };
            }
          });
          setAnswers(existingAnswers);
          setFillBlankAnswers(existingFillBlank);
          setResult({
            sectionScores: data.submission.sectionScores,
            totalScore: data.submission.totalScore,
          });
        }
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  const loadMaterials = async (moduleId) => {
    try {
      const token = localStorage.getItem('qm_token');
      const res = await fetch(`${API_BASE}/modules/${moduleId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  const handleSelect = (qid, idx) => {
    if (!responsesOpen) {
      setError('Responses are closed. You cannot update your answers.');
      return;
    }
    setAnswers(prev => ({ ...prev, [qid]: idx }));
    setError('');
  };

  const handleFillBlankChange = (qid, field, value) => {
    if (!responsesOpen) {
      setError('Responses are closed. You cannot update your answers.');
      return;
    }
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }
    setFillBlankAnswers(prev => ({
      ...prev,
      [qid]: {
        ...prev[qid],
        [field]: value
      }
    }));
    setError('');
  };

  const handleSave = async () => {
    if (!quiz) return;
    if (!responsesOpen) {
      setError('Responses are closed. You cannot save your answers.');
      return;
    }
    
    setError('');
    try {
      const token = localStorage.getItem('qm_token');
      
      // Combine MCQ and fill-blank answers
      const answersList = [];
      
      // Add MCQ answers
      Object.entries(answers).forEach(([questionId, selectedIndex]) => {
        answersList.push({
          questionId,
          selectedIndex,
        });
      });
      
      // Add fill-blank answers
      Object.entries(fillBlankAnswers).forEach(([questionId, { answer1, answer2 }]) => {
        answersList.push({
          questionId,
          userAnswer1: answer1 || '',
          userAnswer2: answer2 || '',
        });
      });
      
      const payload = {
        quizDayId: quiz.quizDay._id,
        answers: answersList,
        timeTakenSeconds: 0, // No longer tracking time
      };
      
      const res = await fetch(`${API_BASE}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setResult(data);
      setSuccess('Answers saved successfully! You can update them until responses are closed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = async (materialId, title) => {
    try {
      const token = localStorage.getItem('qm_token');
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

  if (error && !quiz) {
    return (
      <div className="quiz-container">
        <p className="error">{error}</p>
        <button className="quiz-button" onClick={() => navigate('/profile')}>Back to Profile</button>
      </div>
    );
  }

  if (!quiz) {
    return <p>Loading quiz...</p>;
  }

  const allQuestions = quiz.questions || [];
  
  // Count total answered (MCQ + Fill-blank)
  const mcqAnswered = Object.keys(answers).length;
  const fillBlankAnswered = Object.entries(fillBlankAnswers).filter(([_, ans]) => 
    ans.answer1 && ans.answer2
  ).length;
  const totalAnswered = mcqAnswered + fillBlankAnswered;
  const allAnswered = totalAnswered === allQuestions.length;
  
  const handleDownloadReference = async (url, title) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download reference PDF');
    }
  };

  // Get section from quiz data
  const section = quiz?.quizDay?.module?.section;
  
  // Log section for debugging
  console.log('Quiz section:', section, 'Module:', quiz?.quizDay?.module);
  console.log('Background image will be:', 
    section === 'Quran' ? 'quarn.avif' : 
    section === 'Seerat' ? 'Seerat.jpg' : 
    'none (no section detected)');

  return (
    <div 
      className="quiz-container" 
      style={{
        backgroundImage: section === 'Quran' 
          ? 'url(/quarn.avif)' 
          : section === 'Seerat' 
          ? 'url(/Seerat.jpg)' 
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
        padding: '2rem'
      }}
    >
      {/* Reference PDF Modal */}
      {viewingReference && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            height: '90%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, color: '#111827' }}>{viewingReference.title}</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  {viewingReference.url}
                </p>
              </div>
              <button
                onClick={() => setViewingReference(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>
            {viewingReference.url ? (
              <iframe
                src={viewingReference.url}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: '0 0 12px 12px'
                }}
                title={viewingReference.title}
              />
            ) : (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#dc2626',
                padding: '2rem'
              }}>
                <p>Error: PDF URL is not available</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="quiz-header-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Quiz: {quiz.quizDay?.dateLabel}</h2>
          <div>
            {materials.length > 0 && (
              <button 
                className="quiz-button"
                onClick={() => setShowMaterials(!showMaterials)}
                style={{ marginRight: '0.5rem' }}
              >
                {showMaterials ? 'Hide' : 'Show'} Reference Materials ({materials.length})
              </button>
            )}
            <button className="quiz-button" onClick={() => navigate('/profile')}>Back to Profile</button>
          </div>
        </div>
        
        {!responsesOpen && (
          <div className="warning" style={{ 
            padding: '0.75rem', 
            backgroundColor: '#fef3c7', 
            color: '#92400e',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            ⚠️ Responses are closed. You can view your answers but cannot update them.
          </div>
        )}
      </div>

      {showMaterials && materials.length > 0 && (
        <div className="reference-materials" style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <h3>Reference Materials</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {materials.map((material) => (
              <div key={material._id} style={{ 
                padding: '0.75rem', 
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <strong>{material.title}</strong>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
                  {material.description}
                </p>
                <button 
                  onClick={() => handleDownload(material._id, material.title)}
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'underline',
                    fontSize: '0.875rem',
                    display: 'inline-block',
                    marginTop: '0.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Download PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quiz-progress" style={{ marginBottom: '1rem' }}>
        <strong>Total Progress:</strong> {totalAnswered} / {allQuestions.length} questions answered
      </div>
      
      {allQuestions.map((q, idx) => (
        <div key={q._id} className="question-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <p className="question-text" style={{ margin: 0, flex: 1 }}>
              {idx + 1}. {q.text}
            </p>
            {q.referenceType && q.referenceType !== 'none' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                {q.referenceType === 'pdf' && (
                  <>
                    <button
                      onClick={() => {
                        console.log('Opening PDF reference:', q.referencePdfUrl);
                        setViewingReference({ 
                          url: q.referencePdfUrl, 
                          title: q.referenceTitle || 'Reference' 
                        });
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📄 View PDF
                    </button>
                    <button
                      onClick={() => handleDownloadReference(q.referencePdfUrl, q.referenceTitle || 'Reference')}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                      title="Download PDF"
                    >
                      ⬇️
                    </button>
                  </>
                )}
                {q.referenceType === 'url' && (
                  <a
                    href={q.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🔗 {q.referenceTitle || 'Reference'}
                  </a>
                )}
              </div>
            )}
          </div>
          {q.questionType === 'fillblank' ? (
            <div className="fillblank-inputs" style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#374151' }}>
                  Surah Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Surah number"
                  value={fillBlankAnswers[q._id]?.answer1 || ''}
                  onChange={(e) => handleFillBlankChange(q._id, 'answer1', e.target.value)}
                  disabled={!responsesOpen}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#374151' }}>
                  Ayat Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Ayat number"
                  value={fillBlankAnswers[q._id]?.answer2 || ''}
                  onChange={(e) => handleFillBlankChange(q._id, 'answer2', e.target.value)}
                  disabled={!responsesOpen}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="options">
              {q.options && q.options.map((opt, i) => (
                <label key={i} className={`option ${answers[q._id] === i ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={q._id}
                    checked={answers[q._id] === i}
                    onChange={() => handleSelect(q._id, i)}
                    disabled={!responsesOpen}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button 
          onClick={handleSave} 
          className="submit-btn"
          disabled={!allAnswered || !responsesOpen}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: responsesOpen ? '#22c55e' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: responsesOpen && allAnswered ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {result ? 'Update Answers' : 'Save Answers'}
        </button>
        {!allAnswered && (
          <p style={{ color: '#dc2626', alignSelf: 'center' }}>
            Please answer all questions before saving
          </p>
        )}
      </div>
      
      {error && <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>}
      {success && <div className="success-message" style={{ marginTop: '1rem' }}>{success}</div>}
    </div>
  );
}
