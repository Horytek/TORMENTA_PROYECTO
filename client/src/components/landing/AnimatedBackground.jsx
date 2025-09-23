import React, { useEffect, useRef } from 'react';

export const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Variables de animación
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;

    // Orbes
    const orbs = [
      { x: 0.3, y: 0.3, radius: 100, speed: 0.5, color: 'rgba(99, 102, 241, 0.3)' },
      { x: 0.7, y: 0.6, radius: 80, speed: 0.3, color: 'rgba(139, 92, 246, 0.2)' },
      { x: 0.5, y: 0.8, radius: 120, speed: 0.4, color: 'rgba(59, 130, 246, 0.25)' },
    ];

    // Manejo del mouse
    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Función de animación
    const animate = () => {
      time += 0.01;
      
      // Limpiar canvas con fondo oscuro
      ctx.fillStyle = '#020203';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar orbes
      orbs.forEach((orb, index) => {
        const x = canvas.width * (orb.x + Math.sin(time * orb.speed + index) * 0.1);
        const y = canvas.height * (orb.y + Math.cos(time * orb.speed + index) * 0.1);
        
        // Crear gradiente radial
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.radius);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Orbe del mouse
      if (mouseX > 0 && mouseY > 0) {
        const mouseRadius = 60;
        const gradient = ctx.createRadialGradient(
          mouseX * canvas.width, 
          mouseY * canvas.height, 
          0, 
          mouseX * canvas.width, 
          mouseY * canvas.height, 
          mouseRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouseX * canvas.width, mouseY * canvas.height, mouseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Efecto de ondas
      const waveY = canvas.height * 0.7 + Math.sin(time * 2) * 20;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      
      for (let x = 0; x <= canvas.width; x += 10) {
        const y = waveY + Math.sin((x / 100) + time * 3) * 10;
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      animationIdRef.current = requestAnimationFrame(animate);
    };

    // Iniciar animación
    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#020203'
      }}
    />
  );
};