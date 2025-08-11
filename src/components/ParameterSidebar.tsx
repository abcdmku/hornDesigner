import { HornProfileParams, MountPlateParams, DriverMountParams, MaterialType } from '../types';
import { MATERIALS } from '../constants';

interface ParameterSidebarProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
  selectedMaterial: MaterialType;
  showMountingPlate: boolean;
  showDriverMount: boolean;
  onHornParamsChange: (params: HornProfileParams) => void;
  onPlateParamsChange: (params: MountPlateParams) => void;
  onDriverParamsChange: (params: DriverMountParams) => void;
  onMaterialChange: (material: MaterialType) => void;
  onToggleMountingPlate: (show: boolean) => void;
  onToggleDriverMount: (show: boolean) => void;
  performanceMode?: 'high' | 'medium' | 'low';
  onPerformanceModeChange?: (mode: 'high' | 'medium' | 'low') => void;
  showPerformanceMonitor?: boolean;
  onTogglePerformanceMonitor?: (show: boolean) => void;
}

export default function ParameterSidebar({
  hornParams,
  plateParams,
  driverParams,
  selectedMaterial,
  showMountingPlate,
  showDriverMount,
  onHornParamsChange,
  onPlateParamsChange,
  onDriverParamsChange,
  onMaterialChange,
  onToggleMountingPlate,
  onToggleDriverMount,
  performanceMode = 'high',
  onPerformanceModeChange,
  showPerformanceMonitor = false,
  onTogglePerformanceMonitor
}: ParameterSidebarProps) {
  return (
    <div className="w-80 glass-dark rounded-r-3xl m-4 ml-0 flex flex-col h-[calc(100vh-2rem)] shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3 mb-2">
          <img src="./logo-icon.svg" alt="Logo" className="w-12 h-12" />
          <div>
            <h2 className="text-2xl font-bold text-white">Horn Designer</h2>
            <p className="text-sm text-gray-400">Professional Audio Design Tool</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Horn Parameters Section */}
        <div className="glass-section p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <h3 className="text-base font-semibold text-white">Horn Parameters</h3>
          </div>
          <div className="space-y-4">
            
            {/* Horn Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Horn Type
              </label>
              <select
                value={hornParams.flareType}
                onChange={(e) => onHornParamsChange({ 
                  ...hornParams, 
                  flareType: e.target.value as 'exponential' | 'conical' 
                })}
                className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
              >
                <option value="exponential" className="bg-gray-800 text-white">Exponential</option>
                <option value="conical" className="bg-gray-800 text-white">Conical</option>
              </select>
            </div>

            {/* Mouth Shape */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mouth Shape
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => {
                    onHornParamsChange({ ...hornParams, roundMouth: true });
                    onPlateParamsChange({ ...plateParams, type: 'circle' });
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hornParams.roundMouth
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Round
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onHornParamsChange({ ...hornParams, roundMouth: false });
                    onPlateParamsChange({ ...plateParams, type: 'rect' });
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    !hornParams.roundMouth
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Rectangular
                </button>
              </div>
            </div>

            {/* Mouth Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Mouth Width (mm)
                </label>
                <input
                  type="number"
                  value={hornParams.mouthWidth}
                  onChange={(e) => onHornParamsChange({ 
                    ...hornParams, 
                    mouthWidth: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
              {!hornParams.roundMouth && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mouth Height (mm)
                  </label>
                  <input
                    type="number"
                    value={hornParams.mouthHeight || hornParams.mouthWidth}
                    onChange={(e) => onHornParamsChange({ 
                      ...hornParams, 
                      mouthHeight: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                  />
                </div>
              )}
            </div>

            {/* Throat and Length */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Throat Diameter (mm)
                </label>
                <input
                  type="number"
                  value={hornParams.throatDiameter}
                  onChange={(e) => onHornParamsChange({ 
                    ...hornParams, 
                    throatDiameter: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Horn Length (mm)
                </label>
                <input
                  type="number"
                  value={hornParams.length}
                  onChange={(e) => onHornParamsChange({ 
                    ...hornParams, 
                    length: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Wall Thickness */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wall Thickness (mm)
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={hornParams.wallThickness}
                onChange={(e) => onHornParamsChange({ 
                  ...hornParams, 
                  wallThickness: Number(e.target.value) 
                })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-sm text-orange-300 mt-2 font-medium">{hornParams.wallThickness}mm thick</div>
            </div>
          </div>
        </div>

        {/* Mounting Plate Section */}
        <div className={`glass-section transition-all duration-300 ease-in-out ${
          showMountingPlate ? 'p-5' : 'px-5 py-3'
        }`}>
          <div className={`flex items-center justify-between transition-all duration-300 ease-in-out ${
            showMountingPlate ? 'mb-4' : 'mb-0'
          }`}>
            <div className={`flex items-center space-x-2 transition-opacity duration-200 ${
              showMountingPlate ? 'opacity-100' : 'opacity-70'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                showMountingPlate ? 'bg-green-400 shadow-sm' : 'bg-gray-500'
              }`}></div>
              <h3 className="text-base font-semibold text-white">Mounting Plate</h3>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMountingPlate}
                onChange={(e) => onToggleMountingPlate(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out ${
                showMountingPlate ? 'bg-blue-600 shadow-lg' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 ease-in-out transform ${
                  showMountingPlate ? 'translate-x-5 scale-105' : 'translate-x-0 scale-100'
                } shadow-md`}></div>
              </div>
            </label>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showMountingPlate ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className={`space-y-4 transition-all duration-300 ease-in-out ${
              showMountingPlate ? 'pt-2' : 'pt-0'
            }`}>
              
              {/* Plate Size Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plate Size
              </label>
              <div className="flex space-x-1 mb-3">
                <button
                  type="button"
                  onClick={() => onPlateParamsChange({ ...plateParams, useManualSize: false })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    !plateParams.useManualSize
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => onPlateParamsChange({ ...plateParams, useManualSize: true })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    plateParams.useManualSize
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Manual
                </button>
              </div>
              
              {/* Auto sizing margin input */}
              {!plateParams.useManualSize && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Extra Margin (mm)
                  </label>
                  <input
                    type="number"
                    value={plateParams.autoMargin || 20}
                    onChange={(e) => onPlateParamsChange({ 
                      ...plateParams, 
                      autoMargin: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                  />
                </div>
              )}
            </div>

            {/* Plate Dimensions - only show when manual mode enabled */}
            {plateParams.useManualSize && (
              <>
                {hornParams.roundMouth ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Diameter (mm)
                    </label>
                    <input
                      type="number"
                      value={plateParams.diameter || (hornParams.mouthWidth + 40)}
                      onChange={(e) => onPlateParamsChange({ 
                        ...plateParams, 
                        diameter: Number(e.target.value) 
                      })}
                      className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        value={plateParams.width || (hornParams.mouthWidth + 40)}
                        onChange={(e) => onPlateParamsChange({ 
                          ...plateParams, 
                          width: Number(e.target.value) 
                        })}
                        className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        value={plateParams.height || ((hornParams.mouthHeight || hornParams.mouthWidth) + 40)}
                        onChange={(e) => onPlateParamsChange({ 
                          ...plateParams, 
                          height: Number(e.target.value) 
                        })}
                        className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Plate Thickness */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Thickness (mm)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={plateParams.thickness}
                onChange={(e) => onPlateParamsChange({ 
                  ...plateParams, 
                  thickness: Number(e.target.value) 
                })}
                className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
              />
            </div>

            {/* Bolt Settings */}
            <div className={`grid gap-3 ${plateParams.type === 'rect' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {plateParams.type === 'circle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bolt Count
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="12"
                    value={plateParams.boltCount}
                    onChange={(e) => onPlateParamsChange({ 
                      ...plateParams, 
                      boltCount: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bolt Hole Ø (mm)
                </label>
                <input
                  type="number"
                  value={plateParams.boltHoleDiameter}
                  onChange={(e) => onPlateParamsChange({ 
                    ...plateParams, 
                    boltHoleDiameter: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Max Bolt Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Bolt Spacing (mm)
              </label>
              <input
                type="range"
                min="50"
                max="250"
                step="20"
                value={plateParams.maxBoltSpacing || 150}
                onChange={(e) => onPlateParamsChange({ 
                  ...plateParams, 
                  maxBoltSpacing: Number(e.target.value) 
                })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-sm text-orange-300 mt-2 font-medium">{plateParams.maxBoltSpacing || 150}mm spacing</div>
            </div>
          </div>
          </div>
        </div>

        {/* Driver Mount Section */}
        <div className={`glass-section transition-all duration-300 ease-in-out ${
          showDriverMount ? 'p-5' : 'px-5 py-3'
        }`}>
          <div className={`flex items-center justify-between transition-all duration-300 ease-in-out ${
            showDriverMount ? 'mb-4' : 'mb-0'
          }`}>
            <div className={`flex items-center space-x-2 transition-opacity duration-200 ${
              showDriverMount ? 'opacity-100' : 'opacity-70'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                showDriverMount ? 'bg-orange-400 shadow-sm' : 'bg-gray-500'
              }`}></div>
              <h3 className="text-base font-semibold text-white">Driver Mount</h3>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDriverMount}
                onChange={(e) => onToggleDriverMount(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out ${
                showDriverMount ? 'bg-blue-600 shadow-lg' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 ease-in-out transform ${
                  showDriverMount ? 'translate-x-5 scale-105' : 'translate-x-0 scale-100'
                } shadow-md`}></div>
              </div>
            </label>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showDriverMount ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className={`space-y-4 transition-all duration-300 ease-in-out ${
              showDriverMount ? 'pt-2' : 'pt-0'
            }`}>
              
              {/* Mount Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mount Type
              </label>
              <div className="glass-button px-4 py-2 rounded-lg text-center">
                <span className="text-white font-medium">Bolt-on Mount</span>
              </div>
            </div>

            {/* Driver Parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Throat Ø (mm)
                </label>
                <input
                  type="number"
                  value={driverParams.throatDiameter}
                  onChange={(e) => onDriverParamsChange({ 
                    ...driverParams, 
                    throatDiameter: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Flange Ø (mm)
                </label>
                <input
                  type="number"
                  value={driverParams.flangeDiameter}
                  onChange={(e) => onDriverParamsChange({ 
                    ...driverParams, 
                    flangeDiameter: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Flange Thickness (mm)
              </label>
              <input
                type="number"
                value={driverParams.flangeThickness}
                onChange={(e) => onDriverParamsChange({ 
                  ...driverParams, 
                  flangeThickness: Number(e.target.value) 
                })}
                className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
              />
            </div>

            {/* Bolt Parameters */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bolt Count
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="8"
                    value={driverParams.boltCount}
                    onChange={(e) => onDriverParamsChange({ 
                      ...driverParams, 
                      boltCount: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bolt Hole Ø (mm)
                  </label>
                  <input
                    type="number"
                    value={driverParams.boltHoleDiameter}
                    onChange={(e) => onDriverParamsChange({ 
                      ...driverParams, 
                      boltHoleDiameter: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bolt Circle Ø (mm)
                </label>
                <input
                  type="number"
                  value={driverParams.boltCircleDiameter}
                  onChange={(e) => onDriverParamsChange({ 
                    ...driverParams, 
                    boltCircleDiameter: Number(e.target.value) 
                  })}
                  className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                />
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="glass-section p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <h3 className="text-base font-semibold text-white">Performance Settings</h3>
          </div>
          <div className="space-y-4">
            
            {/* Performance Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Render Quality
              </label>
              <div className="flex space-x-1">
                {(['low', 'medium', 'high'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onPerformanceModeChange?.(mode)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                      performanceMode === mode
                        ? 'glass-button text-white'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {performanceMode === 'high' && 'Best quality with all features enabled'}
                {performanceMode === 'medium' && 'Balanced performance and quality'}
                {performanceMode === 'low' && 'Optimized for smooth performance'}
              </p>
            </div>
            
            {/* Performance Monitor Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Performance Monitor
                </label>
                <p className="text-xs text-gray-500 mt-1">Show FPS and metrics</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPerformanceMonitor}
                  onChange={(e) => onTogglePerformanceMonitor?.(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-all duration-200 ease-in-out ${
                  showPerformanceMonitor ? 'bg-blue-600 shadow-lg' : 'bg-gray-600'
                }`}>
                  <span
                    className={`absolute block w-5 h-5 bg-white rounded-full shadow transform transition-all duration-200 ease-in-out ${
                      showPerformanceMonitor ? 'translate-x-5' : 'translate-x-0.5'
                    } top-0.5`}
                  />
                </div>
              </label>
            </div>
            
            {/* Performance Info */}
            <div className="glass-input p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-blue-300">Performance Tips</span>
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Lower quality for models with 50+ bolt holes</li>
                <li>• Medium quality balances speed and detail</li>
                <li>• High quality for final presentations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Material Selection */}
        <div className="glass-section p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <h3 className="text-base font-semibold text-white">Material</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Printing Material
            </label>
            <select
              value={selectedMaterial.name}
              onChange={(e) => {
                const material = MATERIALS.find(m => m.name === e.target.value)!;
                onMaterialChange(material);
              }}
              className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
            >
              {MATERIALS.map((material) => (
                <option key={material.name} value={material.name} className="bg-gray-800 text-white">
                  {material.name} (${material.costPerGram.toFixed(3)}/g)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

    </div>
  );
}