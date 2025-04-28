import * as THREE from 'three';

// 检查两点是否相邻（上下左右前后）
const areAdjacent = (point1, point2) => {
  const { x: x1, y: y1, z: z1 } = point1.index;
  const { x: x2, y: y2, z: z2 } = point2.index;
  
  // 检查是否只有一个维度相差1，其他维度相同
  const xDiff = Math.abs(x1 - x2);
  const yDiff = Math.abs(y1 - y2);
  const zDiff = Math.abs(z1 - z2);
  
  return (
    (xDiff === 1 && yDiff === 0 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 1 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 0 && zDiff === 1)
  );
};

// 获取点的所有相邻点
const getAdjacentPoints = (point, gridPoints) => {
  return gridPoints.filter(p => areAdjacent(point, p));
};

/**
 * 生成哈密顿路径 - 经过所有点的优化路径，只能相邻移动
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @returns {Array} - 优化后的路径
 */
export const generateOptimizedHamiltonianPath = (gridPoints, startPoint) => {
  if (!startPoint) return [];
  
  // 查找起点索引
  const startPointIndex = gridPoints.findIndex(point => 
    point.index.x === startPoint.index.x && 
    point.index.y === startPoint.index.y && 
    point.index.z === startPoint.index.z
  );
  
  if (startPointIndex === -1) return [];
  
  // 初始化路径和已访问点集合
  const path = [gridPoints[startPointIndex]];
  const visited = new Set([startPointIndex]);
  
  // 使用回溯法寻找经过所有点的路径
  const backtrack = (currentPoint) => {
    // 如果所有点都已经访问过，返回true
    if (visited.size === gridPoints.length) {
      return true;
    }
    
    // 获取当前点的所有相邻点
    const adjacentPoints = getAdjacentPoints(currentPoint, gridPoints);
    
    // 尝试每一个未访问的相邻点
    for (const nextPoint of adjacentPoints) {
      const nextIndex = gridPoints.findIndex(p => 
        p.index.x === nextPoint.index.x && 
        p.index.y === nextPoint.index.y && 
        p.index.z === nextPoint.index.z
      );
      
      if (!visited.has(nextIndex)) {
        // 访问这个点
        path.push(nextPoint);
        visited.add(nextIndex);
        
        // 递归尝试从这个点继续构建路径
        if (backtrack(nextPoint)) {
          return true;
        }
        
        // 如果不能从这个点构建一个完整路径，回溯
        path.pop();
        visited.delete(nextIndex);
      }
    }
    
    return false;
  };
  
  // 开始回溯
  backtrack(gridPoints[startPointIndex]);
  
  // 如果无法找到经过所有点的路径，可能是因为起点位置限制
  // 我们至少返回尽可能多的相邻点路径
  return path;
};

/**
 * 生成随机路径，只允许相邻移动（上下左右前后）
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @returns {Array} - 随机路径
 */
export const generateRandomPath = (gridPoints, startPoint) => {
  if (!startPoint) return [];
  
  // 查找起点索引
  const startPointIndex = gridPoints.findIndex(point => 
    point.index.x === startPoint.index.x && 
    point.index.y === startPoint.index.y && 
    point.index.z === startPoint.index.z
  );
  
  if (startPointIndex === -1) return [];
  
  // 初始化路径和已访问点
  const path = [gridPoints[startPointIndex]];
  const visited = new Set([startPointIndex]);
  
  let currentPoint = gridPoints[startPointIndex];
  let noMoreMoves = false;
  
  // 随机生成路径直到无法继续移动
  while (!noMoreMoves) {
    // 获取当前点的所有相邻点
    const adjacentPoints = getAdjacentPoints(currentPoint, gridPoints);
    
    // 过滤出未访问的相邻点
    const unvisitedAdjacentPoints = adjacentPoints.filter(p => {
      const index = gridPoints.findIndex(gp => 
        gp.index.x === p.index.x && 
        gp.index.y === p.index.y && 
        gp.index.z === p.index.z
      );
      return !visited.has(index);
    });
    
    if (unvisitedAdjacentPoints.length === 0) {
      // 如果没有未访问的相邻点，结束路径生成
      noMoreMoves = true;
    } else {
      // 随机选择一个未访问的相邻点
      const randomIndex = Math.floor(Math.random() * unvisitedAdjacentPoints.length);
      const nextPoint = unvisitedAdjacentPoints[randomIndex];
      
      // 添加到路径
      path.push(nextPoint);
      
      // 标记为已访问
      const pointIndex = gridPoints.findIndex(p => 
        p.index.x === nextPoint.index.x && 
        p.index.y === nextPoint.index.y && 
        p.index.z === nextPoint.index.z
      );
      visited.add(pointIndex);
      
      // 更新当前点
      currentPoint = nextPoint;
    }
  }
  
  return path;
};

