import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Firebase imports
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Page components
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import Lobby from './pages/Lobby';
import OpenGames from './pages/OpenGames';
import GameScene from './pages/GameScene';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Rules from './pages/Rules';
import Welcome from './pages/Welcome';

// Admin components
import AdminDashboard from './pages/admin/AdminDashboard';
import MapEditor from './pages/admin/MapEditor';
import TileManagement from './pages/admin/TileManagement';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/home" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/home" />} />
        
        {/* Protected routes */}
        <Route path="/home" element={user ? <Home /> : <Navigate to="/signin" />} />
        <Route path="/create-game" element={user ? <CreateGame /> : <Navigate to="/signin" />} />
        <Route path="/lobby/:id" element={user ? <Lobby /> : <Navigate to="/signin" />} />
        <Route path="/open-games" element={user ? <OpenGames /> : <Navigate to="/signin" />} />
        <Route path="/game/:id" element={user ? <GameScene /> : <Navigate to="/signin" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/signin" />} />
        <Route path="/messages" element={user ? <Messages /> : <Navigate to="/signin" />} />
        <Route path="/rules" element={user ? <Rules /> : <Navigate to="/signin" />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/signin" />} />
        <Route path="/admin/map-editor" element={user ? <MapEditor /> : <Navigate to="/signin" />} />
        <Route path="/admin/tiles" element={user ? <TileManagement /> : <Navigate to="/signin" />} />
      </Routes>
    </div>
  );
}

export default App; 