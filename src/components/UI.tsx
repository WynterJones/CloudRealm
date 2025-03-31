import { GameState } from '../types/game';
import { useState, useEffect } from 'react';

interface UIProps {
  gameState: GameState;
  bossHealth: number;
  bossDefeated?: boolean;
}

// Helper function to capitalize the first letter
const capitalize = (text: string | null): string => {
  if (!text) return 'None';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function UI({ gameState, bossHealth, bossDefeated = false }: UIProps) {
  const [showBossNameAnimation, setShowBossNameAnimation] = useState(false);
  const hasAllItems = gameState.weapon !== null && gameState.armour !== null && gameState.magic !== null;
  
  // Show boss name with animation when all items are collected
  useEffect(() => {
    if (hasAllItems && !bossDefeated) {
      // Add a slight delay to show the animation
      const timer = setTimeout(() => {
        setShowBossNameAnimation(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hasAllItems, bossDefeated]);
  
  return (
    <>
      <div className="game-ui">
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between w-full">
            <div className="ui-label">
              Weapon: {capitalize(gameState.weapon)}
            </div>
            <div className="ui-label">
              Armour: {capitalize(gameState.armour)}
            </div>
          </div>
          <div className="mt-auto flex justify-between w-full">
            <div className="ui-label">
              Magic: {capitalize(gameState.magic)}
            </div>
            <div></div>
          </div>
          
          {/* Boss UI - only show if not defeated */}
          {hasAllItems && !bossDefeated && (
            <div 
              className="absolute top-20 left-1/2 transform -translate-x-1/2"
              style={{ 
                animation: showBossNameAnimation ? 'fadeInScale 1s ease-out' : 'none',
              }}
            >
              <div style={{ 
                width: '250px', 
                background: 'rgba(0, 0, 0, 0.7)', 
                padding: '10px', 
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)'
              }}>
                <div style={{ 
                  color: 'white', 
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '18px',
                  letterSpacing: '2px',
                  textShadow: '0 0 10px red, 0 0 15px red'
                }}>
                  THE MIND
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '12px', 
                  background: '#333', 
                  borderRadius: '6px',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{ 
                    width: `${bossHealth}%`, 
                    height: '100%', 
                    background: bossHealth > 50 ? '#4CAF50' : bossHealth > 20 ? '#FFEB3B' : '#F44336',
                    transition: 'width 0.3s, background 0.3s',
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                  }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add the CSS animation for the boss name */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInScale {
            0% { opacity: 0; transform: translate(-50%, 0) scale(0); }
            70% { opacity: 1; transform: translate(-50%, 0) scale(1.2); }
            100% { transform: translate(-50%, 0) scale(1); }
          }
        `}} />
      </div>
      
      {/* Vibe Jam link - placed outside the game-ui div so it can be clicked */}
      <a 
        target="_blank" 
        href="https://jam.pieter.com" 
        style={{ 
          fontFamily: 'system-ui, sans-serif', 
          position: 'fixed', 
          bottom: '8px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          padding: '7px', 
          fontSize: '14px', 
          fontWeight: 'bold', 
          background: '#fff', 
          color: '#000', 
          textDecoration: 'none', 
          zIndex: 10000, 
          borderRadius: '12px', 
          border: '1px solid #fff'
        }}
      >
        🕹️ Vibe Jam 2025
      </a>
    </>
  );
}

export default UI