import { useState, useCallback, useMemo, useEffect } from 'react';
import ParameterSidebar from './components/ParameterSidebar';
import Scene3D from './components/Scene3D';
import OptimizedHornGeometry from './components/OptimizedHornGeometry';
import Profile2DView from './components/Profile2DView';
import PerformanceMonitor, { usePerformanceAdapter } from './components/PerformanceMonitor';
import { AcousticSidePanel } from './components/AcousticSidePanel';
import { AppState } from './types';
import { MATERIALS, DEFAULT_HORN_PARAMS, DEFAULT_PLATE_PARAMS, DEFAULT_DRIVER_PARAMS } from './constants';
import { DispersionAnalyzer } from './acoustic/analysis/Dispersion';
import { FrequencyResponseAnalyzer } from './acoustic/analysis/FrequencyResponse';
// import { calculateCost } from './utils/costCalculator'; // Temporarily disabled

function App() {
  // State management for all horn parameters
  const [appState, setAppState] = useState<AppState>({
    hornParams: DEFAULT_HORN_PARAMS,
    plateParams: DEFAULT_PLATE_PARAMS,
    driverParams: DEFAULT_DRIVER_PARAMS,
    selectedMaterial: MATERIALS[0], // Default to PLA
    showMountingPlate: true,
    showDriverMount: true
  });
  
  // View mode state
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [showAcousticPanel, setShowAcousticPanel] = useState(true);
  
  // Performance state
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  // Use performance adapter for automatic quality adjustment
  const { handlePerformanceChange } = usePerformanceAdapter(50, (quality) => {
    setPerformanceMode(quality);
  });

  // Calculate cost in real-time (simplified for now)
  const estimatedCost = useMemo(() => {
    // Simple cost estimation based on approximate volume
    const volume = appState.hornParams.length * appState.hornParams.mouthWidth * appState.hornParams.mouthWidth * 0.1; // mm³
    const mass = (volume / 1000) * appState.selectedMaterial.density; // grams
    const materialCost = mass * appState.selectedMaterial.costPerGram;
    return materialCost + 15; // Add $15 labor cost
  }, [appState.hornParams, appState.selectedMaterial]);

  // Calculate acoustic properties when parameters change
  useEffect(() => {
    const params = appState.hornParams;
    const mode = params.acousticCalculationMode || 'size-to-dispersion';
    
    if (mode === 'size-to-dispersion') {
      // Calculate dispersion from current horn size
      const targetFreq = params.targetFrequency || 1000;
      const mouthHeight = params.mouthHeight || params.mouthWidth;
      
      // Calculate beamwidth
      const horizontalBeamwidth = DispersionAnalyzer.calculateBeamwidth(
        params.mouthWidth,
        targetFreq
      );
      const verticalBeamwidth = DispersionAnalyzer.calculateBeamwidth(
        mouthHeight,
        targetFreq
      );
      
      // Calculate cutoff frequency
      const throatRadius = params.throatDiameter / 2000; // mm to m
      const cutoffFreq = FrequencyResponseAnalyzer.calculateCutoffFrequency(throatRadius);
      
      // Update calculated values
      setAppState(prev => ({
        ...prev,
        hornParams: {
          ...prev.hornParams,
          calculatedHorizontalDispersion: horizontalBeamwidth,
          calculatedVerticalDispersion: verticalBeamwidth,
          calculatedCutoffFrequency: cutoffFreq
        }
      }));
    } else if (mode === 'dispersion-to-size') {
      // Calculate required horn size from target dispersion
      const targetFreq = params.targetFrequency || 1000;
      const targetHDispersion = params.targetHorizontalDispersion || 60;
      const targetVDispersion = params.targetVerticalDispersion || 40;
      
      // Calculate required mouth dimensions
      const result = DispersionAnalyzer.calculateRequiredMouthSize({
        horizontalAngle: targetHDispersion,
        verticalAngle: targetVDispersion,
        frequency: targetFreq,
        mouthWidth: params.mouthWidth,
        mouthHeight: params.mouthHeight || params.mouthWidth
      });
      
      // Calculate optimal length based on cutoff frequency
      const cutoffFreq = params.cutoffFrequency || 500;
      const wavelength = 343000 / cutoffFreq; // Speed of sound in mm/s
      const optimalLength = wavelength / 4; // Quarter wavelength
      
      // Update calculated values
      setAppState(prev => ({
        ...prev,
        hornParams: {
          ...prev.hornParams,
          calculatedMouthWidth: result.requiredWidth,
          calculatedMouthHeight: result.requiredHeight,
          calculatedLength: optimalLength
        }
      }));
    }
  }, [
    appState.hornParams.mouthWidth,
    appState.hornParams.mouthHeight,
    appState.hornParams.length,
    appState.hornParams.throatDiameter,
    appState.hornParams.targetFrequency,
    appState.hornParams.targetHorizontalDispersion,
    appState.hornParams.targetVerticalDispersion,
    appState.hornParams.cutoffFrequency,
    appState.hornParams.acousticCalculationMode
  ]);

  // Event handlers for parameter updates
  const handleHornParamsChange = useCallback((hornParams: typeof appState.hornParams) => {
    setAppState(prev => ({ 
      ...prev, 
      hornParams,
      plateParams: {
        ...prev.plateParams,
        type: hornParams.roundMouth ? 'circle' : 'rect'
      }
    }));
  }, []);

  const handlePlateParamsChange = useCallback((plateParams: typeof appState.plateParams) => {
    setAppState(prev => ({ ...prev, plateParams }));
  }, []);

  const handleDriverParamsChange = useCallback((driverParams: typeof appState.driverParams) => {
    setAppState(prev => ({ ...prev, driverParams }));
  }, []);

  const handleMaterialChange = useCallback((selectedMaterial: typeof appState.selectedMaterial) => {
    setAppState(prev => ({ ...prev, selectedMaterial }));
  }, []);

  const handleToggleMountingPlate = useCallback((showMountingPlate: boolean) => {
    setAppState(prev => ({ ...prev, showMountingPlate }));
  }, []);

  const handleToggleDriverMount = useCallback((showDriverMount: boolean) => {
    setAppState(prev => ({ ...prev, showDriverMount }));
  }, []);

  // STL Export handler (temporarily disabled)
  const handleExportSTL = useCallback(() => {
    alert('STL export temporarily disabled while fixing geometry generation. Feature will be restored soon!');
  }, []);

  // Add to Cart handler
  const handleAddToCart = useCallback(() => {
    alert('Add to cart feature isn\'t built yet!');
  }, []);

  return (
    <div className="flex h-screen gradient-bg overflow-hidden">
      {/* Acoustic Side Panel - Left Side */}
      <AcousticSidePanel
        hornParams={appState.hornParams}
        isOpen={showAcousticPanel}
        onToggle={() => setShowAcousticPanel(!showAcousticPanel)}
      />

      {/* Parameter Sidebar - Right Side */}
      <ParameterSidebar
        hornParams={appState.hornParams}
        plateParams={appState.plateParams}
        driverParams={appState.driverParams}
        selectedMaterial={appState.selectedMaterial}
        showMountingPlate={appState.showMountingPlate}
        showDriverMount={appState.showDriverMount}
        onHornParamsChange={handleHornParamsChange}
        onPlateParamsChange={handlePlateParamsChange}
        onDriverParamsChange={handleDriverParamsChange}
        onMaterialChange={handleMaterialChange}
        onToggleMountingPlate={handleToggleMountingPlate}
        onToggleDriverMount={handleToggleDriverMount}
        performanceMode={performanceMode}
        onPerformanceModeChange={setPerformanceMode}
        showPerformanceMonitor={showPerformanceMonitor}
        onTogglePerformanceMonitor={setShowPerformanceMonitor}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Status and Export Button */}
        <div className="glass-dark mx-4 mt-4 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="px-4 py-2 glass-input rounded-xl">
                <span className="text-xl font-bold text-gray-300">
                  Cost as configured: <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">${estimatedCost.toFixed(2)}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Type:</span>
                <span className="text-blue-300 font-medium capitalize">{appState.hornParams.flareType}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Shape:</span>
                <span className={`font-medium ${appState.hornParams.roundMouth ? 'text-blue-300' : 'text-red-300'}`}>{appState.hornParams.roundMouth ? 'Round' : 'Rectangular'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Length:</span>
                <span className="text-green-300 font-medium">{appState.hornParams.length}mm</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Material:</span>
                <span className="text-purple-300 font-medium">{appState.selectedMaterial.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportSTL}
                className="glass-button px-6 py-3 rounded-xl font-medium text-white flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export STL</span>
              </button>
              <button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-6 py-3 rounded-xl font-medium text-white flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a2 2 0 002 2h8.5M17 21v-2a2 2 0 00-2-2H9" />
                </svg>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3D Scene or 2D Profile View */}
        <div className="flex-1 relative m-4">
          <div className="glass-dark rounded-2xl h-full shadow-2xl overflow-hidden relative">
            {viewMode === '3d' ? (
              <>
                <Scene3D>
                  <OptimizedHornGeometry
                    hornParams={appState.hornParams}
                    plateParams={appState.plateParams}
                    driverParams={appState.driverParams}
                    showMountingPlate={appState.showMountingPlate}
                    showDriverMount={appState.showDriverMount}
                    performanceMode={performanceMode}
                    enableLOD={true}
                  />
                  {showPerformanceMonitor && (
                    <PerformanceMonitor
                      visible={showPerformanceMonitor}
                      position="top-left"
                      onPerformanceChange={handlePerformanceChange}
                      showGraphs={true}
                      minimal={false}
                    />
                  )}
                </Scene3D>
                {/* View Toggle Buttons - bottom left in 3D view */}
                <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() => setViewMode('2d')}
                    className="glass-button px-6 py-3 rounded-xl text-white font-medium hover:scale-105 transition-transform flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>View 2D Profile</span>
                  </button>
                  
                  <button
                    onClick={() => setShowAcousticPanel(!showAcousticPanel)}
                    className="glass-button px-4 py-2 rounded-lg text-white font-medium hover:scale-105 transition-all flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Acoustic</span>
                  </button>
                </div>
              </>
            ) : (
              <Profile2DView 
                hornParams={appState.hornParams}
                onToggle3D={() => setViewMode('3d')}
                onToggleAcousticPanel={() => setShowAcousticPanel(!showAcousticPanel)}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App