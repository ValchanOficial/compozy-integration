import { useState, useEffect, useCallback } from "react";
import { ScreenBreakpoint, SwipeDirection } from "@/types";

/**
 * Breakpoint thresholds in pixels.
 */
const BREAKPOINTS = {
  xs: 320,
  sm: 600,
  md: 800,
  lg: 1200,
  xl: 1920,
  xxl: 2560,
} as const;

/**
 * Minimum swipe distance to register a swipe gesture (in pixels).
 */
const MIN_SWIPE_DISTANCE = 30;

/**
 * Maximum time for a swipe gesture (in milliseconds).
 */
const MAX_SWIPE_TIME = 300;

/**
 * Responsive state returned by useResponsive hook.
 */
export interface ResponsiveState {
  /** Current screen breakpoint */
  breakpoint: ScreenBreakpoint;
  /** Screen width in pixels */
  width: number;
  /** Screen height in pixels */
  height: number;
  /** Whether the device supports touch */
  isTouchDevice: boolean;
  /** Whether the screen is in portrait orientation */
  isPortrait: boolean;
  /** Whether the current screen is mobile (xs or sm) */
  isMobile: boolean;
  /** Whether the current screen is tablet (md) */
  isTablet: boolean;
  /** Whether the current screen is desktop (lg or larger) */
  isDesktop: boolean;
}

/**
 * Swipe handlers for touch controls.
 */
export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent | TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent | TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent | TouchEvent) => void;
}

/**
 * Return type for useSwipeDetection hook.
 */
export interface SwipeDetectionResult {
  /** Last detected swipe direction */
  swipeDirection: SwipeDirection;
  /** Touch event handlers to attach to the element */
  handlers: SwipeHandlers;
  /** Reset the swipe direction */
  resetSwipe: () => void;
}

/**
 * Determine the current breakpoint based on screen width.
 */
function getBreakpoint(width: number): ScreenBreakpoint {
  if (width < BREAKPOINTS.sm) return "xs";
  if (width < BREAKPOINTS.md) return "sm";
  if (width < BREAKPOINTS.lg) return "md";
  if (width < BREAKPOINTS.xl) return "lg";
  if (width < BREAKPOINTS.xxl) return "xl";
  return "xxl";
}

/**
 * Check if the device supports touch events.
 */
function detectTouchSupport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Hook for detecting responsive screen properties.
 * Provides breakpoint, dimensions, and device capabilities.
 *
 * @returns ResponsiveState with current screen properties
 *
 * @example
 * ```tsx
 * const { breakpoint, isMobile, isTouchDevice } = useResponsive();
 *
 * if (isMobile) {
 *   // Render mobile-specific UI
 * }
 * ```
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 800;
    const height = typeof window !== "undefined" ? window.innerHeight : 600;
    const breakpoint = getBreakpoint(width);

    return {
      breakpoint,
      width,
      height,
      isTouchDevice: detectTouchSupport(),
      isPortrait: height > width,
      isMobile: breakpoint === "xs" || breakpoint === "sm",
      isTablet: breakpoint === "md",
      isDesktop:
        breakpoint === "lg" || breakpoint === "xl" || breakpoint === "xxl",
    };
  });

  useEffect(() => {
    const handleResize = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getBreakpoint(width);

      setState({
        breakpoint,
        width,
        height,
        isTouchDevice: detectTouchSupport(),
        isPortrait: height > width,
        isMobile: breakpoint === "xs" || breakpoint === "sm",
        isTablet: breakpoint === "md",
        isDesktop:
          breakpoint === "lg" || breakpoint === "xl" || breakpoint === "xxl",
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}

/**
 * Hook for detecting swipe gestures on touch devices.
 * Returns handlers to attach to touchable elements and the detected swipe direction.
 *
 * @param onSwipe Optional callback when a swipe is detected
 * @returns SwipeDetectionResult with direction, handlers, and reset function
 *
 * @example
 * ```tsx
 * const { swipeDirection, handlers } = useSwipeDetection((direction) => {
 *   console.log('Swiped:', direction);
 * });
 *
 * return <div {...handlers}>Swipeable area</div>;
 * ```
 */
export function useSwipeDetection(
  onSwipe?: (direction: SwipeDirection) => void
): SwipeDetectionResult {
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  const resetSwipe = useCallback((): void => {
    setSwipeDirection(null);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent | TouchEvent): void => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
    setSwipeDirection(null);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent): void => {
      // Prevent default to avoid scrolling while swiping in game area
      if (touchStart) {
        e.preventDefault();
      }
    },
    [touchStart]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent): void => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.time;

      // Reset touch start
      setTouchStart(null);

      // Check if swipe was fast enough
      if (deltaTime > MAX_SWIPE_TIME) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check if swipe was long enough
      if (absX < MIN_SWIPE_DISTANCE && absY < MIN_SWIPE_DISTANCE) return;

      let direction: SwipeDirection = null;

      // Determine direction based on dominant axis
      if (absX > absY) {
        direction = deltaX > 0 ? "right" : "left";
      } else {
        direction = deltaY > 0 ? "down" : "up";
      }

      setSwipeDirection(direction);

      if (onSwipe) {
        onSwipe(direction);
      }
    },
    [touchStart, onSwipe]
  );

  return {
    swipeDirection,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    resetSwipe,
  };
}

/**
 * Calculate optimal game canvas dimensions based on available space.
 *
 * @param containerWidth Available container width
 * @param containerHeight Available container height
 * @param baseWidth Base game width (default 800)
 * @param baseHeight Base game height (default 600)
 * @returns Scaled dimensions that fit within container while maintaining aspect ratio
 */
export function calculateCanvasDimensions(
  containerWidth: number,
  containerHeight: number,
  baseWidth: number = 800,
  baseHeight: number = 600
): { width: number; height: number; scale: number } {
  const aspectRatio = baseWidth / baseHeight;

  let width = containerWidth;
  let height = width / aspectRatio;

  // If height exceeds container, scale based on height instead
  if (height > containerHeight) {
    height = containerHeight;
    width = height * aspectRatio;
  }

  // Ensure minimum dimensions
  const minWidth = 320;
  const minHeight = minWidth / aspectRatio;

  if (width < minWidth) {
    width = minWidth;
    height = minHeight;
  }

  const scale = width / baseWidth;

  return {
    width: Math.floor(width),
    height: Math.floor(height),
    scale,
  };
}

export { BREAKPOINTS, MIN_SWIPE_DISTANCE, MAX_SWIPE_TIME };
