/**
 * AcousticSidePanel Component
 * Toggleable side panel containing acoustic visualizations
 */

import React, { useState } from 'react';
import { HornProfileParams } from '../lib/types';
import { DispersionContourPlots } from '../acoustic/visualization/ContourPlot';
import { FrequencyPlot } from '../acoustic/visualization/FrequencyPlot';
import { FrequencyResponseAnalyzer } from '../acoustic/analysis/FrequencyResponse';
import { getProfile } from '../profiles';

interface AcousticSidePanelProps {
  hornParams: HornProfileParams;
  isOpen: boolean;
  onToggle: () => void;
}

export const AcousticSidePanel: React.FC<AcousticSidePanelProps> = ({
  hornParams,
  isOpen,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'dispersion' | 'frequency'>('dispersion');

  // Calculate frequency response data
  const frequencyResponseData = React.useMemo(() => {
    const profilePoints = getProfile(hornParams.flareType, {
      throatRadius: hornParams.throatDiameter / 2,
      mouthRadius: hornParams.mouthWidth / 2,
      length: hornParams.length,
      segments: 100,
      cutoffFrequency: hornParams.cutoffFrequency
    });

    return FrequencyResponseAnalyzer.calculateResponse(profilePoints, hornParams);
  }, [hornParams]);

  return (
    <div className="w-[28rem] glass-dark rounded-l-3xl m-4 mr-0 flex flex-col h-[calc(100vh-2rem)] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3 mb-2">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-white">Acoustic Analysis</h2>
              <p className="text-sm text-gray-400">Real-time Performance Metrics</p>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex mt-4 space-x-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dispersion')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dispersion'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Dispersion
            </button>
            <button
              onClick={() => setActiveTab('frequency')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'frequency'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Response
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'dispersion' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Frequency vs angle contour plots showing dispersion patterns at different frequencies.
                Color represents SPL relative to on-axis response.
              </div>
              
              <DispersionContourPlots
                hornParams={hornParams}
                width={350}
                height={250}
              />
              
              {/* Dispersion Summary */}
              <div className="mt-6 bg-purple-900/20 rounded-lg p-4 border border-purple-600/30">
                <h3 className="text-sm font-bold text-purple-300 mb-3">Current Dispersion</h3>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Analysis Frequency:</span>
                    <span className="text-white">{hornParams.targetFrequency || 1000} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Horizontal:</span>
                    <span className="text-white">
                      {hornParams.calculatedHorizontalDispersion?.toFixed(0) || '--'}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vertical:</span>
                    <span className="text-white">
                      {hornParams.calculatedVerticalDispersion?.toFixed(0) || '--'}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cutoff Freq:</span>
                    <span className="text-white">
                      {hornParams.calculatedCutoffFrequency?.toFixed(0) || '--'} Hz
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'frequency' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Frequency response showing SPL and phase characteristics across the audio spectrum.
              </div>
              
              <FrequencyPlot
                data={frequencyResponseData}
                width={350}
                height={200}
                title="SPL Response"
                plotType="spl"
                yAxisLabel="SPL (dB)"
                minDb={60}
                maxDb={120}
                color="#00ff41"
                backgroundColor="#0a0a0a"
              />
              
              <FrequencyPlot
                data={frequencyResponseData}
                width={350}
                height={200}
                title="Phase Response"
                plotType="phase"
                yAxisLabel="Phase (°)"
                minDb={-180}
                maxDb={180}
                color="#41a0ff"
                backgroundColor="#0a0a0a"
              />
              
              {/* Response Summary */}
              <div className="mt-6 bg-green-900/20 rounded-lg p-4 border border-green-600/30">
                <h3 className="text-sm font-bold text-green-300 mb-3">Response Summary</h3>
                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cutoff Frequency:</span>
                    <span className="text-white">{frequencyResponseData.cutoffFrequency.toFixed(0)} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Efficiency:</span>
                    <span className="text-white">{(frequencyResponseData.efficiency || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Throat Impedance:</span>
                    <span className="text-white">
                      {frequencyResponseData.impedanceAtThroat ? Math.sqrt(
                        frequencyResponseData.impedanceAtThroat.real ** 2 + 
                        frequencyResponseData.impedanceAtThroat.imaginary ** 2
                      ).toFixed(0) : '--'} Ω
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};