import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ControlContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
`;

const RadioGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
`;

const RadioLabel = styled.label`
  margin: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const PathInfo = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #333;
`;

const PositionDisplay = styled.span`
  font-weight: bold;
  color: #2196F3;
`;

const TransparentButton = styled.button`
  &.selecting {
    background-color: rgba(255, 255, 255, 0.6);
  }
`;

const StartPointInfo = styled.div`
  margin-top: 5px;
  font-size: 12px;
  color: #666;
`;

const AnimationControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
`;

const ControlPanel = ({ 
  manualMode, 
  onModeChange, 
  onStartPointSelectionClick, 
  currentPath,
  selectingStartPoint,
  animationPlaying,
  animationPaused,
  onGeneratePath,
  onStartAnimation,
  onPauseAnimation,
  onResumeAnimation,
  onStopAnimation,
  onUndoLastStep,
  onResetPath,
  onStartDrawPath
}) => {
  const [selectingStart, setSelectingStart] = useState(false);
  
  // 同步外部选择状态
  useEffect(() => {
    setSelectingStart(selectingStartPoint);
  }, [selectingStartPoint]);
  
  const handleStartSelection = () => {
    setSelectingStart(true);
    onStartPointSelectionClick();
  };
  
  const getPathInfo = () => {
    if (currentPath.length === 0) {
      return '路径: 暂无';
    }
    return `路径: ${currentPath.length} 步`;
  };
  
  const getCurrentPosition = () => {
    if (currentPath.length === 0) {
      return '(?,?,?)';
    }
    const lastPoint = currentPath[currentPath.length - 1];
    return `(${lastPoint.index.x},${lastPoint.index.y},${lastPoint.index.z})`;
  };

  const getStartPointInfo = () => {
    if (currentPath.length === 0) {
      return '尚未选择起点';
    }
    const startPoint = currentPath[0];
    return `起点: (${startPoint.index.x},${startPoint.index.y},${startPoint.index.z})`;
  };

  return (
    <ControlContainer>
      <RadioGroup>
        <RadioLabel>
          <input 
            type="radio" 
            name="mode" 
            value="manual" 
            checked={manualMode} 
            onChange={() => onModeChange('manual')} 
          />
          手动模式
        </RadioLabel>
        <RadioLabel>
          <input 
            type="radio" 
            name="mode" 
            value="auto" 
            checked={!manualMode} 
            onChange={() => onModeChange('auto')} 
          />
          自动模式
        </RadioLabel>
      </RadioGroup>
      
      <ButtonGroup>
        <TransparentButton 
          onClick={handleStartSelection}
        >
          选择起点位置
        </TransparentButton>
        
        {manualMode ? (
          <>
            <button
              disabled={currentPath.length === 0}
              onClick={onStartDrawPath}
            >
              开始绘制路线
            </button>
            <button
              disabled={currentPath.length <= 1}
              onClick={onUndoLastStep}
            >
              撤回上一步
            </button>
          </>
        ) : (
          <>
            <button
              disabled={currentPath.length === 0}
              onClick={() => onGeneratePath(true)}
              title="生成随机路径，不需要遍历所有格子"
            >
              随机路径
            </button>
            <button
              disabled={currentPath.length === 0}
              onClick={() => onGeneratePath(false)}
              title="生成完整路径，遍历所有的格子"
            >
              完整路径
            </button>
          </>
        )}
        
        <button onClick={onResetPath}>重置路径</button>
      </ButtonGroup>
      
      {!manualMode && currentPath.length > 1 && (
        <AnimationControls>
          {!animationPlaying ? (
            <button onClick={onStartAnimation}>播放动画</button>
          ) : animationPaused ? (
            <button onClick={onResumeAnimation}>继续</button>
          ) : (
            <button onClick={onPauseAnimation}>暂停</button>
          )}
          
          {animationPlaying && (
            <button onClick={onStopAnimation}>停止</button>
          )}
        </AnimationControls>
      )}
      
      <PathInfo>
        {getPathInfo()}
        {manualMode && (
          <div>
            当前位置: <PositionDisplay>{getCurrentPosition()}</PositionDisplay>
          </div>
        )}
        <StartPointInfo>{getStartPointInfo()}</StartPointInfo>
      </PathInfo>
    </ControlContainer>
  );
};

export default ControlPanel; 