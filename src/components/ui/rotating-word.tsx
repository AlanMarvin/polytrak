import { useState, useEffect, useRef } from 'react';

interface RotatingWordProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function RotatingWord({ words, interval = 2500, className = '' }: RotatingWordProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Find the longest word for stable width
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsVisible(true);
      }, 250);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval, prefersReducedMotion, isPaused]);

  // If reduced motion, show "better" (second word)
  const displayWord = prefersReducedMotion ? words[1] : words[currentIndex];

  return (
    <span
      ref={containerRef}
      className={`inline-block relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Invisible text for width reservation */}
      <span className="invisible" aria-hidden="true">{longestWord}</span>
      {/* Visible rotating text */}
      <span
        className={`absolute inset-0 transition-all duration-200 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-2'
        }`}
      >
        {displayWord}
      </span>
    </span>
  );
}
