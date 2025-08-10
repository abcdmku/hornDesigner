import { HornProfileParams, MountPlateParams, DriverMountParams, MaterialType } from '../types';
import { MATERIALS } from '../constants';

interface ParameterSidebarProps {
  hornParams: HornProfileParams;
  plateParams: MountPlateParams;
  driverParams: DriverMountParams;
  selectedMaterial: MaterialType;
  onHornParamsChange: (params: HornProfileParams) => void;
  onPlateParamsChange: (params: MountPlateParams) => void;
  onDriverParamsChange: (params: DriverMountParams) => void;
  onMaterialChange: (material: MaterialType) => void;
  estimatedCost: number;
}

export default function ParameterSidebar({
  hornParams,
  plateParams,
  driverParams,
  selectedMaterial,
  onHornParamsChange,
  onPlateParamsChange,
  onDriverParamsChange,
  onMaterialChange,
  estimatedCost
}: ParameterSidebarProps) {
  return (
    <div className="w-80 glass-dark rounded-r-3xl m-4 ml-0 flex flex-col h-[calc(100vh-2rem)] shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Horn Designer</h2>
            <p className="text-sm text-gray-400">Pro Audio Design Tool</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Configure your audio horn parameters</p>
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
                  onClick={() => onHornParamsChange({ ...hornParams, roundMouth: true })}
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
                  onClick={() => onHornParamsChange({ ...hornParams, roundMouth: false })}
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

            {/* Segments */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Segments (Quality)
              </label>
              <input
                type="range"
                min="8"
                max="64"
                value={hornParams.segments}
                onChange={(e) => onHornParamsChange({ 
                  ...hornParams, 
                  segments: Number(e.target.value) 
                })}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-sm text-blue-300 mt-2 font-medium">{hornParams.segments} segments</div>
            </div>
          </div>
        </div>

        {/* Mounting Plate Section */}
        <div className="glass-section p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <h3 className="text-base font-semibold text-white">Mounting Plate</h3>
          </div>
          <div className="space-y-4">
            
            {/* Plate Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plate Type
              </label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => onPlateParamsChange({ ...plateParams, type: 'circle' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    plateParams.type === 'circle'
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Circle
                </button>
                <button
                  type="button"
                  onClick={() => onPlateParamsChange({ ...plateParams, type: 'rect' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    plateParams.type === 'rect'
                      ? 'glass-button text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Rectangle
                </button>
              </div>
            </div>

            {/* Plate Dimensions */}
            {plateParams.type === 'circle' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Diameter (mm)
                </label>
                <input
                  type="number"
                  value={plateParams.diameter || 250}
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
                    value={plateParams.width || 250}
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
                    value={plateParams.height || 250}
                    onChange={(e) => onPlateParamsChange({ 
                      ...plateParams, 
                      height: Number(e.target.value) 
                    })}
                    className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Bolt Settings */}
            <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bolt Circle Ø (mm)
              </label>
              <input
                type="number"
                value={plateParams.boltCircleDiameter}
                onChange={(e) => onPlateParamsChange({ 
                  ...plateParams, 
                  boltCircleDiameter: Number(e.target.value) 
                })}
                className="w-full px-4 py-2.5 glass-input rounded-lg text-white outline-none placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Driver Mount Section */}
        <div className="glass-section p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
            <h3 className="text-base font-semibold text-white">Driver Mount</h3>
          </div>
          <div className="space-y-4">
            
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

      {/* Cost Display Footer */}
      <div className="border-t border-white/10 p-6 glass-section mx-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-base font-medium text-gray-300">Estimated Cost</span>
          <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
            <span className="text-lg font-bold text-white">
              ${estimatedCost.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Material: <span className="text-blue-300 font-medium">{selectedMaterial.name}</span> • 
          <span className="text-gray-500"> Density: {selectedMaterial.density} g/mm³</span>
        </div>
      </div>
    </div>
  );
}