import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../firebase/config';
import NavBar from '../../components/NavBar';
import { useDropzone } from 'react-dropzone';

interface AdminUser {
  isAdmin: boolean;
}

interface TileAsset {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  storageRef: string;
  createdAt: string;
  createdBy: string;
}

const TileManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [tileAssets, setTileAssets] = useState<TileAsset[]>([]);
  const [tileName, setTileName] = useState('');
  const [tileCategory, setTileCategory] = useState('terrain');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tileFile, setTileFile] = useState<File | null>(null);

  const categories = [
    { value: 'terrain', label: 'Terrain' },
    { value: 'resource', label: 'Resource' },
    { value: 'decoration', label: 'Decoration' },
    { value: 'structure', label: 'Structure' },
    { value: 'unit', label: 'Unit' }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setTileFile(file);
      setTileName(file.name.split('.')[0]); // Set the default name to the file name without extension
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

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
            // Load tile assets
            await loadTileAssets();
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

  const loadTileAssets = async () => {
    try {
      const tileAssetsCollection = collection(db, 'tileAssets');
      const snapshot = await getDocs(tileAssetsCollection);
      const tiles: TileAsset[] = [];
      
      snapshot.forEach(doc => {
        tiles.push({
          id: doc.id,
          ...doc.data() as Omit<TileAsset, 'id'>
        });
      });
      
      // Sort by creation date, newest first
      tiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTileAssets(tiles);
    } catch (err: any) {
      console.error('Error loading tile assets:', err);
      setError('Error loading tile assets');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tileFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!tileName.trim()) {
      setError('Please enter a name for the tile');
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in');
      return;
    }
    
    setUploadLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Create a reference to the file in Firebase Storage
      const fileExtension = tileFile.name.split('.').pop();
      const fileName = `${Date.now()}_${tileName.replace(/\s+/g, '_')}.${fileExtension}`;
      const storageRefPath = `tiles/${tileCategory}/${fileName}`;
      const storageReference = ref(storage, storageRefPath);
      
      // Upload the file
      await uploadBytes(storageReference, tileFile);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageReference);
      
      // Store the metadata in Firestore
      await addDoc(collection(db, 'tileAssets'), {
        name: tileName,
        category: tileCategory,
        imageUrl: downloadURL,
        storageRef: storageRefPath,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      
      // Reset the form
      setTileName('');
      setTileCategory('terrain');
      setTileFile(null);
      setPreviewImage(null);
      
      // Show success message
      setSuccessMessage('Tile asset uploaded successfully!');
      
      // Reload the assets
      await loadTileAssets();
    } catch (err: any) {
      console.error('Error uploading tile asset:', err);
      setError(err.message || 'Error uploading tile asset');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteTile = async (tile: TileAsset) => {
    if (!window.confirm(`Are you sure you want to delete the tile "${tile.name}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'tileAssets', tile.id));
      
      // Delete from Storage
      await deleteObject(ref(storage, tile.storageRef));
      
      // Update UI
      setTileAssets(tileAssets.filter(t => t.id !== tile.id));
      setSuccessMessage('Tile asset deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting tile asset:', err);
      setError(err.message || 'Error deleting tile asset');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#ff6b6b' }}>{error}</p>
          <p>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar />
      
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Tile Management</h1>
          <button 
            onClick={() => navigate('/admin')}
            style={{ 
              backgroundColor: '#4a4a8f',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Back to Admin Dashboard
          </button>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#5c0a0a', 
            color: '#ff6b6b', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div style={{ 
            backgroundColor: '#0a5c2d', 
            color: '#6bff9e', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            {successMessage}
          </div>
        )}
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Upload Form */}
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            padding: '1.5rem',
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Upload New Tile</h2>
            
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tile Image</label>
                <div 
                  {...getRootProps()} 
                  style={{ 
                    border: '2px dashed #4a4a8f',
                    borderRadius: '4px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? '#353564' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <input {...getInputProps()} />
                  
                  {previewImage ? (
                    <div>
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          borderRadius: '4px',
                          marginBottom: '1rem'
                        }} 
                      />
                      <p>Click or drag to replace</p>
                    </div>
                  ) : (
                    <p>{isDragActive ? 'Drop the image here' : 'Drag and drop an image, or click to select'}</p>
                  )}
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="tileName" style={{ display: 'block', marginBottom: '0.5rem' }}>Tile Name</label>
                <input
                  type="text"
                  id="tileName"
                  value={tileName}
                  onChange={(e) => setTileName(e.target.value)}
                  required
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
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="tileCategory" style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
                <select
                  id="tileCategory"
                  value={tileCategory}
                  onChange={(e) => setTileCategory(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                type="submit"
                disabled={uploadLoading || !tileFile}
                style={{ 
                  backgroundColor: uploadLoading || !tileFile ? '#666' : '#ff6b35', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '4px', 
                  cursor: uploadLoading || !tileFile ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Tile'}
              </button>
            </form>
          </div>
          
          {/* Tile Assets Gallery */}
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Tile Assets</h2>
            
            {tileAssets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#262640', borderRadius: '8px' }}>
                <p>No tile assets found. Upload some tiles to get started!</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {tileAssets.map(tile => (
                  <div 
                    key={tile.id}
                    style={{ 
                      backgroundColor: '#262640',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <img 
                      src={tile.imageUrl} 
                      alt={tile.name}
                      style={{ 
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover'
                      }} 
                    />
                    <div style={{ padding: '0.75rem' }}>
                      <h4 style={{ 
                        fontSize: '0.9rem', 
                        margin: '0 0 0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {tile.name}
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.8rem', 
                        color: '#aaa',
                        textTransform: 'capitalize' 
                      }}>
                        {tile.category}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTile(tile)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: 'rgba(211, 47, 47, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TileManagement; 