import React, { useState } from 'react';

interface GridTileProps {
  x: number;
  y: number;
  size: number;
  color: string;
  borderColor?: string;
  onClick?: () => void;
}

/**
 * A reusable grid tile component for the game map
 */
const GridTile: React.FC<GridTileProps> = ({ 
  x, 
  y, 
  size, 
  color, 
  borderColor = '#333',
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        border: `1px solid ${borderColor}`,
        cursor: onClick ? 'pointer' : 'default',
        zIndex: isHovered ? 2 : 1,
        transition: 'transform 0.1s ease-in-out, filter 0.1s ease-in-out',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
      }}
    />
  );
};

export default GridTile; 