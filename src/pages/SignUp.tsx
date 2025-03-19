import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with username
      await updateProfile(user, {
        displayName: username
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username,
        email,
        createdAt: new Date().toISOString(),
        games: []
      });

      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#1a1a2e'
    }}>
      <div className="form-container" style={{ 
        background: '#16213E', 
        padding: '2rem', 
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '2rem', color: 'white' }}>Create your account</h2>
        
        {error && <div className="error-message" style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', color: 'white' }}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter text..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white'
              }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', color: 'white' }}>Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter text..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="username" style={{ display: 'block', textAlign: 'left', marginBottom: '0.5rem', color: 'white' }}>Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter text..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              backgroundColor: '#ff6b35', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '4px', 
              cursor: 'pointer',
              width: '100%',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', color: 'white' }}>
          Already have an account? <Link to="/signin" style={{ color: '#ff6b35', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 