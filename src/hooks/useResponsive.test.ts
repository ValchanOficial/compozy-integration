import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useResponsive,
  useSwipeDetection,
  calculateCanvasDimensions,
  BREAKPOINTS,
  MIN_SWIPE_DISTANCE,
  MAX_SWIPE_TIME,
} from "./useResponsive";

describe("useResponsive", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
    });
  });

  describe("BREAKPOINTS constants", () => {
    it("exports breakpoint values", () => {
      expect(BREAKPOINTS).toEqual({
        xs: 320,
        sm: 600,
        md: 800,
        lg: 1200,
        xl: 1920,
        xxl: 2560,
      });
    });
  });

  describe("MIN_SWIPE_DISTANCE and MAX_SWIPE_TIME constants", () => {
    it("exports minimum swipe distance", () => {
      expect(MIN_SWIPE_DISTANCE).toBe(30);
    });

    it("exports maximum swipe time", () => {
      expect(MAX_SWIPE_TIME).toBe(300);
    });
  });

  describe("useResponsive hook", () => {
    const setWindowSize = (width: number, height: number) => {
      Object.defineProperty(window, "innerWidth", {
        value: width,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: height,
        writable: true,
        configurable: true,
      });
    };

    it("returns xs breakpoint for small screens (<320px)", () => {
      setWindowSize(300, 500);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("xs");
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it("returns sm breakpoint for screens 600-799px", () => {
      setWindowSize(650, 800);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("sm");
      expect(result.current.isMobile).toBe(true);
    });

    it("returns md breakpoint for screens 800-1199px", () => {
      setWindowSize(900, 700);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("md");
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it("returns lg breakpoint for screens 1200-1919px", () => {
      setWindowSize(1400, 900);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("lg");
      expect(result.current.isDesktop).toBe(true);
    });

    it("returns xl breakpoint for screens 1920-2559px", () => {
      setWindowSize(2000, 1200);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("xl");
      expect(result.current.isDesktop).toBe(true);
    });

    it("returns xxl breakpoint for screens 2560px+", () => {
      setWindowSize(2560, 1440);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("xxl");
      expect(result.current.isDesktop).toBe(true);
    });

    it("detects portrait orientation", () => {
      setWindowSize(500, 800);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);
    });

    it("detects landscape orientation", () => {
      setWindowSize(800, 500);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(false);
    });

    it("returns width and height", () => {
      setWindowSize(1024, 768);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });

    it("detects touch device capability", () => {
      // Mock touch support
      Object.defineProperty(window, "ontouchstart", {
        value: null,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useResponsive());
      expect(result.current.isTouchDevice).toBe(true);
    });

    it("updates on window resize", () => {
      setWindowSize(800, 600);
      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe("md");

      act(() => {
        setWindowSize(1200, 900);
        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.breakpoint).toBe("lg");
      expect(result.current.width).toBe(1200);
      expect(result.current.height).toBe(900);
    });

    it("cleans up resize listener on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() => useResponsive());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
    });
  });

  describe("useSwipeDetection hook", () => {
    let dateNowSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      dateNowSpy = vi.spyOn(Date, "now");
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    const createTouchEvent = (x: number, y: number) => ({
      touches: [{ clientX: x, clientY: y }],
      changedTouches: [{ clientX: x, clientY: y }],
      preventDefault: vi.fn(),
    });

    it("returns initial null swipe direction", () => {
      const { result } = renderHook(() => useSwipeDetection());

      expect(result.current.swipeDirection).toBeNull();
    });

    it("returns handlers object", () => {
      const { result } = renderHook(() => useSwipeDetection());

      expect(result.current.handlers).toHaveProperty("onTouchStart");
      expect(result.current.handlers).toHaveProperty("onTouchMove");
      expect(result.current.handlers).toHaveProperty("onTouchEnd");
    });

    it("returns resetSwipe function", () => {
      const { result } = renderHook(() => useSwipeDetection());

      expect(typeof result.current.resetSwipe).toBe("function");
    });

    it("detects right swipe", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("right");
      expect(onSwipe).toHaveBeenCalledWith("right");
    });

    it("detects left swipe", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("left");
      expect(onSwipe).toHaveBeenCalledWith("left");
    });

    it("detects up swipe", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 100) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("up");
      expect(onSwipe).toHaveBeenCalledWith("up");
    });

    it("detects down swipe", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(200, 100) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("down");
      expect(onSwipe).toHaveBeenCalledWith("down");
    });

    it("ignores swipes that are too slow", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(500); // 500ms > MAX_SWIPE_TIME
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBeNull();
      expect(onSwipe).not.toHaveBeenCalled();
    });

    it("ignores swipes that are too short", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(110, 205) as unknown as TouchEvent // < MIN_SWIPE_DISTANCE
        );
      });

      expect(result.current.swipeDirection).toBeNull();
      expect(onSwipe).not.toHaveBeenCalled();
    });

    it("resets swipe direction", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const { result } = renderHook(() => useSwipeDetection());

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("right");

      act(() => {
        result.current.resetSwipe();
      });

      expect(result.current.swipeDirection).toBeNull();
    });

    it("prevents default on touch move when touch has started", () => {
      const { result } = renderHook(() => useSwipeDetection());

      // First start a touch
      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      // Then move - should prevent default
      const moveEvent = createTouchEvent(150, 200);
      act(() => {
        result.current.handlers.onTouchMove(moveEvent as unknown as TouchEvent);
      });

      expect(moveEvent.preventDefault).toHaveBeenCalled();
    });

    it("does not call callback when touchEnd happens without touchStart", () => {
      const onSwipe = vi.fn();
      const { result } = renderHook(() => useSwipeDetection(onSwipe));

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(onSwipe).not.toHaveBeenCalled();
    });

    it("works without callback", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const { result } = renderHook(() => useSwipeDetection());

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("right");
    });

    it("prioritizes horizontal swipe when deltaX > deltaY", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const { result } = renderHook(() => useSwipeDetection());

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 100) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 120) as unknown as TouchEvent // deltaX=100, deltaY=20
        );
      });

      expect(result.current.swipeDirection).toBe("right");
    });

    it("prioritizes vertical swipe when deltaY > deltaX", () => {
      dateNowSpy.mockReturnValueOnce(0).mockReturnValueOnce(100);
      const { result } = renderHook(() => useSwipeDetection());

      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 100) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(120, 200) as unknown as TouchEvent // deltaX=20, deltaY=100
        );
      });

      expect(result.current.swipeDirection).toBe("down");
    });

    it("resets swipe direction on new touch start", () => {
      dateNowSpy.mockReturnValue(100);
      const { result } = renderHook(() => useSwipeDetection());

      // First swipe
      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(100, 200) as unknown as TouchEvent
        );
      });

      act(() => {
        result.current.handlers.onTouchEnd(
          createTouchEvent(200, 200) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBe("right");

      // New touch start should reset
      act(() => {
        result.current.handlers.onTouchStart(
          createTouchEvent(300, 300) as unknown as TouchEvent
        );
      });

      expect(result.current.swipeDirection).toBeNull();
    });
  });

  describe("calculateCanvasDimensions", () => {
    it("scales down to fit container width", () => {
      const result = calculateCanvasDimensions(600, 800, 800, 600);

      // Aspect ratio 800/600 = 1.333...
      // Width 600, height = 600/1.333 = 450
      expect(result.width).toBe(600);
      expect(result.height).toBe(450);
      expect(result.scale).toBeCloseTo(0.75, 2);
    });

    it("scales down to fit container height when width would exceed", () => {
      const result = calculateCanvasDimensions(1000, 400, 800, 600);

      // Height constrained, width = 400 * (800/600) = 533.33
      expect(result.height).toBe(400);
      expect(result.width).toBe(533);
      expect(result.scale).toBeCloseTo(0.666, 2);
    });

    it("maintains minimum dimensions", () => {
      const result = calculateCanvasDimensions(200, 200, 800, 600);

      // Minimum width is 320
      expect(result.width).toBe(320);
      expect(result.height).toBe(240);
    });

    it("uses default base dimensions when not provided", () => {
      const result = calculateCanvasDimensions(800, 600);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.scale).toBe(1);
    });

    it("floors dimensions to integers", () => {
      const result = calculateCanvasDimensions(1000, 1000, 800, 600);

      // Width 1000, height = 1000/1.333 = 750
      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });

    it("handles extreme aspect ratios", () => {
      // Very wide container
      const wideResult = calculateCanvasDimensions(2000, 300, 800, 600);
      expect(wideResult.height).toBe(300);
      expect(wideResult.width).toBe(400);

      // Very tall container
      const tallResult = calculateCanvasDimensions(300, 2000, 800, 600);
      // Minimum width 320 kicks in
      expect(tallResult.width).toBe(320);
      expect(tallResult.height).toBe(240);
    });

    it("returns correct scale for large containers", () => {
      const result = calculateCanvasDimensions(1600, 1200, 800, 600);

      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
      expect(result.scale).toBe(2);
    });

    it("handles 4K resolution", () => {
      const result = calculateCanvasDimensions(3840, 2160, 800, 600);

      // Aspect ratio constraint: height limited
      // 2160 * (800/600) = 2880
      expect(result.width).toBe(2880);
      expect(result.height).toBe(2160);
    });

    it("handles small mobile screens", () => {
      const result = calculateCanvasDimensions(320, 568, 800, 600);

      // Width constrained to 320 (minimum)
      expect(result.width).toBe(320);
      expect(result.height).toBe(240);
    });
  });
});
