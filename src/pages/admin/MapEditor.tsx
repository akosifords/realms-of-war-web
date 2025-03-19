import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import NavBar from '../../components/NavBar';

// Note: @mapeditor/tiled-api would be imported here if it had proper TypeScript definitions
// For now, we'll create interfaces that match what we need
interface TiledMap {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  orientation: 'hexagonal';
  hexSideLength: number;
  layers: any[];
}

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

interface MapTile {
  type: string;
  x: number;
  y: number;
  base?: string; // Player base indicator (red, blue, green, etc.)
}

interface GameMap {
  id?: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  tiles: MapTile[];
  hexagonal: boolean;
  mapSize: { width: number; height: number };
  playerCount: number;
  previewUrl?: string; // URL to the map preview image
}

// Hex grid constants
const HEX_SIZE = 30; // Hex radius (distance from center to corner)
const HEX_WIDTH = 2 * HEX_SIZE * Math.cos(Math.PI/6); // Width of a hex is 2 * radius * cos(30°)
const HEX_HEIGHT = 2 * HEX_SIZE; // Height of a hex is 2 * radius
const HEX_HORIZ_DISTANCE = HEX_WIDTH; // Distance between hex centers horizontally
const HEX_VERT_DISTANCE = HEX_HEIGHT * 0.75; // Distance between hex centers vertically
const HEX_OFFSET = HEX_WIDTH / 2; // Offset for odd rows

// Define viewport and map dimensions
const MAX_MAP_WIDTH = 50; // Maximum map width in tiles
const MAX_MAP_HEIGHT = 50; // Maximum map height in tiles

