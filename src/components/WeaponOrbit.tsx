import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, BoxGeometry, MeshStandardMaterial, Mesh } from 'three';
import { WeaponType } from '../types/game';

interface WeaponOrbitProps {
  weaponType: WeaponType;
  bossDefeated?: boolean;
  hasAllItems?: boolean;
}

function WeaponOrbit({ weaponType, bossDefeated = false, hasAllItems = false }: WeaponOrbitProps) {
  const weaponRef = useRef<Group>(null);
  const { camera } = useThree();
  const [weaponModel, setWeaponModel] = useState<Group | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [exitProgress, setExitProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
  
  // Fixed screen position settings - adjusted for mobile
  const getScreenPositions = () => {
    if (isMobile) {
      return {
        x: -0.3, // Closer to center on mobile
        y: -0.4, // Same vertical position
        z: -1.0  // Same distance from camera
      };
    } else {
      return {
        x: -0.6, // Original left side position for desktop
        y: -0.4, // Lower part of view
        z: -1.0  // Distance from camera
      };
    }
  };
  
  // For animation effects
  const spinSpeed = 2.0; // Speed of spinning
  const attackSpeed = 5.0; // Speed of attack animation
  
  // Animation frame - always called regardless of model loading status
  useFrame((state, delta) => {
    if (!weaponRef.current) return;
    
    // Get current screen positions based on device
    const { x: screenX, y: screenY, z: screenZ } = getScreenPositions();
    
    // Handle boss defeated exit animation
    if (bossDefeated) {
      // Increment exit progress
      setExitProgress(prev => Math.min(prev + delta * 2, 1));
      
      // Animate weapon moving down and off screen
      const exitY = screenY - exitProgress * 2;
      weaponRef.current.position.set(screenX, exitY, screenZ);
      weaponRef.current.rotation.z += delta * 5; // Spin rapidly as it falls
      
      // Make weapon a child of the camera
      weaponRef.current.parent = camera;
      return;
    }
    
    // Position weapon fixed relative to camera (screen space)
    weaponRef.current.position.set(screenX, screenY, screenZ);
    
    // Toggle attack mode periodically
    if (Math.random() < 0.01) {
      setIsAttacking(prev => !prev && hasAllItems);
    }
    
    if (isAttacking && hasAllItems) {
      // Attack animation - move weapon back and forth
      const time = state.clock.getElapsedTime();
      weaponRef.current.position.z = screenZ + Math.sin(time * attackSpeed) * 0.2;
      
      // Rotate based on weapon type during attack
      if (weaponType === 'sword' || weaponType === 'axe') {
        weaponRef.current.rotation.x = Math.sin(time * attackSpeed) * 0.3;
      } else {
        // For fists, do a punching animation
        weaponRef.current.rotation.x = Math.sin(time * attackSpeed) * 0.5;
      }
    } else {
      // Regular spinning animation
      if (weaponType !== 'fist') {
        weaponRef.current.rotation.y += delta * spinSpeed;
      } else {
        // For fists, do a milder rotation
        const time = state.clock.getElapsedTime();
        weaponRef.current.rotation.x = Math.sin(time * 3) * 0.2;
      }
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
        return [0.4, 0.4, 0.4] as [number, number, number]; // Larger scale for fists
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