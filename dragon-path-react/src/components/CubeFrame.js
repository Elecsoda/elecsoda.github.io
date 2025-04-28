import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const CubeFrame = ({ 
  position, 
  size = 0.8, 
  color = 0xcccccc, 
  isSelected = false,
  isStart = false,
  isEnd = false,
  isHovered = false,
  isTempSelected = false,
  userData = {},
  setMeshRef = null
}) => {
  const meshRef = useRef();
  
  // 回调meshRef
  useEffect(() => {
    if (setMeshRef && meshRef.current) {
      setMeshRef(meshRef.current);
    }
  }, [setMeshRef]);
  
  // 确定颜色
  let cubeColor = color;
  if (isStart) {
    cubeColor = 0x90EE90; // 浅绿色
  } else if (isEnd) {
    cubeColor = 0xFF6347; // 橙红色
  } else if (isSelected) {
    cubeColor = 0x00BFFF; // 深天蓝
  } else if (isTempSelected) {
    cubeColor = 0x9370DB; // 中紫色 - 临时选择点的颜色
  } else if (isHovered) {
    cubeColor = 0xFFFFCC; // 浅黄色
  }
  
  // 创建立方体几何体
  const edges = useMemo(() => {
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
  }, [size]);
  
  // 确定线条颜色和透明度
  const lineColor = isTempSelected ? 0x9370DB : 0x000000;
  const lineOpacity = isTempSelected ? 0.8 : 0.4;
  const lineWidth = isTempSelected ? 2 : 1;
  
  return (
    <group position={position}>
      {/* 立方体框架 - 只有当是路径上的点、起点、终点或临时选择点时才显示中心点 */}
      {(isSelected || isStart || isEnd || isTempSelected) && (
        <mesh ref={meshRef} userData={userData}>
          <sphereGeometry args={[size * 0.15, 16, 16]} />
          <meshBasicMaterial color={cubeColor} />
        </mesh>
      )}
      
      {/* 隐藏的点击区域 - 帮助点击检测 */}
      {!isSelected && !isStart && !isEnd && !isTempSelected && (
        <mesh ref={meshRef} userData={userData} visible={false}>
          <sphereGeometry args={[size * 0.4, 16, 16]} />
          <meshBasicMaterial transparent={true} opacity={0} />
        </mesh>
      )}
      
      {/* 立方体边框 */}
      <lineSegments>
        <primitive object={edges} attach="geometry" />
        <lineBasicMaterial 
          color={lineColor} 
          opacity={lineOpacity} 
          transparent={true}
          linewidth={lineWidth}
        />
      </lineSegments>
    </group>
  );
};

export default CubeFrame; 