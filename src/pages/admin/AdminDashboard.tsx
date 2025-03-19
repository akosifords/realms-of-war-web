import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import NavBar from '../../components/NavBar';
import MapPreview from '../../components/MapPreview';

interface AdminUser {
  isAdmin: boolean;
}

interface GameMap {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  playerCount: number;
  mapSize: { width: number; height: number };
  previewUrl?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(false);
  const [mapDeleteStatus, setMapDeleteStatus] = useState<{id: string, status: 'pending' | 'success' | 'error'} | null>(null);
  const [showMapsList, setShowMapsList] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/signin');
          return;
        }

        // Check if the user has admin privileges
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as AdminUser;
          if (userData.isAdmin) {
            setIsAdmin(true);
          } else {
            setError('You do not have admin privileges');
            setTimeout(() => {
              navigate('/home');
            }, 3000);
          }
        } else {
          setError('User data not found');
          setTimeout(() => {
            navigate('/home');
          }, 3000);
        }
      } catch (err: any) {
        setError(err.message || 'Error checking admin status');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const loadMaps = async () => {
    setLoadingMaps(true);
    try {
      const mapsQuery = query(collection(db, 'maps'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(mapsQuery);
      
      const mapsList: GameMap[] = [];
      snapshot.forEach(doc => {
        mapsList.push({
          id: doc.id,
          ...doc.data() as Omit<GameMap, 'id'>
        });
      });
      
      setMaps(mapsList);
      setShowMapsList(true);
    } catch (err: any) {
      console.error('Error loading maps:', err);
      setError('Failed to load maps');
    } finally {
      setLoadingMaps(false);
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (!window.confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
      return;
    }
    
    setMapDeleteStatus({ id: mapId, status: 'pending' });
    
    try {
      await deleteDoc(doc(db, 'maps', mapId));
      
      // Update the maps list
      setMaps(prevMaps => prevMaps.filter(map => map.id !== mapId));
      setMapDeleteStatus({ id: mapId, status: 'success' });
      
      // Clear status after a delay
      setTimeout(() => {
        setMapDeleteStatus(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting map:', err);
      setMapDeleteStatus({ id: mapId, status: 'error' });
      
      // Clear status after a delay
      setTimeout(() => {
        setMapDeleteStatus(null);
      }, 3000);
    }
  };

  const handleEditMap = (mapId: string) => {
    navigate(`/admin/map-editor?mapId=${mapId}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar activeTab="admin" />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar activeTab="admin" />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error}</p>
          <p>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar activeTab="admin" />
      
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Admin Card */}
          <div 
            style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate('/admin/map-editor')}
          >
            <h3 style={{ marginBottom: '1rem' }}>Map Editor</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              Create and manage game maps using the Tiled editor interface.
            </p>
          </div>

          <div 
            style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate('/admin/tiles')}
          >
            <h3 style={{ marginBottom: '1rem' }}>Tile Management</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              Upload and manage tile assets for map creation.
            </p>
          </div>

          <div 
            style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={() => navigate('/admin/users')}
          >
            <h3 style={{ marginBottom: '1rem' }}>User Management</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              View and manage user accounts and permissions.
            </p>
          </div>

          <div 
            style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onClick={loadMaps}
          >
            <h3 style={{ marginBottom: '1rem' }}>Map Management</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              View, edit and delete maps created in the Map Editor.
            </p>
          </div>
        </div>

        {/* Maps List Panel */}
        {showMapsList && (
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem',
            maxWidth: '1200px',
            margin: '2rem auto 0'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2>Map List</h2>
              <button
                onClick={() => setShowMapsList(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
            </div>

            {loadingMaps ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Loading maps...
              </div>
            ) : maps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                No maps found. Create your first map using the Map Editor.
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1rem'
              }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '80px 4fr 1fr 1fr 2fr',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #333',
                  fontWeight: 'bold'
                }}>
                  <span>Preview</span>
                  <span>Map Name</span>
                  <span style={{ textAlign: 'center' }}>Size</span>
                  <span style={{ textAlign: 'center' }}>Players</span>
                  <span style={{ textAlign: 'right' }}>Actions</span>
                </div>

                {maps.map(map => (
                  <div 
                    key={map.id} 
                    style={{ 
                      display: 'grid',
                      gridTemplateColumns: '80px 4fr 1fr 1fr 2fr',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#1e1e35',
                      borderRadius: '4px',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ width: '70px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
                      {map.previewUrl ? (
                        <img 
                          src={map.previewUrl} 
                          alt={map.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          backgroundColor: '#1a1a2e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          color: '#888'
                        }}>
                          No preview
                        </div>
                      )}
                    </div>
                    <div>
                      <div>{map.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{map.description}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {map.mapSize.width} × {map.mapSize.height}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {map.playerCount}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => handleEditMap(map.id)}
                        style={{
                          backgroundColor: '#4a4a8f',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMap(map.id)}
                        disabled={mapDeleteStatus?.id === map.id && mapDeleteStatus.status === 'pending'}
                        style={{
                          backgroundColor: mapDeleteStatus?.id === map.id 
                            ? (mapDeleteStatus.status === 'success' ? '#4CAF50' : 
                               mapDeleteStatus.status === 'error' ? '#f44336' : '#666')
                            : '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          cursor: mapDeleteStatus?.id === map.id && mapDeleteStatus.status === 'pending' 
                            ? 'not-allowed' 
                            : 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {mapDeleteStatus?.id === map.id 
                          ? (mapDeleteStatus.status === 'pending' 
                             ? 'Deleting...' 
                             : mapDeleteStatus.status === 'success' 
                               ? 'Deleted' 
                               : 'Failed') 
                          : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 