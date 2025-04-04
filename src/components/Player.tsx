import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, Vector2, PerspectiveCamera as ThreePerspectiveCamera, Quaternion, MathUtils, Group, SphereGeometry, MeshBasicMaterial } from 'three';
import { PerspectiveCamera, useGLTF, Text } from '@react-three/drei';
import { GameState, WeaponType, ArmourType, MagicType } from '../types/game';
import WeaponOrbit from './WeaponOrbit';
import ArmourOrbit from './ArmourOrbit';

interface PlayerProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  playMusic: () => void;
  bossDefeated?: boolean;
  hasAllItems?: boolean;
  bossHealth: number;
  onMobileMove?: (x: number, y: number) => void;
}

export interface PlayerHandle {
  handleMobileMove: (x: number, y: number) => void;
  clearMobileInput: () => void;
}

const Player = forwardRef<PlayerHandle, PlayerProps>(({ 
  gameState, 
  setGameState, 
  playMusic, 
  bossDefeated, 
  hasAllItems, 
  bossHealth, 
  onMobileMove 
}, ref) => {
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
  const showDebug = true;

  // Track if we've forced a selection
  const [selectionForced, setSelectionForced] = useState(false);

  // Track if music has been played yet
  const musicStartedRef = useRef(false);

  const mobileVelocity = useRef(new Vector2(0, 0));
  const mobileInputActive = useRef(false);

  // Function to unlock all audio after user interaction
  const unlockAudioForAll = useCallback(() => {
    // Create a silent audio context and play it to unlock audio on iOS
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const silentBuffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    // Try to force audio unlock by playing a silent sound
    const silence = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABBwBtbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1t//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAABAcFNb4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kGQAAAAAADUAAAAAACwAAAAAKAQAAAk4QkdAAAAnAAAABgcVNFQJAKiEMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGEAAAQ4EHQIPBA6L0H3gPgQdF0XoPvAfAgcF74fQewIPBAcMHgfBAcAeBB0YPwfQfQfVrWtaywmm2oAAAAAAAAAAAAAAAp222gAAYYQQwwlCsDizq7u7u7u7u7u7u7u7u7u7u+7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7rWtaC21nmB0HwfB8HwfVrWtaH0fggOA+BA4IPg+CB0W5Dg+D4PggOCB4IHQeg9B8EDoQe+H0HwIHPA+g9B9B9B9B9B9B9B9B9BKta1rWta1rWta1rWta1rWtaKNa1rWta1rWiDWtaKNaINa1rWioNCDGMIQYxhBDGMIIYxhBDGMIIYxhBDGMIIYxhBDGMIIYxhBDGMIMYwgxjCD/+5JkEA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARGMIMYwghjCCGMYQQxjCCGMYQQxjCCGMYQQxjCCGMYQQxjCCGMYQQAAAAAP/////////////////////////////////////////////7/////////////////////////////////////////////////////////////////z////////////////////////////4=");
    silence.volume = 0.001;
    silence.play().then(() => {
      console.log('Audio unlocked on mobile device');
    }).catch(e => {
      console.log('Failed to unlock audio:', e);
    });
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleMobileMove: (x: number, y: number) => {
      console.log(`PLAYER handleMobileMove CALLED WITH: (${x}, ${y})`);
      
      // Make sure values are above threshold to prevent very small unintended movements
      if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) {
        console.log('Player ignoring tiny mobile input');
        return;
      }
      
      // First mobile input - try to unlock audio
      unlockAudioForAll();
      
      // Set active flag and update velocity with direct input values
      // FLIP X AXIS by negating the x value to correct left/right movement
      mobileInputActive.current = true;
      mobileVelocity.current.set(-x, y); // Negate x to flip left/right
      console.log(`Setting mobileInputActive to TRUE and mobileVelocity to (${-x}, ${y})`);
      
      // Start music on first movement if not already started
      if (!musicStartedRef.current) {
        playMusic();
        musicStartedRef.current = true;
      }
      
      // DIRECT APPROACH - Modify position immediately for responsive feel
      // Scale inputs to match WASD speed exactly
      const scaledX = -x * 0.0005; // Further reduced for extremely slow movement
      const scaledY = y * 0.0005;  // Further reduced for extremely slow movement
      
      // Calculate new position
      const newX = Math.max(Math.min(positionRef.current.x + scaledX, 1.9), -1.9);
      const newZ = Math.max(Math.min(positionRef.current.z + scaledY, 300), -20);
      
      console.log(`DIRECT MOVEMENT: Current position (${positionRef.current.x}, ${positionRef.current.z})`);
      console.log(`DIRECT MOVEMENT: Setting to (${newX}, ${newZ})`);
      
      // Update position state
      updatePosition(newX, newZ);
      
      // Force immediate mesh update
      if (playerRef.current) {
        playerRef.current.position.x = newX;
        playerRef.current.position.z = newZ;
        console.log(`Directly updated mesh position to (${newX}, ${newZ})`);
      }
    },
    clearMobileInput: () => {
      console.log('PLAYER clearMobileInput CALLED');
      mobileInputActive.current = false;
      mobileVelocity.current.set(0, 0);
      console.log('Setting mobileInputActive to FALSE');
    }
  }));

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
    meowSound.volume = 0.6;
    meowSound.play();
    
    // Play weapon-specific voice when weapon is selected
    if (stage === 0) {
      // Delay the weapon voice to play after the meow sound
      setTimeout(() => {
        const voiceFile = `/models/voice-${cardType}.mp3`;
        const weaponVoice = new Audio(voiceFile);
        weaponVoice.volume = 1.0;
        weaponVoice.play().catch(error => {
          console.log(`Failed to play weapon voice: ${error}`);
        });
      }, 500); // 500ms delay to play after the meow
    }
    // Play armor-specific voice when armor is selected
    else if (stage === 1) {
      // Delay the armor voice to play after the meow sound
      setTimeout(() => {
        const voiceFile = `/models/voice-${cardType}.mp3`;
        const armorVoice = new Audio(voiceFile);
        armorVoice.volume = 1.0;
        armorVoice.play().catch(error => {
          console.log(`Failed to play armor voice: ${error}`);
        });
      }, 500); // 500ms delay to play after the meow
    }
    // Play magic-specific voice when magic is selected
    else if (stage === 2) {
      // Delay the magic voice to play after the meow sound
      setTimeout(() => {
        const voiceFile = `/models/voice-${cardType}.mp3`;
        const magicVoice = new Audio(voiceFile);
        magicVoice.volume = 1.0;
        magicVoice.play().catch(error => {
          console.log(`Failed to play magic voice: ${error}`);
        });
      }, 500); // 500ms delay to play after the meow
    }
    
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
      collectedBlocks: [...gameState.collectedBlocks, { x: cardX, z: cardZ }],
      isInvulnerable: gameState.isInvulnerable,
      bossHealth: gameState.bossHealth,
      bossDefeated: gameState.bossDefeated
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
      collectedBlocks: gameState.collectedBlocks,
      isInvulnerable: gameState.isInvulnerable,
      bossHealth: gameState.bossHealth,
      bossDefeated: gameState.bossDefeated
    });
  }, [gameState, setGameState]);

  // Setup keyboard controls
  useEffect(() => {
    const keys = new Set<string>();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      
      // Play music on first movement if not already started
      if (!musicStartedRef.current && ['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        // Try to unlock audio on first keyboard interaction
        unlockAudioForAll();
        
        // Start background music
        playMusic();
        musicStartedRef.current = true;
      }
      
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
      
      // Handle keyboard input
      if (keys.has('a')) targetVelocity.current.x = speed;
      if (keys.has('d')) targetVelocity.current.x = -speed;
      if (keys.has('w')) targetVelocity.current.y = speed;
      if (keys.has('s')) targetVelocity.current.y = -speed;
      
      // Handle mobile input - prioritize mobile input over keyboard
      if (mobileInputActive.current) {
        console.log(`Mobile active check: active=${mobileInputActive.current}, velocity length=${mobileVelocity.current.length()}`);
        
        // Always prioritize mobile input when active - clear any keyboard inputs
        targetVelocity.current.set(0, 0);
        keys.clear();
        
        if (mobileVelocity.current.length() > 0.01) { // Reduced sensitivity threshold
          console.log(`Using mobile velocity: (${mobileVelocity.current.x}, ${mobileVelocity.current.y})`);
          // Replace keyboard values completely when using mobile
          targetVelocity.current.copy(mobileVelocity.current);
          
          // Scale mobile movement to match much slower than WASD speed
          if (targetVelocity.current.length() > 0) {
            targetVelocity.current.normalize().multiplyScalar(speed * 0.5); // Reduced to 50% of WASD speed
          }
          console.log(`Scaled target velocity: (${targetVelocity.current.x}, ${targetVelocity.current.y})`);
        }
      }
      else {
        // Normalize diagonal movement for keyboard
        if (targetVelocity.current.length() > 0) {
          targetVelocity.current.normalize().multiplyScalar(speed);
        }
      }
      
      // Apply acceleration/deceleration - use extremely slow acceleration for mobile
      const accelerationFactor = (keys.size || mobileInputActive.current) ? 
        (mobileInputActive.current ? 0.05 : acceleration) : deceleration; // Reduced to 0.05 for extremely smooth mobile movement
      velocity.current.lerp(targetVelocity.current, accelerationFactor);
      
      // Calculate new position
      const newX = Math.max(Math.min(positionRef.current.x + velocity.current.x, 1.9), -1.9);
      const newZ = Math.max(Math.min(positionRef.current.z + velocity.current.y, 300), -20);
      
      // Log position changes when using mobile input
      if (mobileInputActive.current && velocity.current.length() > 0.01) {
        console.log(`New position: (${newX}, ${newZ})`);
      }
      
      // Update position
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
  }, [forceSelectCard, speed, updatePosition, playMusic]);
  
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

      // Don't check for collisions when player is invulnerable (during teleportation)
      if (gameState.isInvulnerable) {
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
          collectedBlocks: [],
          isInvulnerable: false,
          bossHealth: gameState.bossHealth,
          bossDefeated: gameState.bossDefeated
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
        
        {/* Mobile input debug */}
        {showDebug && (
          <Text
            position={[0, 3.5, 5]}
            fontSize={0.25}
            color={mobileInputActive.current ? "#00ff00" : "#ff0000"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
            rotation={[0, Math.PI, 0]}
          >
            Mobile: {mobileInputActive.current ? "ACTIVE" : "INACTIVE"} 
            ({mobileVelocity.current.x.toFixed(2)}, {mobileVelocity.current.y.toFixed(2)})
          </Text>
        )}
      </group>
      
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.2, -3]} fov={65} />
      <mesh ref={playerRef} position={[0, 0.2, 0]}>
        <group ref={modelRef}>
          <primitive object={clonedScene} scale={0.5} />
          
          {/* Add orbiting weapon if one is selected */}
          {gameState.weapon && (
            <WeaponOrbit 
              weaponType={gameState.weapon} 
              bossDefeated={bossDefeated}
              hasAllItems={hasAllItems}
            />
          )}
          
          {/* Add orbiting armour if one is selected */}
          {gameState.armour && (
            <ArmourOrbit 
              armourType={gameState.armour} 
              bossDefeated={bossDefeated}
              hasAllItems={hasAllItems}
            />
          )}
        </group>
      </mesh>
    </>
  );
});

useGLTF.preload('/models/player.glb');

export default Player