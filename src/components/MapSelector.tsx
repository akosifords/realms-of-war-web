import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import GridTile from './HexTile';

// Define tile types
enum TileType {
  PLAINS_LIGHT = 'plains_light',
  PLAINS_MEDIUM = 'plains_medium',
  PLAINS_DARK = 'plains_dark',
  WATER = 'water',
  MOUNTAIN = 'mountain',
  FOREST = 'forest',
}

interface MapTile {
  type: string;
  x: number;
  y: number;
  resource?: string;
}

interface GameMap {
  id: string;
  name: string;
  size: string;
  terrainType: string;
  description: string;
  tiles: MapTile[];
  createdBy?: string;
  createdAt?: any;
}

interface MapSelectorProps {
  mapSize: string;
  terrainType: string;
  onClose: () => void;
  onSelectMap?: (mapId: string) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({ mapSize, terrainType, onClose, onSelectMap }) => {
  const [availableMaps, setAvailableMaps] = useState<GameMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  
  // Calculate grid dimensions based on the selected map
  const tileSize = 40; // Size of each square tile in pixels
  const gapSize = 2; // Gap between tiles
  
  useEffect(() => {
    // Load available maps from the database
    loadMaps();
  }, [mapSize, terrainType]);
  
  const loadMaps = async () => {
    try {
      setLoading(true);
      
      // Create a query to filter maps by size and terrain type
      const mapsQuery = query(
        collection(db, 'maps'),
        where('size', '==', mapSize),
        where('terrainType', '==', terrainType)
      );
      
      const snapshot = await getDocs(mapsQuery);
      
      if (snapshot.empty) {
        setError(`No maps found for ${terrainType} terrain with ${mapSize} size.`);
        setAvailableMaps([]);
      } else {
        const maps: GameMap[] = [];
        snapshot.forEach(doc => {
          maps.push({
            id: doc.id,
            ...doc.data()
          } as GameMap);
        });
        
        setAvailableMaps(maps);
        
        // Select the first map by default
        if (maps.length > 0) {
          setSelectedMap(maps[0]);
        }
      }
    } catch (err: any) {
      console.error('Error loading maps:', err);
      setError(err.message || 'Failed to load maps');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectMap = (map: GameMap) => {
    setSelectedMap(map);
    setSelectedTile(null);
    
    // If callback provided, notify parent component
    if (onSelectMap) {
      onSelectMap(map.id);
    }
  };

  // Function to get color for each tile type
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
  
  const getTileName = (type: string) => {
    switch(type) {
      case 'water': return 'Water';
      case 'plains_light': 
      case 'plains_medium': 
      case 'plains_dark': return 'Plains';
      case 'mountain': return 'Mountain';
      case 'forest': return 'Forest';
      default: return 'Unknown';
    }
  };

  // Calculate the actual pixel positions for each grid tile
  const getTilePosition = (x: number, y: number) => {
    return {
      x: x * (tileSize + gapSize),
      y: y * (tileSize + gapSize)
    };
  };
  
  // Calculate map dimensions based on the selected map
  const getMapDimensions = (map: GameMap) => {
    if (!map || !map.tiles || map.tiles.length === 0) {
      return { width: 0, height: 0 };
    }
    
    // Find the maximum x and y values to determine dimensions
    const maxX = Math.max(...map.tiles.map(tile => tile.x));
    const maxY = Math.max(...map.tiles.map(tile => tile.y));
    
    return {
      width: (maxX + 1) * (tileSize + gapSize),
      height: (maxY + 1) * (tileSize + gapSize)
    };
  };
  
  // Render tiles for the selected map
  const renderMapTiles = () => {
    if (!selectedMap || !selectedMap.tiles) return null;
    
    return (
      <>
        {selectedMap.tiles.map((tile, index) => {
          const position = getTilePosition(tile.x, tile.y);
          return (
            <GridTile
              key={index}
              x={position.x}
              y={position.y}
              size={tileSize}
              color={getTileColor(tile.type)}
              borderColor={selectedTile === tile ? '#fff' : '#333'}
              onClick={() => {
                setSelectedTile(tile);
                console.log(`Clicked tile at (${tile.x}, ${tile.y}) of type ${tile.type}`);
              }}
            />
          );
        })}
        
        {/* Add resource indicators */}
        {selectedMap.tiles.filter(t => t.resource).map((tile, index) => {
          const position = getTilePosition(tile.x, tile.y);
          return (
            <div
              key={`resource-${index}`}
              style={{
                position: 'absolute',
                left: `${position.x + tileSize/2 - 4}px`,
                top: `${position.y + tileSize/2 - 4}px`,
                width: '8px',
                height: '8px',
                backgroundColor: tile.resource === 'gold' ? '#fdd835' : 
                                tile.resource === 'iron' ? '#78909c' : 
                                tile.resource === 'wood' ? '#8d6e63' : '#dce775',
                borderRadius: '50%',
                zIndex: 3,
                boxShadow: '0 0 2px #000'
              }}
            />
          );
        })}
      </>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#262640',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
        
        <h2 style={{ marginBottom: '1rem' }}>Select Map - {terrainType} Terrain ({mapSize})</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading available maps...
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#ff6b35'
          }}>
            {error}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '1rem', 
                marginBottom: '1rem' 
              }}>
                {availableMaps.map(map => (
                  <button
                    key={map.id}
                    onClick={() => handleSelectMap(map)}
                    style={{
                      backgroundColor: selectedMap?.id === map.id ? '#4a4a8f' : '#333',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      opacity: selectedMap?.id === map.id ? 1 : 0.7
                    }}
                  >
                    {map.name}
                  </button>
                ))}
              </div>
              
              {selectedMap && (
                <div style={{ marginBottom: '1rem' }}>
                  <h3>{selectedMap.name}</h3>
                  <p>{selectedMap.description}</p>
                </div>
              )}
            </div>
            
            {selectedMap && (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  {selectedTile && (
                    <div style={{ 
                      backgroundColor: '#333', 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        backgroundColor: getTileColor(selectedTile.type),
                        borderRadius: '2px'
                      }} />
                      <span>
                        {getTileName(selectedTile.type)}
                        {selectedTile.resource && ` (${selectedTile.resource})`}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{
                  position: 'relative',
                  width: `${getMapDimensions(selectedMap).width}px`,
                  height: `${getMapDimensions(selectedMap).height}px`,
                  border: '1px solid #333',
                  overflow: 'hidden',
                  backgroundColor: '#111',
                  margin: '0 auto',
                  borderRadius: '8px',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                }}>
                  {renderMapTiles()}
                </div>
              </>
            )}
          </>
        )}
        
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#aaa' }}>
          Note: Select a map that will be used for your game. Maps are filtered based on your lobby settings ({mapSize} size, {terrainType} terrain).
          Click on a tile to see its details. Colored dots represent resources.
        </div>
      </div>
    </div>
  );
};

export default MapSelector; 