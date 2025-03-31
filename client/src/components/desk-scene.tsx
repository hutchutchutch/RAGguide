import { useRef, useEffect, useState } from 'react';

// Custom animation for floating effect
function useFloatAnimation(baseDelay = 0) {
  const [transform, setTransform] = useState('');
  
  useEffect(() => {
    let active = true;
    let timeout: NodeJS.Timeout;
    
    const animate = () => {
      if (!active) return;
      
      const translateX = Math.random() * 20 - 10; // -10 to 10px
      const translateY = Math.random() * 20 - 10; // -10 to 10px
      const rotate = Math.random() * 6 - 3; // -3 to 3 degrees
      
      setTransform(`translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`);
      
      // Random duration between 2-4 seconds for natural movement
      const duration = 2000 + Math.random() * 2000;
      timeout = setTimeout(animate, duration);
    };
    
    // Initial delay based on the prop
    const initialDelay = baseDelay;
    timeout = setTimeout(animate, initialDelay);
    
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [baseDelay]);
  
  return transform;
}

// A CSS-based animated desk scene alternative
export default function DeskScene() {
  const book1Transform = useFloatAnimation(0);
  const book2Transform = useFloatAnimation(500);
  const particle1Transform = useFloatAnimation(200);
  const particle2Transform = useFloatAnimation(700);
  const particle3Transform = useFloatAnimation(1200);
  
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center" 
         style={{ background: 'transparent', overflow: 'hidden' }}>
      {/* Ambient glow effects */}
      <div className="absolute w-80 h-80 bg-indigo-500/20 rounded-full filter blur-3xl animate-pulse-slow" 
           style={{ top: '25%', left: '25%' }} />
      <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse-slow" 
           style={{ top: '40%', right: '25%', animationDelay: '1s' }} />
      <div className="absolute w-72 h-72 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse-slow" 
           style={{ bottom: '30%', left: '35%', animationDelay: '0.5s' }} />
      
      {/* Floating book 1 */}
      <div className="absolute h-64 w-52 transition-all duration-1000 ease-in-out animate-float"
           style={{ 
             top: '40%', 
             left: '30%',
             transform: `${book1Transform} rotate(12deg)`,
             animationDelay: '0s'
           }}>
        <div className="absolute inset-0 rounded-md border-2 border-indigo-500/50 bg-indigo-900/30 backdrop-blur-sm 
                       transform rotate-6 shadow-lg shadow-indigo-500/20" />
        <div className="absolute top-6 left-6 right-6 h-1 bg-indigo-400/70 rounded" />
        <div className="absolute top-10 left-6 right-10 h-1 bg-indigo-400/50 rounded" />
        <div className="absolute top-14 left-6 right-16 h-1 bg-indigo-400/40 rounded" />
      </div>
      
      {/* Floating book 2 */}
      <div className="absolute h-72 w-56 transition-all duration-1000 ease-in-out animate-float"
           style={{ 
             top: '35%', 
             right: '32%',
             transform: `${book2Transform} rotate(-8deg)`,
             animationDelay: '0.5s'
           }}>
        <div className="absolute inset-0 rounded-md border-2 border-purple-500/50 bg-purple-900/30 backdrop-blur-sm 
                       transform -rotate-3 shadow-lg shadow-purple-500/20" />
        <div className="absolute top-8 left-6 right-6 h-1 bg-purple-400/70 rounded" />
        <div className="absolute top-12 left-6 right-12 h-1 bg-purple-400/50 rounded" />
        <div className="absolute top-16 left-6 right-8 h-1 bg-purple-400/40 rounded" />
      </div>
      
      {/* Animated particles */}
      <div className="absolute w-4 h-4 rounded-full bg-indigo-400/80 animate-ping transition-all duration-1000 ease-in-out" 
           style={{ 
             top: '45%', 
             left: '42%', 
             animationDuration: '4s',
             transform: particle1Transform
           }} />
      <div className="absolute w-3 h-3 rounded-full bg-purple-400/80 animate-ping transition-all duration-1000 ease-in-out" 
           style={{ 
             top: '35%', 
             left: '60%', 
             animationDuration: '5s', 
             animationDelay: '1s',
             transform: particle2Transform
           }} />
      <div className="absolute w-2 h-2 rounded-full bg-indigo-300/80 animate-ping transition-all duration-1000 ease-in-out" 
           style={{ 
             top: '65%', 
             left: '55%', 
             animationDuration: '6s', 
             animationDelay: '2s',
             transform: particle3Transform
           }} />
      
      {/* Small connecting lines suggesting a knowledge graph */}
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[300px] -translate-x-1/2 -translate-y-1/2 opacity-40">
        <svg width="100%" height="100%" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <line x1="120" y1="150" x2="280" y2="150" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="0" to="20" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="150" y1="100" x2="250" y2="200" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="20" to="0" dur="4s" repeatCount="indefinite" />
          </line>
          <line x1="150" y1="200" x2="250" y2="100" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="10" to="30" dur="3.5s" repeatCount="indefinite" />
          </line>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-80 pointer-events-none" />
    </div>
  );
}