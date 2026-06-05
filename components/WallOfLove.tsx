'use client';

import React, { useState, useRef } from 'react';

export interface Testimonial {
  id: string | number;
  name: string;
  role: string;
  message: string;
  rating?: number;
  tags?: string[];
}

export interface WallOfLoveProps {
  testimonials: Testimonial[];
  onCardClick?: (testimonial: Testimonial, event: React.MouseEvent | React.TouchEvent) => void;
  tooltipFormatter?: (testimonial: Testimonial) => string;
}

export default function WallOfLove({
  testimonials,
  onCardClick,
  tooltipFormatter,
}: WallOfLoveProps) {
  const [hoveredCardId, setHoveredCardId] = useState<string | number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    // Compute coordinates relative to the container for responsive rendering
    const x = e.clientX - containerRect.left + 15;
    const y = e.clientY - containerRect.top + 15;
    setTooltipPos({ x, y });
  };

  const handleMouseEnter = (e: React.MouseEvent, id: string | number) => {
    setHoveredCardId(id);
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left + 15;
    const y = e.clientY - containerRect.top + 15;
    setTooltipPos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoveredCardId(null);
  };

  const handleTouchStart = (e: React.TouchEvent, testimonial: Testimonial) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - containerRect.left + 15;
    const y = touch.clientY - containerRect.top + 15;

    setHoveredCardId(testimonial.id);
    setTooltipPos({ x, y });
  };

  const handleTouchEnd = (e: React.TouchEvent, testimonial: Testimonial) => {
    // If click/touch action is requested, trigger callback
    if (onCardClick) {
      onCardClick(testimonial, e);
    }
    // Set a timeout to clear the tooltip on touch devices to let user see it momentarily
    setTimeout(() => {
      setHoveredCardId((current) => (current === testimonial.id ? null : current));
    }, 1000);
  };

  const handleCardClick = (e: React.MouseEvent, testimonial: Testimonial) => {
    if (onCardClick) {
      onCardClick(testimonial, e);
    }
  };

  const activeTestimonial = testimonials.find((t) => t.id === hoveredCardId);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[400px] p-6 bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl"
      data-testid="wall-of-love-container"
    >
      <h2 className="text-3xl font-extrabold tracking-tight text-center mb-8 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
        Wall of Love
      </h2>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="testimonials-grid"
      >
        {testimonials.map((testimonial) => {
          const isHovered = hoveredCardId === testimonial.id;
          return (
            <div
              key={testimonial.id}
              data-testid={`testimonial-card-${testimonial.id}`}
              className={`p-6 rounded-xl border transition-all duration-300 transform cursor-pointer ${
                isHovered
                  ? 'bg-slate-800 border-pink-500 scale-105 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
              onMouseEnter={(e) => handleMouseEnter(e, testimonial.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={(e) => handleTouchStart(e, testimonial)}
              onTouchEnd={(e) => handleTouchEnd(e, testimonial)}
              onClick={(e) => handleCardClick(e, testimonial)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-yellow-500 flex items-center justify-center font-bold text-lg text-white">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{testimonial.name}</h3>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">{testimonial.message}</p>
              {testimonial.rating && (
                <div
                  className="flex items-center space-x-1"
                  data-testid={`rating-${testimonial.id}`}
                >
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Responsive interactive tooltip overlay */}
      {hoveredCardId !== null && activeTestimonial && (
        <div
          data-testid="interactive-tooltip"
          className="absolute z-50 pointer-events-none p-3 bg-slate-950 border border-pink-500/50 rounded-lg shadow-xl text-xs max-w-xs transition-opacity duration-150 animate-fade-in"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          <div className="font-bold text-pink-400 mb-1">
            {tooltipFormatter ? tooltipFormatter(activeTestimonial) : activeTestimonial.name}
          </div>
          <p className="text-slate-300">
            {activeTestimonial.rating ? `${activeTestimonial.rating}/5 Stars` : 'Verified User'}
          </p>
          {activeTestimonial.tags && activeTestimonial.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activeTestimonial.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-pink-900/40 text-pink-300 rounded text-[10px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
