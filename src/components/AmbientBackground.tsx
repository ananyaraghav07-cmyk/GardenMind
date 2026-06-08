import React, { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

interface LeafParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

export const AmbientBackground: React.FC = () => {
  const [particles, setParticles] = useState<LeafParticle[]>([]);

  useEffect(() => {
    // Generate randomized parameters for floating leaves
    const generated: LeafParticle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // starting percentage width
      delay: Math.random() * -20, // start scattered immediately
      duration: 12 + Math.random() * 12, // duration range: 12s - 24s
      size: 12 + Math.random() * 18, // size range: 12px - 30px
      rotation: Math.random() * 360,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="leaf-particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <Leaf
            size={p.size}
            style={{
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
