// client/src/components/ProfilePage.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://alfitra-quiz.onrender.com/api';

export default function ProfilePage() {
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    subjects: '',
    classes: '',
    phone: '',
    age: '',
    qualification: '',
    teacherId: ''
  });

  useEffect(() => {
    loadSubmissions();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('qm_token');
      const stored = localStorage.getItem('qm_user');
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
        setProfileData({
          name: userData.name || '',
          subjects: userData.subjects || '',
          classes: userData.classes || '',
          phone: userData.phone || '',
          age: userData.age || '',
          qualification: userData.qualification || '',
          teacherId: userData.teacherId || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('qm_token');
      const res = await fetch(`${API_BASE}/me/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load submissions');
      setSubs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('qm_token');
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      
      // Update local storage
      localStorage.setItem('qm_user', JSON.stringify(data.user));
      setUser(data.user);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !user) return <p className="error">{error}</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Teacher Profile Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Teacher Profile</h2>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            style={{ padding: '0.5rem 1rem' }}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {success && <div className="success" style={{ padding: '0.75rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '4px', marginBottom: '1rem' }}>{success}</div>}
        {error && <div className="error" style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

        {isEditing ? (
          <form onSubmit={handleProfileUpdate}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Subjects</label>
                <input
                  type="text"
                  value={profileData.subjects}
                  onChange={(e) => setProfileData({ ...profileData, subjects: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Classes</label>
                <input
                  type="text"
                  value={profileData.classes}
                  onChange={(e) => setProfileData({ ...profileData, classes: e.target.value })}
                  placeholder="e.g., 10th, 11th, 12th"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="e.g., +1234567890"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Age</label>
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  placeholder="e.g., 30"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Qualification</label>
                <input
                  type="text"
                  value={profileData.qualification}
                  onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                  placeholder="e.g., M.A., B.Ed., Ph.D."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Teacher ID</label>
                <input
                  type="text"
                  value={profileData.teacherId}
                  onChange={(e) => setProfileData({ ...profileData, teacherId: e.target.value })}
                  placeholder="e.g., TCH001"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                />
              </div>
            </div>
            
            <button 
              type="submit"
              style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Name:</strong> {user?.name || 'Not set'}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || 'Not set'}
            </div>
            <div>
              <strong>Subjects:</strong> {user?.subjects || 'Not set'}
            </div>
            <div>
              <strong>Classes:</strong> {user?.classes || 'Not set'}
            </div>
            <div>
              <strong>Phone:</strong> {user?.phone || 'Not set'}
            </div>
            <div>
              <strong>Age:</strong> {user?.age || 'Not set'}
            </div>
            <div>
              <strong>Qualification:</strong> {user?.qualification || 'Not set'}
            </div>
            <div>
              <strong>Teacher ID:</strong> {user?.teacherId || 'Not set'}
            </div>
          </div>
        )}
      </div>

      {/* Quiz History Section */}
      <div className="card">
        <h2>Your Previous Quizzes</h2>
        {subs.length === 0 && <p>No attempts yet.</p>}
        <ul>
          {subs.map((s) => (
            <li key={s._id}>
              <strong>{s.quizDay?.dateLabel}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}