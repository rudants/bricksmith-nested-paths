import { PATH_CONSTANTS } from '../constants/path';

/**
 * Checks if an object is empty
 */
export function isEmptyObject(obj: any): boolean {
  return obj !== null && 
         typeof obj === 'object' && 
         !Array.isArray(obj) && 
         Object.keys(obj).length === 0;
}

/**
 * Gets a value from an object by dot-separated path
 */
export function getValueByPath(obj: Record<string, any>, path: string): any {
  if (!obj || !path) {
    return undefined;
  }
  
  return path.split(PATH_CONSTANTS.DOT_SEPARATOR).reduce((acc, part) => {
    if (acc === undefined || acc === null) {
      return acc;
    }
    return acc[part];
  }, obj);
}

/**
 * Sets a value in an object by dot-separated path
 * Creates intermediate objects if they don't exist
 */
export function setValueByPath(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  if (!obj || !path) return obj;
  
  const parts = path.split(PATH_CONSTANTS.DOT_SEPARATOR);
  const last = parts.pop()!;
  const target = parts.reduce((acc, part) => {
    if (acc[part] === undefined) {
      acc[part] = {};
    }
    return acc[part];
  }, obj);
  
  target[last] = value;
  return obj;
}

/**
 * Checks if a path contains a wildcard
 */
export function containsWildcard(path: string): boolean {
  return path.includes(PATH_CONSTANTS.WILDCARD_PATTERN);
}

/**
 * Checks if a path contains a dot separator
 */
export function containsDotSeparator(path: string): boolean {
  return path.includes(PATH_CONSTANTS.DOT_SEPARATOR);
}

/**
 * Extracts the path portion before the wildcard
 */
export function extractPathBeforeWildcard(path: string): string {
  const wildcardIndex = path.indexOf(PATH_CONSTANTS.WILDCARD_PATTERN);
  if (wildcardIndex <= 0) {
    return '';
  }
  
  const dotIndex = path.lastIndexOf(PATH_CONSTANTS.DOT_SEPARATOR, wildcardIndex);
  if (dotIndex === -1) {
    return '';
  }
  
  return path.substring(0, dotIndex);
}

/**
 * Extracts the path portion after the wildcard
 */
export function extractPathAfterWildcard(path: string): string {
  const wildcardIndex = path.indexOf(PATH_CONSTANTS.WILDCARD_PATTERN);
  if (wildcardIndex === -1) {
    return '';
  }
  
  const wildcardLength = PATH_CONSTANTS.WILDCARD_PATTERN.length;
  const afterWildcardIndex = wildcardIndex + wildcardLength;
  
  if (afterWildcardIndex >= path.length) {
    return '';
  }
  
  let afterArray = path.substring(afterWildcardIndex);
  
  // Remove the initial dot if present
  if (afterArray.startsWith(PATH_CONSTANTS.DOT_SEPARATOR)) {
    afterArray = afterArray.substring(1);
  }
  
  return afterArray;
}

/**
 * Splits a path into parts for processing arrays with wildcards
 */
export function parsePath(path: string): { beforeArray: string; arrayPath: string; afterArray: string } {
  const wildcardIndex = path.indexOf(PATH_CONSTANTS.WILDCARD_PATTERN);
  const dotIndex = path.lastIndexOf(PATH_CONSTANTS.DOT_SEPARATOR, wildcardIndex);
  const arrayStartIndex = dotIndex === -1 ? 0 : dotIndex + 1;
  
  return {
    beforeArray: dotIndex === -1 ? '' : path.substring(0, dotIndex),
    arrayPath: path.substring(arrayStartIndex, wildcardIndex + PATH_CONSTANTS.WILDCARD_PATTERN.length - 3),
    afterArray: extractPathAfterWildcard(path)
  };
}

/**
 * Finds the index of wildcard in a path
 */
export function findWildcardIndex(path: string): number {
  return path.indexOf(PATH_CONSTANTS.WILDCARD_PATTERN);
}

