// client/src/App.jsx
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import AdminPage from './components/AdminPage';
import ProfilePage from './components/ProfilePage';
import QuizPage from './components/QuizPage';
import ResultsPage from './components/ResultsPage';
import LeaderboardPage from './components/LeaderboardPage';

const API_BASE = 'https://alfitra-quiz.onrender.com/api';

function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('qm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const navigate = useNavigate();

  const saveAuth = (data, onSuccess = () => {}) => {
    localStorage.setItem('qm_token', data.token);
    localStorage.setItem('qm_user', JSON.stringify(data.user));
    setUser(data.user);
    onSuccess();
  };

  const logout = () => {
    localStorage.removeItem('qm_token');
    localStorage.removeItem('qm_user');
    setUser(null);
  };

  return { user, saveAuth, logout };
}

function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [theme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('qm_theme', 'light');
  }, []);

  useEffect(() => {
    // Close menu on route change
    setMenuOpen(false);
  }, [location.pathname]);

  const isQuizPage = location.pathname === '/quiz';

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className={`app-root ${isQuizPage ? 'quiz-page' : ''}`}>
      {!isQuizPage && (
        <>          
          <header className="app-header">
            <div className="left">
              <span className="logo-text">QuizMern</span>
            </div>
            <div className="center">
              {/* Timer and section buttons removed */}
            </div>
            
            {/* Hamburger Menu Button */}
            <button className="hamburger" onClick={handleMenuToggle} aria-label="Menu">
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div className={`right ${menuOpen ? 'mobile-menu-open' : ''}`}>
              {user?.role !== 'admin' && <Link to="/" onClick={closeMenu}>Home</Link>}
              {user?.role !== 'admin' && <Link to="/quiz" onClick={closeMenu}>Quiz</Link>}
              {user?.role !== 'admin' && <Link to="/results" onClick={closeMenu}>Results</Link>}
              <Link to="/profile" onClick={closeMenu}>Profile</Link>
              {user?.role === 'admin' && <Link to="/admin" onClick={closeMenu}>Admin</Link>}
              {user?.role === 'admin' && <Link to="/leaderboard" onClick={closeMenu}>Leaderboard</Link>}
              {user ? (
                <button onClick={() => { onLogout(); closeMenu(); }} className="link-button">
                  Logout
                </button>
              ) : (
                <Link to="/auth" onClick={closeMenu}>Login / Signup</Link>
              )}
            </div>
          </header>
        </>
      )}

      <main className="app-main">
        {children}
      </main>

      {!isQuizPage && (
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-left">
              <img src="/school_logo.jpeg" alt="School Logo" className="footer-logo" />
              <div className="footer-school-info">
                <h3>AL-FITRAH E.M HIGH SCHOOL</h3>
                <p>(Recognised by Government Of Andhra Pradesh)</p>
                <p>Chandole, 522311.</p>
                <p><strong>Director:</strong> Mr.Firoz (Ex-Navy)</p>
                <p><strong>For any contact or Support :</strong> <a href="mailto:alfitrah.quiz@gmail.com">alfitrah.quiz@gmail.com</a></p>
              </div>
            </div>
            <div className="footer-right">
              
              <img src="/webdevelopmentlogo.jpeg" alt="Company Logo" className="footer-logo" />
              <div className="footer-company-info">
                <h5
  style={{
    fontFamily: '"Edwardian Script ITC", cursive',
    fontSize: "28px",
    letterSpacing: "2px",
    padding:"none"
  }}
>
  This website is developed and maintained by
</h5>


                <h3>Wintage Developers</h3>
                <p><strong>Main Home Branch:</strong></p>
                <p>5-125, Rauoof Nagar, Near Andhra Muslim College,</p>
                <p>Guntur, 522003, India.</p>
                <p><strong>Website:</strong> <a href="https://www.wintagedevelopers.com" target="_blank" rel="noopener noreferrer">www.wintagedevelopers.com</a></p>
                <p><strong>Email:</strong> <a href="mailto:sdsameer1609@gmail.com">sdsameer1609@gmail.com</a></p>
                <p><strong>Contact:</strong> +917386055404</p>
                <p className="footer-tagline">"Crafting Digital Excellence, Swiftly"</p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Form submission started');

    // Client-side validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      console.error('Validation error:', errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const url = `${API_BASE}${endpoint}`;
      const requestBody = {
        email: formData.email,
        password: formData.password,
        ...(!isLogin && { name: formData.name }) // Only include name for registration
      };

      console.log('Making request to:', url);
      console.log('Request body:', requestBody);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log('Response status:', res.status);
      console.log('Response data:', data);

      if (!res.ok) {
        const errorMsg = data.message || `Authentication failed with status ${res.status}`;
        console.error('Server error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.token || !data.user) {
        const errorMsg = 'Invalid response from server';
        console.error('Invalid response format:', data);
        throw new Error(errorMsg);
      }

      console.log('Authentication successful, user:', data.user);
      
      // Call onAuth with the data and a callback to navigate
      onAuth(data, () => {
        console.log('Auth successful, navigating to /');
        navigate('/');
      });
      
    } catch (err) {
      console.error('Authentication error:', err);
      const errorMessage = err.message.includes('Failed to fetch') 
        ? 'Unable to connect to the server. Please check your internet connection.'
        : err.message || 'An error occurred during authentication';
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
          )}
          <button type="submit" className="btn-primary">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="link-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ user, children, adminOnly = false }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const { user, saveAuth, logout } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [quizDays, setQuizDays] = useState([]);
  const [quizDaysLoading, setQuizDaysLoading] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const loadMaterials = async () => {
      if (!user) return;
      setMaterialsError('');
      setMaterialsLoading(true);
      try {
        const token = localStorage.getItem('qm_token');
        const res = await fetch(`${API_BASE}/modules/materials`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load reference materials');
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        setMaterialsError(err.message);
        setMaterials([]);
      } finally {
        setMaterialsLoading(false);
      }
    };
    loadMaterials();
  }, [user]);

  useEffect(() => {
    const loadModules = async () => {
      if (!user || user.role === 'admin') return;
      try {
        const token = localStorage.getItem('qm_token');
        const res = await fetch(`${API_BASE}/modules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setModules(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error loading modules:', err);
      }
    };
    loadModules();
  }, [user]);

  useEffect(() => {
    const loadQuizDays = async () => {
      if (!selectedModule) {
        setQuizDays([]);
        return;
      }
      setQuizDaysLoading(true);
      try {
        const token = localStorage.getItem('qm_token');
        const res = await fetch(`${API_BASE}/quiz-days/module/${selectedModule._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setQuizDays(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error loading quiz days:', err);
      } finally {
        setQuizDaysLoading(false);
      }
    };
    loadQuizDays();
  }, [selectedModule]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout user={user} onLogout={logout}>
            <div className="home">
              {/* Umrah Marquee */}
              <div className="marquee-container">
                <marquee behavior="scroll" direction="left" scrollamount="5">
                  ✈️ 🕋 Answer the Quiz and Grab a chance to Umrah, For Al Fitrah Teachers 🕌 ✈️
                </marquee>
              </div>

              <h1 style={{ 
                color: '#3279ddff', 
                fontFamily: "'Edwardian Script ITC', 'Brush Script MT', 'Lucida Handwriting', cursive", 
                fontSize: '3.5rem',
                fontWeight: '700',
                textShadow: '3px 3px 6px rgba(0,0,0,0.4)',
                letterSpacing: '2px'
              }}>Marhaban to QuizMern</h1>
              {!user ? (
                <p>Please login to take the quiz.</p>
              ) : user.role === 'admin' ? (
                <div className="dashboard">
                  <h2 style={{ 
                    color: '#3279ddff', 
                    fontFamily: "'Edwardian Script ITC', 'Brush Script MT', 'Lucida Handwriting', cursive",
                    fontSize: '3rem',
                    fontWeight: '700',
                    textShadow: '3px 3px 6px rgba(0,0,0,0.4)',
                    letterSpacing: '1px'
                  }}>Assalamualikum, Principal {user.name}!</h2>
                  <p>Manage your modules, quizzes, and view evaluations from the Admin panel.</p>
                  <Link to="/admin" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    Go to Admin Panel
                  </Link>
                </div>
              ) : (
                <div className="dashboard">
                  <h2 style={{ 
                    color: '#3279ddff', 
                    fontFamily: "'Edwardian Script ITC', 'Brush Script MT', 'Lucida Handwriting', cursive",
                    fontSize: '3rem',
                    fontWeight: '700',
                    textShadow: '3px 3px 6px rgba(0,0,0,0.4)',
                    letterSpacing: '1px'
                  }}>Assalamualikum, {user.name}😊</h2>
                  <p>Ready to test your knowledge?</p>
                  
                  {/* Section Selection */}
                  {!selectedSection && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h3>Select a Section</h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '2rem',
                        marginTop: '1rem',
                        maxWidth: '800px',
                        margin: '1.5rem auto'
                      }}>
                        <div 
                          style={{ 
                            border: '3px solid #10b981', 
                            borderRadius: '16px', 
                            padding: '3rem 2rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                            textAlign: 'center'
                          }}
                          onClick={() => setSelectedSection('Quran')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                          }}
                        >
                          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
                          <div style={{ fontWeight: '700', fontSize: '2rem', marginBottom: '0.5rem' }}>
                            Quran
                          </div>
                          <div style={{ fontSize: '1rem', opacity: 0.95 }}>
                            Holy Quran Knowledge
                          </div>
                        </div>
                        
                        <div 
                          style={{ 
                            border: '3px solid #3b82f6', 
                            borderRadius: '16px', 
                            padding: '3rem 2rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                            textAlign: 'center'
                          }}
                          onClick={() => setSelectedSection('Seerat')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.25)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                          }}
                        >
                          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕌</div>
                          <div style={{ fontWeight: '700', fontSize: '2rem', marginBottom: '0.5rem' }}>
                            Seerat
                          </div>
                          <div style={{ fontSize: '1rem', opacity: 0.95 }}>
                            Prophet's Biography
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Module Selection */}
                  {selectedSection && !selectedModule && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <button 
                          onClick={() => setSelectedSection(null)}
                          style={{ 
                            padding: '0.5rem 1rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ← Back to Sections
                        </button>
                        <h3 style={{ margin: 0 }}>{selectedSection} - Select a Module</h3>
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '1.5rem',
                        marginTop: '1rem'
                      }}>
                        {modules
                          .filter(m => m.section === selectedSection)
                          .map((module) => (
                          <div 
                            key={module._id} 
                            style={{ 
                              border: '2px solid #e5e7eb', 
                              borderRadius: '12px', 
                              padding: '2rem',
                              background: selectedSection === 'Quran'
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => setSelectedModule(module)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-8px)';
                              e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            }}
                          >
                            <div style={{ fontWeight: '700', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                              {module.name}
                            </div>
                            {module.description && (
                              <div style={{ fontSize: '0.9rem', opacity: 0.95, lineHeight: '1.5' }}>
                                {module.description}
                              </div>
                            )}
                            <div style={{ 
                              marginTop: '1rem', 
                              fontSize: '0.85rem', 
                              opacity: 0.9,
                              fontWeight: '600'
                            }}>
                              Click to view quizzes →
                            </div>
                          </div>
                        ))}
                      </div>
                      {modules.filter(m => m.section === selectedSection).length === 0 && (
                        <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '2rem' }}>
                          No modules available for {selectedSection} yet.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quiz Days for Selected Module */}
                  {selectedSection && selectedModule && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <button 
                          onClick={() => setSelectedModule(null)}
                          style={{ 
                            padding: '0.5rem 1rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ← Back to Modules
                        </button>
                        <h3 style={{ margin: 0 }}>{selectedModule.name} - Available Quizzes</h3>
                      </div>
                      
                      {quizDaysLoading && <p>Loading quiz days...</p>}
                      {!quizDaysLoading && quizDays.length === 0 && (
                        <p style={{ color: '#6b7280' }}>No quizzes available for this module yet.</p>
                      )}
                      {!quizDaysLoading && quizDays.length > 0 && (
                        <div style={{ 
                          display: 'flex',
                          gap: '1.5rem',
                          overflowX: 'auto',
                          paddingBottom: '1rem'
                        }}>
                          {quizDays.map((day) => (
                            <div 
                              key={day._id} 
                              style={{ 
                                minWidth: '300px',
                                maxWidth: '300px',
                                border: '2px solid var(--border-color)', 
                                borderRadius: '12px', 
                                padding: '1.5rem',
                                background: day.acceptingResponses 
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                color: 'white',
                                cursor: day.acceptingResponses ? 'pointer' : 'not-allowed',
                                position: 'relative',
                                transition: 'transform 0.2s',
                                opacity: day.acceptingResponses ? 1 : 0.7
                              }}
                              onClick={() => day.acceptingResponses && navigate('/quiz', { state: { dayId: day._id } })}
                              onMouseEnter={(e) => day.acceptingResponses && (e.currentTarget.style.transform = 'translateY(-4px)')}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                              {!day.acceptingResponses && (
                                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '2rem' }}>
                                  🔒
                                </div>
                              )}
                              <div style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                                {day.dateLabel}
                              </div>
                              <div style={{ fontSize: '0.85rem', opacity: 0.95, marginBottom: '0.5rem' }}>
                                {day.acceptingResponses ? '✓ Open for responses' : '✗ Responses closed'}
                              </div>
                              {day.acceptingResponses && (
                                <div style={{ 
                                  marginTop: '1rem',
                                  padding: '0.5rem',
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  borderRadius: '4px',
                                  textAlign: 'center',
                                  fontSize: '0.9rem',
                                  fontWeight: '600'
                                }}>
                                  Click to start →
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '2rem' }}>
                    <h3>Reference Materials (PDF)</h3>
                    {materialsError && <p className="error">{materialsError}</p>}
                    {materialsLoading && <p>Loading materials...</p>}
                    {!materialsLoading && materials.length === 0 && (
                      <p>No materials available.</p>
                    )}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {materials.map((m) => (
                        <div key={m._id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                          {m.description && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.description}</div>}
                          <button
                            onClick={() => handleDownload(m._id, m.title)}
                            style={{ display: 'inline-block', marginTop: '0.5rem', color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Download PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Layout>
        }
      />
      <Route
        path="/auth"
        element={
          <Layout user={user} onLogout={logout}>
            <AuthPage onAuth={saveAuth} />
          </Layout>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={logout}>
              <QuizPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={logout}>
              <ResultsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={logout}>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute user={user} adminOnly>
            <Layout user={user} onLogout={logout}>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute user={user} adminOnly>
            <Layout user={user} onLogout={logout}>
              <LeaderboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;