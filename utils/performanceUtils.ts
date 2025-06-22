import { StyleSheet } from 'react-native';

/**
 * Utilitaires pour optimiser les performances de l'application
 */

/**
 * Cache pour les styles calculés
 */
const styleCache = new Map<string, any>();

/**
 * Crée des styles optimisés avec mise en cache
 */
export const createOptimizedStyles = <T extends Record<string, any>>(
  key: string,
  styleFactory: () => T
): T => {
  if (styleCache.has(key)) {
    return styleCache.get(key);
  }
  
  const styles = StyleSheet.create(styleFactory());
  styleCache.set(key, styles);
  return styles;
};

/**
 * Vide le cache des styles (utile pour les changements de thème)
 */
export const clearStyleCache = (): void => {
  styleCache.clear();
};

/**
 * Debounce une fonction
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle une fonction
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Compare deux objets de manière superficielle
 */
export const shallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
};

/**
 * Optimise les props pour React.memo
 */
export const arePropsEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  return shallowEqual(prevProps, nextProps);
};

/**
 * Crée une fonction de comparaison personnalisée pour React.memo
 */
export const createMemoComparison = <T extends Record<string, any>>(
  keysToCompare?: (keyof T)[]
) => {
  return (prevProps: T, nextProps: T): boolean => {
    if (!keysToCompare) {
      return shallowEqual(prevProps, nextProps);
    }
    
    for (const key of keysToCompare) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  };
};
