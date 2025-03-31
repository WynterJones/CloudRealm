import React, { useState } from 'react';
import Game from './components/Game';
import { GameState } from './types/game';
import './index.css';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    weapon: null,
    armour: null,
    magic: null,
    position: { x: 0, z: 0 },
    stage: 0,
    collectedBlocks: [],
    isInvulnerable: false,
    bossHealth: 100,
    bossDefeated: false
  });

  const playMusic = () => {
    // This will be handled by the Game component
  };

  return (
    <div className="w-screen h-screen">
      <Game 
        gameState={gameState}
        setGameState={setGameState}
        playMusic={playMusic}
      />
    </div>
  );
}

export default App;
