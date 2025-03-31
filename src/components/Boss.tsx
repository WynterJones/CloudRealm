import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, Vector3, MathUtils } from 'three';

interface BossProps {
  playerPosition: { x: number, z: number };
}

function Boss({ playerPosition }: BossProps) {
  const bossRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/brain.glb');
  const [isDescending, setIsDescending] = useState(true);
  const [initialPosition] = useState(new Vector3(0, 15, 55));
  
  // Simplified spin state management
  const spinState = useRef({
    isSpinning: false,
    nextSpinTime: 0,
    spinStartTime: 0
  });
  
  // Target position in front of player
  const targetDistance = 20; // 20 feet in front of the player
  const targetHeight = 2.5; // Hover height above the bridge

  // Initial setup
  useEffect(() => {
    if (bossRef.current) {
      // Set initial position high above
      bossRef.current.position.copy(initialPosition);
      
      // Smaller scale
      bossRef.current.scale.set(3, 3, 3);
      
      // Set initial spin time
      spinState.current.nextSpinTime = 6 + Math.random() * 6;
      
      // Fade in animation
      const descentDuration = 3000; // 3 seconds for descent
      
      setTimeout(() => {
        setIsDescending(false);
      }, descentDuration);
    }
  }, [initialPosition]);

  // Animation loop
  useFrame((state, delta) => {
    if (!bossRef.current) return;
    
    // Calculate target position (20 feet in front of player)
    const playerForwardZ = playerPosition.z + targetDistance;
    
    if (isDescending) {
      // Descent animation - move down gradually
      const targetY = targetHeight;
      const currentY = bossRef.current.position.y;
      
      if (currentY > targetY) {
        // Smooth descent
        bossRef.current.position.y -= delta * 5;
      }
      
      // During descent, also start moving to be in front of player
      bossRef.current.position.x = MathUtils.lerp(
        bossRef.current.position.x, 
        playerPosition.x, 
        delta * 3
      );
      bossRef.current.position.z = MathUtils.lerp(
        bossRef.current.position.z, 
        playerForwardZ, 
        delta * 3
      );
    } else {
      // Stay in front of player with smooth following
      bossRef.current.position.x = MathUtils.lerp(
        bossRef.current.position.x, 
        playerPosition.x, 
        delta * 5
      );
      bossRef.current.position.z = MathUtils.lerp(
        bossRef.current.position.z, 
        playerForwardZ, 
        delta * 5
      );
      
      // Bobbing up and down
      const bobHeight = 0.5;
      const bobSpeed = 0.5;
      bossRef.current.position.y = targetHeight + 
        Math.sin(state.clock.getElapsedTime() * bobSpeed) * bobHeight;
      
      // Handle spinning logic
      const currentTime = state.clock.getElapsedTime();
      
      if (!spinState.current.isSpinning) {
        // Check if it's time for a new spin
        if (currentTime > spinState.current.nextSpinTime) {
          // Start a new spin
          spinState.current.isSpinning = true;
          spinState.current.spinStartTime = currentTime;
        } else {
          // Not spinning - face the player
          const dx = playerPosition.x - bossRef.current.position.x;
          const dz = playerPosition.z - bossRef.current.position.z;
          const targetAngle = Math.atan2(dx, dz);
          
          // Smoothly rotate to face player
          bossRef.current.rotation.y = MathUtils.lerp(
            bossRef.current.rotation.y,
            targetAngle,
            delta * 5
          );
        }
      } else {
        // Currently spinning
        const spinDuration = 1; // 1 second per complete rotation
        const spinElapsedTime = currentTime - spinState.current.spinStartTime;
        
        if (spinElapsedTime <= spinDuration) {
          // Do one complete 360° rotation
          const spinProgress = spinElapsedTime / spinDuration;
          const spinAngle = Math.PI * 2 * spinProgress;
          bossRef.current.rotation.y = spinAngle;
        } else {
          // Spin completed - schedule next spin
          spinState.current.isSpinning = false;
          spinState.current.nextSpinTime = currentTime + 6 + Math.random() * 6; // Next spin in 6-12 seconds
        }
      }
    }
  });

  // Create a clone of the scene to be able to use ref
  const clonedScene = scene.clone();

  return (
    <group ref={bossRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/brain.glb');

export default Boss; 