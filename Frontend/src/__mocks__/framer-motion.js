




const React = require('react');

const createMotionComponent = (tag) =>
  
  React.forwardRef(({ children, ...props }, ref) => {
    
    const {
      initial, animate, exit, transition, variants, whileHover, whileTap,
      whileFocus, whileDrag, whileInView, layout, layoutId, drag, dragConstraints,
      dragElastic, dragMomentum, onDragStart, onDragEnd, onAnimationStart,
      onAnimationComplete, custom, ...rest
    } = props;
    return React.createElement(tag, { ...rest, ref }, children);
  });

const motion = new Proxy(
  {},
  {
    get: (_, tag) => createMotionComponent(tag),
  }
);

const AnimatePresence = ({ children }) => children;
AnimatePresence.displayName = 'AnimatePresence';

module.exports = {
  motion,
  AnimatePresence,
  useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
  useMotionValue: (initial) => ({ get: () => initial, set: jest.fn() }),
  useTransform: () => ({ get: jest.fn() }),
  useSpring: () => ({ get: jest.fn() }),
  useReducedMotion: () => false,
};
