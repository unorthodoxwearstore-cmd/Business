// Smooth transitions and animations for Hisaabb UI

export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  },

  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },

  // Stagger animations for lists
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  // Card hover effects
  cardHover: {
    whileHover: { 
      scale: 1.02, 
      y: -2,
      transition: { duration: 0.2, ease: 'easeInOut' }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  },

  // Button animations
  buttonPress: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1 }
  },

  // Loading animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  }
};

// CSS transition classes for non-framer-motion components
export const transitionClasses = {
  default: 'transition-all duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
  
  // Specific property transitions
  colors: 'transition-colors duration-300 ease-in-out',
  transform: 'transition-transform duration-300 ease-in-out',
  opacity: 'transition-opacity duration-300 ease-in-out',
  shadow: 'transition-shadow duration-300 ease-in-out',
  
  // Hover effects
  hoverScale: 'transition-transform duration-200 ease-in-out hover:scale-105',
  hoverLift: 'transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1',
  hoverGlow: 'transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-blue-500/25',
  
  // Focus effects
  focusRing: 'transition-all duration-200 ease-in-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  
  // Loading states
  shimmer: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]'
};

// Page transition variants
export const pageTransitions = {
  slideLeft: {
    initial: { opacity: 0, x: 300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -300 },
    transition: { duration: 0.5, ease: 'easeInOut' }
  },

  slideRight: {
    initial: { opacity: 0, x: -300 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 300 },
    transition: { duration: 0.5, ease: 'easeInOut' }
  },

  fadeScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.4, ease: 'easeInOut' }
  }
};

// Utility functions for dynamic animations
export const createStaggeredAnimation = (itemCount: number, delay: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delay,
      delayChildren: 0.1
    }
  }
});

export const createBounceIn = (delay: number = 0) => ({
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      delay,
      duration: 0.6,
      ease: [0.175, 0.885, 0.32, 1.275]
    }
  }
});

export const createSlideInVariant = (direction: 'left' | 'right' | 'up' | 'down', distance: number = 50) => {
  const coords = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance }
  };

  return {
    initial: { opacity: 0, ...coords[direction] },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, ...coords[direction] },
    transition: { duration: 0.4, ease: 'easeOut' }
  };
};

// CSS custom properties for smooth theme transitions
export const cssVariables = `
:root {
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Enhanced focus indicators */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Loading state animations */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Animation utility classes */
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

.animate-slide-in-left {
  animation: slideInFromLeft 0.4s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-in-out;
}

/* Stagger delay utilities */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
.stagger-4 { animation-delay: 0.4s; }
.stagger-5 { animation-delay: 0.5s; }

/* Hover effects */
.hover-lift {
  transition: all var(--transition-normal);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.hover-glow {
  transition: all var(--transition-normal);
}

.hover-glow:hover {
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2);
}

/* Loading spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// Inject CSS if not already present
if (typeof document !== 'undefined') {
  const styleId = 'hisaabb-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssVariables;
    document.head.appendChild(style);
  }
}
