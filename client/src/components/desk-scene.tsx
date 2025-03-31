import { useRef, useState } from 'react';

// CSS-based animated desk scene alternative
export default function DeskScene() {
  return (
    <div className="absolute inset-0 z-0" style={{ 
      background: 'transparent',
      overflow: 'hidden',
    }}>
      {/* Ambient glow effects */}
      <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl animate-pulse-slow" 
           style={{ top: '25%', left: '25%' }} />
      <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse-slow" 
           style={{ top: '40%', right: '25%', animationDelay: '1s' }} />
      <div className="absolute w-80 h-80 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse-slow" 
           style={{ bottom: '30%', left: '35%', animationDelay: '0.5s' }} />
      
      {/* Floating book 1 */}
      <div className="absolute h-64 w-52 animate-float"
           style={{ top: '38%', left: '30%', animationDelay: '0.2s' }}>
        <div className="absolute inset-0 rounded-md border-2 border-indigo-500/50 bg-indigo-900/30 
                      backdrop-blur-sm shadow-lg shadow-indigo-500/20 transform rotate-6" />
        <div className="absolute top-6 left-6 right-6 h-1 bg-indigo-400/70 rounded" />
        <div className="absolute top-10 left-6 right-10 h-1 bg-indigo-400/50 rounded" />
        <div className="absolute top-14 left-6 right-16 h-1 bg-indigo-400/40 rounded" />
      </div>
      
      {/* Floating book 2 */}
      <div className="absolute h-72 w-56 animate-float"
           style={{ top: '32%', right: '32%', animationDelay: '0.7s' }}>
        <div className="absolute inset-0 rounded-md border-2 border-purple-500/50 bg-purple-900/30 
                      backdrop-blur-sm shadow-lg shadow-purple-500/20 transform -rotate-3" />
        <div className="absolute top-8 left-6 right-6 h-1 bg-purple-400/70 rounded" />
        <div className="absolute top-12 left-6 right-12 h-1 bg-purple-400/50 rounded" />
        <div className="absolute top-16 left-6 right-8 h-1 bg-purple-400/40 rounded" />
      </div>
      
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
      
      {/* Animated particles */}
      <div className="absolute w-4 h-4 rounded-full bg-indigo-400/80 animate-ping" 
           style={{ top: '45%', left: '42%', animationDuration: '4s' }} />
      <div className="absolute w-3 h-3 rounded-full bg-purple-400/80 animate-ping" 
           style={{ top: '35%', left: '60%', animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute w-2 h-2 rounded-full bg-indigo-300/80 animate-ping" 
           style={{ top: '65%', left: '55%', animationDuration: '6s', animationDelay: '2s' }} />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-70 pointer-events-none" />
    </div>
  );
}