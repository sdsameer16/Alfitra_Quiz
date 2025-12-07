// client/src/components/ResultsPage.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function ResultsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('qm_token');
      const res = await fetch(`${API_BASE}/me/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load submissions');
      setSubmissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading results...</div>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h1>Quiz Results</h1>
      
      {submissions.length === 0 && (
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>No quiz submissions yet.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
        {submissions.map((submission) => (
          <div 
            key={submission._id} 
            className="card"
            style={{
              padding: '1.5rem',
              borderRadius: '8px',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{submission.quizDay?.dateLabel}</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  Submitted: {new Date(submission.lastUpdated).toLocaleString()}
                </p>
              </div>
              
              {submission.quizDay?.resultsPublished ? (
                <div style={{ 
                  textAlign: 'right',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {submission.totalScore}
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                    Total Score
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '6px',
                  minWidth: '200px'
                }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🔒</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    Waiting for Admin
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                    Results not published yet
                  </div>
                </div>
              )}
            </div>

            {submission.quizDay?.resultsPublished && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ 
                  padding: '0.75rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                    Quran Section
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                    {submission.sectionScores?.Quran || 0}
                  </div>
                </div>
                
                <div style={{ 
                  padding: '0.75rem',
                  backgroundColor: '#fce7f3',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#9f1239', marginBottom: '0.25rem' }}>
                    Seerat Section
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#881337' }}>
                    {submission.sectionScores?.Seerat || 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
