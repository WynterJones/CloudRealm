import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { Group, Vector3, MathUtils, Color, PointLight, Mesh, SphereGeometry, MeshBasicMaterial, BufferGeometry, Points, PointsMaterial, Float32BufferAttribute, BoxGeometry } from 'three';
import { GameState } from '../types/game';

interface BossProps {
  playerPosition: { x: number, z: number };
  gameState: GameState;
  bossHealth: number;
  updateBossHealth: (newHealth: number) => void;
}

function Boss({ playerPosition, gameState, bossHealth, updateBossHealth }: BossProps) {
  const bossRef = useRef<Group>(null);
  const effectsRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/brain.glb');
  const [isDescending, setIsDescending] = useState(true);
  const [initialPosition] = useState(new Vector3(0, 15, 55));
  const [isDying, setIsDying] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const [showBossNameAnimation, setShowBossNameAnimation] = useState(false);
  const damageRef = useRef(0);
  const bossAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Track health as local state instead of just a ref
  const [localBossHealth, setLocalBossHealth] = useState(bossHealth);
  
  // Also keep ref for non-reactive contexts
  const bossHealthRef = useRef(bossHealth);
  
  // Update our local state and ref whenever props change
  useEffect(() => {
    console.log(`Boss props health changed: ${bossHealth}, local health: ${localBossHealth}`);
    bossHealthRef.current = bossHealth;
    setLocalBossHealth(bossHealth);
  }, [bossHealth]);
  
  // Effect particles for different magic types
  const [rainParticles, setRainParticles] = useState<Points | null>(null);
  const [fireParticles, setFireParticles] = useState<Points | null>(null);
  const [heartParticles, setHeartParticles] = useState<Points | null>(null);
  
  // Reference for the light that will change color based on magic
  const magicLightRef = useRef<PointLight>(null);
  
  // Simplified spin state management
  const spinState = useRef({
    isSpinning: false,
    nextSpinTime: 0,
    spinStartTime: 0
  });
  
  // Combat system
  const combatState = useRef({
    lastAttackTime: 0,
    attackInterval: 1.0, // Reduced from 1.5 to 1.0 for more frequent attacks
    baseDamage: 10 // Increased from 5 to 10 for faster damage
  });
  
  // Dynamic movement tracking
  const movementState = useRef({
    baseDistance: 20, // Base distance to maintain from player
    currentDistance: 20, // Current target distance
    minDistance: 10, // Minimum distance boss can approach
    maxDistance: 25, // Maximum retreat distance
    isApproaching: false, // Whether boss is currently approaching player
    nextMovementChange: 0, // Time to change movement direction
    movementChangeInterval: [3, 7], // Range for movement change interval in seconds
    approachSpeed: 1.2, // Multiplier for approach speed
    retreatSpeed: 0.8 // Multiplier for retreat speed
  });
  
  // Target position in front of player (now dynamic)
  const targetHeight = 2.5; // Hover height above the bridge

  // Setup boss audio
  useEffect(() => {
    // Create audio element for boss sound
    const audio = new Audio('/models/brain.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    bossAudioRef.current = audio;
    
    // Clean up audio when component unmounts
    return () => {
      if (bossAudioRef.current) {
        bossAudioRef.current.pause();
        bossAudioRef.current = null;
      }
    };
  }, []);
  
  // Handle audio playback based on boss state
  useEffect(() => {
    // Start playing when boss has finished descending
    if (!isDescending && !isDying && !isDefeated && bossAudioRef.current) {
      // Try to play with a small delay after user interaction
      setTimeout(() => {
        if (bossAudioRef.current) {
          // Set volume very low at first to prevent loud start
          bossAudioRef.current.volume = 0.05;
          bossAudioRef.current.play()
            .then(() => {
              console.log('Boss audio started successfully');
              // Gradually increase volume
              const fadeIn = setInterval(() => {
                if (bossAudioRef.current && bossAudioRef.current.volume < 0.5) {
                  bossAudioRef.current.volume += 0.05;
                } else {
                  clearInterval(fadeIn);
                }
              }, 200);
            })
            .catch(err => {
              console.log('Failed to play boss audio - this is normal if user has not interacted yet:', err);
              // We'll let background music play first, boss audio will try again later
            });
        }
      }, 500);
    }
    
    // Stop audio when boss is defeated
    if ((isDying || isDefeated) && bossAudioRef.current) {
      // Gradually fade out audio
      const fadeAudio = setInterval(() => {
        if (bossAudioRef.current) {
          if (bossAudioRef.current.volume > 0.05) {
            bossAudioRef.current.volume -= 0.05;
          } else {
            bossAudioRef.current.pause();
            clearInterval(fadeAudio);
          }
        } else {
          clearInterval(fadeAudio);
        }
      }, 100);
      
      return () => clearInterval(fadeAudio);
    }
  }, [isDescending, isDying, isDefeated]);

  // Calculate damage based on player equipment
  const calculateDamage = () => {
    let damage = combatState.current.baseDamage;
    
    // Weapon bonus
    if (gameState.weapon === 'axe') damage += 3;
    else if (gameState.weapon === 'sword') damage += 2;
    else if (gameState.weapon === 'fist') damage += 1;
    
    // Armor bonus
    if (gameState.armour === 'steel') damage += 2;
    else if (gameState.armour === 'gold') damage += 1;
    else if (gameState.armour === 'knowledge') damage += 3;
    
    // Magic multiplier
    if (gameState.magic === 'fire') damage *= 1.5;
    else if (gameState.magic === 'water') damage *= 1.2;
    else if (gameState.magic === 'love') damage *= 1.3;
    
    return Math.round(damage);
  };

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
      
      // Show boss name with animation after the boss has descended a bit
      setTimeout(() => {
        setShowBossNameAnimation(true);
      }, 1500);
      
      setTimeout(() => {
        setIsDescending(false);
      }, descentDuration);
    }
    
    // Create particles for different magic effects
    if (effectsRef.current) {
      // Rain particles for water magic
      const rainGeometry = new BufferGeometry();
      const rainVertices = [];
      
      for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = Math.random() * 10;
        const z = (Math.random() - 0.5) * 10;
        rainVertices.push(x, y, z);
      }
      
      rainGeometry.setAttribute('position', new Float32BufferAttribute(rainVertices, 3));
      const rainMaterial = new PointsMaterial({ 
        color: 0x00aaff,
        size: 0.05,
        transparent: true,
        opacity: 0.7
      });
      
      const newRainParticles = new Points(rainGeometry, rainMaterial);
      newRainParticles.visible = false;
      setRainParticles(newRainParticles);
      effectsRef.current.add(newRainParticles);
      
      // Fire particles
      const fireGeometry = new BufferGeometry();
      const fireVertices = [];
      
      for (let i = 0; i < 500; i++) {
        const x = (Math.random() - 0.5) * 8;
        const y = Math.random() * 5;
        const z = (Math.random() - 0.5) * 8;
        fireVertices.push(x, y, z);
      }
      
      fireGeometry.setAttribute('position', new Float32BufferAttribute(fireVertices, 3));
      const fireMaterial = new PointsMaterial({ 
        color: 0xff5500,
        size: 0.1,
        transparent: true,
        opacity: 0.8
      });
      
      const newFireParticles = new Points(fireGeometry, fireMaterial);
      newFireParticles.visible = false;
      setFireParticles(newFireParticles);
      effectsRef.current.add(newFireParticles);
      
      // Heart particles for love magic
      const heartGeometry = new BufferGeometry();
      const heartVertices = [];
      
      for (let i = 0; i < 300; i++) {
        const x = (Math.random() - 0.5) * 12;
        const y = Math.random() * 8;
        const z = (Math.random() - 0.5) * 12;
        heartVertices.push(x, y, z);
      }
      
      heartGeometry.setAttribute('position', new Float32BufferAttribute(heartVertices, 3));
      const heartMaterial = new PointsMaterial({ 
        color: 0xff00aa,
        size: 0.15,
        transparent: true,
        opacity: 0.9
      });
      
      const newHeartParticles = new Points(heartGeometry, heartMaterial);
      newHeartParticles.visible = false;
      setHeartParticles(newHeartParticles);
      effectsRef.current.add(newHeartParticles);
    }
  }, [initialPosition]);
  
  // Effect for showing damage
  useEffect(() => {
    if (showDamageEffect) {
      const timer = setTimeout(() => {
        setShowDamageEffect(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showDamageEffect]);
  
  // Update magic effects based on player's magic selection
  useEffect(() => {
    if (!effectsRef.current) return;
    
    // Hide all effects first
    if (rainParticles) rainParticles.visible = false;
    if (fireParticles) fireParticles.visible = false;
    if (heartParticles) heartParticles.visible = false;
    
    // Show effect based on selected magic
    if (gameState.magic === 'water' && rainParticles) {
      rainParticles.visible = true;
      if (magicLightRef.current) {
        magicLightRef.current.color = new Color(0x00aaff);
        magicLightRef.current.intensity = 2;
      }
    } else if (gameState.magic === 'fire' && fireParticles) {
      fireParticles.visible = true;
      if (magicLightRef.current) {
        magicLightRef.current.color = new Color(0xff5500);
        magicLightRef.current.intensity = 3;
      }
    } else if (gameState.magic === 'love' && heartParticles) {
      heartParticles.visible = true;
      if (magicLightRef.current) {
        magicLightRef.current.color = new Color(0xff00aa);
        magicLightRef.current.intensity = 2.5;
      }
    }
  }, [gameState.magic, rainParticles, fireParticles, heartParticles]);

  // Animation loop
  useFrame((state, delta) => {
    if (!bossRef.current || !effectsRef.current) return;
    
    // If boss is defeated, handle death animation
    if (isDefeated) {
      // Rise up to the sky
      bossRef.current.position.y += delta * 10;
      
      // Rotate faster as it ascends
      bossRef.current.rotation.y += delta * 5;
      
      return;
    }
    
    // Death animation - pulsate before shooting up
    if (isDying) {
      const pulseFrequency = 5;
      const pulseAmplitude = 1 + Math.sin(state.clock.getElapsedTime() * pulseFrequency) * 0.5;
      bossRef.current.scale.set(
        3 * pulseAmplitude,
        3 * pulseAmplitude,
        3 * pulseAmplitude
      );
      
      // After 3 seconds of pulsing, set to defeated
      if (state.clock.getElapsedTime() - damageRef.current > 3) {
        setIsDefeated(true);
      }
      
      return;
    }
    
    // Update dynamic movement distance once not descending
    if (!isDescending) {
      const currentTime = state.clock.getElapsedTime();
      
      // Check if it's time to change movement direction
      if (currentTime > movementState.current.nextMovementChange) {
        // Toggle approach/retreat mode
        movementState.current.isApproaching = !movementState.current.isApproaching;
        
        // Set next change time
        const [min, max] = movementState.current.movementChangeInterval;
        const nextInterval = min + Math.random() * (max - min);
        movementState.current.nextMovementChange = currentTime + nextInterval;
        
        // Occasionally perform a quick dart movement
        if (Math.random() < 0.3) {
          // Quick dart is faster approach followed by faster retreat
          if (movementState.current.isApproaching) {
            movementState.current.approachSpeed = 2.0; // Faster approach
          } else {
            movementState.current.retreatSpeed = 1.5; // Faster retreat
          }
        } else {
          // Reset to normal speeds
          movementState.current.approachSpeed = 1.2;
          movementState.current.retreatSpeed = 0.8;
        }
      }
      
      // Gradually update the current distance based on approach/retreat
      if (movementState.current.isApproaching) {
        // Move closer to the player
        movementState.current.currentDistance = MathUtils.lerp(
          movementState.current.currentDistance,
          movementState.current.minDistance,
          delta * movementState.current.approachSpeed
        );
      } else {
        // Move away from the player
        movementState.current.currentDistance = MathUtils.lerp(
          movementState.current.currentDistance,
          movementState.current.maxDistance,
          delta * movementState.current.retreatSpeed
        );
      }
    }
    
    // Calculate target position with dynamic distance
    const playerForwardZ = playerPosition.z + movementState.current.currentDistance;
    
    // Calculate damage and attack at intervals if boss is active
    if (!isDescending && !isDying && gameState.magic && gameState.weapon && gameState.armour) {
      const currentTime = state.clock.getElapsedTime();
      
      if (currentTime - combatState.current.lastAttackTime > combatState.current.attackInterval) {
        // Time for a new attack
        const damage = calculateDamage();
        
        // Use local health state to ensure consistent updates
        const newHealth = Math.max(0, localBossHealth - damage);
        
        console.log(`Boss taking damage: ${damage}, Current Health: ${localBossHealth} -> ${newHealth}`);
        
        // Update our local state immediately
        setLocalBossHealth(newHealth);
        
        // Apply damage by updating parent health
        updateBossHealth(newHealth);
        
        // Check if the boss is dying - need to check exactly zero to avoid floating point issues
        if (newHealth <= 0 && !isDying) {
          setIsDying(true);
          damageRef.current = currentTime;
          console.log('Boss dying triggered!');
        }
        
        // Show damage effect
        setShowDamageEffect(true);
        
        // Update last attack time
        combatState.current.lastAttackTime = currentTime;
      }
    }
    
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
      // Stay in front of player with smooth following - use dynamic distance
      bossRef.current.position.x = MathUtils.lerp(
        bossRef.current.position.x, 
        playerPosition.x + (Math.sin(state.clock.getElapsedTime() * 0.8) * 3), // Add slight side-to-side movement
        delta * 5
      );
      bossRef.current.position.z = MathUtils.lerp(
        bossRef.current.position.z, 
        playerForwardZ, 
        delta * 5
      );
      
      // Bobbing up and down with varying height based on approach/retreat
      const bobHeight = movementState.current.isApproaching ? 0.8 : 0.5; // More vertical movement when approaching
      const bobSpeed = movementState.current.isApproaching ? 0.8 : 0.5;  // Faster bobbing when approaching
      bossRef.current.position.y = targetHeight + 
        Math.sin(state.clock.getElapsedTime() * bobSpeed) * bobHeight;
      
      // Position effects to follow the boss
      effectsRef.current.position.copy(bossRef.current.position);
      
      // Animate rain particles (water magic)
      if (rainParticles && rainParticles.visible) {
        const positions = rainParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          // Move rain downward
          positions[i + 1] -= delta * 5; // Speed of falling
          
          // Reset if below ground
          if (positions[i + 1] < -5) {
            positions[i + 1] = 10; // Reset to top
            positions[i] = (Math.random() - 0.5) * 10; // Randomize x
            positions[i + 2] = (Math.random() - 0.5) * 10; // Randomize z
          }
        }
        rainParticles.geometry.attributes.position.needsUpdate = true;
      }
      
      // Animate fire particles
      if (fireParticles && fireParticles.visible) {
        const positions = fireParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          // Move fire upward
          positions[i + 1] += delta * (1 + Math.random() * 2); // Variable speed
          
          // Add some randomness to X and Z
          positions[i] += delta * (Math.random() - 0.5) * 2;
          positions[i + 2] += delta * (Math.random() - 0.5) * 2;
          
          // Reset if above threshold
          if (positions[i + 1] > 5) {
            positions[i + 1] = Math.random() * 0.5; // Reset near ground
            positions[i] = (Math.random() - 0.5) * 8; // Randomize x
            positions[i + 2] = (Math.random() - 0.5) * 8; // Randomize z
          }
        }
        fireParticles.geometry.attributes.position.needsUpdate = true;
      }
      
      // Animate heart particles
      if (heartParticles && heartParticles.visible) {
        const positions = heartParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          // Move hearts in all directions
          positions[i] += delta * (Math.random() - 0.5) * 2; // X movement
          positions[i + 1] += delta * (0.5 + Math.random() * 1); // Upward Y movement
          positions[i + 2] += delta * (Math.random() - 0.5) * 2; // Z movement
          
          // Reset if too far
          const distance = Math.sqrt(
            positions[i] * positions[i] + 
            positions[i + 1] * positions[i + 1] + 
            positions[i + 2] * positions[i + 2]
          );
          
          if (distance > 12 || positions[i + 1] > 8) {
            positions[i] = (Math.random() - 0.5) * 6; // Close to center
            positions[i + 1] = Math.random() * 1; // Low height
            positions[i + 2] = (Math.random() - 0.5) * 6; // Close to center
          }
        }
        heartParticles.geometry.attributes.position.needsUpdate = true;
      }
      
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

  // Update component when boss dies
  useEffect(() => {
    if (isDying && !isDefeated) {
      console.log('Boss death animation starting');
      
      // After death animation completes, set to defeated
      const defeatTimer = setTimeout(() => {
        console.log('Boss is now fully defeated, hiding model');
        setIsDefeated(true);
        
        // Ensure the parent knows the boss is defeated
        updateBossHealth(0);
      }, 4000); // 4 seconds for death animation
      
      return () => clearTimeout(defeatTimer);
    }
  }, [isDying, isDefeated]);
  
  // Clean up effect when boss is defeated
  useEffect(() => {
    if (isDefeated) {
      console.log('Boss is defeated, clearing all effects and sounds');
      
      // Explicitly set health to 0 and mark as defeated again to ensure it's updated
      console.log('Explicitly calling updateBossHealth(0) when boss is defeated');
      updateBossHealth(0);
      
      // Clear all particle effects
      setRainParticles(null);
      setFireParticles(null);
      setHeartParticles(null);
      
      // Stop boss audio with fade out
      if (bossAudioRef.current) {
        const fadeOut = setInterval(() => {
          if (bossAudioRef.current && bossAudioRef.current.volume > 0.05) {
            bossAudioRef.current.volume -= 0.05;
          } else {
            if (bossAudioRef.current) {
              bossAudioRef.current.pause();
              bossAudioRef.current.currentTime = 0;
            }
            clearInterval(fadeOut);
          }
        }, 50);
      }
    }
  }, [isDefeated]);

  return (
    <>
      <group ref={bossRef}>
        <primitive object={clonedScene} />
        
        {/* Damage effect */}
        {showDamageEffect && (
          <Html position={[0, 3, 0]} center>
            <div style={{ 
              color: 'red', 
              fontWeight: 'bold',
              fontSize: '24px',
              textShadow: '0 0 5px black, 0 0 10px red',
              animation: 'damageAnim 0.5s',
              fontFamily: 'Arial, sans-serif'
            }}>
              {calculateDamage()}
            </div>
          </Html>
        )}
      </group>
      
      {/* Effects group */}
      <group ref={effectsRef}>
        <pointLight ref={magicLightRef} color="white" intensity={0} distance={15} />
      </group>
      
      {/* Add the CSS animation for the damage numbers */}
      <Html position={[0, 0, 0]}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes damageAnim {
            0% { transform: scale(1); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
          }
        `}} />
      </Html>
    </>
  );
}

// Preload the model
useGLTF.preload('/models/brain.glb');

export default Boss; 