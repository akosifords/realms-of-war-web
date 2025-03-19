import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';

interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
  games: string[];
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          setError('User profile not found');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error || 'Profile not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar activeTab="profile" />
      
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>My Profile</h1>
        
        <div style={{ 
          backgroundColor: '#262640',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Username</h3>
            <p style={{ textAlign: 'left', backgroundColor: '#1a1a2e', padding: '0.75rem', borderRadius: '4px' }}>
              {profile.username}
            </p>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Email</h3>
            <p style={{ textAlign: 'left', backgroundColor: '#1a1a2e', padding: '0.75rem', borderRadius: '4px' }}>
              {profile.email}
            </p>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Account Created</h3>
            <p style={{ textAlign: 'left', backgroundColor: '#1a1a2e', padding: '0.75rem', borderRadius: '4px' }}>
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div>
            <h3 style={{ marginBottom: '0.5rem', textAlign: 'left' }}>Games Played</h3>
            <p style={{ textAlign: 'left', backgroundColor: '#1a1a2e', padding: '0.75rem', borderRadius: '4px' }}>
              {profile.games.length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 