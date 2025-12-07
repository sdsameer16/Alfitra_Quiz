// client/src/components/LeaderboardPage.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://alfitra-quiz.onrender.com/api';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantProfile, setShowParticipantProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const token = localStorage.getItem('qm_token');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/leaderboard/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(Array.isArray(data) ? data : []);
      } else {
        setError(data.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantProfile = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/participant-profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedParticipant(data);
        setShowParticipantProfile(true);
      } else {
        setError(data.message || 'Failed to load participant profile');
      }
    } catch (err) {
      console.error('Error loading participant profile:', err);
      setError('Failed to load participant profile');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading leaderboard...</div>;
  }
  
  // Filter leaderboard based on selected section
  const filteredLeaderboard = leaderboard
    .map(entry => {
      if (filter === 'All') {
        return entry; // Show totalScore
      } else if (filter === 'Quran') {
        return {
          ...entry,
          totalScore: entry.sectionScores?.Quran || 0
        };
      } else if (filter === 'Seerat') {
        return {
          ...entry,
          totalScore: entry.sectionScores?.Seerat || 0
        };
      }
      return entry;
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Leaderboard</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            borderRadius: '6px',
            border: '2px solid #e5e7eb',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="All">Combined (Quran + Seerat)</option>
          <option value="Quran">Quran Only</option>
          <option value="Seerat">Seerat Only</option>
        </select>
      </div>
      
      {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
      
      {filteredLeaderboard.length === 0 ? (
        <div className="card" style={{ 
          padding: '3rem', 
          textAlign: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
            No participants yet. Leaderboard will appear once quizzes are completed.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#1f2937',
                  color: 'white'
                }}>
                  <th style={{ padding: '1rem', textAlign: 'center', width: '80px' }}>Rank</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Total Score</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Quizzes</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Average</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((participant) => (
                  <tr 
                    key={participant.userId}
                    style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      backgroundColor: participant.rank <= 3 ? '#fef3c7' : 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = participant.rank <= 3 ? '#fef3c7' : 'white';
                    }}
                    onClick={() => loadParticipantProfile(participant.userId)}
                  >
                    <td style={{ 
                      padding: '1rem', 
                      fontSize: '2rem', 
                      textAlign: 'center'
                    }}>
                      {participant.rank === 1 && '🥇'}
                      {participant.rank === 2 && '🥈'}
                      {participant.rank === 3 && '🥉'}
                      {participant.rank > 3 && (
                        <span style={{ 
                          color: '#6b7280', 
                          fontSize: '1.2rem',
                          fontWeight: '600'
                        }}>
                          {participant.rank}
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '1rem',
                      fontWeight: participant.rank <= 3 ? '700' : '500',
                      fontSize: participant.rank <= 3 ? '1.1rem' : '1rem',
                      color: participant.rank <= 3 ? '#1f2937' : '#374151'
                    }}>
                      {participant.userName}
                      {participant.rank <= 3 && (
                        <span style={{ 
                          marginLeft: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#92400e',
                          fontWeight: 'normal'
                        }}>
                          TOP {participant.rank}
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: '1.25rem',
                      color: participant.rank === 1 ? '#d97706' : participant.rank === 2 ? '#6b7280' : participant.rank === 3 ? '#92400e' : '#10b981'
                    }}>
                      {participant.totalScore}
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '1rem'
                    }}>
                      {participant.quizzesTaken}
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '1rem'
                    }}>
                      {participant.averageScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participant Profile Modal */}
      {showParticipantProfile && selectedParticipant && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }} 
          onClick={() => setShowParticipantProfile(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Participant Profile</h2>
              <button 
                onClick={() => setShowParticipantProfile(false)}
                style={{ 
                  fontSize: '2rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: 1,
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gap: '1rem',
              backgroundColor: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Name:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Email:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Subjects:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.subjects || 'Not set'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Classes:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.classes || 'Not set'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Phone:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.phone || 'Not set'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Age:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.age || 'Not set'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Qualification:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.qualification || 'Not set'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem' }}>
                <strong style={{ color: '#6b7280' }}>Teacher ID:</strong>
                <span style={{ color: '#1f2937' }}>{selectedParticipant.teacherId || 'Not set'}</span>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Quiz History</h3>
              {selectedParticipant.submissions && selectedParticipant.submissions.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {selectedParticipant.submissions.map((sub) => (
                    <div 
                      key={sub._id} 
                      style={{ 
                        padding: '1rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>
                        {sub.quizDay?.dateLabel}
                      </span>
                      {sub.quizDay?.resultsPublished ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            Quran: <strong>{sub.sectionScores?.Quran || 0}</strong>
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            Seerat: <strong>{sub.sectionScores?.Seerat || 0}</strong>
                          </span>
                          <span style={{ 
                            fontWeight: '700', 
                            color: '#10b981',
                            fontSize: '1rem',
                            minWidth: '60px',
                            textAlign: 'right'
                          }}>
                            {sub.totalScore}
                          </span>
                        </div>
                      ) : (
                        <span style={{ 
                          color: '#f59e0b', 
                          fontStyle: 'italic',
                          fontSize: '0.9rem'
                        }}>
                          Results Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                  No quiz submissions yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