/**
 * Checks if a path is a direct reference to a top-level array
 */
export function isTopLevelArrayPath(path: string): boolean {
  return containsWildcard(path) && 
         !path.includes(PATH_CONSTANTS.DOT_SEPARATOR);
}

/**
 * Splits a path by wildcard patterns
 */
export function splitPathByWildcards(path: string): string[] {
  const wildcardPattern = PATH_CONSTANTS.WILDCARD_PATTERN;
  const segments: string[] = [];
  let currentPos = 0;
  
  while (currentPos < path.length) {
    const wildcardIndex = path.indexOf(wildcardPattern, currentPos);
    
    if (wildcardIndex === -1) {
      segments.push(path.substring(currentPos));
      break;
    }
    
    segments.push(path.substring(currentPos, wildcardIndex));
    currentPos = wildcardIndex + wildcardPattern.length;
    
    if (currentPos < path.length && path[currentPos] === PATH_CONSTANTS.DOT_SEPARATOR) {
      currentPos++;
    }
  }
  
  return segments;
}

/**
 * Checks if a path contains nested wildcards
 */
export function hasNestedWildcards(path: string): boolean {
  const wildcardPattern = PATH_CONSTANTS.WILDCARD_PATTERN;
  const firstIndex = path.indexOf(wildcardPattern);
  
  if (firstIndex === -1) {
    return false;
  }
  
  const secondIndex = path.indexOf(wildcardPattern, firstIndex + wildcardPattern.length);
  return secondIndex !== -1;
}

/**
 * Counts the number of wildcards in a path
 */
export function countWildcards(path: string): number {
  const pattern = PATH_CONSTANTS.WILDCARD_PATTERN;
  let count = 0;
  let pos = 0;
  
  while ((pos = path.indexOf(pattern, pos)) !== -1) {
    count++;
    pos += pattern.length;
  }
  
  return count;
}

/**
 * Parses a path with multiple wildcards into components
 */
export function parsePathForNestedWildcards(path: string): {
  rootObject?: string;
  outerArray?: string;
  outerProperty?: string;
  innerArray?: string;
  innerProperty?: string;
} {
  const result: {
    rootObject?: string;
    outerArray?: string;
    outerProperty?: string;
    innerArray?: string;
    innerProperty?: string;
  } = {};
  
  if (!path) return result;
  
  const parts = path.split('.');
  
  if (parts.length > 0) {
    const firstPart = parts[0];
    if (!firstPart.includes('[')) {
      result.rootObject = firstPart;
      parts.shift();
    }
  }
  
  const outerArrayIndex = parts.findIndex(part => 
    part.includes(PATH_CONSTANTS.WILDCARD_PATTERN)
  );
  
  if (outerArrayIndex !== -1) {
    const outerArrayPart = parts[outerArrayIndex];
    result.outerArray = outerArrayPart.split('[')[0];
    
    if (outerArrayIndex + 1 < parts.length) {
      const nextPart = parts[outerArrayIndex + 1];
      if (!nextPart.includes(PATH_CONSTANTS.WILDCARD_PATTERN)) {
        result.outerProperty = nextPart;
      } else {
        result.innerArray = nextPart.split('[')[0];
        
        if (outerArrayIndex + 2 < parts.length) {
          result.innerProperty = parts[outerArrayIndex + 2];
        }
      }
    }
    
    const remainingParts = parts.slice(outerArrayIndex + 1);
    const innerArrayIndex = remainingParts.findIndex(part => 
      part.includes(PATH_CONSTANTS.WILDCARD_PATTERN)
    );
    
    if (innerArrayIndex !== -1 && !result.innerArray) {
      const innerArrayPart = remainingParts[innerArrayIndex];
      result.innerArray = innerArrayPart.split('[')[0];
      
      if (innerArrayIndex + 1 < remainingParts.length) {
        result.innerProperty = remainingParts[innerArrayIndex + 1];
      }
    }
  }
  
  return result;
} 