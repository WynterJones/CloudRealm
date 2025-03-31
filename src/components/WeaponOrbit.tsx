import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, BoxGeometry, MeshStandardMaterial, Mesh } from 'three';
import { WeaponType } from '../types/game';

interface WeaponOrbitProps {
  weaponType: WeaponType;
}

function WeaponOrbit({ weaponType }: WeaponOrbitProps) {
  const weaponRef = useRef<Group>(null);
  const { camera } = useThree();
  const [weaponModel, setWeaponModel] = useState<Group | null>(null);
  
  // Load weapon model in an effect to avoid conditional hook issues
  useEffect(() => {
    let modelPath = '/models/axe.glb'; // Default
    
    // Select the correct model based on weapon type
    switch (weaponType) {
      case 'sword':
        modelPath = '/models/sword.glb';
        break;
      case 'axe':
        modelPath = '/models/axe.glb';
        break;
      case 'fist':
        modelPath = '/models/fists.glb';
        break;

        // For fists, we'll create a simple geometry instead of loading a model
        // const fistGroup = new Group();
        // const fistGeometry = new BoxGeometry(0.1, 0.1, 0.1);
        // const fistMaterial = new MeshStandardMaterial({ color: '#ffcc88' });
        
        // // Create left fist
        // const leftFist = new Mesh(fistGeometry, fistMaterial);
        // leftFist.position.set(-0.1, 0, 0);
        // fistGroup.add(leftFist);
        
        // // Create right fist
        // const rightFist = new Mesh(fistGeometry, fistMaterial);
        // rightFist.position.set(0.1, 0, 0);
        // fistGroup.add(rightFist);
        
        // setWeaponModel(fistGroup);
        // return; // Exit early as we've already set the model
    }
    
    try {
      // For sword and axe, load the GLTF model manually
      const { scene } = useGLTF(modelPath);
      setWeaponModel(scene.clone());
    } catch (error) {
      console.error("Error loading weapon model:", error);
    }
  }, [weaponType]);
  
  // Fixed screen position settings
  const screenX = -0.6; // Left side of screen
  const screenY = -0.4; // Lower part of view
  const screenZ = -1.0; // Distance from camera
  
  // For animation effects
  const spinSpeed = 2.0; // Speed of spinning
  
  // Animation frame - always called regardless of model loading status
  useFrame((state, delta) => {
    if (!weaponRef.current) return;
    
    // Position weapon fixed relative to camera (screen space)
    weaponRef.current.position.set(screenX, screenY, screenZ);
    
    // Rotate based on weapon type
    if (weaponType !== 'fist') {
      weaponRef.current.rotation.y += delta * spinSpeed;
    } else {
      // For fists, do a punching animation
      const time = state.clock.getElapsedTime();
      weaponRef.current.rotation.x = Math.sin(time * 5) * 0.3;
    }
    
    // Make weapon a child of the camera
    weaponRef.current.parent = camera;
  });
  
  // Adjust scale based on weapon type
  const getScale = () => {
    switch (weaponType) {
      case 'sword':
        return [0.6, 0.6, 0.6] as [number, number, number];
      case 'axe':
        return [0.5, 0.5, 0.5] as [number, number, number];
      case 'fist':
        return [0.5, 0.5, 0.5] as [number, number, number]; // Larger scale for fists
      default:
        return [0.5, 0.5, 0.5] as [number, number, number];
    }
  };
  
  return (
    <group ref={weaponRef} scale={getScale()}>
      {weaponModel && <primitive object={weaponModel} />}
    </group>
  );
}

// Preload weapon models with error handling
try {
  useGLTF.preload('/models/axe.glb');
  useGLTF.preload('/models/sword.glb');
  useGLTF.preload('/models/fists.glb');
} catch (error) {
  console.error("Error preloading weapon models:", error);
}

export default WeaponOrbit; 