import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import { Color } from 'three';
import Bridge from './Bridge.tsx';
import Player from './Player.tsx';
import UI from './UI.tsx';
import Boss from './Boss.tsx';
import AdBillboards from './AdBillboards.tsx';
import IntroMessages from './IntroMessages.tsx';
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
  
  const [showIntro, setShowIntro] = useState(true);

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

  // Function to play music
  const playMusic = () => {
    if (hasAllItems && bossMusicRef.current) {
      bossMusicRef.current.play();
    } else if (backgroundMusicRef.current) {
      backgroundMusicRef.current.play();
    }
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

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
        <Player gameState={gameState} setGameState={setGameState} playMusic={playMusic} />
        
        {/* Render boss only when all items are collected */}
        {hasAllItems && <Boss playerPosition={gameState.position} gameState={gameState} />}
      </Canvas>
      <UI gameState={gameState} />
      
      {/* Intro Messages */}
      {showIntro && <IntroMessages onComplete={handleIntroComplete} />}
      
      {/* Wynter logo link */}
      <a 
        href="https://wynter.ai" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 hover:opacity-80 transition-opacity"
      >
        <img 
          src="/models/wynter-logo.png" 
          alt="Wynter.ai" 
          width="200" 
          className="drop-shadow-lg"
        />
      </a>
    </div>
  );
}

export default Game