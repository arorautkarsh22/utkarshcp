import { useRef, useEffect, useState } from 'react';
import { motion, useInView as useMotionInView } from 'motion/react';

/**
 * InView — Triggers animations when element enters viewport.
 * Uses rootMargin: '200px 0px 200px 0px' so content pre-renders
 * before the user scrolls directly onto it.
 */
export function InView({
  children,
  variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  transition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  viewOptions = { once: true, margin: '200px 0px 200px 0px' },
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
 * AnimatedGroup — Staggered animations for groups of children.
 * Optimized with pre-scroll triggers and reduced stagger delays.
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
          staggerChildren: 0.02,
          delayChildren: 0.02,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 15 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      },
    },
  },
  preset,
}) {
  const presets = {
    'fade-in-up': {
      container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
      },
      item: {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      },
    },
    'scale-up': {
      container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
      },
      item: {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
      },
    },
    'blur-in': {
      container: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
      },
      item: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
      },
    },
  };

  const activeVariants = preset ? presets[preset] || variants : variants;
  const ref = useRef(null);
  const isInView = useMotionInView(ref, { once: true, margin: '200px 0px 200px 0px' });

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
  const elements = per === 'char' ? text.split('') : text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: per === 'char' ? 0.015 : 0.04,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const MotionComponent = motion.create(Component);

  return (
    <MotionComponent
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={trigger ? 'visible' : 'hidden'}
      aria-label={text}
    >
      {elements.map((el, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {el}{per === 'word' && i < elements.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </MotionComponent>
  );
}

/**
 * TextLoop — Cycles through an array of text elements
 */
export function TextLoop({
  children,
  interval = 3000,
  className,
  transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}) {
  const [index, setIndex] = useState(0);
  const items = Array.isArray(children) ? children : [children];

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative' }}>
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={transition}
        style={{ display: 'inline-block' }}
      >
        {items[index]}
      </motion.span>
    </span>
  );
}
