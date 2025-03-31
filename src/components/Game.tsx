import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import { Color } from 'three';
import Bridge from './Bridge.tsx';
import Player from './Player.tsx';
import UI from './UI.tsx';
import Boss from './Boss.tsx';
import { GameState } from '../types/game';

function Game() {
  const [gameState, setGameState] = useState<GameState>({
    weapon: null,
    armour: null,
    magic: null,
    position: { x: 0, z: 0 },
    stage: 0,
    collectedBlocks: []
  });

  // Check if all items are collected to spawn the boss
  const hasAllItems = gameState.weapon !== null && gameState.armour !== null && gameState.magic !== null;
  
  // Refs for music control
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const bossMusicRef = useRef<HTMLAudioElement | null>(null);
  const musicSwitchedRef = useRef(false);

  // Initialize background music
  useEffect(() => {
    // Create audio elements
    backgroundMusicRef.current = new Audio('/models/bg.mp3');
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.6;
    
    bossMusicRef.current = new Audio('/models/boss.mp3');
    bossMusicRef.current.loop = true;
    bossMusicRef.current.volume = 0.7;
    
    // Try to play initial background music
    backgroundMusicRef.current.play().catch(error => {
      // Create a button to play music on user interaction if autoplay fails
      const playButton = document.createElement('button');
      playButton.textContent = 'Play Music';
      playButton.style.position = 'fixed';
      playButton.style.bottom = '20px';
      playButton.style.right = '20px';
      playButton.style.zIndex = '1000';
      playButton.style.padding = '10px';
      playButton.style.background = 'rgba(0,0,0,0.5)';
      playButton.style.color = 'white';
      playButton.style.border = 'none';
      playButton.style.borderRadius = '5px';
      playButton.style.cursor = 'pointer';
      
      playButton.onclick = () => {
        if (hasAllItems && bossMusicRef.current) {
          bossMusicRef.current.play();
        } else if (backgroundMusicRef.current) {
          backgroundMusicRef.current.play();
        }
        playButton.remove();
      };
      
      document.body.appendChild(playButton);
    });
    
    // Clean up
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.src = '';
      }
      if (bossMusicRef.current) {
        bossMusicRef.current.pause();
        bossMusicRef.current.src = '';
      }
    };
  }, []);
  
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
        <Player gameState={gameState} setGameState={setGameState} />
        
        {/* Render boss only when all items are collected */}
        {hasAllItems && <Boss playerPosition={gameState.position} />}
      </Canvas>
      <UI gameState={gameState} />
      
      {/* Play Music button - visible from UI */}
      <button 
        className="absolute bottom-5 right-5 px-4 py-2 bg-black bg-opacity-50 text-white rounded cursor-pointer z-50 hover:bg-opacity-70"
        onClick={() => {
          if (hasAllItems && bossMusicRef.current) {
            bossMusicRef.current.play();
          } else if (backgroundMusicRef.current) {
            backgroundMusicRef.current.play();
          }
        }}
      >
        Play Music
      </button>
    </div>
  );
}

export default Game