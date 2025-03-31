import React, { useState, useCallback } from 'react';
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

  // Track if music has started
  const [musicStarted, setMusicStarted] = useState(false);

  // Function to start background music - will be called after user interaction (WASD/mobile joystick)
  const playMusic = useCallback(() => {
    if (!musicStarted) {
      console.log('Starting background music after user interaction');
      setMusicStarted(true);
      // Actual playback happens in Game component
    }
  }, [musicStarted]);

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
