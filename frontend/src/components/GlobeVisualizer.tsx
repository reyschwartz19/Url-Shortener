import { useEffect, useRef, useState } from 'react';

interface CityNode {
  name: string;
  lat: number; // in radians
  lon: number; // in radians
  color: string;
  glowClass: string;
}

const CITIES: CityNode[] = [
  { name: 'Tokyo', lat: 0.61, lon: 2.42, color: '#4D8DFF', glowClass: 'bg-primary' },
  { name: 'London', lat: 0.89, lon: 0.0, color: '#44E098', glowClass: 'bg-secondary' },
  { name: 'Frankfurt', lat: 0.87, lon: 0.15, color: '#FABB57', glowClass: 'bg-tertiary' },
  { name: 'New York', lat: 0.71, lon: -1.29, color: '#E2E8F0', glowClass: 'text-on-surface' }
];

export default function GlobeVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [projectedCities, setProjectedCities] = useState<
    Array<{ name: string; x: number; y: number; z: number; visible: boolean; color: string }>
  >([]);

  // Rotation angles
  const angleYRef = useRef(0);
  const angleXRef = useRef(0.1);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: width || 500,
          height: height || 500
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Track mouse coordinates for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Convert to normalized coordinates [-0.5, 0.5]
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 0.4;
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Generate globe particles
    const particleCount = 180;
    const particles: Array<{ x: number; y: number; z: number }> = [];
    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution on sphere
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      particles.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta)
      });
    }

    const render = () => {
      // Lerp mouse angles for lag effect
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Base rotation + mouse interaction
      angleYRef.current += 0.003;
      const currentAngleY = angleYRef.current + mouseRef.current.x;
      const currentAngleX = angleXRef.current + mouseRef.current.y;

      const cosY = Math.cos(currentAngleY);
      const sinY = Math.sin(currentAngleY);
      const cosX = Math.cos(currentAngleX);
      const sinX = Math.sin(currentAngleX);

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.38;

      // 3D rotation and projection helpers
      const rotate3D = (p: { x: number; y: number; z: number }) => {
        // Rotate around Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // Rotate around X axis
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        return { x: x1, y: y2, z: z2 };
      };

      // 1. Draw Globe Wireframe (Grid lines)
      ctx.strokeStyle = 'rgba(77, 141, 255, 0.03)';
      ctx.lineWidth = 1;
      
      // Latitude bands
      const bands = 8;
      for (let b = 1; b < bands; b++) {
        ctx.beginPath();
        const latAngle = (b / bands) * Math.PI - Math.PI / 2;
        const latRadius = Math.cos(latAngle);
        const latY = Math.sin(latAngle);

        for (let s = 0; s <= 36; s++) {
          const lonAngle = (s / 36) * Math.PI * 2;
          const pt = rotate3D({
            x: latRadius * Math.cos(lonAngle),
            y: latY,
            z: latRadius * Math.sin(lonAngle)
          });
          const drawX = centerX + pt.x * radius;
          const drawY = centerY + pt.y * radius;
          
          if (s === 0) ctx.moveTo(drawX, drawY);
          else ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();
      }

      // Longitude lines
      const meridians = 12;
      for (let m = 0; m < meridians; m++) {
        ctx.beginPath();
        const lonAngle = (m / meridians) * Math.PI * 2;
        for (let s = 0; s <= 36; s++) {
          const latAngle = (s / 36) * Math.PI - Math.PI / 2;
          const pt = rotate3D({
            x: Math.cos(latAngle) * Math.cos(lonAngle),
            y: Math.sin(latAngle),
            z: Math.cos(latAngle) * Math.sin(lonAngle)
          });
          const drawX = centerX + pt.x * radius;
          const drawY = centerY + pt.y * radius;

          if (s === 0) ctx.moveTo(drawX, drawY);
          else ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();
      }

      // 2. Render particles
      particles.forEach((p) => {
        const rotated = rotate3D(p);
        
        // Depth buffer fade
        // rotated.z goes from -1 (back) to 1 (front)
        const alpha = (rotated.z + 1.2) / 2.2 * 0.35 + 0.05;
        const size = (rotated.z + 1.2) / 2.2 * 1.5 + 0.5;

        ctx.fillStyle = `rgba(77, 141, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(centerX + rotated.x * radius, centerY + rotated.y * radius, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Project and update city nodes
      const citiesProjected = CITIES.map((city) => {
        // Spherical coordinates mapping
        const rawPt = {
          x: Math.cos(city.lat) * Math.sin(city.lon),
          y: Math.sin(city.lat),
          z: Math.cos(city.lat) * Math.cos(city.lon)
        };

        const rotated = rotate3D(rawPt);
        const drawX = centerX + rotated.x * radius;
        const drawY = centerY + rotated.y * radius;

        // Draw dot on canvas
        const isFront = rotated.z > -0.2;
        if (isFront) {
          const alpha = (rotated.z + 0.2) / 1.2;
          // Pulse size
          const time = Date.now() * 0.003;
          const pulse = Math.sin(time) * 3 + 4;

          // Outer pulse ring
          ctx.strokeStyle = `${city.color}${Math.floor(alpha * 40).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(drawX, drawY, pulse + 1, 0, Math.PI * 2);
          ctx.stroke();

          // Inner solid core
          ctx.fillStyle = city.color;
          ctx.beginPath();
          ctx.arc(drawX, drawY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        return {
          name: city.name,
          x: drawX,
          y: drawY,
          z: rotated.z,
          visible: isFront,
          color: city.color
        };
      });

      setProjectedCities(citiesProjected);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      />
      {/* HTML Floating overlay badges for cities */}
      <div className="absolute inset-0 pointer-events-none">
        {projectedCities.map((city, idx) => {
          if (!city.visible) return null;
          // Fade label depending on depth
          const opacity = Math.max(0, (city.z + 0.1) / 1.1);
          return (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-full mb-3 flex items-center gap-2 glass-panel px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter uppercase border border-white/10"
              style={{
                left: `${city.x}px`,
                top: `${city.y}px`,
                opacity: opacity,
                backgroundColor: 'rgba(20, 32, 48, 0.8)',
                backdropFilter: 'blur(4px)',
                borderColor: `${city.color}33`,
                color: city.color,
                transition: 'opacity 0.1s ease-out'
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: city.color }}
              />
              {city.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
