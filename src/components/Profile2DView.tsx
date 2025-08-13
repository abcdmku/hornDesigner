import { useEffect, useRef, useMemo } from 'react';
import { HornProfileParams } from '../types';
import { getProfile, getProfileDisplayName } from '../profiles';

interface Profile2DViewProps {
  hornParams: HornProfileParams;
  onToggle3D: () => void;
  onToggleAcousticPanel: () => void;
}

export default function Profile2DView({ hornParams, onToggle3D, onToggleAcousticPanel }: Profile2DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate the horn profile points
  const profilePoints = useMemo(() => {
    const { throatDiameter, mouthWidth, length, flareType, cutoffFrequency } = hornParams;
    
    return getProfile(flareType, {
      throatRadius: throatDiameter / 2,
      mouthRadius: mouthWidth / 2,
      length,
      segments: 100,
      cutoffFrequency
    });
  }, [hornParams]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Calculate bounds
    const padding = 60;
    const graphWidth = rect.width - padding * 2;
    const graphHeight = rect.height - padding * 2;

    // Find min/max values for scaling
    const maxRadius = Math.max(...profilePoints.map(p => p.radius));
    const maxX = hornParams.length;

    // Scale factors
    const xScale = graphWidth / maxX;
    const yScale = (graphHeight / 2) / maxRadius; // Scale to use half height for each direction

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (graphWidth * i / 10);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, rect.height - padding);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (graphHeight * i / 10);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    // X-axis (center line)
    ctx.beginPath();
    ctx.moveTo(padding, rect.height / 2);
    ctx.lineTo(rect.width - padding, rect.height / 2);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.stroke();

    // Draw profile (upper half)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    profilePoints.forEach((point, index) => {
      const x = padding + point.x * xScale;
      const y = rect.height / 2 - point.radius * yScale;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw profile (lower half - mirror)
    ctx.beginPath();
    profilePoints.forEach((point, index) => {
      const x = padding + point.x * xScale;
      const y = rect.height / 2 + point.radius * yScale;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw wall thickness if visible
    if (hornParams.wallThickness > 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      // Upper outer wall
      ctx.beginPath();
      profilePoints.forEach((point, index) => {
        const x = padding + point.x * xScale;
        const y = rect.height / 2 - (point.radius + hornParams.wallThickness) * yScale;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Lower outer wall
      ctx.beginPath();
      profilePoints.forEach((point, index) => {
        const x = padding + point.x * xScale;
        const y = rect.height / 2 + (point.radius + hornParams.wallThickness) * yScale;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      ctx.setLineDash([]);
    }

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    
    // X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const value = (maxX * i / 5).toFixed(0);
      const x = padding + (graphWidth * i / 5);
      ctx.fillText(`${value}mm`, x, rect.height - padding + 20);
    }
    
    // Y-axis labels (centered at 0)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = (maxRadius * (1 - i / 2)).toFixed(0); // Range from +maxRadius to -maxRadius
      const y = padding + (graphHeight * i / 4);
      ctx.fillText(`${value}mm`, padding - 10, y + 4);
    }
    
    // Axis titles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Length (mm)', rect.width / 2, rect.height - 20);
    
    ctx.save();
    ctx.translate(20, rect.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Radius (mm)', 0, 0);
    ctx.restore();

    // Draw dimensions
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    
    // Throat diameter
    ctx.textAlign = 'left';
    ctx.fillText(`Throat: ${hornParams.throatDiameter.toFixed(1)}mm`, padding + 10, rect.height / 2 - profilePoints[0].radius * yScale - 10);
    
    // Mouth diameter
    ctx.textAlign = 'right';
    const lastPoint = profilePoints[profilePoints.length - 1];
    ctx.fillText(`Mouth: ${hornParams.mouthWidth.toFixed(1)}mm`, rect.width - padding - 10, rect.height / 2 - lastPoint.radius * yScale - 10);

  }, [profilePoints, hornParams]);

  return (
    <div className="flex-1 flex flex-col gradient-bg relative">
      {/* Header with profile info */}
      <div className="absolute top-4 left-4 z-10">
        <div className="glass-dark rounded-xl p-4">
          <h2 className="text-xl font-bold text-white mb-2">2D Horn Profile</h2>
          <p className="text-sm text-gray-400">
            {getProfileDisplayName(hornParams.flareType)} Profile
          </p>
          <div className="mt-3 space-y-1 text-xs text-gray-300">
            <div>Length: {hornParams.length}mm</div>
            <div>Throat: {hornParams.throatDiameter}mm</div>
            <div>Mouth: {hornParams.mouthWidth}mm</div>
            {hornParams.cutoffFrequency && (
              <div>Cutoff: {hornParams.cutoffFrequency}Hz</div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Legend - moved to top right to avoid overlap */}
      <div className="absolute top-4 right-4 glass-dark rounded-lg p-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-300">Interior Profile</span>
          </div>
          {hornParams.wallThickness > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-red-500 border-dashed"></div>
              <span className="text-gray-300">Exterior Wall</span>
            </div>
          )}
        </div>
      </div>

      {/* View Toggle Buttons - moved to bottom left */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={onToggle3D}
          className="glass-button px-6 py-3 rounded-xl text-white font-medium hover:scale-105 transition-transform flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>View 3D</span>
        </button>
        
        <button
          onClick={onToggleAcousticPanel}
          className="glass-button px-4 py-2 rounded-lg text-white font-medium hover:scale-105 transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Acoustic</span>
        </button>
      </div>

    </div>
  );
}