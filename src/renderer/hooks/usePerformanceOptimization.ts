/**
 * Performance Optimization Hooks
 * Custom hooks for improving React component performance
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { errorLogger as logger } from '../../shared/security/error-handling';

/**
 * Debounced value hook for reducing unnecessary updates
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook for limiting function execution frequency
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memoized expensive computation hook
 */
export function useExpensiveComputation<T>(
  computeFn: () => T,
  dependencies: React.DependencyList,
  cacheKey?: string
): T {
  return useMemo(() => {
    const startTime = performance.now();
    
    try {
      const result = computeFn();
      const endTime = performance.now();
      
      logger.debug('Expensive computation completed', 'useExpensiveComputation', {
        cacheKey,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
      });
      
      return result;
    } catch (error) {
      logger.error('Expensive computation failed', 'useExpensiveComputation', error, {
        cacheKey,
      });
      throw error;
    }
  }, dependencies);
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange,
  };
}

/**
 * Memory-efficient cache hook
 */
export function useMemoryCache<K, V>(maxSize: number = 100) {
  const cache = useRef(new Map<K, V>());
  const accessOrder = useRef<K[]>([]);

  const get = useCallback((key: K): V | undefined => {
    const value = cache.current.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
      accessOrder.current.push(key);
    }
    return value;
  }, []);

  const set = useCallback((key: K, value: V): void => {
    // Remove if already exists
    if (cache.current.has(key)) {
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
    }

    // Add new entry
    cache.current.set(key, value);
    accessOrder.current.push(key);

    // Evict least recently used if over capacity
    while (cache.current.size > maxSize) {
      const lruKey = accessOrder.current.shift();
      if (lruKey !== undefined) {
        cache.current.delete(lruKey);
      }
    }
  }, [maxSize]);

  const clear = useCallback(() => {
    cache.current.clear();
    accessOrder.current = [];
  }, []);

  const has = useCallback((key: K): boolean => {
    return cache.current.has(key);
  }, []);

  return { get, set, clear, has, size: cache.current.size };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceMount = now - mountTime.current;
    const timeSinceLastRender = now - lastRenderTime.current;

    logger.debug('Component render', 'usePerformanceMonitor', {
      componentName,
      renderCount: renderCount.current,
      timeSinceMount,
      timeSinceLastRender,
    });

    lastRenderTime.current = now;
  });

  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTime.current;
      logger.debug('Component unmounted', 'usePerformanceMonitor', {
        componentName,
        totalRenderCount: renderCount.current,
        totalLifetime: totalTime,
        averageRenderInterval: totalTime / renderCount.current,
      });
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current,
  };
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [ref, isIntersecting];
}

/**
 * Batch state updates hook
 */
export function useBatchedUpdates<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((update: Partial<T>) => {
    pendingUpdates.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        const newState = { ...prevState };
        pendingUpdates.current.forEach(update => {
          Object.assign(newState, update);
        });
        pendingUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState(prevState => {
      const newState = { ...prevState };
      pendingUpdates.current.forEach(update => {
        Object.assign(newState, update);
      });
      pendingUpdates.current = [];
      return newState;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate, flushUpdates] as const;
}

/**
 * Resource cleanup hook
 */
export function useResourceCleanup() {
  const resources = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    resources.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    resources.current.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        logger.error('Resource cleanup failed', 'useResourceCleanup', error);
      }
    });
    resources.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
}

/**
 * Optimized event handler hook
 */
export function useOptimizedEventHandler<T extends (...args: any[]) => any>(
  handler: T,
  dependencies: React.DependencyList
): T {
  return useCallback(handler, dependencies);
}

/**
 * Component size tracking hook
 */
export function useComponentSize(): [React.RefCallback<HTMLElement>, { width: number; height: number }] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [element, setElement] = useState<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  return [ref, size];
}