const MapEditor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [tileAssets, setTileAssets] = useState<TileAsset[]>([]);
  const [mapName, setMapName] = useState<string>('');
  const [mapDescription, setMapDescription] = useState<string>('');
  const [mapWidth, setMapWidth] = useState(20); // Default width
  const [mapHeight, setMapHeight] = useState(20); // Default height
  const [playerCount, setPlayerCount] = useState(2); // Default player count
  const [gridSize, setGridSize] = useState({ width: mapWidth, height: mapHeight });
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentBrush, setCurrentBrush] = useState<string>('plains_medium');
  const [brushMode, setBrushMode] = useState<'terrain' | 'base'>('terrain');
  const [isPainting, setIsPainting] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const terrainOptions = [
    { value: 'plains', label: 'Plains' },
    { value: 'mountain', label: 'Mountains' },
    { value: 'forest', label: 'Forest' },
    { value: 'water', label: 'Archipelago' },
    { value: 'mixed', label: 'Mixed' }
  ];

  // Initialize the grid with the default size
  useEffect(() => {
    initializeEmptyTiles(mapWidth, mapHeight);
  }, []);

  // Check if user has admin privileges
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

  // Draw the grid whenever tiles change
  useEffect(() => {
    drawGrid();
  }, [tiles]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => drawGrid();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeEmptyTiles = (width: number, height: number) => {
    const newTiles: MapTile[] = [];
    
    // Generate the hex grid with proper hex arrangement
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        // Default to a plains tile
        const plainTypes = ['plains_light', 'plains_medium', 'plains_dark'];
        const randomPlainType = plainTypes[Math.floor(Math.random() * plainTypes.length)];
        
        newTiles.push({
          type: randomPlainType,
          x: q, // Column (q coordinate in hex grid)
          y: r  // Row (r coordinate in hex grid)
        });
      }
    }
    
    setTiles(newTiles);
  };

  const loadTileAssets = async () => {
    try {
      const tileAssetsCollection = collection(db, 'tileAssets');
      const snapshot = await getDocs(tileAssetsCollection);
      const assets: TileAsset[] = [];
      
      snapshot.forEach(doc => {
        assets.push({
          id: doc.id,
          ...doc.data() as Omit<TileAsset, 'id'>
        });
      });
      
      // Group by category
      const groupedAssets = assets.reduce((acc, asset) => {
        if (!acc[asset.category]) {
          acc[asset.category] = [];
        }
        acc[asset.category].push(asset);
        return acc;
      }, {} as Record<string, TileAsset[]>);
      
      // Flatten and sort
      const sortedAssets: TileAsset[] = [];
      ['terrain', 'resource', 'decoration', 'structure', 'unit'].forEach(category => {
        if (groupedAssets[category]) {
          sortedAssets.push(...groupedAssets[category]);
        }
      });
      
      setTileAssets(sortedAssets);
    } catch (err: any) {
      console.error('Error loading tile assets:', err);
      setError('Error loading tile assets');
    }
  };

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate the maximum size that can fit in the container
    const maxHexWidth = containerWidth / gridSize.width;
    const maxHexHeight = containerHeight / (gridSize.height * 0.75);
    
    // Calculate scale factor to fit entire map
    const scaleFactor = Math.min(
      maxHexWidth / HEX_WIDTH,
      maxHexHeight / HEX_HEIGHT
    ) * 0.95; // Leave some margin
    
    // Calculate the scaled hex dimensions
    const scaledHexSize = HEX_SIZE * scaleFactor;
    const scaledHexWidth = HEX_WIDTH * scaleFactor;
    const scaledHexHeight = HEX_HEIGHT * scaleFactor;
    const scaledVertDist = HEX_VERT_DISTANCE * scaleFactor;
    const scaledHorizDist = HEX_HORIZ_DISTANCE * scaleFactor;
    
    // Calculate canvas size to fit the current map size
    const padding = scaledHexSize;
    const canvasWidth = Math.ceil(gridSize.width * scaledHorizDist + padding);
    const canvasHeight = Math.ceil(gridSize.height * scaledVertDist + padding);
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw each hexagonal tile
    tiles.forEach(tile => {
      // Skip tiles outside current grid size
      if (tile.x >= gridSize.width || tile.y >= gridSize.height) {
        return;
      }
      
      // Convert grid coordinates to scaled pixel coordinates
      let x = tile.x * scaledHorizDist;
      let y = tile.y * scaledVertDist;
      
      // Offset every other row (odd rows)
      if (tile.y % 2 !== 0) {
        x += (scaledHexWidth / 2);
      }
      
      const centerX = x + padding/2;
      const centerY = y + padding/2;
      
      // Get base color if present
      const baseColor = tile.base ? getBaseColor(tile.base) : undefined;
      
      // Draw the hex tile with potential base
      drawScaledHexTile(ctx, centerX, centerY, getTileColor(tile.type), scaledHexSize, baseColor);
    });
  };
  
  // Draw a hexagon with the specified scale
  const drawScaledHexTile = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string, hexSize: number, baseColor?: string) => {
    ctx.beginPath();
    
    // Draw a pointy-topped hexagon
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6; // Adding PI/6 makes it pointy-topped
      const hx = x + hexSize * Math.cos(angle);
      const hy = y + hexSize * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(hx, hy);
      } else {
        ctx.lineTo(hx, hy);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw outline
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.stroke();

    // If there's a base, draw it
    if (baseColor) {
      // Draw a smaller hexagon for the base
      const baseSize = hexSize * 0.5;
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const hx = x + baseSize * Math.cos(angle);
        const hy = y + baseSize * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();
      
      // Draw base outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  const getTileColor = (type: string) => {
    switch(type) {
      case 'water': return '#1e88e5'; // Blue
      case 'plains_light': return '#66bb6a'; // Light green
      case 'plains_medium': return '#43a047'; // Medium green
      case 'plains_dark': return '#2e7d32'; // Dark green
      case 'mountain': return '#757575'; // Grey
      case 'forest': return '#1b5e20'; // Dark green
      default: return '#795548'; // Brown as fallback
    }
  };

  // Get the color for a base
  const getBaseColor = (baseType: string) => {
    switch(baseType) {
      case 'red': return '#e53935'; // Red
      case 'blue': return '#1e88e5'; // Blue
      case 'green': return '#43a047'; // Green
      case 'orange': return '#fb8c00'; // Orange
      case 'purple': return '#8e24aa'; // Purple
      case 'yellow': return '#fdd835'; // Yellow
      case 'white': return '#ffffff'; // White (AI)
      default: return 'transparent'; // No base
    }
  };

  // Paint a tile at the specified grid coordinates
  const paintTile = (gridX: number, gridY: number) => {
    // Make sure coordinates are within bounds of current grid size
    if (gridX < 0 || gridX >= gridSize.width || gridY < 0 || gridY >= gridSize.height) {
      return;
    }
    
    // Update the tile with the current brush
    setTiles(prevTiles => {
      return prevTiles.map(tile => {
        if (tile.x === gridX && tile.y === gridY) {
          if (brushMode === 'terrain') {
            return {
              ...tile,
              type: currentBrush
            };
          } else if (brushMode === 'base') {
            // For base mode, currentBrush contains the base color
            return {
              ...tile,
              base: currentBrush === 'none' ? undefined : currentBrush
            };
          }
          return tile;
        }
        return tile;
      });
    });
  };

  // Handle mouse events for painting
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPainting(true);
    handleCanvasMouseMove(e); // Paint on initial click
  };

  const handleCanvasMouseUp = () => {
    setIsPainting(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsPainting(false);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale factor based on current grid size
    const maxHexWidth = containerWidth / gridSize.width;
    const maxHexHeight = containerHeight / (gridSize.height * 0.75);
    const scaleFactor = Math.min(
      maxHexWidth / HEX_WIDTH,
      maxHexHeight / HEX_HEIGHT
    ) * 0.95;
    
    // Scaled hex dimensions
    const scaledHexSize = HEX_SIZE * scaleFactor;
    const scaledHexWidth = HEX_WIDTH * scaleFactor;
    const scaledVertDist = HEX_VERT_DISTANCE * scaleFactor;
    const scaledHorizDist = HEX_HORIZ_DISTANCE * scaleFactor;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert click coordinates to canvas coordinates
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    // Convert to grid coordinates
    const padding = scaledHexSize;
    const adjustedX = canvasX - padding/2;
    const adjustedY = canvasY - padding/2;
    
    // Find the closest hex center
    let minDist = Infinity;
    let closestGridX = -1;
    let closestGridY = -1;
    
    // Search for the closest hex within the current grid size
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        // Calculate hex center
        let centerX = x * scaledHorizDist;
        let centerY = y * scaledVertDist;
        
        if (y % 2 !== 0) {
          centerX += (scaledHexWidth / 2);
        }
        
        centerX += padding/2;
        centerY += padding/2;
        
        // Calculate distance
        const dist = Math.sqrt(
          Math.pow(centerX - canvasX, 2) + 
          Math.pow(centerY - canvasY, 2)
        );
        
        if (dist < minDist && dist < scaledHexSize) {
          minDist = dist;
          closestGridX = x;
          closestGridY = y;
        }
      }
    }
    
    // Paint the closest hex if found
    if (closestGridX >= 0 && closestGridY >= 0) {
      paintTile(closestGridX, closestGridY);
    }
  };
  
  // Handle context menu to prevent right-click menu
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    return false;
  };

  const handleMapSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 1;
    const limitedValue = Math.min(Math.max(numValue, 1), dimension === 'width' ? MAX_MAP_WIDTH : MAX_MAP_HEIGHT);
    
    if (dimension === 'width') {
      setMapWidth(limitedValue);
    } else {
      setMapHeight(limitedValue);
    }
  };

  const applyMapSize = () => {
    // Confirm before resizing if map already has tiles
    if (tiles.length > 0) {
      if (!window.confirm('Changing the map size will reset the current map. Are you sure?')) {
        return;
      }
    }
    
    setGridSize({ width: mapWidth, height: mapHeight });
    initializeEmptyTiles(mapWidth, mapHeight);
  };

  // Count unique player bases on the map (excluding white/AI bases)
  const countPlayerBases = (): { count: number, baseTypes: string[] } => {
    const uniqueBases = new Set<string>();
    
    tiles.forEach(tile => {
      if (tile.base && tile.base !== 'white' && tile.base !== 'none') {
        uniqueBases.add(tile.base);
      }
    });
    
    return { 
      count: uniqueBases.size,
      baseTypes: Array.from(uniqueBases)
    };
  };

  // Generate a map preview thumbnail
  const generateMapPreview = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary canvas for the thumbnail
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          reject('Could not create canvas context');
          return;
        }
        
        // Set a fixed size for the thumbnail
        const previewWidth = 300;
        const previewHeight = 200;
        tempCanvas.width = previewWidth;
        tempCanvas.height = previewHeight;
        
        // Fill background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, previewWidth, previewHeight);
        
        // Calculate scale to fit the entire map in the thumbnail
        const mapAspect = gridSize.width / gridSize.height;
        const previewAspect = previewWidth / previewHeight;
        
        let scaleFactor: number;
        let offsetX = 0;
        let offsetY = 0;
        
        if (mapAspect > previewAspect) {
          // Map is wider, scale based on width
          scaleFactor = previewWidth / (gridSize.width * HEX_WIDTH * 1.2);
          offsetY = (previewHeight - (gridSize.height * HEX_VERT_DISTANCE * scaleFactor)) / 2;
        } else {
          // Map is taller, scale based on height
          scaleFactor = previewHeight / (gridSize.height * HEX_VERT_DISTANCE * 1.2);
          offsetX = (previewWidth - (gridSize.width * HEX_WIDTH * scaleFactor)) / 2;
        }
        
        // Scaled hex dimensions
        const scaledHexSize = HEX_SIZE * scaleFactor;
        
        // Draw each hex
        tiles.forEach(tile => {
          if (tile.x >= gridSize.width || tile.y >= gridSize.height) return;
          
          // Calculate position
          let x = tile.x * HEX_WIDTH * scaleFactor;
          let y = tile.y * HEX_VERT_DISTANCE * scaleFactor;
          
          // Offset every other row
          if (tile.y % 2 !== 0) {
            x += (HEX_WIDTH * scaleFactor / 2);
          }
          
          // Apply centering offset
          x += offsetX;
          y += offsetY;
          
          // Draw hex
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 6;
            const hx = x + scaledHexSize * Math.cos(angle);
            const hy = y + scaledHexSize * Math.sin(angle);
            
            if (i === 0) {
              ctx.moveTo(hx, hy);
            } else {
              ctx.lineTo(hx, hy);
            }
          }
          ctx.closePath();
          ctx.fillStyle = getTileColor(tile.type);
          ctx.fill();
          
          // Draw outline
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // Draw base if present
          if (tile.base) {
            const baseSize = scaledHexSize * 0.5;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i + Math.PI / 6;
              const hx = x + baseSize * Math.cos(angle);
              const hy = y + baseSize * Math.sin(angle);
              
              if (i === 0) {
                ctx.moveTo(hx, hy);
              } else {
                ctx.lineTo(hx, hy);
              }
            }
            ctx.closePath();
            ctx.fillStyle = getBaseColor(tile.base);
            ctx.fill();
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
        
        // Convert canvas to data URL
        const dataUrl = tempCanvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        console.error('Error generating map preview:', err);
        reject('Failed to generate preview');
      }
    });
  };

  const handleSaveMap = async () => {
    // Get values directly from refs
    const nameValue = nameInputRef.current?.value || '';
    const descValue = descriptionRef.current?.value || '';
    
    // Validation
    if (!nameValue.trim()) {
      setError('Please enter a map name');
      return;
    }
    
    if (!descValue.trim()) {
      setError('Please enter a map description');
      return;
    }

    // Check player base count matches required player count
    const { count: actualPlayerCount, baseTypes } = countPlayerBases();
    if (actualPlayerCount !== playerCount) {
      setError(`Player base count mismatch! The map requires ${playerCount} players but has ${actualPlayerCount} player bases.`);
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Generate map preview
      const previewDataUrl = await generateMapPreview();
      
      const mapData: GameMap = {
        name: nameValue,
        description: descValue,
        createdAt: new Date(),
        createdBy: user.uid,
        tiles: tiles,
        hexagonal: true,
        mapSize: { width: gridSize.width, height: gridSize.height },
        playerCount: playerCount,
        previewUrl: previewDataUrl
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'maps'), mapData);
      
      setSuccessMessage(`Map "${nameValue}" created successfully!`);
      
      // Reset form after a delay
      setTimeout(() => {
        if (nameInputRef.current) nameInputRef.current.value = '';
        if (descriptionRef.current) descriptionRef.current.value = '';
        
        // Re-initialize the grid with current dimensions
        initializeEmptyTiles(mapWidth, mapHeight);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving map:', err);
      setError(err.message || 'Error saving map');
    } finally {
      setSaving(false);
    }
  };

  // Add a handler with console logging for debugging
  const handleMapNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Map name changed:', e.target.value);
    setMapName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('Description changed:', e.target.value);
    setMapDescription(e.target.value);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <NavBar />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading map editor...</p>
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
          <h1>Hexagonal Map Editor</h1>
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
          gridTemplateColumns: '300px 1fr',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Editor Controls */}
          <div>
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Map Properties</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="mapName" style={{ display: 'block', marginBottom: '0.5rem' }}>Map Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  id="mapName"
                  placeholder="Enter map name"
                  autoComplete="off"
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
                <label htmlFor="mapDescription" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  ref={descriptionRef}
                  id="mapDescription"
                  placeholder="Enter map description"
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Map Size (max 50x50)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={mapWidth}
                    onChange={(e) => handleMapSizeChange('width', e.target.value)}
                    min="1"
                    max={MAX_MAP_WIDTH}
                    style={{ 
                      width: '70px',
                      padding: '0.75rem', 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={mapHeight}
                    onChange={(e) => handleMapSizeChange('height', e.target.value)}
                    min="1"
                    max={MAX_MAP_HEIGHT}
                    style={{ 
                      width: '70px',
                      padding: '0.75rem', 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  />
                  <button
                    onClick={applyMapSize}
                    style={{ 
                      backgroundColor: '#4a4a8f',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flexGrow: 1
                    }}
                  >
                    Apply Size
                  </button>
                </div>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: '#aaa', 
                  marginTop: '0.5rem',
                  display: tiles.length > 0 ? 'block' : 'none' 
                }}>
                  Warning: Changing map size will reset the current map.
                </p>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Player Count</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={playerCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 2;
                      setPlayerCount(Math.min(Math.max(value, 2), 6)); // Limit between 2 and 6 players
                    }}
                    min="2"
                    max="6"
                    style={{ 
                      width: '70px',
                      padding: '0.75rem', 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  />
                  <div style={{ 
                    flex: 1,
                    fontSize: '0.9rem',
                    color: '#aaa',
                    paddingLeft: '0.5rem'
                  }}>
                    Required number of players (2-6)
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSaveMap}
                disabled={saving}
                style={{ 
                  backgroundColor: saving ? '#666' : '#ff6b35', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '4px', 
                  cursor: saving ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {saving ? 'Saving...' : 'Save Map'}
              </button>
            </div>
            
            {/* Brush Toggle */}
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Brush Mode</h2>
              
              <div style={{
                display: 'flex',
                marginBottom: '1rem',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setBrushMode('terrain')}
                  style={{
                    backgroundColor: brushMode === 'terrain' ? '#ff6b35' : '#4a4a8f',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Terrain
                </button>
                <button
                  onClick={() => setBrushMode('base')}
                  style={{
                    backgroundColor: brushMode === 'base' ? '#ff6b35' : '#4a4a8f',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Bases
                </button>
              </div>
            </div>
            
            {/* Terrain Brushes */}
            {brushMode === 'terrain' && (
              <div style={{ 
                backgroundColor: '#262640',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Terrain Brushes</h2>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {['plains_light', 'plains_medium', 'plains_dark', 'water', 'mountain', 'forest'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setCurrentBrush(type)}
                      style={{ 
                        backgroundColor: getTileColor(type),
                        border: currentBrush === type && brushMode === 'terrain' ? '3px solid white' : '1px solid #444',
                        height: '40px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title={type.replace('_', ' ')}
                    />
                  ))}
                </div>
                
                <div style={{ fontSize: '0.9rem', color: '#aaa', textAlign: 'center' }}>
                  <p>Click and drag on the map to paint terrain</p>
                </div>
              </div>
            )}
            
            {/* Base Brushes */}
            {brushMode === 'base' && (
              <div style={{ 
                backgroundColor: '#262640',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Base Brushes</h2>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'white', 'none'].map(baseType => (
                    <button 
                      key={baseType}
                      onClick={() => setCurrentBrush(baseType)}
                      style={{ 
                        backgroundColor: baseType === 'none' ? '#1a1a2e' : getBaseColor(baseType),
                        border: currentBrush === baseType && brushMode === 'base' ? '3px solid white' : '1px solid #444',
                        height: '40px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: baseType === 'white' ? '#000' : (baseType === 'none' ? '#fff' : undefined),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={baseType.charAt(0).toUpperCase() + baseType.slice(1)}
                    >
                      {baseType === 'none' && 'Clear'}
                    </button>
                  ))}
                </div>
                
                <div style={{ fontSize: '0.9rem', color: '#aaa', textAlign: 'center' }}>
                  <p>Click to place player bases (indicated by color)</p>
                  <p>Red, Blue, Green, etc. for players, White for AI</p>
                  <p style={{ 
                    marginTop: '0.5rem', 
                    fontWeight: 'bold',
                    color: countPlayerBases().count === playerCount ? '#6bff9e' : '#ff6b6b'
                  }}>
                    This map requires {playerCount} player bases
                    {countPlayerBases().count !== playerCount ? 
                      ` (${countPlayerBases().count} currently placed)` : 
                      ' ✓'}
                  </p>
                </div>
              </div>
            )}
            
            <div style={{ 
              backgroundColor: '#262640',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h2 style={{ marginBottom: '1rem' }}>Map Info</h2>
              <p>Current Map Size: {gridSize.width} x {gridSize.height}</p>
              
              {/* Base count indicator */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Player Bases:</span>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    backgroundColor: countPlayerBases().count === playerCount ? '#0a5c2d' : '#5c0a0a',
                    color: countPlayerBases().count === playerCount ? '#6bff9e' : '#ff6b6b',
                  }}>
                    {countPlayerBases().count} / {playerCount}
                  </div>
                </div>
                
                {/* Display base colors placed */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  marginTop: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {countPlayerBases().baseTypes.map(baseType => (
                    <div 
                      key={baseType}
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: getBaseColor(baseType),
                        borderRadius: '50%',
                        border: '1px solid #444'
                      }}
                      title={baseType.charAt(0).toUpperCase() + baseType.slice(1)}
                    />
                  ))}
                </div>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.5rem' }}>
                The entire map is displayed at once for easy editing.
              </p>
            </div>
          </div>
          
          {/* Map Canvas */}
          <div>
            <div style={{ backgroundColor: '#262640', borderRadius: '8px', padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Hexagonal Grid</h2>
              
              <div 
                ref={containerRef}
                style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius: '4px',
                  border: '1px solid #4a4a8f',
                  height: '600px'
                }}
              >
                <canvas 
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseLeave}
                  onContextMenu={handleContextMenu}
                  style={{ 
                    cursor: 'pointer',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                <p>Click and drag on the map to paint terrain.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapEditor; 