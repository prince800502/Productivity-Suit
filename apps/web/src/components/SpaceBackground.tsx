'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { isWeb } from '@productivity-suite/ui';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Planet {
  x: number;
  y: number;
  radius: number;
  color1: string;
  color2: string;
  rotation: number;
  rotationSpeed: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  orbitCenterX: number;
  orbitCenterY: number;
  hasRing: boolean;
  ringColor: string;
  ringInnerRadius: number;
  ringOuterRadius: number;
}

export function SpaceBackground({ 
  className = '',
  reducedMotion = false 
}: { 
  className?: string;
  reducedMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (!isWeb) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize stars and planets
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    if (width === 0 || height === 0) return;

    // Generate stars
    const starCount = Math.min(300, Math.floor((width * height) / 3000));
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.3,
        brightness: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.002 + 0.0005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;

    // Generate planets
    const planets: Planet[] = [
      // Primary large planet
      {
        x: 0,
        y: 0,
        radius: Math.min(width, height) * 0.18,
        color1: '#1a1a3e',
        color2: '#0d0d2b',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.00003,
        orbitRadius: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        orbitCenterX: width * 0.85,
        orbitCenterY: height * 0.15,
        hasRing: true,
        ringColor: 'rgba(120, 113, 255, 0.15)',
        ringInnerRadius: Math.min(width, height) * 0.18 * 1.35,
        ringOuterRadius: Math.min(width, height) * 0.18 * 1.85,
      },
      // Secondary planet
      {
        x: 0,
        y: 0,
        radius: Math.min(width, height) * 0.08,
        color1: '#2d1b4e',
        color2: '#1a0d2e',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.00005,
        orbitRadius: Math.min(width, height) * 0.35,
        orbitSpeed: 0.000015,
        orbitAngle: Math.PI * 0.3,
        orbitCenterX: width * 0.15,
        orbitCenterY: height * 0.85,
        hasRing: false,
        ringColor: '',
        ringInnerRadius: 0,
        ringOuterRadius: 0,
      },
      // Small distant moon
      {
        x: 0,
        y: 0,
        radius: Math.min(width, height) * 0.035,
        color1: '#3a3a5e',
        color2: '#252540',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.00008,
        orbitRadius: Math.min(width, height) * 0.12,
        orbitSpeed: 0.00008,
        orbitAngle: Math.PI * 1.2,
        orbitCenterX: width * 0.85,
        orbitCenterY: height * 0.15,
        hasRing: false,
        ringColor: '',
        ringInnerRadius: 0,
        ringOuterRadius: 0,
      },
      // Tiny distant planet
      {
        x: 0,
        y: 0,
        radius: Math.min(width, height) * 0.025,
        color1: '#4a2c5a',
        color2: '#2d153a',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 0.00004,
        orbitRadius: Math.min(width, height) * 0.42,
        orbitSpeed: 0.00001,
        orbitAngle: Math.PI * 0.8,
        orbitCenterX: width * 0.15,
        orbitCenterY: height * 0.85,
        hasRing: false,
        ringColor: '',
        ringInnerRadius: 0,
        ringOuterRadius: 0,
      },
    ];
    planetsRef.current = planets;
  }, [canvasSize]);

  // Handle resize
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const handleResize = () => {
      const canvas = canvasRef.current!;
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        setCanvasSize({ width: canvas.width, height: canvas.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drawing functions - defined inside component to access refs
  const drawNebula = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const gradient1 = ctx.createRadialGradient(
      width * 0.2, height * 0.1, 0,
      width * 0.2, height * 0.1, Math.max(width, height) * 0.6
    );
    gradient1.addColorStop(0, 'rgba(117, 103, 255, 0.08)');
    gradient1.addColorStop(0.3, 'rgba(117, 103, 255, 0.04)');
    gradient1.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, width, height);

    const gradient2 = ctx.createRadialGradient(
      width * 0.85, height * 0.9, 0,
      width * 0.85, height * 0.9, Math.max(width, height) * 0.5
    );
    gradient2.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
    gradient2.addColorStop(0.4, 'rgba(56, 189, 248, 0.02)');
    gradient2.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, width, height);

    const gradient3 = ctx.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.7
    );
    gradient3.addColorStop(0, 'rgba(168, 85, 247, 0.04)');
    gradient3.addColorStop(0.5, 'rgba(168, 85, 247, 0.01)');
    gradient3.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient3;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const stars = starsRef.current;
    for (const star of stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      const alpha = star.brightness * twinkle;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }, []);

  const drawPlanets = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number, deltaTime: number) => {
    const planets = planetsRef.current;
    for (const planet of planets) {
      // Update orbital position
      if (planet.orbitRadius > 0) {
        planet.orbitAngle += planet.orbitSpeed * deltaTime;
        planet.x = planet.orbitCenterX + Math.cos(planet.orbitAngle) * planet.orbitRadius;
        planet.y = planet.orbitCenterY + Math.sin(planet.orbitAngle) * planet.orbitRadius;
      } else {
        planet.x = planet.orbitCenterX;
        planet.y = planet.orbitCenterY;
      }

      // Update rotation
      planet.rotation += planet.rotationSpeed * deltaTime;

      // Draw ring first (behind planet)
      if (planet.hasRing) {
        ctx.save();
        ctx.translate(planet.x, planet.y);
        ctx.rotate(Math.PI / 6); // Tilt the ring
        ctx.scale(1, 0.35); // Ellipse for perspective
        
        const ringGradient = ctx.createRadialGradient(0, 0, planet.ringInnerRadius, 0, 0, planet.ringOuterRadius);
        ringGradient.addColorStop(0, 'transparent');
        ringGradient.addColorStop(0.2, planet.ringColor);
        ringGradient.addColorStop(0.5, planet.ringColor);
        ringGradient.addColorStop(0.8, planet.ringColor);
        ringGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(0, 0, planet.ringOuterRadius, 0, Math.PI * 2);
        ctx.arc(0, 0, planet.ringInnerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = ringGradient;
        ctx.fill();
        ctx.restore();
      }

      // Draw planet with spherical shading
      ctx.save();
      ctx.translate(planet.x, planet.y);
      ctx.rotate(planet.rotation);

      // Planet base
      const planetGradient = ctx.createRadialGradient(
        -planet.radius * 0.3, -planet.radius * 0.3, 0,
        0, 0, planet.radius
      );
      planetGradient.addColorStop(0, planet.color1);
      planetGradient.addColorStop(0.6, planet.color2);
      planetGradient.addColorStop(1, '#050810');

      ctx.beginPath();
      ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
      ctx.fillStyle = planetGradient;
      ctx.fill();

      // Atmospheric rim
      const atmosphereGradient = ctx.createRadialGradient(
        -planet.radius * 0.2, -planet.radius * 0.2, planet.radius * 0.8,
        0, 0, planet.radius * 1.05
      );
      atmosphereGradient.addColorStop(0, 'transparent');
      atmosphereGradient.addColorStop(0.7, 'rgba(120, 113, 255, 0.08)');
      atmosphereGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(0, 0, planet.radius * 1.03, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGradient;
      ctx.fill();

      // Surface details - subtle bands
      for (let i = 0; i < 3; i++) {
        const bandY = -planet.radius * 0.5 + i * planet.radius * 0.4;
        const bandWidth = Math.sqrt(planet.radius * planet.radius - bandY * bandY) * 1.8;
        
        ctx.beginPath();
        ctx.ellipse(0, bandY, bandWidth, planet.radius * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 
          ? 'rgba(120, 113, 255, 0.03)' 
          : 'rgba(56, 189, 248, 0.02)';
        ctx.fill();
      }

      // Highlight (specular)
      const highlightGradient = ctx.createRadialGradient(
        -planet.radius * 0.4, -planet.radius * 0.4, 0,
        -planet.radius * 0.4, -planet.radius * 0.4, planet.radius * 0.5
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      highlightGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      ctx.restore();
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion || reducedMotion) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    if (width === 0 || height === 0) return;

    let lastTime = 0;
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw nebula background
      drawNebula(ctx, width, height, currentTime);

      // Update and draw stars
      drawStars(ctx, width, height, currentTime);

      // Update and draw planets
      drawPlanets(ctx, width, height, currentTime, deltaTime);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasSize, prefersReducedMotion, reducedMotion, drawNebula, drawStars, drawPlanets]);

  // Static render for reduced motion
  useEffect(() => {
    if (!canvasRef.current || !prefersReducedMotion && !reducedMotion) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    if (width === 0 || height === 0) return;

    // Draw static nebula
    drawNebula(ctx, width, height, 0);
    drawStars(ctx, width, height, 0);
    drawPlanets(ctx, width, height, 0, 0);
  }, [canvasSize, prefersReducedMotion, reducedMotion, drawNebula, drawStars, drawPlanets]);

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="true"
      />
      {/* CSS-based ambient glow layers for additional depth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#080F1E] to-[#0E172B]" />
        <div className="absolute top-[-40%] left-[-20%] w-[150%] h-[150%] rounded-full blur-[200px] opacity-20 bg-gradient-radial from-[#7567FF] to-transparent animate-pulse-slow" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[120%] h-[120%] rounded-full blur-[200px] opacity-15 bg-gradient-radial from-[#38BDF8] to-transparent animate-pulse-slow delay-1000" />
        <div className="absolute top-[20%] left-[30%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 bg-gradient-radial from-[#A855F7] to-transparent animate-pulse-slow delay-2000" />
      </div>
    </div>
  );
}