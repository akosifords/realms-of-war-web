import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface NavBarProps {
  activeTab?: string;
}

const NavBar: React.FC<NavBarProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (tab: string) => {
    return activeTab === tab;
  };

  return (
    <div style={{
      backgroundColor: '#262640',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          <Link to="/home" style={{ color: 'white', textDecoration: 'none' }}>
            Realms of War
          </Link>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link 
          to="/home" 
          style={{ 
            color: isActive('home') ? '#ff6b35' : 'white', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: isActive('home') ? 'bold' : 'normal',
          }}
        >
          Home
        </Link>
        
        <Link 
          to="/games" 
          style={{ 
            color: isActive('games') ? '#ff6b35' : 'white', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: isActive('games') ? 'bold' : 'normal',
          }}
        >
          Games
        </Link>
        
        {isAdmin && (
          <Link 
            to="/admin" 
            style={{ 
              color: isActive('admin') ? '#ff6b35' : '#00ffff', 
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontWeight: isActive('admin') ? 'bold' : 'normal',
            }}
          >
            Admin Dashboard
          </Link>
        )}

        <Link 
          to="/profile" 
          style={{ 
            color: isActive('profile') ? '#ff6b35' : 'white', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: isActive('profile') ? 'bold' : 'normal',
          }}
        >
          Profile
        </Link>

        <Link 
          to="/messages" 
          style={{ 
            color: isActive('messages') ? '#ff6b35' : 'white', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: isActive('messages') ? 'bold' : 'normal',
          }}
        >
          Messages
        </Link>

        <Link 
          to="/rules" 
          style={{ 
            color: isActive('rules') ? '#ff6b35' : 'white', 
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: isActive('rules') ? 'bold' : 'normal',
          }}
        >
          Rules
        </Link>
        
        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: 'transparent',
            color: '#ff6b6b',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 'bold',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default NavBar; 