/**
 * 计算两点之间的距离
 * @param {THREE.Vector3} p1 - 第一个点
 * @param {THREE.Vector3} p2 - 第二个点
 * @returns {number} - 距离
 */
export const calculateDistance = (p1, p2) => {
  return p1.distanceTo(p2);
};

/**
 * 生成最优路径
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @param {boolean} useRandomPath - 是否使用随机路径
 * @returns {Array} - 生成的路径
 */
export const generatePath = (gridPoints, startPoint, useRandomPath = false) => {
  if (!startPoint) return [];
  
  return useRandomPath 
    ? generateRandomPath(gridPoints, startPoint)
    : generateOptimizedHamiltonianPath(gridPoints, startPoint);
};

/**
 * 创建路径线几何体
 * @param {Array} path - 路径点数组
 * @returns {THREE.BufferGeometry} - 路径线几何体
 */
export const createPathLineGeometry = (path) => {
  if (!path || path.length < 2) return null;
  
  const points = path.map(p => p.position);
  return points;
};

/**
 * 移动沿路径的动画逻辑
 * @param {Array} path - 路径点数组
 * @param {Function} onStep - 步骤回调
 * @param {Function} onComplete - 完成回调
 * @param {number} speed - 移动速度 (0-1)
 * @returns {Object} - 动画控制器
 */
export const createPathAnimation = (path, onStep, onComplete, speed = 0.02) => {
  if (!path || path.length < 2) return null;
  
  let currentIndex = 0;
  let targetIndex = 1;
  let progress = 0;
  let isPlaying = false;
  
  const updatePosition = () => {
    if (!isPlaying) return;
    
    if (progress >= 1) {
      // 移动到下一段
      progress = 0;
      currentIndex = targetIndex;
      targetIndex++;
      
      // 检查是否到达终点
      if (targetIndex >= path.length) {
        stop();
        if (onComplete) onComplete();
        return;
      }
    }
    
    // 计算当前位置
    const currentPoint = path[currentIndex].position;
    const targetPoint = path[targetIndex].position;
    
    const position = new THREE.Vector3().lerpVectors(
      currentPoint, 
      targetPoint, 
      progress
    );
    
    // 更新进度
    progress += speed;
    
    // 回调当前位置
    if (onStep) {
      onStep({
        position,
        currentIndex,
        targetIndex,
        progress,
        totalSteps: path.length
      });
    }
  };
  
  const start = () => {
    isPlaying = true;
    currentIndex = 0;
    targetIndex = 1;
    progress = 0;
  };
  
  const pause = () => {
    isPlaying = false;
  };
  
  const resume = () => {
    isPlaying = true;
  };
  
  const stop = () => {
    isPlaying = false;
    currentIndex = 0;
    targetIndex = 1;
    progress = 0;
  };
  
  const tick = () => {
    if (isPlaying) {
      updatePosition();
    }
  };
  
  return {
    start,
    pause,
    resume,
    stop,
    tick,
    isPlaying: () => isPlaying
  };
}; 