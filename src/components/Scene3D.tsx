import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

interface Scene3DProps {
  children?: React.ReactNode;
}

export default function Scene3D({ children }: Scene3DProps) {
  return (
    <div className="flex-1 h-full">
      <Canvas
        camera={{ 
          position: [500, 400, 500], 
          fov: 50,
          near: 1,
          far: 10000
        }}
        shadows
        gl={{ 
          alpha: true, 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        {/* Enhanced Lighting for Dark Theme */}
        <ambientLight intensity={0.2} />
        
        {/* Key Light */}
        <directionalLight 
          position={[300, 300, 300]} 
          intensity={0.8}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={1000}
          shadow-camera-left={-500}
          shadow-camera-right={500}
          shadow-camera-top={500}
          shadow-camera-bottom={-500}
        />
        
        {/* Fill Light */}
        <pointLight position={[-200, 100, 200]} intensity={0.3} color="#4f46e5" />
        
        {/* Rim Light */}
        <pointLight position={[200, -100, -200]} intensity={0.4} color="#06b6d4" />

        {/* Dark Environment */}
        <Environment preset="night" background={false} />
        
        {/* Custom dark background */}
        <color attach="background" args={['#0a0a0a']} />
        
        {/* Dark Grid for reference */}
        <Grid 
          position={[0, -200, 0]} 
          args={[2000, 2000]} 
          cellSize={25} 
          sectionSize={100}
          sectionThickness={2}
          cellThickness={1}
          sectionColor="#333333"
          cellColor="#1a1a1a"
          fadeDistance={1500}
          fadeStrength={1}
          infiniteGrid={false}
        />

        {/* OrbitControls - FOLLOW PATTERN: Standard R3F Canvas with drei OrbitControls */}
        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.1}
          minDistance={10}
          maxDistance={5000}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Gizmo Helper for orientation */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport 
            axisColors={['#ff4444', '#44ff44', '#4444ff']} 
            labelColor="white" 
          />
        </GizmoHelper>

        {/* 3D Content */}
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}