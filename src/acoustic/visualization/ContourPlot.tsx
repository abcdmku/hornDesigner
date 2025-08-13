/**
 * ContourPlot Component
 * Visualizes dispersion patterns as frequency vs angle contour plots
 */

import React, { useRef, useEffect } from 'react';
import { HornProfileParams } from '../../lib/types';

interface ContourPlotProps {
  hornParams: HornProfileParams;
  axis: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
  title?: string;
  showColorbar?: boolean;
}

export const ContourPlot: React.FC<ContourPlotProps> = ({
  hornParams,
  axis,
  width = 400,
  height = 300,
  title = '',
  showColorbar = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // For HiDPI: render at 2x resolution
  const renderScale = 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas internal resolution for HiDPI
    canvas.width = width * renderScale;
    canvas.height = height * renderScale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // All coordinates below are scaled for HiDPI
    const margin = { top: 30 * renderScale, right: (showColorbar ? 80 : 20) * renderScale, bottom: 50 * renderScale, left: 60 * renderScale };
    const plotWidth = (width * renderScale) - margin.left - margin.right;
    const plotHeight = (height * renderScale) - margin.top - margin.bottom;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width * renderScale, height * renderScale);

    // Generate frequency and angle ranges (higher resolution)
    const frequencies = generateLogFrequencies(20, 20000, 200);
    const angles = generateLinearAngles(-90, 90, 200);

    // Get mouth dimension for this axis
    const mouthDimension = axis === 'horizontal'
      ? hornParams.mouthWidth
      : (hornParams.mouthHeight || hornParams.mouthWidth);

    // Calculate dispersion data for contour
    const contourData = calculateDispersionContour(frequencies, angles, mouthDimension);

    // Draw contour plot
    drawContour(ctx, contourData, frequencies, angles, margin, plotWidth, plotHeight);

    // Draw grid and axes
    drawAxes(ctx, frequencies, angles, margin, plotWidth, plotHeight);

    // Draw labels
    drawLabels(ctx, margin, plotWidth, plotHeight, title, axis, height * renderScale);

    // Draw colorbar
    if (showColorbar) {
      drawColorbar(ctx, margin, plotWidth, plotHeight);
    }
  }, [hornParams, axis, width, height, title, showColorbar]);

  const generateLogFrequencies = (min: number, max: number, points: number): number[] => {
    const frequencies: number[] = [];
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const step = (logMax - logMin) / (points - 1);
    for (let i = 0; i < points; i++) {
      frequencies.push(Math.pow(10, logMin + i * step));
    }
    return frequencies;
  };

  const generateLinearAngles = (min: number, max: number, points: number): number[] => {
    const angles: number[] = [];
    const step = (max - min) / (points - 1);
    for (let i = 0; i < points; i++) {
      angles.push(min + i * step);
    }
    return angles;
  };

  const calculateDispersionContour = (
    frequencies: number[],
    angles: number[],
    mouthDimension: number
  ): number[][] => {
    const K_CONSTANT = 29000; // Empirical constant
    const MM_TO_INCH = 0.0393701;
    
    const contour: number[][] = [];
    
    frequencies.forEach(freq => {
      const row: number[] = [];
      
      angles.forEach(angle => {
        // Calculate beamwidth for this frequency
        const dimensionInches = mouthDimension * MM_TO_INCH;
        const beamwidth = K_CONSTANT / (dimensionInches * freq);
        
        // Calculate response at this angle relative to beamwidth
        const normalizedAngle = Math.abs(angle) / (beamwidth / 2);
        
        // Use a directivity pattern approximation
        let response: number;
        if (normalizedAngle <= 1) {
          // Main lobe - cosine rolloff
          response = Math.cos(normalizedAngle * Math.PI / 2);
        } else if (normalizedAngle <= 2) {
          // First sidelobe
          response = -0.2 * Math.cos((normalizedAngle - 1) * Math.PI);
        } else {
          // Far field rolloff
          response = 0.05 / normalizedAngle;
        }
        
        // Convert to dB (0 to -40 dB range)
        const dB = Math.max(-40, 20 * Math.log10(Math.max(0.01, Math.abs(response))));
        row.push(dB);
      });
      
      contour.push(row);
    });
    
    return contour;
  };

  const drawContour = (
    ctx: CanvasRenderingContext2D,
    data: number[][],
    _frequencies: number[],
    _angles: number[],
    margin: any,
    plotWidth: number,
    plotHeight: number
  ) => {
    const imageData = ctx.createImageData(plotWidth, plotHeight);
    for (let x = 0; x < plotWidth; x++) {
      for (let y = 0; y < plotHeight; y++) {
        // Map pixel coordinates to data indices
        const freqIndex = Math.floor((x / plotWidth) * (data.length - 1));
        const angleIndex = Math.floor(((plotHeight - y - 1) / plotHeight) * (data[0]?.length - 1 || 0));
        if (freqIndex < data.length && angleIndex < data[freqIndex].length) {
          const dBValue = data[freqIndex][angleIndex];
          const color = dBToColor(dBValue);
          const pixelIndex = (y * plotWidth + x) * 4;
          imageData.data[pixelIndex] = color.r;
          imageData.data[pixelIndex + 1] = color.g;
          imageData.data[pixelIndex + 2] = color.b;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
    }
    ctx.putImageData(imageData, margin.left, margin.top);
  };

  const dBToColor = (dB: number): { r: number; g: number; b: number } => {
    // Standard dB color scale: red (-40dB) -> yellow (-20dB) -> green (-10dB) -> blue (0dB)
    const normalized = Math.max(0, Math.min(1, (dB + 40) / 40)); // Normalize -40 to 0 dB to 0-1
    
    if (normalized < 0.25) {
      // Red to orange
      const t = normalized / 0.25;
      return { r: 255, g: Math.floor(t * 128), b: 0 };
    } else if (normalized < 0.5) {
      // Orange to yellow
      const t = (normalized - 0.25) / 0.25;
      return { r: 255, g: Math.floor(128 + t * 127), b: 0 };
    } else if (normalized < 0.75) {
      // Yellow to green
      const t = (normalized - 0.5) / 0.25;
      return { r: Math.floor(255 * (1 - t)), g: 255, b: Math.floor(t * 128) };
    } else {
      // Green to blue
      const t = (normalized - 0.75) / 0.25;
      return { r: 0, g: Math.floor(255 * (1 - t)), b: Math.floor(128 + t * 127) };
    }
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    _frequencies: number[],
    _angles: number[],
    margin: any,
    plotWidth: number,
    plotHeight: number
  ) => {
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;

    // X-axis (frequency)
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    // Y-axis (angle)
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();

    // Frequency tick marks
    const freqTicks = [20, 100, 1000, 10000, 20000];
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    freqTicks.forEach(freq => {
      if (freq >= 20 && freq <= 20000) {
        const x = margin.left + plotWidth * Math.log10(freq / 20) / Math.log10(20000 / 20);
        
        // Tick mark
        ctx.beginPath();
        ctx.moveTo(x, margin.top + plotHeight);
        ctx.lineTo(x, margin.top + plotHeight + 5);
        ctx.stroke();
        
        // Label
        const label = freq >= 1000 ? `${freq / 1000}k` : freq.toString();
        ctx.fillText(label, x, margin.top + plotHeight + 18);
      }
    });

    // Angle tick marks
    const angleTicks = [-90, -45, 0, 45, 90];
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    angleTicks.forEach(angle => {
      const y = margin.top + plotHeight * (1 - (angle + 90) / 180);
      
      // Tick mark
      ctx.beginPath();
      ctx.moveTo(margin.left - 5, y);
      ctx.lineTo(margin.left, y);
      ctx.stroke();
      
      // Label
      ctx.fillText(`${angle}°`, margin.left - 8, y);
    });

    // Center line at 0 degrees
    ctx.strokeStyle = '#444444';
    ctx.setLineDash([2, 2]);
    const centerY = margin.top + plotHeight / 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, centerY);
    ctx.lineTo(margin.left + plotWidth, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
  margin: any,
  plotWidth: number,
  plotHeight: number,
  title: string,
  axis: string,
  scaledHeight: number
  ) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = `${12 * renderScale}px monospace`;

    // Title
    if (title) {
      ctx.textAlign = 'center';
      ctx.fillText(title, margin.left + plotWidth / 2, 20 * renderScale);
    }

    // Axis labels
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz)', margin.left + plotWidth / 2, scaledHeight - 10 * renderScale);

    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(15 * renderScale, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${axis === 'horizontal' ? 'Horizontal' : 'Vertical'} Angle (°)`, 0, 0);
    ctx.restore();
  };

  const drawColorbar = (
    ctx: CanvasRenderingContext2D,
    margin: any,
    plotWidth: number,
    plotHeight: number
  ) => {
    const colorbarWidth = 20;
    const colorbarX = margin.left + plotWidth + 20;
    const colorbarY = margin.top;
    const colorbarHeight = plotHeight;

    // Draw colorbar gradient
    const gradient = ctx.createLinearGradient(0, colorbarY + colorbarHeight, 0, colorbarY);
    gradient.addColorStop(0, 'rgb(255, 0, 0)');      // -40 dB
    gradient.addColorStop(0.25, 'rgb(255, 128, 0)'); // -30 dB
    gradient.addColorStop(0.5, 'rgb(255, 255, 0)');  // -20 dB
    gradient.addColorStop(0.75, 'rgb(0, 255, 128)'); // -10 dB
    gradient.addColorStop(1, 'rgb(0, 128, 255)');    // 0 dB

    ctx.fillStyle = gradient;
    ctx.fillRect(colorbarX, colorbarY, colorbarWidth, colorbarHeight);

    // Colorbar border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorbarX, colorbarY, colorbarWidth, colorbarHeight);

    // Colorbar labels
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    
    const dbLabels = [0, -10, -20, -30, -40];
    dbLabels.forEach((db, i) => {
      const y = colorbarY + (i / (dbLabels.length - 1)) * colorbarHeight;
      ctx.fillText(`${db} dB`, colorbarX + colorbarWidth + 5, y + 3);
    });
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width * renderScale}
        height={height * renderScale}
        className="border border-gray-700 rounded bg-gray-900"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

/**
 * Combined contour plots for horizontal and vertical dispersion
 */
interface DispersionContourPlotsProps {
  hornParams: HornProfileParams;
  width?: number;
  height?: number;
}

export const DispersionContourPlots: React.FC<DispersionContourPlotsProps> = ({
  hornParams,
  width = 400,
  height = 300
}) => {
  return (
    <div className="space-y-4">
      <ContourPlot
        hornParams={hornParams}
        axis="horizontal"
        width={width}
        height={height}
        title="Horizontal Dispersion"
        showColorbar={false}
      />
      <ContourPlot
        hornParams={hornParams}
        axis="vertical"
        width={width}
        height={height}
        title="Vertical Dispersion"
        showColorbar={false}
      />
    </div>
  );
};