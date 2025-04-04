import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Color } from 'three';
import Bridge from './Bridge.tsx';
import Player, { PlayerHandle } from './Player';
import UI from './UI.tsx';
import Boss from './Boss.tsx';
import AdBillboards from './AdBillboards.tsx';
import IntroMessages from './IntroMessages.tsx';
import Victory from './Victory.tsx';
import { GameState } from '../types/game';
import { Suspense } from 'react';

// Extend Window interface to include our global game state
declare global {
  interface Window {
    gameState?: GameState;
    setGameState?: (state: GameState) => void;
  }
}

interface GameProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  playMusic: () => void;
}

const Game = ({ gameState, setGameState, playMusic }: GameProps) => {
  const [showIntro, setShowIntro] = useState(true);
  const hasAllItems = gameState.weapon !== null && gameState.armour !== null && gameState.magic !== null;
  const playerRef = useRef<PlayerHandle>(null);
  
  // Refs for music control
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const bossMusicRef = useRef<HTMLAudioElement | null>(null);
  const endMusicRef = useRef<HTMLAudioElement | null>(null);
  const musicSwitchedRef = useRef(false);
  
  // Refs for weapon attack sounds
  const swordAttackRef = useRef<HTMLAudioElement | null>(null);
  const axeAttackRef = useRef<HTMLAudioElement | null>(null);
  const fistsAttackRef = useRef<HTMLAudioElement | null>(null);
  const currentAttackSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Refs for magic attack sounds
  const waterAttackRef = useRef<HTMLAudioElement | null>(null);
  const fireAttackRef = useRef<HTMLAudioElement | null>(null);
  const loveAttackRef = useRef<HTMLAudioElement | null>(null);
  const currentMagicSoundRef = useRef<HTMLAudioElement | null>(null);

  // Create a ref to track if music has started
  const musicStartedRef = useRef(false);

  // Create a ref to track current boss health to avoid state update delays
  const currentBossHealthRef = useRef(gameState.bossHealth);
  
  // State to track victory screen display
  const [showVictory, setShowVictory] = useState(false);
  
  // Update our local ref whenever gameState changes
  useEffect(() => {
    currentBossHealthRef.current = gameState.bossHealth;
  }, [gameState.bossHealth]);

  // Expose gameState and setGameState to window for Victory component
  useEffect(() => {
    window.gameState = gameState;
    window.setGameState = setGameState;
    
    return () => {
      // Clean up when component unmounts
      window.gameState = undefined;
      window.setGameState = undefined;
    };
  }, [gameState, setGameState]);

  // Initialize audio
  useEffect(() => {
    // Create audio elements for background music
    backgroundMusicRef.current = new Audio('/models/bg.mp3');
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.6;
    
    bossMusicRef.current = new Audio('/models/boss.mp3');
    bossMusicRef.current.loop = true;
    bossMusicRef.current.volume = 0.7;
    
    // Create victory music
    endMusicRef.current = new Audio('/models/end.mp3');
    endMusicRef.current.loop = true;
    endMusicRef.current.volume = 0.7;
    
    // Create audio elements for weapon attack sounds
    swordAttackRef.current = new Audio('/models/attack-sword.mp3');
    swordAttackRef.current.loop = true;
    swordAttackRef.current.volume =0.9;
    
    axeAttackRef.current = new Audio('/models/attack-axe.mp3');
    axeAttackRef.current.loop = true;
    axeAttackRef.current.volume = 0.9;
    
    fistsAttackRef.current = new Audio('/models/attack-fists.mp3');
    fistsAttackRef.current.loop = true;
    fistsAttackRef.current.volume = 0.9;
    
    // Create audio elements for magic attack sounds at lower volume
    waterAttackRef.current = new Audio('/models/attack-water.mp3');
    waterAttackRef.current.loop = true;
    waterAttackRef.current.volume = 0.9;
    
    fireAttackRef.current = new Audio('/models/attack-fire.mp3');
    fireAttackRef.current.loop = true;
    fireAttackRef.current.volume = 0.9;
    
    loveAttackRef.current = new Audio('/models/attack-love.mp3');
    loveAttackRef.current.loop = true;
    loveAttackRef.current.volume = 0.9;
    
    // Clean up
    return () => {
      // Stop and clean up background music
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.src = '';
      }
      if (bossMusicRef.current) {
        bossMusicRef.current.pause();
        bossMusicRef.current.src = '';
      }
      
      if (endMusicRef.current) {
        endMusicRef.current.pause();
        endMusicRef.current.src = '';
      }
      
      // Stop and clean up attack sounds
      if (swordAttackRef.current) {
        swordAttackRef.current.pause();
        swordAttackRef.current.src = '';
      }
      if (axeAttackRef.current) {
        axeAttackRef.current.pause();
        axeAttackRef.current.src = '';
      }
      if (fistsAttackRef.current) {
        fistsAttackRef.current.pause();
        fistsAttackRef.current.src = '';
      }
      
      // Stop and clean up magic sounds
      if (waterAttackRef.current) {
        waterAttackRef.current.pause();
        waterAttackRef.current.src = '';
      }
      if (fireAttackRef.current) {
        fireAttackRef.current.pause();
        fireAttackRef.current.src = '';
      }
      if (loveAttackRef.current) {
        loveAttackRef.current.pause();
        loveAttackRef.current.src = '';
      }
    };
  }, []);
  
  // Effect to play weapon attack sounds when all items are selected
  useEffect(() => {
    // Stop current attack sound if there is one
    if (currentAttackSoundRef.current) {
      currentAttackSoundRef.current.pause();
      currentAttackSoundRef.current = null;
    }
    
    // If boss is defeated, don't play any attack sounds
    if (gameState.bossDefeated) {
      return;
    }
    
    // Play the appropriate attack sound if weapon is selected and all items are collected
    if (hasAllItems && gameState.weapon) {
      let attackSound: HTMLAudioElement | null = null;
      
      if (gameState.weapon === 'sword' && swordAttackRef.current) {
        attackSound = swordAttackRef.current;
      } else if (gameState.weapon === 'axe' && axeAttackRef.current) {
        attackSound = axeAttackRef.current;
      } else if (gameState.weapon === 'fist' && fistsAttackRef.current) {
        attackSound = fistsAttackRef.current;
      }
      
      if (attackSound) {
        attackSound.currentTime = 0;
        attackSound.play().catch(error => {
          console.log("Attack sound autoplay failed:", error);
        });
        currentAttackSoundRef.current = attackSound;
      }
    }
    
    // Cleanup function to stop attack sounds when component unmounts or when effect reruns
    return () => {
      if (currentAttackSoundRef.current) {
        currentAttackSoundRef.current.pause();
      }
    };
  }, [hasAllItems, gameState.weapon, gameState.bossDefeated]);
  
  // Effect to play magic attack sounds when all items are selected
  useEffect(() => {
    // Stop current magic sound if there is one
    if (currentMagicSoundRef.current) {
      currentMagicSoundRef.current.pause();
      currentMagicSoundRef.current = null;
    }
    
    // If boss is defeated, don't play any magic sounds
    if (gameState.bossDefeated) {
      return;
    }
    
    // Play the appropriate magic sound if magic is selected and all items are collected
    if (hasAllItems && gameState.magic) {
      let magicSound: HTMLAudioElement | null = null;
      
      if (gameState.magic === 'water' && waterAttackRef.current) {
        magicSound = waterAttackRef.current;
      } else if (gameState.magic === 'fire' && fireAttackRef.current) {
        magicSound = fireAttackRef.current;
      } else if (gameState.magic === 'love' && loveAttackRef.current) {
        magicSound = loveAttackRef.current;
      }
      
      if (magicSound) {
        magicSound.currentTime = 0;
        magicSound.play().catch(error => {
          console.log("Magic sound autoplay failed:", error);
        });
        currentMagicSoundRef.current = magicSound;
      }
    }
    
    // Cleanup function to stop magic sounds when component unmounts or when effect reruns
    return () => {
      if (currentMagicSoundRef.current) {
        currentMagicSoundRef.current.pause();
      }
    };
  }, [hasAllItems, gameState.magic, gameState.bossDefeated]);
  
  // Effect to switch music when boss appears
  useEffect(() => {
    // Only run this once when hasAllItems becomes true
    if (hasAllItems && !musicSwitchedRef.current && backgroundMusicRef.current && bossMusicRef.current) {
      const bgMusic = backgroundMusicRef.current;
      const bossMusic = bossMusicRef.current;
      
      // Fade out background music
      const fadeOutInterval = setInterval(() => {
        if (bgMusic && bgMusic.volume > 0.05) {
          bgMusic.volume -= 0.05;
        } else {
          clearInterval(fadeOutInterval);
          if (bgMusic) {
            bgMusic.pause();
          }
          
          // Start boss music
          bossMusic.play().catch(error => {
            console.log("Boss music autoplay failed, will play on user interaction");
          });
          
          // Fade in boss music
          let bossVolume = 0;
          const fadeInInterval = setInterval(() => {
            if (bossVolume < 0.7) {
              bossVolume += 0.05;
              bossMusic.volume = bossVolume;
            } else {
              clearInterval(fadeInInterval);
            }
          }, 100);
          
          musicSwitchedRef.current = true;
        }
      }, 100);
    }
  }, [hasAllItems]);

  // Effect to handle boss being defeated
  useEffect(() => {
    if (gameState.bossDefeated) {
      console.log("Boss defeated detected in Game component, showing victory screen");
      
      // Stop attack sound
      if (currentAttackSoundRef.current) {
        // Fade out the attack sound
        const fadeInterval = setInterval(() => {
          if (currentAttackSoundRef.current && currentAttackSoundRef.current.volume > 0.05) {
            currentAttackSoundRef.current.volume -= 0.05;
          } else {
            clearInterval(fadeInterval);
            if (currentAttackSoundRef.current) {
              currentAttackSoundRef.current.pause();
              currentAttackSoundRef.current = null;
            }
          }
        }, 100);
      }
      
      // Stop magic sound
      if (currentMagicSoundRef.current) {
        // Fade out the magic sound
        const fadeMagicInterval = setInterval(() => {
          if (currentMagicSoundRef.current && currentMagicSoundRef.current.volume > 0.03) {
            currentMagicSoundRef.current.volume -= 0.03;
          } else {
            clearInterval(fadeMagicInterval);
            if (currentMagicSoundRef.current) {
              currentMagicSoundRef.current.pause();
              currentMagicSoundRef.current = null;
            }
          }
        }, 100);
      }
      
      // Switch from boss music to end music
      if (bossMusicRef.current && endMusicRef.current) {
        // Fade out boss music
        const fadeBossMusicInterval = setInterval(() => {
          if (bossMusicRef.current && bossMusicRef.current.volume > 0.05) {
            bossMusicRef.current.volume -= 0.05;
          } else {
            clearInterval(fadeBossMusicInterval);
            if (bossMusicRef.current) {
              bossMusicRef.current.pause();
            }
            
            if (endMusicRef.current) {
              // Start end music with fade in
              endMusicRef.current.currentTime = 0;
              endMusicRef.current.volume = 0.1;
              endMusicRef.current.play().catch(error => {
                console.log("End music autoplay failed, will play on user interaction");
              });
              
              // Fade in end music
              let endVolume = 0.1;
              const fadeInInterval = setInterval(() => {
                if (endMusicRef.current && endVolume < 0.7) {
                  endVolume += 0.05;
                  endMusicRef.current.volume = endVolume;
                } else {
                  clearInterval(fadeInInterval);
                }
              }, 100);
            }
          }
        }, 100);
      }
    }
  }, [gameState.bossDefeated]);

  // Effect specifically to debug bossDefeated state changes
  useEffect(() => {
    console.log('VICTORY DEBUG - gameState.bossDefeated changed to:', gameState.bossDefeated);
    if (gameState.bossDefeated) {
      console.log('VICTORY SHOULD BE SHOWING NOW!');
    }
  }, [gameState.bossDefeated]);

  // Effect to continuously check boss health and ensure victory state
  useEffect(() => {
    // If boss health is 0 or less but bossDefeated isn't true, fix it
    if (currentBossHealthRef.current <= 0 && !gameState.bossDefeated) {
      console.log("FIXING INCONSISTENT STATE: Boss health is 0 but bossDefeated isn't true");
      
      // Create a fresh state object with bossDefeated set to true
      const fixedState = {
        ...gameState,
        bossHealth: 0,
        bossDefeated: true
      };
      
      // Update state
      setGameState(fixedState);
      
      // Update global state
      if (window.setGameState) {
        window.setGameState(fixedState);
      }
    }
  }, [gameState, setGameState]);

  // Add effect to handle victory state
  useEffect(() => {
    if (gameState.bossDefeated && !showVictory) {
      console.log("VICTORY DEBUG: Setting showVictory to true");
      setShowVictory(true);
    }
  }, [gameState.bossDefeated, showVictory]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleRestartGame = () => {
    console.log("RESTARTING GAME FROM VICTORY SCREEN");
    
    // Hide the victory screen
    setShowVictory(false);
    
    // Reset boss health ref first
    currentBossHealthRef.current = 100;
    
    // Force teleport player to the start position
    if (window.gameState) {
      window.gameState = {
        weapon: null,
        armour: null,
        magic: null,
        position: { x: 0, z: 0 },
        stage: 0,
        collectedBlocks: [],
        isInvulnerable: true,
        bossHealth: 100,
        bossDefeated: false
      };
    }
    
    // Reset game state
    setGameState({
      weapon: null,
      armour: null,
      magic: null,
      position: { x: 0, z: 0 },
      stage: 0,
      collectedBlocks: [],
      isInvulnerable: true,
      bossHealth: 100,
      bossDefeated: false
    });
    
    // Remove invulnerability after a 1-second delay
    setTimeout(() => {
      // Update both local gameState and window.gameState
      setGameState({
        ...gameState,
        isInvulnerable: false
      });
      
      // Make sure window.gameState is also updated with invulnerability off
      if (window.gameState && window.setGameState) {
        window.setGameState({
          ...window.gameState,
          isInvulnerable: false
        });
      }
      
      console.log("Collision detection re-enabled after restart");
    }, 1000);
    
    setShowIntro(true);
    
    // Reset music
    if (endMusicRef.current) {
      endMusicRef.current.pause();
      endMusicRef.current.currentTime = 0;
    }
    
    if (bossMusicRef.current) {
      bossMusicRef.current.pause();
      bossMusicRef.current.currentTime = 0;
    }
    
    // Start background music again - this is in response to a user interaction (clicking restart),
    // so it should work without autoplay restrictions
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.currentTime = 0;
      backgroundMusicRef.current.volume = 0.6;
      
      // Try to play the music - we already have user interaction from the restart button
      backgroundMusicRef.current.play().then(() => {
        console.log("Background music successfully restarted");
        musicStartedRef.current = true;
      }).catch(error => {
        console.log("Background music autoplay failed on restart, will play on next user interaction");
        musicStartedRef.current = false;
      });
    }
    
    // Reset music switched flag
    musicSwitchedRef.current = false;
  };

  const handleMobileMove = (x: number, y: number) => {
    console.log(`GAME FORWARDING MOBILE INPUT WITH VALUES: (${x}, ${y})`);
    // This will be handled by the Player component
    if (playerRef.current) {
      if (x === 0 && y === 0) {
        // When touch is released, clear the mobile input
        console.log('GAME CALLING clearMobileInput');
        playerRef.current.clearMobileInput();
      } else {
        // Regular move - ensure the values are properly passed
        console.log('GAME CALLING handleMobileMove');
        playerRef.current.handleMobileMove(x, y);
      }
    } else {
      console.warn('Player ref not available for mobile input');
    }
  };

  // Function that will be called after user input/interaction
  const handlePlayMusic = useCallback(() => {
    if (!musicStartedRef.current) {
      console.log('Game: Starting background music after user interaction');
      
      // Try to unlock all audio by creating a short silent sound
      try {
        // Create an audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create a brief silent sound
        const silentBuffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        
        // Try to play short silent audio to unlock audio playback
        const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABBwBtbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1t//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAABAcFNb4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kGQAAAAAADUAAAAAACwAAAAAKAQAAAk4QkdAAAAnAAAABgcVNFQJAKiEMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGMIMYwgxjCDGEAAAQ4EHQIPBA6L0H3gPgQdF0XoPvAfAgcF74fQewIPBAcMHgfBAcAeBB0YPwfQfQfVrWtaywmm2oAAAAAAAAAAAAAAAp222gAAYYQQwwlCsDizq7u7u7u7u7u7u7u7u7u7u+7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7rWtaC21nmB0HwfB8HwfVrWtaH0fggOA+BA4IPg+CB0W5Dg+D4PggOCB4IHQeg9B8EDoQe+H0HwIHPA+g9B9B9B9B9B9B9B9B9BKta1rWta1rWta1rWta1rWtaKNa1rWta1rWiDWtaKNaINa1rWioNCDGMIQYxhBDGMIIYxhBDGMIIYxhBDGMIIYxhBDGMIIYxhBDGMIMYwgxjCD/+5JkEA/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARGMIMYwghjCCGMYQQxjCCGMYQQxjCCGMYQQxjCCGMYQQxjCCGMYQQAAAAAP/////////////////////////////////////////////7/////////////////////////////////////////////////////////////////z////////////////////////////4=");
        silentAudio.volume = 0.001;
        silentAudio.play()
          .then(() => console.log('Audio context unlocked'))
          .catch(err => console.error('Failed to unlock audio context:', err));
        
        // Attempt to play all important audio elements one by one
        // with minimal volume to warm up the audio system
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.volume = 0.001;
          backgroundMusicRef.current.play()
            .then(() => {
              // Successfully started, now set real volume and restart
              backgroundMusicRef.current!.pause();
              backgroundMusicRef.current!.currentTime = 0;
              backgroundMusicRef.current!.volume = 0.6;
              backgroundMusicRef.current!.play()
                .then(() => {
                  console.log('Background music started successfully');
                  musicStartedRef.current = true;
                })
                .catch(error => {
                  console.error('Background music failed to play:', error);
                });
            })
            .catch(error => {
              console.error('Failed to warm up audio:', error);
            });
        }
      } catch (e) {
        console.error('Error while trying to unlock audio:', e);
        
        // Fallback direct attempt
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.play().then(() => {
            console.log('Background music started with fallback method');
            musicStartedRef.current = true;
          }).catch(error => {
            console.error('Background music failed to play with fallback:', error);
          });
        }
      }
      
      // Also trigger parent playMusic for any additional logic
      playMusic();
    }
  }, [playMusic]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        style={{ 
          width: '100vw', 
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        shadows
      >
        {/* Space background */}
        <color attach="background" args={['#000010']} />
        <Stars radius={100} depth={50} count={2500} factor={4} saturation={0} fade />
        
        {/* Floating ad billboards in space */}
        <AdBillboards />
        
        {/* Improved lighting setup */}
        <ambientLight intensity={0.6} /> {/* Increased ambient light */}
        <directionalLight 
          position={[0, 10, 5]} 
          intensity={1.2} 
          color="#ffffff" 
        />
        <directionalLight 
          position={[5, 8, 0]} 
          intensity={0.8} 
          color="#ffeecc"
        />
        <directionalLight 
          position={[-5, 8, 0]} 
          intensity={0.8} 
          color="#ccddff"
        />
        
        {/* Game Title */}
        <group position={[0, 8, -5]}>
          <Text
            position={[0, 0, 0]}
            fontSize={2}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.1}
            outlineColor="#000000"
          >
            CLOUD REALM
          </Text>
        </group>
        
        <Bridge gameState={gameState} />
        <Suspense fallback={null}>
          <Player
            ref={playerRef}
            gameState={gameState}
            setGameState={setGameState}
            playMusic={handlePlayMusic}
            bossDefeated={gameState.bossDefeated}
            hasAllItems={hasAllItems}
            bossHealth={gameState.bossHealth}
          />
        </Suspense>
        
        {/* Render boss only when all items are collected */}
        {hasAllItems && !gameState.bossDefeated && (
          <Boss
            playerPosition={gameState.position}
            gameState={gameState}
            bossHealth={currentBossHealthRef.current}
            updateBossHealth={(newHealth: number) => {
              console.log(`Game: Updating boss health to ${newHealth} (previous: ${currentBossHealthRef.current})`);
              
              // Update our ref immediately
              currentBossHealthRef.current = newHealth;
              
              // Check if boss is defeated
              const isBossDefeated = newHealth <= 0;
              
              // If boss is defeated, log it
              if (isBossDefeated) {
                console.log("BOSS DEFEATED! Setting bossDefeated flag to true");
              }
              
              // Create a completely fresh state object to prevent race conditions
              const updatedState = {
                weapon: gameState.weapon,
                armour: gameState.armour,
                magic: gameState.magic,
                position: { ...gameState.position },
                stage: gameState.stage,
                collectedBlocks: [...gameState.collectedBlocks],
                isInvulnerable: gameState.isInvulnerable,
                bossHealth: newHealth,
                bossDefeated: isBossDefeated
              };
              
              console.log("Setting gameState with bossDefeated =", isBossDefeated);
              
              // Update both local state and window state
              setGameState(updatedState);
              
              // Also update window.gameState for global access
              if (window.setGameState) {
                window.setGameState(updatedState);
                console.log("Updated window.gameState, bossDefeated =", window.gameState?.bossDefeated);
              }
            }}
          />
        )}
      </Canvas>
      
      <UI
        gameState={gameState}
        bossHealth={currentBossHealthRef.current}
        bossDefeated={gameState.bossDefeated}
        onMobileMove={handleMobileMove}
      />
      
      {/* Intro Messages */}
      {showIntro && (
        <IntroMessages onComplete={handleIntroComplete} />
      )}
      
      {/* Victory Screen - show when victory state is true, not just when boss is defeated */}
      {showVictory && (
        <Victory onRestart={handleRestartGame} />
      )}
      
      {/* Debug info */}
      <div style={{ display: 'none' }}>
        {`Current bossDefeated: ${gameState.bossDefeated}`}
      </div>
    </div>
  );
};

export default Game