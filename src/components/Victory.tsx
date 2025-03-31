import { useEffect, useState, useCallback } from 'react';

interface VictoryProps {
  onComplete?: () => void;
  onRestart?: () => void;
}

const Victory = ({ onComplete, onRestart }: VictoryProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [fullText] = useState('Enter the portal to continue or press Space to restart');
  const [fadeOut, setFadeOut] = useState(false);
  
  // Handle restart on space key press
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && showTypewriter && onRestart) {
      setFadeOut(true);
      setTimeout(() => {
        onRestart();
      }, 1000);
    }
  }, [showTypewriter, onRestart]);
  
  // Set up key event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
  
  // Start confetti with small delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Start typewriter effect after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTypewriter(true);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Typewriter effect for second message
  useEffect(() => {
    if (showTypewriter && typewriterText.length < fullText.length) {
      const timer = setTimeout(() => {
        setTypewriterText(fullText.substring(0, typewriterText.length + 1));
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [typewriterText, fullText, showTypewriter]);
  
  return (
    <div 
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ transition: 'opacity 1s ease-out' }}
    >
      {/* Dark overlay with some transparency */}
      <div className="absolute inset-0 bg-black bg-opacity-60" />
      
      {/* Victory text with animation */}
      <div 
        className="relative mb-8 text-center"
        style={{
          animation: 'victoryTextAppear 1.5s ease-out forwards'
        }}
      >
        <h1 
          className="text-6xl font-bold text-white mb-4"
          style={{
            textShadow: '0 0 15px gold, 0 0 25px gold, 0 0 35px gold'
          }}
        >
          VICTORY!
        </h1>
        <h2 
          className="text-3xl font-bold text-white h-12" // Fixed height to prevent layout shift
          style={{
            textShadow: '0 0 10px white, 0 0 15px white'
          }}
        >
          {showTypewriter ? typewriterText : 'You have conquered your Mind'}
        </h2>
      </div>
      
      {/* Confetti container */}
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 150 }).map((_, i) => {
            const animationDelay = `${Math.random() * 5}s`;
            const left = `${Math.random() * 100}%`;
            const width = `${Math.random() * 10 + 5}px`;
            const height = `${Math.random() * 10 + 5}px`;
            const bgColor = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#FFD700'][Math.floor(Math.random() * 8)];
            
            return (
              <div 
                key={i}
                className="confetti"
                style={{
                  left,
                  width,
                  height,
                  backgroundColor: bgColor,
                  animationDelay,
                  animationDuration: `${Math.random() * 3 + 4}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            );
          })}
        </div>
      )}
      
      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes victoryTextAppear {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes confettiFall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
        }
      `}} />
    </div>
  );
};

export default Victory; 