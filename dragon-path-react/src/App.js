import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';
import CubeNavigation from './components/CubeNavigation';
import TouchGuide from './components/TouchGuide';
import ControlPanel from './components/ControlPanel';
import LayerSelector from './components/LayerSelector';
import './App.css';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
`;

function App() {
  const [manualMode, setManualMode] = useState(true);
  const [selectedStartPoint, setSelectedStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectingStartPoint, setSelectingStartPoint] = useState(false);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [tempSelectedPoint, setTempSelectedPoint] = useState(null);
  
  // 引用立方体导航组件
  const cubeNavigationRef = useRef();
  
  const handleModeChange = (mode) => {
    setManualMode(mode === 'manual');
    setCurrentPath([]);
    setSelectedStartPoint(null);
    setAnimationPlaying(false);
    setAnimationPaused(false);
    setTempSelectedPoint(null);
  };

  const handleStartPointSelect = (point) => {
    console.log('选择了起点:', point.index);
    setSelectedStartPoint(point);
    setSelectingStartPoint(false);
    setShowLayerSelector(false);
    setTempSelectedPoint(null);
  };

  const handleStartPointSelectionClick = () => {
    setShowLayerSelector(true);
  };

  const handlePathUpdate = (newPath) => {
    setCurrentPath(newPath);
  };
  
  // 生成路径
  const handleGeneratePath = (useRandomPath = true) => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.generatePath) return;
    cubeNavigationRef.current.generatePath(useRandomPath);
  };
  
  // 开始动画
  const handleStartAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.startAnimation) return;
    cubeNavigationRef.current.startAnimation();
    setAnimationPlaying(true);
    setAnimationPaused(false);
  };
  
  // 暂停动画
  const handlePauseAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.pauseAnimation) return;
    cubeNavigationRef.current.pauseAnimation();
    setAnimationPaused(true);
  };
  
  // 恢复动画
  const handleResumeAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.resumeAnimation) return;
    cubeNavigationRef.current.resumeAnimation();
    setAnimationPaused(false);
  };
  
  // 停止动画
  const handleStopAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.stopAnimation) return;
    cubeNavigationRef.current.stopAnimation();
    setAnimationPlaying(false);
    setAnimationPaused(false);
  };
  
  // 撤回上一步
  const handleUndoLastStep = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.undoLastStep) return;
    cubeNavigationRef.current.undoLastStep();
  };
  
  // 重置路径
  const handleResetPath = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.resetPath) return;
    cubeNavigationRef.current.resetPath();
  };
  
  // 开始绘制路线
  const handleStartDrawPath = () => {
    // 在手动模式下，重置为只有起点的路径，保留起点
    if (currentPath.length > 0) {
      const startPoint = currentPath[0];
      setCurrentPath([startPoint]);
    }
  };
  
  // 取消选择
  const handleCancelSelection = () => {
    setShowLayerSelector(false);
    setTempSelectedPoint(null);
  };
  
  // 临时选择点（预览）
  const handleTempPointSelect = (point) => {
    setTempSelectedPoint(point);
  };

  return (
    <AppContainer>
      <TouchGuide />
      
      <CanvasContainer>
        <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          <CubeNavigation 
            ref={cubeNavigationRef}
            manualMode={manualMode}
            selectedStartPoint={selectedStartPoint}
            currentPath={currentPath}
            onPathUpdate={handlePathUpdate}
            selectingStartPoint={selectingStartPoint}
            onStartPointSelect={handleStartPointSelect}
            tempSelectedPoint={tempSelectedPoint}
          />
        </Canvas>
      </CanvasContainer>
      
      <ControlPanel 
        manualMode={manualMode}
        onModeChange={handleModeChange}
        onStartPointSelectionClick={handleStartPointSelectionClick}
        currentPath={currentPath}
        selectingStartPoint={selectingStartPoint}
        animationPlaying={animationPlaying}
        animationPaused={animationPaused}
        onGeneratePath={handleGeneratePath}
        onStartAnimation={handleStartAnimation}
        onPauseAnimation={handlePauseAnimation}
        onResumeAnimation={handleResumeAnimation}
        onStopAnimation={handleStopAnimation}
        onUndoLastStep={handleUndoLastStep}
        onResetPath={handleResetPath}
        onStartDrawPath={handleStartDrawPath}
      />
      
      {showLayerSelector && (
        <LayerSelector 
          onSelect={handleStartPointSelect}
          onCancel={handleCancelSelection}
          onTempSelect={handleTempPointSelect}
        />
      )}
    </AppContainer>
  );
}

export default App; 