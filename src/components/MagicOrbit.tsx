import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, BoxGeometry, MeshStandardMaterial, Mesh, PointLight } from 'three';
import { MagicType } from '../types/game';

interface MagicOrbitProps {
  magicType: MagicType;
}

function MagicOrbit({ magicType }: MagicOrbitProps) {
  const magicRef = useRef<Group>(null);
  const { camera } = useThree();
  const [magicModel, setMagicModel] = useState<Group | null>(null);
  const lightRef = useRef<PointLight>(null);
  
  // Load magic model in an effect to avoid conditional hook issues
  useEffect(() => {
    let modelPath = '/models/sword.glb'; // Default placeholder for now
    let lightColor = '#ffffff'; // Default light color
    
    // Select the correct model based on magic type
    switch (magicType) {
      case 'fire':
        modelPath = '/models/sword.glb'; // Will be '/models/fire.glb'
        lightColor = '#ff5500'; // Orange-red light for fire
        break;
      case 'water':
        modelPath = '/models/sword.glb'; // Will be '/models/water.glb'
        lightColor = '#00aaff'; // Blue light for water
        break;
      case 'love':
        modelPath = '/models/sword.glb'; // Will be '/models/love.glb'
        lightColor = '#ff00aa'; // Pink light for love
        break;
    }
    
    try {
      // Load the GLTF model
      const { scene } = useGLTF(modelPath);
      
      // Create a point light and add it to the model
      const light = new PointLight(lightColor, 2.0, 3.0);
      light.position.set(0, 0, 0);
      scene.add(light);
      
      setMagicModel(scene.clone());
    } catch (error) {
      console.error("Error loading magic model:", error);
    }
  }, [magicType]);
  
  // Fixed screen position settings - on TOP of screen
  const screenX = 0; // Center horizontally
  const screenY = 0.4; // Top part of view
  const screenZ = -1.0; // Distance from camera
  
  // For animation effects
  const spinSpeed = 1.0; // Slower spin for magic
  const floatSpeed = 0.8; // Speed of floating animation
  const floatAmount = 0.1; // Magnitude of floating
  
  // Animation frame - always called regardless of model loading status
  useFrame((state, delta) => {
    if (!magicRef.current) return;
    
    // Position magic fixed relative to camera (screen space)
    magicRef.current.position.set(
      screenX,
      screenY + Math.sin(state.clock.getElapsedTime() * floatSpeed) * floatAmount,
      screenZ
    );
    
    // Rotate magic item
    magicRef.current.rotation.y += delta * spinSpeed;
    
    // Make magic a child of the camera
    magicRef.current.parent = camera;
  });
  
  // Special effects based on magic type
  useFrame((state) => {
    if (!magicRef.current || !lightRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Different pulsing light intensities based on magic type
    switch (magicType) {
      case 'fire':
        if (lightRef.current) lightRef.current.intensity = 1.0 + Math.sin(time * 5) * 0.5;
        break;
      case 'water':
        if (lightRef.current) lightRef.current.intensity = 1.0 + Math.sin(time * 2) * 0.3;
        break;
      case 'love':
        if (lightRef.current) lightRef.current.intensity = 1.0 + Math.sin(time * 1.5) * 0.7;
        break;
    }
  });
  
  // Adjust scale based on magic type
  const getScale = () => {
    switch (magicType) {
      case 'fire':
        return [0.4, 0.4, 0.4] as [number, number, number];
      case 'water':
        return [0.5, 0.5, 0.5] as [number, number, number];
      case 'love':
        return [0.45, 0.45, 0.45] as [number, number, number];
      default:
        return [0.5, 0.5, 0.5] as [number, number, number];
    }
  };
  
  return (
    <group ref={magicRef} scale={getScale()}>
      {magicModel && <primitive object={magicModel} />}
      <pointLight ref={lightRef} color="#ffffff" intensity={1.0} distance={2.0} />
    </group>
  );
}

// Preload magic models with error handling
try {
  // Will use actual models when available
  useGLTF.preload('/models/fists.glb'); // Placeholder
} catch (error) {
  console.error("Error preloading magic models:", error);
}

export default MagicOrbit; 