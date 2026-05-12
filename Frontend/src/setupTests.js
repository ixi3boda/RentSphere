







import '@testing-library/jest-dom';
import { server } from './tests/mocks/server';


beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});


global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};


global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};


jest.mock('framer-motion', () => {
  const React = require('react');
  const dummy = (tag) => React.forwardRef(({ children, ...props }, ref) => {
    const {
      initial, animate, exit, variants, transition, custom,
      whileHover, whileTap, whileFocus, whileDrag, whileInView,
      viewport, layout, layoutId, onAnimationStart, onAnimationComplete,
      onUpdate, onDragStart, onDragEnd, onDrag, onDirectionLock,
      onDragTransitionEnd, drag, dragControls, dragListener,
      dragConstraints, dragElastic, dragMomentum, dragPropagation,
      ...rest
    } = props;
    return React.createElement(tag, { ...rest, ref }, children);
  });

  return {
    motion: {
      div: dummy('div'),
      h1: dummy('h1'),
      h2: dummy('h2'),
      h3: dummy('h3'),
      p: dummy('p'),
      span: dummy('span'),
      button: dummy('button'),
      input: dummy('input'),
      img: dummy('img'),
      section: dummy('section'),
      footer: dummy('footer'),
      nav: dummy('nav'),
      aside: dummy('aside'),
      main: dummy('main'),
      label: dummy('label'),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    MotionConfig: ({ children }) => <>{children}</>,
  };
});


const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args) => {
    const msg = args[0]?.toString?.() ?? '';
    if (
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('Warning: An update to') ||
      msg.includes('not wrapped in act')
    ) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
