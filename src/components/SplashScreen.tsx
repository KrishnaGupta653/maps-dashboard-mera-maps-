'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image'
interface SplashScreenProps {
  onComplete: () => void;
  logoSrc?: string; // Optional logo image source
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, logoSrc }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 4 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4000);

    // Complete the splash screen after fade out
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Main Splash Container */}
      <div className="flex flex-col items-center animate-fadeIn">
        
        {/* Title Container with Logo and Text */}
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-titleFade">
          {/* Logo Image */}
          {logoSrc && (
            <div className="logo-image-container animate-logoFloat">
              <Image 
                src={logoSrc} 
                alt="MERA MAPS Logo" 
                width={48}  // 12 * 4 (since w-12 = 3rem = 48px)
                height={48} // 12 * 4 (since h-12 = 3rem = 48px)
                className="object-contain"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}
              />
              
            </div>
          )}
          
          {/* MERA MAPS Title */}
          <div className="text-white text-3xl font-bold tracking-wider">
            MERA MAPS
          </div>
        </div>

        {/* Logo Container with Thin Segments */}
        <div className="flex gap-1 mb-8 animate-logoPulse">
          {/* Logo Segment 1 - Blue */}
          <div 
            className="logo-segment animate-segmentReveal1"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)'
            }}
          >
            <div className="map-lines">
              <div className="road-line road1"></div>
              <div className="road-line road2"></div>
              <div className="map-dot dot1"></div>
            </div>
            <div className="glow-effect"></div>
          </div>

          {/* Logo Segment 2 - Cyan/Teal */}
          <div 
            className="logo-segment animate-segmentReveal2"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #14b8a6 50%, #10b981 100%)'
            }}
          >
            <div className="map-lines">
              <div className="road-line road2"></div>
              <div className="road-line road3"></div>
              <div className="map-dot dot2"></div>
            </div>
            <div className="glow-effect"></div>
          </div>

          {/* Logo Segment 3 - Green */}
          <div 
            className="logo-segment animate-segmentReveal3"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #84cc16 50%, #eab308 100%)'
            }}
          >
            <div className="map-lines">
              <div className="road-line road1"></div>
              <div className="road-line road3"></div>
              <div className="map-dot dot1"></div>
            </div>
            <div className="glow-effect"></div>
          </div>

          {/* Logo Segment 4 - Yellow */}
          <div 
            className="logo-segment animate-segmentReveal4"
            style={{
              background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)'
            }}
          >
            <div className="map-lines">
              <div className="road-line road2"></div>
              <div className="road-line road1"></div>
              <div className="map-dot dot2"></div>
            </div>
            <div className="glow-effect"></div>
          </div>

          {/* Logo Segment 5 - Orange */}
          <div 
            className="logo-segment animate-segmentReveal5"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)'
            }}
          >
            <div className="map-lines">
              <div className="road-line road3"></div>
              <div className="road-line road2"></div>
              <div className="map-dot dot1"></div>
            </div>
            <div className="glow-effect"></div>
          </div>

          {/* Logo Segment 6 - Red */}
          <div 
            className="logo-segment animate-segmentReveal6"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #be185d 50%, #9333ea 100%)'
            }}
          >
            <div className="map-lines">
              <div className="road-line road1"></div>
              <div className="road-line road3"></div>
              <div className="map-dot dot2"></div>
            </div>
            <div className="glow-effect"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-white text-sm font-light tracking-wider opacity-0 animate-textFade">
          Loading your maps
          <span className="ml-2 animate-dots">...</span>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="particle particle1"></div>
      <div className="particle particle2"></div>
      <div className="particle particle3"></div>
      <div className="particle particle4"></div>

      <style jsx>{`
        .logo-image-container {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(-10px) scale(0.8);
        }

        .logo-segment {
          width: 40px;
          height: 60px;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(50px) rotateX(15deg);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .map-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .road-line {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          animation: flowRoad 3s ease-in-out infinite;
        }

        .road1 {
          width: 2px;
          height: 25px;
          top: 15%;
          left: 25%;
          animation-delay: 0.5s;
          transform: rotate(25deg);
        }

        .road2 {
          width: 20px;
          height: 2px;
          top: 45%;
          right: 15%;
          animation-delay: 1s;
          transform: rotate(-10deg);
        }

        .road3 {
          width: 2px;
          height: 18px;
          bottom: 25%;
          left: 60%;
          animation-delay: 1.5s;
          transform: rotate(-15deg);
        }

        .map-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          animation: mapPulse 2s ease-in-out infinite;
        }

        .dot1 {
          top: 30%;
          left: 30%;
          animation-delay: 0.8s;
        }

        .dot2 {
          bottom: 35%;
          right: 25%;
          animation-delay: 1.3s;
        }

        .glow-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
          opacity: 0;
          animation: glow 3s ease-in-out infinite;
          animation-delay: 2s;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          animation: float 5s ease-in-out infinite;
        }

        .particle1 {
          top: 15%;
          left: 8%;
          animation-delay: 0s;
        }

        .particle2 {
          top: 65%;
          right: 12%;
          animation-delay: 1.5s;
        }

        .particle3 {
          bottom: 20%;
          left: 15%;
          animation-delay: 3s;
        }

        .particle4 {
          top: 40%;
          right: 5%;
          animation-delay: 2.2s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes titleFade {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoFloat {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.8) rotate(-5deg);
          }
          60% {
            transform: translateY(2px) scale(1.05) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes segmentReveal {
          0% {
            opacity: 0;
            transform: translateY(50px) rotateX(15deg) scale(0.8);
          }
          60% {
            transform: translateY(-8px) rotateX(0deg) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) scale(1);
          }
        }

        @keyframes flowRoad {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(0) translateX(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translateY(-8px) translateX(3px) scale(1.1);
          }
        }

        @keyframes mapPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.15);
          }
        }

        @keyframes textFade {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 0.8;
            transform: translateY(0);
          }
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }

        @keyframes float {
          0%, 100% {
            opacity: 0;
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-25px) rotate(180deg);
          }
        }

        @keyframes dots {
          0%, 33% { opacity: 0.3; }
          66%, 100% { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-titleFade {
          animation: titleFade 1s ease-out 0.3s forwards;
        }

        .animate-logoFloat {
          animation: logoFloat 1.2s ease-out 0.5s forwards;
        }

        .animate-segmentReveal1 {
          animation: segmentReveal 0.9s ease-out 0.6s forwards;
        }

        .animate-segmentReveal2 {
          animation: segmentReveal 0.9s ease-out 0.8s forwards;
        }

        .animate-segmentReveal3 {
          animation: segmentReveal 0.9s ease-out 1.0s forwards;
        }

        .animate-segmentReveal4 {
          animation: segmentReveal 0.9s ease-out 1.2s forwards;
        }

        .animate-segmentReveal5 {
          animation: segmentReveal 0.9s ease-out 1.4s forwards;
        }

        .animate-segmentReveal6 {
          animation: segmentReveal 0.9s ease-out 1.6s forwards;
        }

        .animate-logoPulse {
          animation: logoPulse 4s ease-in-out 2.5s infinite;
        }

        .animate-textFade {
          animation: textFade 1s ease-in 2.2s forwards;
        }

        .animate-dots {
          animation: dots 1.5s ease-in-out 2.8s infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
