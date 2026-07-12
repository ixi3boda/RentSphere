// src/__mocks__/framer-motion.js
// Replaces framer-motion with lightweight passthrough components for tests.
const React = require('react');

const motion = new Proxy(
  {},
  {
    get: (_, tag) =>
      // eslint-disable-next-line react/display-name
      React.forwardRef(({ children, ...props }, ref) => {
        // Strip framer-motion-specific props before forwarding to DOM
        const {
          initial, animate, exit, transition, variants, custom,
          whileHover, whileTap, whileFocus, whileDrag, whileInView,
          layout, layoutId,
          ...rest
        } = props;
        return React.createElement(tag, { ...rest, ref }, children);
      }),
  }
);

const AnimatePresence = ({ children }) => React.createElement(React.Fragment, null, children);

module.exports = { motion, AnimatePresence };
