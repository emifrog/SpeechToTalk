import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Hook personnalisé pour optimiser les performances des composants React Native
 * Fournit des utilitaires pour la mémorisation et la gestion des re-rendus
 */
export const usePerformanceOptimization = () => {
  /**
   * Utilitaire pour comparer les objets de manière superficielle
   * Utile pour React.memo avec des props complexes
   */
  const shallowEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    
    if (!obj1 || !obj2) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
  }, []);

  return {
    shallowEqual,
  };
};

/**
 * Hook pour optimiser les styles React Native
 * Mémorise les objets de style pour éviter les recréations
 */
export const useOptimizedStyles = <T extends Record<string, any>>(
  styleFactory: () => T,
  deps: React.DependencyList = []
): T => {
  return useMemo(() => styleFactory(), [styleFactory, ...deps]);
};

/**
 * Hook pour créer un callback debounced
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  // Dans React Native, setTimeout retourne un nombre, pas un objet Timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

/**
 * Hook pour créer un callback throttled
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
};

/**
 * Hook pour gérer les listes avec pagination optimisée
 * Utile pour les grandes listes avec FlatList
 */
export const useOptimizedList = <T>(
  data: T[],
  pageSize: number = 20
) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedData = useMemo(() => {
    return data.slice(0, currentPage * pageSize);
  }, [data, currentPage, pageSize]);

  const loadMore = useCallback(() => {
    if (paginatedData.length < data.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedData.length, data.length]);

  const hasMore = useMemo(() => {
    return paginatedData.length < data.length;
  }, [paginatedData.length, data.length]);

  return {
    data: paginatedData,
    loadMore,
    hasMore,
    currentPage,
    resetPagination: useCallback(() => setCurrentPage(1), []),
  };
};
