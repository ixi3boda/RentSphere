// src/components/ImageCarousel.js
//
// RS-10 — Image gallery carousel for PropertyDetail.
//
// Props:
//   images   {string[]}  – array of image URLs (Cloudinary or blob)
//   autoPlay {boolean}   – enable auto-advance (default: false)

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDE_DURATION_MS = 4000;

function ImageCarousel({ images = [], autoPlay = false }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const count = images.length;

  const goTo = useCallback(
    (index) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % count);
  }, [count]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    const id = setInterval(next, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [autoPlay, count, next]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  if (!count) {
    return (
      <div className="w-full h-72 rounded-2xl bg-gradient-to-br from-rentsphere-teal/10 to-rentsphere-orange/10 flex items-center justify-center">
        <span className="text-6xl opacity-30">🏠</span>
      </div>
    );
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden select-none" style={{ aspectRatio: '16/9' }}>
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={current}
          src={images[current]}
          alt={`Property image ${current + 1}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </AnimatePresence>

      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Navigation buttons (only when multiple images) */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            id="carousel-prev"
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-gray-700 hover:bg-white transition-all hover:scale-110 active:scale-95 z-10"
          >
            ‹
          </button>
          <button
            onClick={next}
            id="carousel-next"
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-gray-700 hover:bg-white transition-all hover:scale-110 active:scale-95 z-10"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`rounded-full transition-all duration-300
                ${i === current
                  ? 'w-5 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}

      {/* Counter badge */}
      {count > 1 && (
        <span className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
          {current + 1} / {count}
        </span>
      )}
    </div>
  );
}

export default ImageCarousel;
