// src/__mocks__/framer-motion.js
//
// Replaces framer-motion with plain DOM elements so Jest/JSDOM doesn't
// choke on animation internals. All motion.* components render as their
// HTML tag equivalent (div, button, etc.).
const React = require('react');

const createMotionComponent = (tag) =>
  // eslint-disable-next-line react/display-name
  React.forwardRef(({ children, ...props }, ref) => {
    // Strip framer-motion-specific props to avoid unknown-prop warnings
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
