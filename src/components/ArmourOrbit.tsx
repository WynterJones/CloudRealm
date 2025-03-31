import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, BoxGeometry, MeshStandardMaterial, Mesh } from 'three';
import { ArmourType } from '../types/game';

interface ArmourOrbitProps {
  armourType: ArmourType;
}

function ArmourOrbit({ armourType }: ArmourOrbitProps) {
  const armourRef = useRef<Group>(null);
  const { camera } = useThree();
  const [armourModel, setArmourModel] = useState<Group | null>(null);
  
  // Load armor model in an effect to avoid conditional hook issues
  useEffect(() => {
    let modelPath = '/models/steel.glb'; // Default placeholder for now
    
    // Select the correct model based on armor type
    switch (armourType) {
      case 'gold':
        modelPath = '/models/steel.glb'; // Will be '/models/gold.glb'
        break;
      case 'steel':
        modelPath = '/models/gold.glb'; // Will be '/models/steel.glb'
        break;
      case 'knowledge':
        modelPath = '/models/book.glb'; // Will be '/models/book.glb'
        break;
    }
    
    try {
      // Load the GLTF model
      const { scene } = useGLTF(modelPath);
      setArmourModel(scene.clone());
    } catch (error) {
      console.error("Error loading armor model:", error);
    }
  }, [armourType]);
  
  // Fixed screen position settings - on RIGHT side of screen
  const screenX = 0.6; // Right side of screen
  const screenY = -0.4; // Lower part of view
  const screenZ = -1.0; // Distance from camera
  
  // For animation effects
  const spinSpeed = 0.3; // Slightly slower spin speed
  
  // Animation frame - always called regardless of model loading status
  useFrame((state, delta) => {
    if (!armourRef.current) return;
    
    // Position armor fixed relative to camera (screen space)
    armourRef.current.position.set(screenX, screenY, screenZ);
    
    // Rotate all armor types
    armourRef.current.rotation.y += delta * spinSpeed;
    
    // Make armor a child of the camera
    armourRef.current.parent = camera;
  });
  
  // Adjust scale based on armor type
  const getScale = () => {
    switch (armourType) {
      case 'gold':
        return [0.2, 0.2, 0.2] as [number, number, number];
      case 'steel':
        return [0.2, 0.2, 0.2] as [number, number, number];
      case 'knowledge':
        return [0.3, 0.3, 0.3] as [number, number, number]; // Smaller scale for book
      default:
        return [0.3, 0.3, 0.3] as [number, number, number];
    }
  };
  
  return (
    <group ref={armourRef} scale={getScale()}>
      {armourModel && <primitive object={armourModel} />}
    </group>
  );
}

// Preload armor models with error handling
try {
  // Will use actual models when available
  useGLTF.preload('/models/book.glb'); // Placeholder
  useGLTF.preload('/models/gold.glb'); // Placeholder
  useGLTF.preload('/models/steel.glb'); // Placeholder
} catch (error) {
  console.error("Error preloading armor models:", error);
}

export default ArmourOrbit; 