import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Carousel = ({
  slides = [],
  renderSlide,
  autoPlay = true,
  interval = 5000,
  showIndicators = true,
  showArrows = true,
  imageMode = 'adaptive', 
  imagePosition = 'center', 
  fixedHeight = false, 
  indicatorContainerClass = "flex justify-center w-full py-3 gap-2 bg-npc-navy/90",
  arrowPrevClass = "btn btn-circle bg-white/20 border-none text-white hover:bg-white/40",
  arrowNextClass = "btn btn-circle bg-white/20 border-none text-white hover:bg-white/40",
  arrowPrevIcon = "❮",
  arrowNextIcon = "❯",
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    let slideInterval;
    
    if (autoPlay && totalSlides > 1) {
      slideInterval = setInterval(() => {
        nextSlide();
      }, interval);
    }
    
    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [autoPlay, interval, totalSlides]);

  const getImageContainerClasses = () => {
    const baseClasses = "relative w-full";
    
    if (fixedHeight) {
      return `${baseClasses} h-full`;
    }
    
    if (imageMode === 'adaptive') {
      return `${baseClasses} h-auto`;
    }
    
    return `${baseClasses} h-full`;
  };
  
  const getImageStyles = (slide) => {
    const baseStyle = {
      objectPosition: imagePosition,
      loading: 'lazy'
    };
    
    switch (imageMode) {
      case 'contain':
        return {
          ...baseStyle,
          objectFit: 'contain',
          width: '100%',
          height: fixedHeight ? '100%' : 'auto',
          backgroundColor: '#111'
        };
      case 'fill':
        return {
          ...baseStyle,
          objectFit: 'fill',
          width: '100%',
          height: '100%'
        };
      case 'cover':
        return {
          ...baseStyle,
          objectFit: 'cover',
          width: '100%',
          height: '100%'
        };
      case 'adaptive':
      default:
        return {
          ...baseStyle,
          objectFit: fixedHeight ? 'contain' : 'cover',
          width: '100%',
          height: fixedHeight ? '100%' : 'auto'
        };
    }
  };

  if (totalSlides === 0 || !renderSlide) {
    return (
      <div className="carousel-placeholder w-full h-40 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No content to display</p>
      </div>
    );
  }

  return (
    <div className={`carousel-container w-full ${fixedHeight ? 'h-full' : 'h-auto'}`}>
      <div className={`carousel w-full ${fixedHeight ? 'h-full' : 'h-auto'} relative`}>
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`carousel-item relative w-full ${fixedHeight ? 'h-full' : 'h-auto'} ${currentSlide === index ? 'block' : 'hidden'}`}
          >
            {renderSlide(slide, index, { getImageStyles })}
          </div>
        ))}
        
        {showArrows && totalSlides > 1 && (
          <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2 z-40">
            <button 
              className={arrowPrevClass} 
              onClick={prevSlide}
              aria-label="Previous Slide"
            >
              {arrowPrevIcon}
            </button>
            <button 
              className={arrowNextClass} 
              onClick={nextSlide}
              aria-label="Next Slide"
            >
              {arrowNextIcon}
            </button>
          </div>
        )}
        
        {showIndicators && totalSlides > 1 && (
          <div className={`absolute bottom-0 left-0 right-0 ${indicatorContainerClass}`}>
            {slides.map((_, index) => (
              <button 
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index ? 'bg-npc-gold w-6' : 'bg-white/50'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Carousel.propTypes = {
  slides: PropTypes.array.isRequired,
  renderSlide: PropTypes.func.isRequired,
  autoPlay: PropTypes.bool,
  interval: PropTypes.number,
  showIndicators: PropTypes.bool,
  showArrows: PropTypes.bool,
  imageMode: PropTypes.oneOf(['adaptive', 'contain', 'cover', 'fill']),
  imagePosition: PropTypes.oneOf(['center', 'top', 'bottom']),
  fixedHeight: PropTypes.bool,
  indicatorContainerClass: PropTypes.string,
  arrowPrevClass: PropTypes.string,
  arrowNextClass: PropTypes.string,
  arrowPrevIcon: PropTypes.node,
  arrowNextIcon: PropTypes.node,
};

export default Carousel;