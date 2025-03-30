import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Vector2, PerspectiveCamera as ThreePerspectiveCamera, Quaternion, MathUtils, Group } from 'three';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import { GameState } from '../types/game';

interface PlayerProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

function Player({ gameState, setGameState }: PlayerProps) {
  const playerRef = useRef<Mesh>(null);
  const modelRef = useRef<Group>(null);
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const { scene } = useGLTF('/models/player.glb');
  const speed = 0.15;
  const cameraOffset = new Vector3(0, 1.2, -3);
  const lerpFactor = 0.08;
  const velocity = useRef(new Vector2(0, 0));
  const targetVelocity = useRef(new Vector2(0, 0));
  const targetRotation = useRef(0);
  const acceleration = 0.1;
  const deceleration = 0.08;
  const rotationSpeed = 0.1;
  const positionLerpFactor = 0.1;

  const updateCamera = useCallback(() => {
    if (playerRef.current && cameraRef.current) {
      const targetPosition = playerRef.current.position.clone().add(cameraOffset);
      cameraRef.current.position.lerp(targetPosition, lerpFactor);
      cameraRef.current.lookAt(playerRef.current.position);
    }
  }, [lerpFactor]);

  useEffect(() => {
    const keys = new Set<string>();
    
    const handleKeyDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    
    let animationFrameId: number;
    
    const updateMovement = () => {
      targetVelocity.current.set(0, 0);
      
      if (keys.has('a')) targetVelocity.current.x = speed;
      if (keys.has('d')) targetVelocity.current.x = -speed;
      if (keys.has('w')) targetVelocity.current.y = speed;
      if (keys.has('s')) targetVelocity.current.y = -speed;
      
      // Normalize diagonal movement
      if (targetVelocity.current.length() > 0) {
        targetVelocity.current.normalize().multiplyScalar(speed);
      }
      
      // Apply acceleration/deceleration
      velocity.current.lerp(targetVelocity.current, keys.size ? acceleration : deceleration);
      
      const newPosition = { ...gameState.position };
      newPosition.x = Math.max(Math.min(newPosition.x + velocity.current.x, 2), -2);
      newPosition.z = Math.max(Math.min(newPosition.z + velocity.current.y, 45), 0);
      
      // Calculate rotation based on movement direction
      if (velocity.current.length() > 0.01) {
        targetRotation.current = Math.atan2(velocity.current.x, velocity.current.y);
      }
      
      setGameState({ ...gameState, position: newPosition });
      animationFrameId = requestAnimationFrame(updateMovement);
    };
    
    animationFrameId = requestAnimationFrame(updateMovement);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, setGameState, speed]);
  
  useFrame((state, delta) => {
    if (playerRef.current) {
      // Smoothly interpolate player position with delta time
      const currentPos = playerRef.current.position;
      const targetPos = new Vector3(gameState.position.x, 0.5, gameState.position.z);
      currentPos.lerp(targetPos, positionLerpFactor);
      
      // Smoothly rotate player model to face movement direction
      if (modelRef.current) {
        const currentRotation = modelRef.current.rotation.y;
        modelRef.current.rotation.y = MathUtils.lerp(
          currentRotation,
          targetRotation.current,
          rotationSpeed
        );
      }

      // Check for block collisions
      const blockPositions = [0, 1, 2].flatMap(stage => 
        [-2, 0, 2].map(x => ({ x, z: 10 + stage * 15 }))
      );

      blockPositions.forEach(block => {
        const distance = Math.sqrt(
          Math.pow(currentPos.x - block.x, 2) + 
          Math.pow(currentPos.z - block.z, 2)
        );

        if (distance < 0.8 && !gameState.collectedBlocks.some(collected => 
          collected.x === block.x && collected.z === block.z
        )) {
          setGameState({
            ...gameState,
            collectedBlocks: [...gameState.collectedBlocks, block]
          });
        }
      });
      
      updateCamera();
      
      // Check if player fell off
      if (Math.abs(currentPos.x) > 2) {
        velocity.current.set(0, 0);
        targetVelocity.current.set(0, 0);
        setGameState({
          weapon: null,
          armour: null,
          magic: null,
          position: { x: 0, z: 0 },
          stage: 0,
          collectedBlocks: []
        });
      }
    }
  });

  // Clone the scene to be able to set a ref on the model group
  const clonedScene = scene.clone();

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.2, -3]} fov={65} />
      <mesh ref={playerRef} position={[0, 0.5, 0]}>
        <group ref={modelRef}>
          <primitive object={clonedScene} scale={0.5} />
        </group>
      </mesh>
    </>
  );
}

useGLTF.preload('/models/player.glb');

export default Player