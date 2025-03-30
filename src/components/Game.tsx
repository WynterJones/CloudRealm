import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useState } from 'react';
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
        <Bridge />
        <Player gameState={gameState} setGameState={setGameState} />
      </Canvas>
      <UI gameState={gameState} />
    </div>
  );
}

export default Game