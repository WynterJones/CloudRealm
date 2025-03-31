import { GameState } from '../types/game';
import { useState, useEffect, useRef } from 'react';

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
  const [showBossUI, setShowBossUI] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const lastHitTime = useRef(0);
  const minPlayerHealth = 30; // Player health won't drop below this
  const hasAllItems = gameState.weapon !== null && gameState.armour !== null && gameState.magic !== null;
  
  // Show boss name with animation when all items are collected
  useEffect(() => {
    if (hasAllItems && !bossDefeated) {
      // First set showBossUI to true, but keep it invisible with opacity 0
      setShowBossUI(true);
      
      // Add a slight delay to show the animation
      const timer = setTimeout(() => {
        setShowBossNameAnimation(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hasAllItems, bossDefeated]);
  
  // Randomly reduce player health when boss fight is active
  useEffect(() => {
    if (!hasAllItems || bossDefeated) return;
    
    const randomHitInterval = () => Math.random() * 2000 + 500; // Random interval between 0.5-2.5 seconds
    
    const damagePlayer = () => {
      // Only apply damage if it's been at least 500ms since the last hit
      const now = Date.now();
      if (now - lastHitTime.current < 500) return;
      
      // Random damage between 1-5%
      const damage = Math.floor(Math.random() * 5) + 1;
      
      setPlayerHealth(prev => {
        // Don't let health go below minimum
        return Math.max(prev - damage, minPlayerHealth);
      });
      
      // Play hit sound
      const hitSound = new Audio('/models/hit.mp3');
      hitSound.volume = 0.3;
      hitSound.play().catch(err => console.log('Failed to play hit sound'));
      
      lastHitTime.current = now;
    };
    
    const interval = setInterval(() => {
      // 70% chance of getting hit each interval check
      if (Math.random() < 0.7) {
        damagePlayer();
      }
    }, randomHitInterval());
    
    return () => clearInterval(interval);
  }, [hasAllItems, bossDefeated]);
  
  // Reset player health when boss is defeated
  useEffect(() => {
    if (bossDefeated) {
      setPlayerHealth(100);
    }
  }, [bossDefeated]);
  
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
          
          {/* Boss UI - only show if not defeated and showBossUI is true */}
          {hasAllItems && !bossDefeated && showBossUI && (
            <div 
              className="absolute top-0 left-0 right-0 w-full"
              style={{ 
                opacity: showBossNameAnimation ? 1 : 0,
                transition: 'opacity 0.8s ease-in',
                pointerEvents: 'none'
              }}
            >
              <div style={{ 
                margin: '20px auto',
                width: '80%',
                maxWidth: '800px',
                background: 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.8), rgba(0,0,0,0.8), rgba(0,0,0,0))',
                padding: '15px 30px',
                borderRadius: '0',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(255, 0, 0, 0.5), 0 0 15px rgba(255, 255, 0, 0.5)'
              }}>
                <div className="flex justify-between items-center">
                  {/* Boss name */}
                  <div style={{ 
                    flex: '0 0 auto',
                    color: 'white', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '24px',
                    letterSpacing: '3px',
                    textShadow: '0 0 10px red, 0 0 15px red',
                    animation: showBossNameAnimation ? 'pulseBossName 2s infinite' : 'none'
                  }}>
                    <span style={{ color: '#FF3333' }}>THE</span> MIND
                  </div>
                  
                  {/* Versus text */}
                  <div style={{
                    flex: '0 0 auto',
                    fontSize: '28px',
                    color: '#FFC700',
                    fontWeight: 'bold',
                    textShadow: '0 0 8px #FFA500',
                    animation: showBossNameAnimation ? 'flashVS 1.5s infinite' : 'none',
                    margin: '0 20px'
                  }}>
                    VS
                  </div>
                  
                  {/* Player indicator */}
                  <div style={{
                    flex: '0 0 auto',
                    color: '#00BFFF',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '24px', 
                    letterSpacing: '2px',
                    textShadow: '0 0 10px #00BFFF, 0 0 15px #00BFFF',
                  }}>
                    YOU
                  </div>
                </div>
                
                {/* Health bars container */}
                <div className="flex justify-between mt-4">
                  {/* Boss health bar */}
                  <div style={{
                    flex: '1',
                    height: '20px',
                    marginRight: '10px',
                    position: 'relative',
                    borderRadius: '2px',
                    border: '2px solid #333',
                    overflow: 'hidden',
                    background: '#111',
                    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 5px rgba(255, 0, 0, 0.5)'
                  }}>
                    <div style={{ 
                      width: `${bossHealth}%`, 
                      height: '100%', 
                      background: bossHealth > 50 
                        ? 'linear-gradient(to right, #FF3333, #FF5555)' 
                        : bossHealth > 20 
                          ? 'linear-gradient(to right, #FFCC00, #FFDD33)' 
                          : 'linear-gradient(to right, #FF3300, #FF5500)',
                      transition: 'width 0.3s, background 0.3s',
                      boxShadow: '0 0 10px rgba(255, 0, 0, 0.7)'
                    }}></div>
                    
                    {/* Damage segments */}
                    <div className="damage-segments" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      pointerEvents: 'none'
                    }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{
                          flex: '1',
                          borderRight: i < 9 ? '1px solid rgba(0, 0, 0, 0.3)' : 'none'
                        }}></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Player health bar - now dynamic */}
                  <div style={{
                    flex: '1',
                    height: '20px',
                    marginLeft: '10px',
                    borderRadius: '2px',
                    border: '2px solid #333',
                    overflow: 'hidden',
                    background: '#111',
                    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 5px rgba(0, 191, 255, 0.5)'
                  }}>
                    <div 
                      style={{ 
                        width: `${playerHealth}%`, 
                        height: '100%', 
                        background: playerHealth > 70 
                          ? 'linear-gradient(to right, #0088FF, #00AAFF)'
                          : playerHealth > 40
                            ? 'linear-gradient(to right, #00AAFF, #00DDFF)'
                            : 'linear-gradient(to right, #00DDFF, #00FFFF)',
                        boxShadow: '0 0 10px rgba(0, 191, 255, 0.7)',
                        transition: 'width 0.3s, background 0.3s'
                      }}
                      className={lastHitTime.current && Date.now() - lastHitTime.current < 300 ? "pulse-damage" : ""}
                    ></div>
                    
                    {/* Damage segments */}
                    <div className="damage-segments" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      pointerEvents: 'none'
                    }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{
                          flex: '1',
                          borderRight: i < 9 ? '1px solid rgba(0, 0, 0, 0.3)' : 'none'
                        }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add the CSS animations for the boss name and damage effects */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeInScale {
            0% { opacity: 0; transform: translate(-50%, 0) scale(0); }
            70% { opacity: 1; transform: translate(-50%, 0) scale(1.2); }
            100% { transform: translate(-50%, 0) scale(1); }
          }
          
          @keyframes pulseBossName {
            0% { text-shadow: 0 0 10px red, 0 0 15px red; }
            50% { text-shadow: 0 0 15px red, 0 0 25px red, 0 0 35px red; }
            100% { text-shadow: 0 0 10px red, 0 0 15px red; }
          }
          
          @keyframes flashVS {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          @keyframes pulseDamage {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .pulse-damage {
            animation: pulseDamage 0.3s;
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