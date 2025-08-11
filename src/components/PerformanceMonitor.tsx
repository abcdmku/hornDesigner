import { Perf } from 'r3f-perf';
import { useFrame } from '@react-three/fiber';
import { useState, useEffect, useRef } from 'react';

interface PerformanceMonitorProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPerformanceChange?: (fps: number) => void;
  showGraphs?: boolean;
  minimal?: boolean;
}

export default function PerformanceMonitor({
  visible = true,
  position = 'top-left',
  onPerformanceChange,
  showGraphs = true,
  minimal = false
}: PerformanceMonitorProps) {
  const [averageFPS, setAverageFPS] = useState(60);
  const fpsHistoryRef = useRef<number[]>([]);
  
  // Track FPS over time
  useFrame((_, delta) => {
    const currentFPS = 1 / delta;
    
    // Update FPS history
    fpsHistoryRef.current = [...fpsHistoryRef.current, currentFPS];
    // Keep only last 60 frames for average calculation
    if (fpsHistoryRef.current.length > 60) {
      fpsHistoryRef.current.shift();
    }
    
    // Calculate average FPS when we have enough samples
    if (fpsHistoryRef.current.length >= 60) {
      const avg = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
      setAverageFPS(avg);
      
      // Notify parent component of performance changes
      if (onPerformanceChange && avg !== averageFPS) {
        onPerformanceChange(avg);
      }
    }
  });
  
  // Log performance warnings
  useEffect(() => {
    if (averageFPS < 30) {
      console.warn(`Performance warning: FPS dropped to ${averageFPS.toFixed(1)}`);
    }
  }, [averageFPS]);
  
  if (!visible) {
    return null;
  }
  
  return (
    <Perf 
      position={position}
      showGraph={showGraphs}
      minimal={minimal}
      matrixUpdate={true}
      logsPerSecond={4}
      className="performance-monitor"
      style={{
        position: 'absolute',
        zIndex: 1000,
      }}
    />
  );
}

// Performance adapter hook for automatic quality adjustment
export function usePerformanceAdapter(
  targetFPS: number = 50,
  onQualityChange?: (quality: 'high' | 'medium' | 'low') => void
) {
  const [currentQuality, setCurrentQuality] = useState<'high' | 'medium' | 'low'>('high');
  const bufferRef = useRef<number[]>([]);
  
  const handlePerformanceChange = (fps: number) => {
    // Update buffer
    bufferRef.current = [...bufferRef.current, fps];
    if (bufferRef.current.length > 10) {
      bufferRef.current.shift();
    }
    
    // Calculate average FPS from buffer
    const avgFPS = bufferRef.current.reduce((a, b) => a + b, 0) / bufferRef.current.length;
    
    // Adjust quality based on performance
    if (avgFPS < targetFPS - 10 && currentQuality !== 'low') {
      const newQuality = currentQuality === 'high' ? 'medium' : 'low';
      setCurrentQuality(newQuality);
      if (onQualityChange) {
        onQualityChange(newQuality);
      }
      console.log(`Auto-adjusting quality to ${newQuality} (FPS: ${avgFPS.toFixed(1)})`);
    } else if (avgFPS > targetFPS + 10 && currentQuality !== 'high') {
      const newQuality = currentQuality === 'low' ? 'medium' : 'high';
      setCurrentQuality(newQuality);
      if (onQualityChange) {
        onQualityChange(newQuality);
      }
      console.log(`Auto-adjusting quality to ${newQuality} (FPS: ${avgFPS.toFixed(1)})`);
    }
  };
  
  return {
    currentQuality,
    handlePerformanceChange
  };
}