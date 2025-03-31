import { useState, useEffect, useRef } from 'react';

interface IntroMessagesProps {
  onComplete: () => void;
}

const IntroMessages = ({ onComplete }: IntroMessagesProps) => {
  // Check if there's a ref parameter in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const hasRefParam = urlParams.has('ref');

  // Define messages array conditionally based on ref parameter
  const messages = [
    "Welcome to the Cloud Realm...",
    "Use WASD to move around...",
    // Only include the return portal message if there's a ref parameter
    ...(hasRefParam ? ["Turn around to return to the portal..."] : []),
    "Select a Weapon, Protection, and Magic...",
    "...and Fight Your Own Mind...",
    "...if you dare... and continue into the Vibeverse..."
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isExploding, setIsExploding] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  // Clear any existing timers when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Typewriter effect
  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      onComplete();
      return;
    }
    
    const currentMessage = messages[currentMessageIndex];
    
    const handleTyping = () => {
      if (displayedText.length < currentMessage.length) {
        timerRef.current = setTimeout(() => {
          setDisplayedText(currentMessage.substring(0, displayedText.length + 1));
        }, 100);
      } else {
        setIsTyping(false);
        
        // If this is the last message, trigger explosion after 2 seconds
        if (currentMessageIndex === messages.length - 1) {
          timerRef.current = setTimeout(() => {
            setIsExploding(true);
            timerRef.current = setTimeout(() => {
              onComplete();
            }, 1000);
          }, 2000);
        } else {
          // Otherwise, wait 2 seconds and move to the next message
          timerRef.current = setTimeout(() => {
            setDisplayedText('');
            setCurrentMessageIndex(prev => prev + 1);
            setIsTyping(true);
          }, 2000);
        }
      }
    };
    
    if (isTyping) {
      handleTyping();
    }
    
  }, [currentMessageIndex, displayedText, isTyping, messages, onComplete]);
  
  if (currentMessageIndex >= messages.length) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-0 right-0 flex justify-center items-center z-50 pointer-events-none">
      <div 
        className={`text-white text-2xl font-bold text-center px-6 py-3 bg-black bg-opacity-50 rounded-lg
          ${isExploding ? 'animate-explode' : ''}`}
      >
        {displayedText}
      </div>
    </div>
  );
};

export default IntroMessages; 