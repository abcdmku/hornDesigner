import { useState, useCallback, useMemo } from 'react';
import ParameterSidebar from './components/ParameterSidebar';
import Scene3D from './components/Scene3D';
import OptimizedHornGeometry from './components/OptimizedHornGeometry';
import PerformanceMonitor, { usePerformanceAdapter } from './components/PerformanceMonitor';
import { AppState } from './types';
import { MATERIALS, DEFAULT_HORN_PARAMS, DEFAULT_PLATE_PARAMS, DEFAULT_DRIVER_PARAMS } from './constants';
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

  return (
    <div className="flex h-screen gradient-bg overflow-hidden">
      {/* Parameter Sidebar */}
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
        estimatedCost={estimatedCost}
        performanceMode={performanceMode}
        onPerformanceModeChange={setPerformanceMode}
        showPerformanceMonitor={showPerformanceMonitor}
        onTogglePerformanceMonitor={setShowPerformanceMonitor}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Export Button */}
        <div className="glass-dark mx-4 mt-4 rounded-2xl px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">3D Horn Preview</h1>
                <p className="text-sm text-gray-400">
                  Real-time preview of your audio horn design
                </p>
              </div>
            </div>
            <button
              onClick={handleExportSTL}
              className="glass-button px-6 py-3 rounded-xl font-medium text-white flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export STL</span>
            </button>
          </div>
        </div>

        {/* 3D Scene */}
        <div className="flex-1 relative m-4">
          <div className="glass-dark rounded-2xl h-full shadow-2xl overflow-hidden">
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
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="glass-dark mx-4 mb-4 rounded-2xl px-6 py-3 shadow-xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">
                  <span className="text-blue-300 font-medium">{appState.hornParams.flareType}</span> | {appState.hornParams.roundMouth ? 'Round' : 'Rectangular'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">
                  Length: <span className="text-green-300 font-medium">{appState.hornParams.length}mm</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">
                  Material: <span className="text-purple-300 font-medium">{appState.selectedMaterial.name}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-green-400/30">
                <span className="text-green-300 font-bold">
                  ${estimatedCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App