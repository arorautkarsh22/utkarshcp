import { useRef, useEffect, useState } from 'react';
import { motion, useInView as useMotionInView } from 'motion/react';

/**
 * InView — Triggers animations when element enters viewport
 * Inspired by motion-primitives InView component
 */
export function InView({
  children,
  variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  viewOptions = { once: true, amount: 0.1 },
  as: Component = 'div',
  className,
  style,
}) {
  const ref = useRef(null);
  const isInView = useMotionInView(ref, viewOptions);

  const MotionComponent = motion.create(Component);

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
      className={className}
      style={style}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * AnimatedGroup — Staggered animations for groups of children
 * Inspired by motion-primitives AnimatedGroup component
 */
export function AnimatedGroup({
  children,
  className,
  variants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      },
    },
  },
  preset,
}) {
  const presets = {
    'fade-in-up': {
      container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
      },
      item: {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      },
    },
    'scale-up': {
      container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
      },
      item: {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
      },
    },
    'blur-in': {
      container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
      },
      item: {
        hidden: { opacity: 0, filter: 'blur(12px)' },
        visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.6 } },
      },
    },
  };

  const activeVariants = preset ? presets[preset] || variants : variants;
  const ref = useRef(null);
  const isInView = useMotionInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={activeVariants.container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={activeVariants.item}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={activeVariants.item}>{children}</motion.div>
      }
    </motion.div>
  );
}

/**
 * TextEffect — Animated text with per-character or per-word animations
 * Inspired by motion-primitives TextEffect component
 */
export function TextEffect({
  children,
  per = 'word',
  preset = 'fade-in-up',
  delay = 0,
  className,
  as: Component = 'span',
  trigger = true,
}) {
  const text = typeof children === 'string' ? children : '';

  const presets = {
    'fade-in-up': {
      hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
    },
    'fade-in': {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    'blur-in': {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
    'slide-up': {
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0 },
    },
    'slide-down': {
      hidden: { opacity: 0, y: -24 },
      visible: { opacity: 1, y: 0 },
    },
  };

  const variants = presets[preset] || presets['fade-in-up'];

  const segments = per === 'char'
    ? text.split('')
    : text.split(' ');

  return (
    <Component className={className} style={{ display: 'inline' }}>
      <motion.span
        initial="hidden"
        animate={trigger ? 'visible' : 'hidden'}
        transition={{
          staggerChildren: per === 'char' ? 0.025 : 0.06,
          delayChildren: delay,
        }}
        style={{ display: 'inline' }}
      >
        {segments.map((segment, i) => (
          <motion.span
            key={`${segment}-${i}`}
            variants={variants}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-block',
              whiteSpace: per === 'char' ? 'pre' : 'normal',
            }}
          >
            {segment}
            {per === 'word' && i < segments.length - 1 ? '\u00A0' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}

/**
 * TransitionPanel — Animated panel transitions for content switching
 * Inspired by motion-primitives TransitionPanel component
 */
export function TransitionPanel({
  children,
  activeIndex = 0,
  className,
  transition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  variants = {
    enter: { opacity: 0, y: 12, filter: 'blur(4px)' },
    center: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
  },
}) {
  const childArray = Array.isArray(children) ? children : [children];
  const activeChild = childArray[activeIndex];

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      <motion.div
        key={activeIndex}
        initial="enter"
        animate="center"
        exit="exit"
        variants={variants}
        transition={transition}
      >
        {activeChild}
      </motion.div>
    </div>
  );
}

/**
 * TextLoop — Cycles through text values with animation
 */
export function TextLoop({
  children,
  interval = 3000,
  className,
  transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}) {
  const items = Array.isArray(children) ? children : [children];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative' }}>
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
        transition={transition}
        style={{ display: 'inline-block' }}
      >
        {items[index]}
      </motion.span>
    </span>
  );
}
