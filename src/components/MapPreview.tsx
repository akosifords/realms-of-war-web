import React from 'react';

interface GameMap {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  tiles: any[];
  hexagonal: boolean;
  mapSize: { width: number; height: number };
  playerCount: number;
  previewUrl?: string;
}

interface MapPreviewProps {
  map: GameMap;
  selected: boolean;
  onClick: () => void;
}

const MapPreview: React.FC<MapPreviewProps> = ({ map, selected, onClick }) => {
  // Default preview for maps without a thumbnail
  const defaultPreview = (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a2e',
        color: '#888'
      }}
    >
      {map.name} ({map.mapSize.width}x{map.mapSize.height})
    </div>
  );
  
  return (
    <div 
      onClick={onClick}
      style={{ 
        width: '180px',
        height: '120px',
        margin: '0.5rem',
        cursor: 'pointer',
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden',
        border: selected ? '3px solid #ff6b35' : '1px solid #333',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        boxShadow: selected ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'
      }}
    >
      {/* Map preview image or fallback */}
      {map.previewUrl ? (
        <img 
          src={map.previewUrl} 
          alt={map.name} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block'
          }} 
        />
      ) : defaultPreview}
      
      {/* Map details overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '0.3rem 0.5rem',
        fontSize: '0.8rem',
      }}>
        <div style={{ 
          color: 'white', 
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '2px'
        }}>
          {map.name}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          color: '#ccc',
          fontSize: '0.7rem'
        }}>
          <span>{map.mapSize.width}x{map.mapSize.height}</span>
          <span>{map.playerCount} Players</span>
        </div>
      </div>
    </div>
  );
};

export default MapPreview; 