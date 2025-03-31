import { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Vector2, PerspectiveCamera as ThreePerspectiveCamera, Quaternion, MathUtils, Group, SphereGeometry, MeshBasicMaterial } from 'three';
import { PerspectiveCamera, useGLTF, Text } from '@react-three/drei';
import { GameState, WeaponType, ArmourType, MagicType } from '../types/game';
import WeaponOrbit from './WeaponOrbit';
import ArmourOrbit from './ArmourOrbit';
import MagicOrbit from './MagicOrbit';

interface PlayerProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

function Player({ gameState, setGameState }: PlayerProps) {
  const playerRef = useRef<Mesh>(null);
  const modelRef = useRef<Group>(null);
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const debugSphereRef = useRef<Mesh>(null);
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
  const collisionRadius = 1.5;
  
  // Local refs to track the actual values between frames
  const weaponRef = useRef<WeaponType | null>(gameState.weapon);
  const armourRef = useRef<ArmourType | null>(gameState.armour);
  const magicRef = useRef<MagicType | null>(gameState.magic);
  const positionRef = useRef(gameState.position);
  const stageRef = useRef(gameState.stage);
  
  // Selection cooldown to prevent immediate redetection
  const [selectionCooldown, setSelectionCooldown] = useState(false);
  const cooldownRef = useRef(false);

  // Debug flag
  const showDebug = false;

  // Track if we've forced a selection
  const [selectionForced, setSelectionForced] = useState(false);

  // Define card positions for all stages - moved outside the frame loop for visualization
  const stageCardPositions = [
    // Stage 0 - Weapons
    [
      { x: -2, z: 10, type: 'sword' as WeaponType },
      { x: 0, z: 10, type: 'fist' as WeaponType },
      { x: 2, z: 10, type: 'axe' as WeaponType }
    ],
    // Stage 1 - Armour
    [
      { x: -2, z: 25, type: 'steel' as ArmourType },
      { x: 0, z: 25, type: 'knowledge' as ArmourType },
      { x: 2, z: 25, type: 'gold' as ArmourType }
    ],
    // Stage 2 - Magic
    [
      { x: -2, z: 40, type: 'fire' as MagicType },
      { x: 0, z: 40, type: 'water' as MagicType },
      { x: 2, z: 40, type: 'love' as MagicType }
    ]
  ];

  // Keep local refs updated with gameState
  useEffect(() => {
    weaponRef.current = gameState.weapon;
    armourRef.current = gameState.armour;
    magicRef.current = gameState.magic;
    positionRef.current = gameState.position;
    stageRef.current = gameState.stage;
  }, [gameState]);

  const updateCamera = useCallback(() => {
    if (playerRef.current && cameraRef.current) {
      const targetPosition = playerRef.current.position.clone().add(cameraOffset);
      cameraRef.current.position.lerp(targetPosition, lerpFactor);
      cameraRef.current.lookAt(playerRef.current.position);
    }
  }, [lerpFactor]);

  // Function to directly update game state with selections
  const applyCardSelection = useCallback((stage: number, cardType: string, cardX: number, cardZ: number) => {
    if (cooldownRef.current) return;
    
    // Play meow sound when a card is selected
    const meowSound = new Audio('/models/meow.mp3');
    meowSound.volume = 0.7;
    meowSound.play();
    
    // Update refs first
    if (stage === 0) {
      weaponRef.current = cardType as WeaponType;
      stageRef.current = 1;
    } else if (stage === 1) {
      armourRef.current = cardType as ArmourType;
      stageRef.current = 2; 
    } else if (stage === 2) {
      magicRef.current = cardType as MagicType;
    }
    
    // Update game state
    const newState = {
      weapon: weaponRef.current,
      armour: armourRef.current,
      magic: magicRef.current,
      stage: stageRef.current,
      position: positionRef.current,
      collectedBlocks: [...gameState.collectedBlocks, { x: cardX, z: cardZ }]
    };
    
    setGameState(newState);
    
    // Set selection cooldown
    cooldownRef.current = true;
    setSelectionCooldown(true);
    setSelectionForced(true);
    
    // Release cooldown after delay
    setTimeout(() => {
      cooldownRef.current = false;
      setSelectionCooldown(false);
    }, 1000);
  }, [gameState]);

  // Function to force select a card by index
  const forceSelectCard = useCallback((stage: number, cardIndex: number) => {
    if (cooldownRef.current) return;
    if (stage >= stageCardPositions.length || cardIndex >= stageCardPositions[stage].length) return;
    
    const card = stageCardPositions[stage][cardIndex];
    
    applyCardSelection(stage, card.type, card.x, card.z);
  }, [stageCardPositions, applyCardSelection]);

  // This function only updates position - doesn't touch other state
  const updatePosition = useCallback((newX: number, newZ: number) => {
    positionRef.current = { x: newX, z: newZ };
    
    setGameState({
      weapon: weaponRef.current,
      armour: armourRef.current,
      magic: magicRef.current,
      stage: stageRef.current,
      position: { x: newX, z: newZ },
      collectedBlocks: gameState.collectedBlocks
    });
  }, [gameState, setGameState]);

  // Setup keyboard controls
  useEffect(() => {
    const keys = new Set<string>();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      
      // Number keys 1-3 to force select a card
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        const cardIndex = parseInt(e.key) - 1;
        forceSelectCard(stageRef.current, cardIndex);
      }
    };
    
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
      
      // Calculate new position
      const newX = Math.max(Math.min(positionRef.current.x + velocity.current.x, 1.9), -1.9);
      const newZ = Math.max(Math.min(positionRef.current.z + velocity.current.y, 250), 0);
      
      // Update position - only position! Not other properties
      updatePosition(newX, newZ);
      
      // Calculate rotation based on movement direction
      if (velocity.current.length() > 0.01) {
        targetRotation.current = Math.atan2(velocity.current.x, velocity.current.y);
      }
      
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
  }, [forceSelectCard, speed, updatePosition]);
  
  useFrame((state, delta) => {
    if (playerRef.current) {
      // Smoothly interpolate player position with delta time
      const currentPos = playerRef.current.position;
      const targetPos = new Vector3(positionRef.current.x, 0.5, positionRef.current.z);
      currentPos.lerp(targetPos, positionLerpFactor);
      
      // Meditation bobbing effect - makes the character float up and down slightly
      playerRef.current.position.y = 0.5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.05;
      
      // Update debug sphere position to match player's hitbox position
      if (debugSphereRef.current && showDebug) {
        debugSphereRef.current.position.copy(currentPos);
      }
      
      // Smoothly rotate player model to face movement direction
      if (modelRef.current) {
        const currentRotation = modelRef.current.rotation.y;
        
        if (velocity.current.length() > 0.01) {
          // When moving, rotate to face movement direction
          modelRef.current.rotation.y = MathUtils.lerp(
            currentRotation,
            targetRotation.current,
            rotationSpeed
          );
        } else {
          // When still, apply a slow meditation spin
          modelRef.current.rotation.y += delta * 0.2; // Slow rotation speed
        }
      }

      // Don't check for collisions during cooldown
      if (cooldownRef.current) {
        updateCamera();
        return;
      }

      // Check for collision with any card
      if (stageRef.current < stageCardPositions.length) {
        const currentStageCards = stageCardPositions[stageRef.current];
        
        for (let i = 0; i < currentStageCards.length; i++) {
          const card = currentStageCards[i];
          
          // Skip already collected cards
          if (gameState.collectedBlocks.some(block => block.x === card.x && block.z === card.z)) {
            continue;
          }
          
          // Calculate distance between player and card
          const dx = currentPos.x - card.x;
          const dz = currentPos.z - card.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          // Check if player is colliding with this card
          if (distance < 1.0) {
            applyCardSelection(stageRef.current, card.type, card.x, card.z);
            return;
          }
        }
      }
      
      updateCamera();
      
      // Check if player fell off
      if (Math.abs(currentPos.x) > 2) {
        velocity.current.set(0, 0);
        targetVelocity.current.set(0, 0);
        
        // Reset all state
        weaponRef.current = null;
        armourRef.current = null;
        magicRef.current = null;
        stageRef.current = 0;
        positionRef.current = { x: 0, z: 0 };
        
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
      {/* Debug UI showing current selection */}
      <group position={[0, 0.5, 0]}>
        <Text
          position={[0, 4, 5]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
          rotation={[0, Math.PI, 0]}
        >
          Press 1-3 to select cards
        </Text>
      </group>
      
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.2, -3]} fov={65} />
      <mesh ref={playerRef} position={[0, 0.2, 0]}>
        <group ref={modelRef}>
          <primitive object={clonedScene} scale={0.5} />
          
          {/* Add orbiting weapon if one is selected */}
          {gameState.weapon && (
            <WeaponOrbit 
              weaponType={gameState.weapon} 
            />
          )}
          
          {/* Add orbiting armour if one is selected */}
          {gameState.armour && (
            <ArmourOrbit 
              armourType={gameState.armour} 
            />
          )}
          
          {/* Add orbiting magic if one is selected */}
          {gameState.magic && (
            <MagicOrbit 
              magicType={gameState.magic} 
            />
          )}
        </group>
      </mesh>
    </>
  );
}

useGLTF.preload('/models/player.glb');

export default Player