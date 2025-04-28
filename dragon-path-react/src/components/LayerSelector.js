import React, { useState } from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
`;

const LayerButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const LayerButton = styled.button`
  padding: 8px 15px;
  background-color: ${props => props.active ? '#4a90e2' : '#e1e1e1'};
  color: ${props => props.active ? 'white' : 'black'};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &:hover {
    background-color: ${props => props.active ? '#4a90e2' : '#d1d1d1'};
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-gap: 10px;
  margin-bottom: 15px;
`;

const GridCell = styled.button`
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #555;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
`;

const GRID_SIZE = 3;

const LayerSelector = ({ onSelect, onCancel, onTempSelect }) => {
  const [selectedLayer, setSelectedLayer] = useState(1);
  
  const handleLayerSelect = (layer) => {
    setSelectedLayer(layer);
  };
  
  const handleCellSelect = (x, z) => {
    // 选择了具体的格子，y 为层级，x 和 z 为格子坐标
    const point = {
      index: { x, y: selectedLayer - 1, z }
    };
    
    onSelect(point);
  };
  
  const handleCellHover = (x, z) => {
    if (onTempSelect) {
      const point = {
        index: { x, y: selectedLayer - 1, z }
      };
      onTempSelect(point);
    }
  };
  
  const handleCellLeave = () => {
    if (onTempSelect) {
      onTempSelect(null);
    }
  };
  
  // 生成九宫格按钮
  const renderGrid = () => {
    const grid = [];
    
    for (let z = 0; z < GRID_SIZE; z++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        grid.push(
          <GridCell 
            key={`${x}-${z}`}
            onClick={() => handleCellSelect(x, z)}
            onMouseEnter={() => handleCellHover(x, z)}
            onMouseLeave={handleCellLeave}
          >
            ({x},{z})
          </GridCell>
        );
      }
    }
    
    return grid;
  };

  return (
    <SelectorContainer>
      <Title>选择起点位置</Title>
      
      <LayerButtons>
        {[1, 2, 3].map(layer => (
          <LayerButton
            key={layer}
            active={selectedLayer === layer}
            onClick={() => handleLayerSelect(layer)}
          >
            层级 {layer}
          </LayerButton>
        ))}
      </LayerButtons>
      
      <GridContainer>
        {renderGrid()}
      </GridContainer>
      
      <ButtonRow>
        <button onClick={onCancel}>取消</button>
      </ButtonRow>
    </SelectorContainer>
  );
};

export default LayerSelector; 