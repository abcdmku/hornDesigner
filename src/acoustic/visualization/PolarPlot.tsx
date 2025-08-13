/**
 * PolarPlot Component
 * Visualizes horn dispersion patterns as polar plots
 */

import React, { useRef, useEffect } from 'react';
import { PolarData } from '../types';

interface PolarPlotProps {
  data: PolarData;
  width?: number;
  height?: number;
  title?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  color?: string;
  backgroundColor?: string;
}

export const PolarPlot: React.FC<PolarPlotProps> = ({
  data,
  width = 400,
  height = 400,
  title = '',
  showGrid = true,
  showLabels = true,
  color = '#00ff41',
  backgroundColor = '#0a0a0a'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate center and radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Draw grid if enabled
    if (showGrid) {
      drawPolarGrid(ctx, centerX, centerY, radius);
    }

    // Draw polar pattern
    drawPolarPattern(ctx, data, centerX, centerY, radius, color);

    // Draw labels if enabled
    if (showLabels) {
      drawLabels(ctx, centerX, centerY, radius);
    }

    // Draw title
    if (title) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(title, centerX, 30);
    }

    // Draw frequency label
    if (data.frequency) {
      ctx.fillStyle = '#888888';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.frequency} Hz`, centerX, height - 20);
    }
  }, [data, width, height, title, showGrid, showLabels, color, backgroundColor]);

  const drawPolarGrid = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number
  ) => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;

    // Draw concentric circles (magnitude rings)
    const rings = [0.25, 0.5, 0.75, 1.0];
    rings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * ring, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw radial lines (angle lines)
    const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    angles.forEach(angle => {
      const rad = angle * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + maxRadius * Math.cos(rad),
        centerY + maxRadius * Math.sin(rad)
      );
      ctx.stroke();
    });

    // Draw main axes with stronger lines
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    
    // Horizontal axis
    ctx.beginPath();
    ctx.moveTo(centerX - maxRadius, centerY);
    ctx.lineTo(centerX + maxRadius, centerY);
    ctx.stroke();
    
    // Vertical axis
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - maxRadius);
    ctx.lineTo(centerX, centerY + maxRadius);
    ctx.stroke();
  };

  const drawPolarPattern = (
    ctx: CanvasRenderingContext2D,
    data: PolarData,
    centerX: number,
    centerY: number,
    maxRadius: number,
    color: string
  ) => {
    const { angles, magnitudes } = data;
    
    if (angles.length === 0 || magnitudes.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Draw the polar pattern
    angles.forEach((angle, i) => {
      const magnitude = magnitudes[i] || 0;
      const r = maxRadius * Math.abs(magnitude);
      
      // Convert angle to screen coordinates
      // Rotate -90 degrees so 0° is at top
      const screenAngle = angle - Math.PI / 2;
      const x = centerX + r * Math.cos(screenAngle);
      const y = centerY + r * Math.sin(screenAngle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Close the path if it's a full circle
    if (Math.abs(angles[angles.length - 1] - angles[0]) >= 2 * Math.PI - 0.1) {
      ctx.closePath();
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Angle labels
    const angleLabels = [
      { angle: 0, label: '0°' },
      { angle: 30, label: '30°' },
      { angle: 60, label: '60°' },
      { angle: 90, label: '90°' },
      { angle: -30, label: '-30°' },
      { angle: -60, label: '-60°' },
      { angle: -90, label: '-90°' }
    ];

    angleLabels.forEach(({ angle, label }) => {
      const rad = (angle - 90) * Math.PI / 180; // Rotate so 0° is at top
      const x = centerX + (radius + 20) * Math.cos(rad);
      const y = centerY + (radius + 20) * Math.sin(rad);
      ctx.fillText(label, x, y);
    });

    // Magnitude labels (dB scale)
    ctx.textAlign = 'left';
    const dbLabels = [
      { mag: 1.0, label: '0 dB' },
      { mag: 0.75, label: '-2.5 dB' },
      { mag: 0.5, label: '-6 dB' },
      { mag: 0.25, label: '-12 dB' }
    ];

    dbLabels.forEach(({ mag, label }) => {
      const x = centerX + 5;
      const y = centerY - radius * mag;
      ctx.fillText(label, x, y);
    });
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-800 rounded"
        style={{ backgroundColor }}
      />
      {data.axis && (
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          {data.axis === 'horizontal' ? 'H-plane' : 'V-plane'}
        </div>
      )}
    </div>
  );
};

/**
 * Helper component to display multiple polar plots
 */
interface MultiPolarPlotProps {
  horizontalData: PolarData;
  verticalData: PolarData;
  width?: number;
  height?: number;
  title?: string;
}

export const MultiPolarPlot: React.FC<MultiPolarPlotProps> = ({
  horizontalData,
  verticalData,
  width = 800,
  height = 400,
  title = 'Dispersion Pattern'
}) => {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      )}
      <div className="flex gap-4">
        <PolarPlot
          data={horizontalData}
          width={width / 2}
          height={height}
          title="Horizontal Dispersion"
          color="#00ff41"
        />
        <PolarPlot
          data={verticalData}
          width={width / 2}
          height={height}
          title="Vertical Dispersion"
          color="#41a0ff"
        />
      </div>
    </div>
  );
};