import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Vector3, Box3 } from 'three';
import { WeaponType } from '../types/game';

interface WeaponOrbitProps {
  weaponType: WeaponType;
  playerPosition: Vector3;
}

function WeaponOrbit({ weaponType, playerPosition }: WeaponOrbitProps) {
  const weaponRef = useRef<Group>(null);
  
  // Use a try-catch to handle potential model loading errors
  let weaponModel;
  try {
    // Load appropriate weapon model based on type
    // Currently only axe.glb is implemented
    const { scene } = useGLTF('/models/axe.glb');
    weaponModel = scene.clone();
  } catch (error) {
    console.error("Error loading weapon model:", error);
    // Return an empty component if model fails to load
    return null;
  }
  
  // Fixed position settings - right next to player's head
  const xOffset = 1.4; // Right side of player head
  const yOffset = 0.5; // Level with head
  const zOffset = 0.0; // Aligned with player depth
  
  // For animation effects
  const floatSpeed = 0.7;
  const floatAmount = 0.02;
  const spinSpeed = 2.0; // Speed of spinning
  
  // Animation frame
  useFrame((state, delta) => {
    if (!weaponRef.current || !playerPosition) return;
    
    // Fixed position right next to player head
    weaponRef.current.position.x = playerPosition.x + xOffset;
    weaponRef.current.position.y = playerPosition.y + yOffset + Math.sin(state.clock.getElapsedTime() * floatSpeed) * floatAmount;
    weaponRef.current.position.z = playerPosition.z + zOffset;
    
    // Make the axe spin continuously on its own axis
    weaponRef.current.rotation.y += delta * spinSpeed;
  });
  
  return (
    <group ref={weaponRef} scale={[0.7, 0.7, 0.7]}>
      <primitive object={weaponModel} />
    </group>
  );
}

// Preload weapon models with error handling
try {
  useGLTF.preload('/models/axe.glb');
} catch (error) {
  console.error("Error preloading weapon model:", error);
}

export default WeaponOrbit; 