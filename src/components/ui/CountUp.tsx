"use client";

import React, { useState, useEffect } from 'react';
import { formatDashboardNumber } from '@/lib/utils';

interface CountUpProps {
  end: number | string;
  duration?: number;
}

export const CountUp = ({ end, duration = 2000 }: CountUpProps) => {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    // 1. Parse target value
    const target = typeof end === 'number' 
      ? end 
      : parseFloat(String(end).replace(/[^0-9.-]+/g, "")) || 0;
    
    // 2. Animation setup
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Basic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;

      const isInt = target % 1 === 0;
      setDisplayValue(formatDashboardNumber(current, isInt ? 0 : 2));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Ensure final precision
        setDisplayValue(formatDashboardNumber(target, isInt ? 0 : 2));
      }
    };

    // 3. Start animation
    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span className="tabular-nums">{displayValue}</span>;
};
