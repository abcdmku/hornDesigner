import React, { useEffect, useRef } from 'react';
import { ProfileParams } from '../profiles/types';
import { getProfileFunction } from '../profiles';

interface Profile2DViewV2Props {
  profileType: string;
  profileParams: ProfileParams;
  onToggle3D?: () => void;
}

export const Profile2DViewV2: React.FC<Profile2DViewV2Props> = ({ 
  profileType, 
  profileParams,
  onToggle3D 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get profile function and generate points
    const profileFunc = getProfileFunction(profileType);
    if (!profileFunc) {
      console.error('Unknown profile type:', profileType);
      return;
    }

    const profilePoints = profileFunc(profileParams);
    
    // Debug logging
    console.log('Profile2DViewV2 - profileType:', profileType);
    console.log('Profile2DViewV2 - profileParams:', profileParams);
    console.log('Profile2DViewV2 - profilePoints:', profilePoints?.slice(0, 5)); // Log first 5 points
    
    if (!profilePoints || profilePoints.length === 0) {
      console.error('No profile points generated');
      return;
    }

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
    const maxRadius = Math.max(...profilePoints.map(p => p.r));
    const maxZ = profileParams.length;

    // Scale factors
    const xScale = graphWidth / maxZ;
    const yScale = (graphHeight / 2) / maxRadius;

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
      const x = padding + point.z * xScale;
      const y = rect.height / 2 - point.r * yScale;
      
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
      const x = padding + point.z * xScale;
      const y = rect.height / 2 + point.r * yScale;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    
    // X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const value = (maxZ * i / 5).toFixed(0);
      const x = padding + (graphWidth * i / 5);
      ctx.fillText(`${value}mm`, x, rect.height - padding + 20);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = (maxRadius * (1 - i / 2)).toFixed(0);
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
    ctx.fillText(
      `Throat: ${(profileParams.throatRadius * 2).toFixed(1)}mm`, 
      padding + 10, 
      rect.height / 2 - profilePoints[0].r * yScale - 10
    );
    
    // Mouth diameter
    ctx.textAlign = 'right';
    const lastPoint = profilePoints[profilePoints.length - 1];
    ctx.fillText(
      `Mouth: ${(profileParams.mouthRadius * 2).toFixed(1)}mm`, 
      rect.width - padding - 10, 
      rect.height / 2 - lastPoint.r * yScale - 10
    );

  }, [profileType, profileParams]);

  return (
    <div className="flex-1 flex flex-col gradient-bg relative">
      {/* Header with profile info */}
      <div className="absolute top-4 left-4 z-10">
        <div className="glass-dark rounded-xl p-4">
          <h2 className="text-xl font-bold text-white mb-2">2D Horn Profile</h2>
          <p className="text-sm text-gray-400 capitalize">
            {profileType} Profile
          </p>
          <div className="mt-3 space-y-1 text-xs text-gray-300">
            <div>Length: {profileParams.length.toFixed(1)}mm</div>
            <div>Throat: {(profileParams.throatRadius * 2).toFixed(1)}mm</div>
            <div>Mouth: {(profileParams.mouthRadius * 2).toFixed(1)}mm</div>
            {profileParams.segments && (
              <div>Segments: {profileParams.segments}</div>
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

      {/* Legend */}
      <div className="absolute top-4 right-4 glass-dark rounded-lg p-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-300">Interior Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};