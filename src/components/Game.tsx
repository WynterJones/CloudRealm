import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Text } from '@react-three/drei';
import { useState, useEffect, useRef } from 'react';
import { Color } from 'three';
import Bridge from './Bridge.tsx';
import Player from './Player.tsx';
import UI from './UI.tsx';
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

  // Initialize background music
  useEffect(() => {
    const backgroundMusic = new Audio('/models/bg.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.6; // 60% volume
    backgroundMusic.play().catch(error => {
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
        backgroundMusic.play();
        playButton.remove();
      };
      
      document.body.appendChild(playButton);
    });
    
    // Clean up
    return () => {
      backgroundMusic.pause();
      backgroundMusic.src = '';
    };
  }, []);

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
      </Canvas>
      <UI gameState={gameState} />
    </div>
  );
}

export default Game