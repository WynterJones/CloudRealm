import { GameState } from '../types/game';
import { useState, useEffect, useRef } from 'react';

interface UIProps {
  gameState: GameState;
  bossHealth: number;
  bossDefeated?: boolean;
  onMobileMove?: (x: number, y: number) => void;
}

// Helper function to capitalize the first letter
const capitalize = (text: string | null): string => {
  if (!text) return 'None';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function UI({ gameState, bossHealth, bossDefeated = false, onMobileMove }: UIProps) {
  const [showBossNameAnimation, setShowBossNameAnimation] = useState(false);
  const [showBossUI, setShowBossUI] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [isMobile, setIsMobile] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const lastHitTime = useRef(0);
  const minPlayerHealth = 30; // Player health won't drop below this
  const hasAllItems = gameState.weapon !== null && gameState.armour !== null && gameState.magic !== null;
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !joystickRef.current) return;
    
    console.log("UI TOUCH START");
    
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setTouchActive(true);
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * 1.0;
      normalizedY = (deltaY / distance) * 1.0;
    }
    
    setJoystickPosition({ 
      x: normalizedX * maxDistance * 0.5, 
      y: normalizedY * maxDistance * 0.5 
    });
    
    console.log(`UI sending movement: (${normalizedX}, ${-normalizedY})`);
    onMobileMove?.(normalizedX, -normalizedY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !touchActive || !joystickRef.current) return;
    
    console.log("UI TOUCH MOVE");
    
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;
    
    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * 1.0;
      normalizedY = (deltaY / distance) * 1.0;
    }
    
    setJoystickPosition({ 
      x: normalizedX * maxDistance * 0.5, 
      y: normalizedY * maxDistance * 0.5 
    });
    
    console.log(`UI sending movement: (${normalizedX}, ${-normalizedY})`);
    onMobileMove?.(normalizedX, -normalizedY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    console.log("UI TOUCH END");
    
    setTouchActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    console.log(`UI sending movement: (0, 0)`);
    onMobileMove?.(0, 0);
  };

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
    <div className="fixed inset-0" style={{ pointerEvents: 'none' }}>
      {/* Mobile joystick */}
      {isMobile && (
        <div
          ref={joystickRef}
          className="fixed bottom-16 right-16 w-40 h-40 rounded-full"
          style={{
            zIndex: 10001,
            background: 'rgba(255, 255, 255, 0.3)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
            border: '3px solid rgba(255, 255, 255, 0.4)',
            pointerEvents: 'auto'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: '40%',
              height: '40%',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
              background: touchActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none',
              transition: touchActive ? 'none' : 'transform 0.2s ease-out'
            }}
          />
          {/* Debug value display */}
          <div style={{ 
            position: 'absolute', 
            top: '-30px', 
            left: 0, 
            width: '100%', 
            textAlign: 'center', 
            color: 'white',
            fontSize: '12px',
            textShadow: '0 0 3px black',
            pointerEvents: 'none'
          }}>
            {touchActive ? 
              `X: ${joystickPosition.x.toFixed(1)}, Y: ${joystickPosition.y.toFixed(1)}` :
              'Touch to move'
            }
          </div>
        </div>
      )}
      
      {/* Rest of UI elements */}
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

      {/* Add the CSS for mobile controls */}
      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-joystick {
          position: fixed;
          bottom: 80px;
          left: 50px;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          z-index: 1000;
          touch-action: none;
        }

        .joystick-knob {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.1s;
        }

        .joystick-knob.active {
          background: rgba(255, 255, 255, 0.8);
        }
      `}} />
    </div>
  );
}

export default UI