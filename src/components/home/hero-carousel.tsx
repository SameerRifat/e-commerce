// ============================================
// src/components/home/HeroCarousel.tsx
// ============================================

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import Fade from 'embla-carousel-fade';
import type { CarouselApi } from '@/components/ui/carousel';

// Type definitions
interface HeroSlide {
  type: 'image' | 'video';
  src: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  className?: string;
}

interface VideoDurations {
  [key: number]: number;
}

// Hero Carousel Component
const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, className = '' }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>(false);
  const [canScrollNext, setCanScrollNext] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoDurations, setVideoDurations] = useState<VideoDurations>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  
  // Handle video metadata loading to capture durations
  const handleVideoMetadata = useCallback((index: number, video: HTMLVideoElement) => {
    if (video && video.duration && !isNaN(video.duration)) {
      console.log(`Video ${index} duration loaded: ${video.duration}s`);
      setVideoDurations(prev => ({
        ...prev,
        [index]: video.duration
      }));
    }
  }, []);

  // Get current slide duration (dynamic for videos, fixed for images)
  const getCurrentSlideDuration = useCallback((): number => {
    const currentSlide = slides[current];
    if (currentSlide?.type === 'video') {
      const duration = videoDurations[current];
      const finalDuration = duration ? Math.floor(duration * 1000) : 5000;
      console.log(`Video slide ${current} duration: ${finalDuration}ms (${duration}s)`);
      return finalDuration;
    }
    console.log(`Image slide ${current} duration: 5000ms`);
    return 5000;
  }, [current, videoDurations, slides]);

  // Custom autoplay management with dynamic timing
  const customAutoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const startCustomAutoplay = useCallback(() => {
    if (customAutoplayTimeoutRef.current) {
      clearTimeout(customAutoplayTimeoutRef.current);
    }
    
    const duration = getCurrentSlideDuration();
    
    customAutoplayTimeoutRef.current = setTimeout(() => {
      if (api && isPlaying) {
        api.scrollNext();
      }
    }, duration);
  }, [api, getCurrentSlideDuration, isPlaying]);
  
  const stopCustomAutoplay = useCallback(() => {
    if (customAutoplayTimeoutRef.current) {
      clearTimeout(customAutoplayTimeoutRef.current);
      customAutoplayTimeoutRef.current = null;
    }
  }, []);
  
  // Check for pre-loaded video durations
  useEffect(() => {
    const checkVideoDurations = () => {
      videoRefs.current.forEach((video, index) => {
        if (video && video.duration && !isNaN(video.duration) && !videoDurations[index]) {
          handleVideoMetadata(index, video);
        }
      });
    };
    
    checkVideoDurations();
  }, [videoDurations, handleVideoMetadata]);
  
  // Fade plugin reference
  const fadePlugin = useRef(Fade());

  // Progress tracking state
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(0);
    
    const startTime = Date.now();
    const duration = getCurrentSlideDuration();
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressValue = Math.min(elapsed / duration, 1);
      setProgress(progressValue);
      
      if (progressValue >= 1) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50);
  }, [getCurrentSlideDuration]);
  
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(0);
  }, []);

  // Handle carousel API and events
  useEffect(() => {
    if (!api) return;

    const updateSelection = () => {
      const currentIndex = api.selectedScrollSnap();
      setCurrent(currentIndex);
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
      
      // Update active slide data attributes for animations
      const slides = api.slideNodes();
      slides.forEach((slide, index) => {
        if (index === currentIndex) {
          slide.setAttribute('data-active', 'true');
          slide.classList.add('embla__slide--active');
        } else {
          slide.removeAttribute('data-active');
          slide.classList.remove('embla__slide--active');
        }
      });
    };

    const handleSlideChange = () => {
      updateSelection();
      startProgressTracking();
      
      // Start custom autoplay for the new slide
      if (isPlaying) {
        startCustomAutoplay();
      }
      
      // Handle video playback
      const currentIndex = api.selectedScrollSnap();
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      });
    };

    updateSelection();
    startProgressTracking();
    
    // Start initial custom autoplay
    if (isPlaying) {
      startCustomAutoplay();
    }
    
    api.on('select', handleSlideChange);
    api.on('reInit', updateSelection);

    return () => {
      stopProgressTracking();
      stopCustomAutoplay();
      api.off('select', handleSlideChange);
      api.off('reInit', updateSelection);
    };
  }, [api, startProgressTracking, stopProgressTracking, startCustomAutoplay, stopCustomAutoplay, isPlaying]);

  const scrollTo = useCallback((index: number) => {
    if (api) {
      api.scrollTo(index);
      // Reset custom autoplay timer and progress animation for full duration on manual navigation
      if (isPlaying) {
        stopCustomAutoplay();
        startProgressTracking();
        startCustomAutoplay();
      }
    }
  }, [api, isPlaying, startProgressTracking, startCustomAutoplay, stopCustomAutoplay]);

  const scrollPrev = useCallback(() => {
    if (api) {
      api.scrollPrev();
      // Reset custom autoplay timer and progress animation for full duration on manual navigation
      if (isPlaying) {
        stopCustomAutoplay();
        startProgressTracking();
        startCustomAutoplay();
      }
    }
  }, [api, isPlaying, startProgressTracking, startCustomAutoplay, stopCustomAutoplay]);

  const scrollNext = useCallback(() => {
    if (api) {
      api.scrollNext();
      // Reset custom autoplay timer and progress animation for full duration on manual navigation
      if (isPlaying) {
        stopCustomAutoplay();
        startProgressTracking();
        startCustomAutoplay();
      }
    }
  }, [api, isPlaying, startProgressTracking, startCustomAutoplay, stopCustomAutoplay]);

  const toggleAutoplay = useCallback(() => {
    if (isPlaying) {
      stopCustomAutoplay();
      stopProgressTracking();
    } else {
      startProgressTracking();
      startCustomAutoplay();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, startProgressTracking, stopProgressTracking, startCustomAutoplay, stopCustomAutoplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCustomAutoplay();
      stopProgressTracking();
    };
  }, [stopCustomAutoplay, stopProgressTracking]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Carousel
        className="h-full w-full hero-carousel"
        setApi={setApi}
        plugins={[fadePlugin.current]}
        opts={{
          align: "center",
          loop: true,
          containScroll: false,
        }}
      >
        <CarouselContent className="h-full bg-black">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="hero-slide">
              {/* Slide Content with Fade and Scale Animation */}
              <div className="hero-slide-content">
                {slide.type === 'image' ? (
                  <div 
                    className="hero-media bg-black"
                    style={{ 
                      backgroundImage: `url(${slide.src})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                ) : (
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    className="hero-media"
                    src={slide.src}
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    onLoadedMetadata={(e) => handleVideoMetadata(index, e.currentTarget)}
                  />
                )}
                {/* Subtle overlay for better control visibility */}
                <div className="absolute inset-0 bg-black/10" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Custom Navigation Controls */}
      <div className="custom_container absolute left-0 right-0 bottom-3">
        <div className="w-fit flex items-center ml-auto space-x-3 lg:space-x-6 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 lg:px-6 lg:py-3 border border-white/20">

          {/* Enhanced Dots with Progress - Responsive */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`relative transition-all duration-500 rounded-full overflow-hidden ${
                  current === index 
                    ? 'w-6 h-1.5 lg:w-8 lg:h-2' 
                    : 'w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              >
                {current === index ? (
                  <>
                    {/* Background dot - darker for contrast */}
                    <div className="absolute inset-0 bg-white/20 rounded-full border border-white/30" />
                    {/* Progress indicator - gold/amber for visibility */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: current === index ? progress : 0 }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                    {/* Active dot highlight - subtle overlay */}
                    <motion.div
                      className="absolute inset-0 bg-white/10 rounded-full"
                      layoutId="activeDot"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  </>
                ) : null}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 lg:h-6 bg-white/20" />

          {/* Controls - Responsive */}
          <div className="flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </button>

            <button
              onClick={toggleAutoplay}
              className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
            >
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
              ) : (
                <Play className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white ml-0.5" />
              )}
            </button>

            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
export type { HeroSlide, HeroCarouselProps };