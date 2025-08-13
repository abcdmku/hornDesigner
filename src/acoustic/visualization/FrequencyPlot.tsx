/**
 * FrequencyPlot Component
 * Visualizes frequency response, impedance, and other frequency-dependent data
 */

import React, { useRef, useEffect } from 'react';
import { FrequencyResponseData, FrequencyPoint } from '../types';

interface FrequencyPlotProps {
  data: FrequencyResponseData | FrequencyPoint[];
  width?: number;
  height?: number;
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  plotType?: 'spl' | 'phase' | 'impedance' | 'directivity';
  showGrid?: boolean;
  showLegend?: boolean;
  color?: string;
  backgroundColor?: string;
  minFreq?: number;
  maxFreq?: number;
  minDb?: number;
  maxDb?: number;
}

export const FrequencyPlot: React.FC<FrequencyPlotProps> = ({
  data,
  width = 800,
  height = 400,
  title = 'Frequency Response',
  yAxisLabel = 'SPL (dB)',
  xAxisLabel = 'Frequency (Hz)',
  plotType = 'spl',
  showGrid = true,
  showLegend = false,
  color = '#00ff41',
  backgroundColor = '#0a0a0a',
  minFreq = 20,
  maxFreq = 20000,
  minDb = 60,
  maxDb = 120
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Extract response array from data
    const response = Array.isArray(data) ? data : data.response;
    if (!response || response.length === 0) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate plot area (with margins)
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, margin, plotWidth, plotHeight, minFreq, maxFreq, minDb, maxDb);
    }

    // Draw axes
    drawAxes(ctx, margin, plotWidth, plotHeight);

    // Draw frequency response curve
    drawFrequencyResponse(ctx, response, margin, plotWidth, plotHeight, 
                         minFreq, maxFreq, minDb, maxDb, plotType, color);

    // Draw labels
    drawLabels(ctx, margin, plotWidth, plotHeight, title, xAxisLabel, yAxisLabel,
              minFreq, maxFreq, minDb, maxDb);

    // Draw cutoff frequency line if available
    if (!Array.isArray(data) && data.cutoffFrequency) {
      drawCutoffLine(ctx, data.cutoffFrequency, margin, plotWidth, plotHeight,
                    minFreq, maxFreq);
    }

    // Draw legend if enabled
    if (showLegend) {
      drawLegend(ctx, margin, plotType, color);
    }
  }, [data, width, height, title, yAxisLabel, xAxisLabel, plotType, 
      showGrid, showLegend, color, backgroundColor, minFreq, maxFreq, minDb, maxDb]);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    margin: any,
    plotWidth: number,
    plotHeight: number,
    minFreq: number,
    maxFreq: number,
    minDb: number,
    maxDb: number
  ) => {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;

    // Logarithmic frequency grid lines
    const freqLines = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqLines.forEach(freq => {
      if (freq >= minFreq && freq <= maxFreq) {
        const x = margin.left + plotWidth * Math.log10(freq / minFreq) / 
                  Math.log10(maxFreq / minFreq);
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, margin.top + plotHeight);
        ctx.stroke();
      }
    });

    // Horizontal dB grid lines
    const dbStep = 10;
    for (let db = minDb; db <= maxDb; db += dbStep) {
      const y = margin.top + plotHeight * (1 - (db - minDb) / (maxDb - minDb));
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();
    }
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    margin: any,
    plotWidth: number,
    plotHeight: number
  ) => {
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();
  };

  const drawFrequencyResponse = (
    ctx: CanvasRenderingContext2D,
    response: FrequencyPoint[],
    margin: any,
    plotWidth: number,
    plotHeight: number,
    minFreq: number,
    maxFreq: number,
    minDb: number,
    maxDb: number,
    plotType: string,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    response.forEach(point => {
      if (point.frequency >= minFreq && point.frequency <= maxFreq) {
        // Calculate x position (logarithmic scale)
        const x = margin.left + plotWidth * Math.log10(point.frequency / minFreq) / 
                  Math.log10(maxFreq / minFreq);
        
        // Calculate y position based on plot type
        let value = 0;
        switch (plotType) {
          case 'spl':
            value = point.spl || 0;
            break;
          case 'phase':
            value = (point.phase || 0) + 90; // Shift phase to positive range
            break;
          case 'impedance':
            value = point.impedance ? 
              20 * Math.log10(Math.sqrt(point.impedance.real * point.impedance.real + 
                                       point.impedance.imaginary * point.impedance.imaginary)) : 0;
            break;
          case 'directivity':
            value = point.spl || 0; // Use SPL as proxy for directivity
            break;
        }
        
        const y = margin.top + plotHeight * (1 - (value - minDb) / (maxDb - minDb));
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });

    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 5;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    margin: any,
    plotWidth: number,
    plotHeight: number,
    title: string,
    xAxisLabel: string,
    yAxisLabel: string,
    minFreq: number,
    maxFreq: number,
    minDb: number,
    maxDb: number
  ) => {
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';

    // Title
    ctx.textAlign = 'center';
    ctx.fillText(title, margin.left + plotWidth / 2, 25);

    // X-axis label
    ctx.fillText(xAxisLabel, margin.left + plotWidth / 2, 
                margin.top + plotHeight + 45);

    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(20, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();

    // Frequency labels
    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    const freqLabels = [20, 100, 1000, 10000];
    freqLabels.forEach(freq => {
      if (freq >= minFreq && freq <= maxFreq) {
        const x = margin.left + plotWidth * Math.log10(freq / minFreq) / 
                  Math.log10(maxFreq / minFreq);
        const label = freq >= 1000 ? `${freq / 1000}k` : freq.toString();
        ctx.fillText(label, x, margin.top + plotHeight + 15);
      }
    });

    // dB labels
    ctx.textAlign = 'right';
    const dbStep = 10;
    for (let db = minDb; db <= maxDb; db += dbStep) {
      const y = margin.top + plotHeight * (1 - (db - minDb) / (maxDb - minDb));
      ctx.fillText(db.toString(), margin.left - 10, y + 3);
    }
  };

  const drawCutoffLine = (
    ctx: CanvasRenderingContext2D,
    cutoffFreq: number,
    margin: any,
    plotWidth: number,
    plotHeight: number,
    minFreq: number,
    maxFreq: number
  ) => {
    if (cutoffFreq >= minFreq && cutoffFreq <= maxFreq) {
      const x = margin.left + plotWidth * Math.log10(cutoffFreq / minFreq) / 
                Math.log10(maxFreq / minFreq);
      
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // Label
      ctx.fillStyle = '#ff4444';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`fc: ${cutoffFreq.toFixed(0)} Hz`, x, margin.top - 5);
    }
  };

  const drawLegend = (
    ctx: CanvasRenderingContext2D,
    margin: any,
    plotType: string,
    color: string
  ) => {
    const legendX = margin.left + 20;
    const legendY = margin.top + 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(legendX - 5, legendY - 15, 120, 30);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const legendText: Record<string, string> = {
      'spl': 'SPL',
      'phase': 'Phase',
      'impedance': 'Impedance',
      'directivity': 'Directivity'
    };
    
    ctx.fillText(legendText[plotType] || plotType, legendX + 25, legendY + 3);
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
    </div>
  );
};

/**
 * Helper component to display multiple frequency plots
 */
interface MultiFrequencyPlotProps {
  responseData: FrequencyResponseData;
  width?: number;
  height?: number;
}

export const MultiFrequencyPlot: React.FC<MultiFrequencyPlotProps> = ({
  responseData,
  width = 800,
  height = 600
}) => {
  return (
    <div className="space-y-4">
      <FrequencyPlot
        data={responseData}
        width={width}
        height={height / 2}
        title="Frequency Response"
        plotType="spl"
        yAxisLabel="SPL (dB)"
        minDb={60}
        maxDb={120}
        color="#00ff41"
      />
      <FrequencyPlot
        data={responseData}
        width={width}
        height={height / 2}
        title="Phase Response"
        plotType="phase"
        yAxisLabel="Phase (degrees)"
        minDb={-180}
        maxDb={180}
        color="#41a0ff"
      />
    </div>
  );
};