import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import { useState, useEffect } from 'react';
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
      >
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, 10, -10]} intensity={1.5} />
        <Environment files="/models/sky.hdr" background />
        
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