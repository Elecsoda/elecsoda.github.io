import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import DirectionArrows from './DirectionArrows';
import CubeFrame from './CubeFrame';
import { generatePath, createPathAnimation, createPathLineGeometry } from '../utils/pathUtils';

// 常量
const GRID_SIZE = 3;
const CUBE_SIZE = 0.8;
const GRID_SPACING = 2.0; // 增加格子间距，原来是默认的1.0

// 辅助函数 - 生成立方体网格点
const generateGridPoints = () => {
  const points = [];
  const offset = ((GRID_SIZE - 1) / 2) * GRID_SPACING; // 调整偏移量计算
  
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        points.push({
          index: { x, y, z },
          position: new THREE.Vector3(
            x * GRID_SPACING - offset, 
            y * GRID_SPACING - offset, 
            z * GRID_SPACING - offset
          ),
        });
      }
    }
  }
  
  return points;
};

const CubeNavigation = forwardRef((props, ref) => {
  const {
    manualMode,
    selectedStartPoint,
    currentPath,
    onPathUpdate,
    selectingStartPoint,
    onStartPointSelect,
    tempSelectedPoint
  } = props;
  
  const groupRef = useRef();
  const controlsRef = useRef();
  const gridPoints = useRef(generateGridPoints());
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [pathLine, setPathLine] = useState(null);
  const { camera, raycaster, mouse, scene, gl } = useThree();
  
  // 方向箭头功能
  const [enabledDirections, setEnabledDirections] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const meshRefs = useRef({});
  
  // 动画状态
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [animationSphere, setAnimationSphere] = useState(null);
  const pathAnimation = useRef(null);
  
  // 路径生成动画
  const [generatingPath, setGeneratingPath] = useState(false);
  const [generatedPath, setGeneratedPath] = useState([]);
  const [pathAnimationTimer, setPathAnimationTimer] = useState(null);
  const [currentAnimationStep, setCurrentAnimationStep] = useState(0);
  
  // 存储所有点的mesh引用
  const storeMeshRef = (index, ref) => {
    if (ref) {
      meshRefs.current[`${index.x}-${index.y}-${index.z}`] = ref;
    }
  };
  
  // 重置方块颜色
  const resetCubeColors = () => {
    // 实现重置颜色的逻辑
  };
  
  // 检查可用方向
  const updateEnabledDirections = (currentPos) => {
    if (!currentPos) return [];
    
    const directions = [];
    const { x, y, z } = currentPos.index;
    
    // 检查六个方向
    if (x < GRID_SIZE - 1) directions.push('x+');
    if (x > 0) directions.push('x-');
    if (y < GRID_SIZE - 1) directions.push('y+');
    if (y > 0) directions.push('y-');
    if (z < GRID_SIZE - 1) directions.push('z+');
    if (z > 0) directions.push('z-');
    
    setEnabledDirections(directions);
  };
  
  // 处理方向箭头点击
  const handleDirectionClick = (direction) => {
    if (!currentPosition || !manualMode) return;
    
    const { x, y, z } = currentPosition.index;
    let nextPoint;
    
    // 计算下一个点的索引
    switch (direction) {
      case 'x+': nextPoint = findPointByIndex(x + 1, y, z); break;
      case 'x-': nextPoint = findPointByIndex(x - 1, y, z); break;
      case 'y+': nextPoint = findPointByIndex(x, y + 1, z); break;
      case 'y-': nextPoint = findPointByIndex(x, y - 1, z); break;
      case 'z+': nextPoint = findPointByIndex(x, y, z + 1); break;
      case 'z-': nextPoint = findPointByIndex(x, y, z - 1); break;
      default: return;
    }
    
    if (nextPoint) {
      handlePointSelection(nextPoint);
    }
  };
  
  // 通过索引查找点
  const findPointByIndex = (x, y, z) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE || z < 0 || z >= GRID_SIZE) {
      return null;
    }
    return gridPoints.current.find(p => 
      p.index.x === x && p.index.y === y && p.index.z === z);
  };
  
  // 处理点选择
  const handlePointSelection = (point) => {
    if (!point) return;
    
    let newPath = [...currentPath];
    
    // 如果是第一个点或手动模式下的新的起点
    if (newPath.length === 0 || (manualMode && !currentPosition)) {
      newPath = [point];
      setCurrentPosition(point);
    } else if (manualMode) {
      // 手动模式下添加到路径中
      newPath.push(point);
      setCurrentPosition(point);
    }
    
    // 更新可用方向
    updateEnabledDirections(point);
    
    // 更新路径
    onPathUpdate(newPath);
    
    // 更新路径线
    updatePathLine(newPath);
  };
  
  // 更新路径线
  const updatePathLine = (path) => {
    if (path.length < 2) {
      setPathLine(null);
      return;
    }
    
    const points = path.map(p => p.position);
    setPathLine(points);
  };
  
  // 处理层级选择器选择的点
  useEffect(() => {
    if (selectedStartPoint && !currentPath.some(p => 
      p.index.x === selectedStartPoint.index.x && 
      p.index.y === selectedStartPoint.index.y && 
      p.index.z === selectedStartPoint.index.z)) {
      
      // 查找完整的点对象
      const fullPoint = findPointByIndex(
        selectedStartPoint.index.x,
        selectedStartPoint.index.y,
        selectedStartPoint.index.z
      );
      
      if (fullPoint) {
        // 设置为起点
        const newPath = [fullPoint];
        onPathUpdate(newPath);
        setCurrentPosition(fullPoint);
        updateEnabledDirections(fullPoint);
      }
    }
  }, [selectedStartPoint]);
  
  // 生成自动路径
  const handleGeneratePath = (useRandomPath = true) => {
    if (!currentPath[0]) return;
    
    // 生成路径
    const startPoint = currentPath[0];
    const newPath = generatePath(gridPoints.current, startPoint, useRandomPath);
    
    // 开始路径生成动画
    setGeneratingPath(true);
    setGeneratedPath([startPoint]);
    setCurrentAnimationStep(1);
    
    // 设置定时器，逐步显示路径
    const timerId = setInterval(() => {
      setCurrentAnimationStep(prevStep => {
        if (prevStep >= newPath.length) {
          clearInterval(timerId);
          setGeneratingPath(false);
          
          // 完成路径生成动画后，更新路径
          onPathUpdate(newPath);
          updatePathLine(newPath);
          
          // 创建动画控制器
          pathAnimation.current = createPathAnimation(
            newPath,
            handleAnimationStep,
            handleAnimationComplete,
            0.02
          );
          
          return prevStep;
        }
        
        // 逐步更新生成的路径
        setGeneratedPath(newPath.slice(0, prevStep + 1));
        updatePathLine(newPath.slice(0, prevStep + 1));
        
        return prevStep + 1;
      });
    }, 100); // 每100毫秒添加一个点
    
    setPathAnimationTimer(timerId);
    
    return newPath;
  };
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (pathAnimationTimer) {
        clearInterval(pathAnimationTimer);
      }
    };
  }, [pathAnimationTimer]);
  
  // 动画步骤回调
  const handleAnimationStep = (data) => {
    if (!animationSphere) return;
    
    // 更新球体位置
    animationSphere.position.copy(data.position);
  };
  
  // 动画完成回调
  const handleAnimationComplete = () => {
    setAnimationPlaying(false);
    setAnimationPaused(false);
  };
  
  // 开始路径动画
  const startPathAnimation = () => {
    if (!currentPath || currentPath.length < 2 || manualMode) return;
    
    // 如果没有动画控制器，重新生成路径
    if (!pathAnimation.current) {
      handleGeneratePath(true);
    }
    
    // 创建球体 (如果不存在)
    if (!animationSphere) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      setAnimationSphere(sphere);
    }
    
    // 开始动画
    if (pathAnimation.current) {
      pathAnimation.current.start();
      setAnimationPlaying(true);
      setAnimationPaused(false);
    }
  };
  
  // 暂停路径动画
  const pausePathAnimation = () => {
    if (pathAnimation.current && animationPlaying && !animationPaused) {
      pathAnimation.current.pause();
      setAnimationPaused(true);
    }
  };
  
  // 恢复路径动画
  const resumePathAnimation = () => {
    if (pathAnimation.current && animationPlaying && animationPaused) {
      pathAnimation.current.resume();
      setAnimationPaused(false);
    }
  };
  
  // 停止路径动画
  const stopPathAnimation = () => {
    if (pathAnimation.current) {
      pathAnimation.current.stop();
      setAnimationPlaying(false);
      setAnimationPaused(false);
    }
  };
  
  // 处理悬停
  const handlePointHover = (event) => {
    if (!selectingStartPoint) return;
    
    event.stopPropagation();
    raycaster.setFromCamera(mouse, camera);
    
    // 获取所有可点击的对象
    const allMeshes = Object.values(meshRefs.current);
    const intersects = raycaster.intersectObjects(allMeshes);
    
    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      const pointKey = Object.keys(meshRefs.current).find(
        key => meshRefs.current[key] === hoveredObject
      );
      
      if (pointKey) {
        const [x, y, z] = pointKey.split('-').map(Number);
        const point = findPointByIndex(x, y, z);
        setHoveredPoint(point);
      } else {
        setHoveredPoint(null);
      }
    } else {
      setHoveredPoint(null);
    }
  };
  
  // 处理点击事件
  const handleCubeClick = (event) => {
    if (!selectingStartPoint && !manualMode) return;
    
    event.stopPropagation();
    raycaster.setFromCamera(mouse, camera);
    
    // 获取所有可点击的对象
    const allMeshes = Object.values(meshRefs.current);
    const intersects = raycaster.intersectObjects(allMeshes);
    
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const pointKey = Object.keys(meshRefs.current).find(
        key => meshRefs.current[key] === clickedObject
      );
      
      if (pointKey) {
        const [x, y, z] = pointKey.split('-').map(Number);
        const clickedPoint = findPointByIndex(x, y, z);
        
        if (clickedPoint) {
          console.log('点击了坐标点:', clickedPoint.index);
          
          if (selectingStartPoint) {
            onStartPointSelect(clickedPoint);
          } else if (manualMode) {
            handlePointSelection(clickedPoint);
          }
        }
      }
    }
  };
  
  // 撤回上一步
  const undoLastStep = () => {
    if (!manualMode || currentPath.length <= 1) return;
    
    // 创建新路径，删除最后一个点
    const newPath = [...currentPath];
    newPath.pop();
    
    // 更新当前位置为新路径的最后一个点
    setCurrentPosition(newPath[newPath.length - 1]);
    
    // 更新路径
    onPathUpdate(newPath);
    
    // 更新路径线
    updatePathLine(newPath);
    
    // 更新可用方向
    updateEnabledDirections(newPath[newPath.length - 1]);
  };
  
  // 重置路径
  const resetPath = () => {
    // 保留起点，清除其他点
    if (currentPath.length > 0) {
      const startPoint = currentPath[0];
      onPathUpdate([startPoint]);
      setCurrentPosition(startPoint);
      updateEnabledDirections(startPoint);
      setPathLine(null);
    } else {
      onPathUpdate([]);
      setCurrentPosition(null);
      setEnabledDirections([]);
      setPathLine(null);
    }
    
    // 停止动画
    stopPathAnimation();
  };
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    generatePath: handleGeneratePath,
    startAnimation: startPathAnimation,
    pauseAnimation: pausePathAnimation,
    resumeAnimation: resumePathAnimation,
    stopAnimation: stopPathAnimation,
    undoLastStep: undoLastStep,
    resetPath: resetPath
  }));
  
  // 在每一帧更新动画
  useFrame(() => {
    if (pathAnimation.current && animationPlaying && !animationPaused) {
      pathAnimation.current.tick();
    }
  });
  
  // 初始化
  useEffect(() => {
    if (selectedStartPoint && currentPath.length === 0) {
      handlePointSelection(selectedStartPoint);
    }
  }, [selectedStartPoint]);
  
  // 更新方向箭头
  useEffect(() => {
    if (currentPosition && manualMode) {
      updateEnabledDirections(currentPosition);
    }
  }, [currentPosition, manualMode]);
  
  // 添加鼠标移动监听
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', handlePointHover);
    return () => {
      canvas.removeEventListener('pointermove', handlePointHover);
    };
  }, [selectingStartPoint]);
  
  // 模式切换时的清理
  useEffect(() => {
    if (manualMode) {
      stopPathAnimation();
    }
  }, [manualMode]);
  
  // 检查一个点是否为临时选择的点
  const isTempSelected = (point) => {
    if (!tempSelectedPoint) return false;
    return (
      point.index.x === tempSelectedPoint.index.x &&
      point.index.y === tempSelectedPoint.index.y &&
      point.index.z === tempSelectedPoint.index.z
    );
  };
  
  return (
    <>
      <OrbitControls ref={controlsRef} makeDefault />
      
      <group ref={groupRef} onClick={handleCubeClick}>
        {/* 绘制立方体框架 */}
        {gridPoints.current.map((point, index) => (
          <CubeFrame 
            key={index}
            position={point.position}
            size={CUBE_SIZE}
            color={0xcccccc}
            isSelected={currentPath.includes(point)}
            isStart={currentPath[0] === point}
            isEnd={currentPath.length > 1 && currentPath[currentPath.length - 1] === point}
            isHovered={hoveredPoint === point}
            isTempSelected={isTempSelected(point)}
            userData={{ isGridPoint: true, index: point.index }}
            setMeshRef={(ref) => storeMeshRef(point.index, ref)}
          />
        ))}
        
        {/* 绘制路径线 */}
        {pathLine && (
          <Line
            points={pathLine}
            color="deepskyblue"
            lineWidth={3}
          />
        )}
        
        {/* 动画球体 - 仅在动画播放时显示 */}
        {animationPlaying && animationSphere && (
          <mesh position={animationSphere.position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={0xff0000} />
          </mesh>
        )}
      </group>
      
      {/* 方向箭头 */}
      {manualMode && (
        <DirectionArrows 
          enabledDirections={enabledDirections}
          onDirectionClick={handleDirectionClick}
        />
      )}
    </>
  );
});

export default CubeNavigation; 