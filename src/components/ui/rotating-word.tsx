import { useState, useEffect } from 'react';

interface RotatingWordProps {
  words: string[];
  interval?: number;
  className?: string;
  reducedMotionFallbackIndex?: number;
}

export function RotatingWord({ 
  words, 
  interval = 2500, 
  className = '',
  reducedMotionFallbackIndex = 3 // "suggested" by default
}: RotatingWordProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

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

  const displayWord = prefersReducedMotion ? words[reducedMotionFallbackIndex] : words[currentIndex];

  return (
    <span
      className={`inline-flex items-center justify-center relative ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Invisible text for width reservation */}
      <span className="invisible px-1" aria-hidden="true">{longestWord}</span>
      {/* Visible rotating text */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {displayWord}
      </span>
    </span>
  );
}