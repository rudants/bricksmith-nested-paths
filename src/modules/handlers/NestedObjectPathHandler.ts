import { PathHandler, ValueOptions } from '../../types';
import { PATH_CONSTANTS } from '../../constants/path';
import { isEmptyObject, getValueByPath } from '../../utils';

/**
 * Handler for nested objects with access via dot notation
 * For example: 'user.address.city'
 */
export class NestedObjectPathHandler implements PathHandler {
  /**
   * Get a value from a nested object using dot notation
   */
  getNestedValue(obj: Record<string, any>, path: string): any {
    return getValueByPath(obj, path);
  }

  /**
   * Set a value in a nested object using dot notation
   * Creates the path if it doesn't exist
   */
  setNestedValue(
    obj: Record<string, any>, 
    path: string, 
    value: any, 
    options: ValueOptions = {}
  ): boolean {
    if (!obj || !path) {
      return false;
    }

    // Skip setting if value is null/undefined and options specify to skip
    if ((value === null && options.skipNull) && !options.preserveNull) {
      return false;
    }

    if (value === undefined && options.skipUndefined) {
      return false;
    }

    if (options.strict) {
      if (value === undefined || (value === null && !options.preserveNull)) {
        return false;
      }
    }

    const parts = path.split(PATH_CONSTANTS.DOT_SEPARATOR);
    const lastPart = parts.pop();

    if (!lastPart) {
      return false;
    }

    let current = obj;

    // Create the path if it doesn't exist
    for (const part of parts) {
      if (current[part] === undefined) {
        // In strict mode, don't create new properties
        if (options.strict) {
          return false;
        }
        current[part] = {};
      } else if (current[part] === null || typeof current[part] !== 'object') {
        // Cannot create a path through a non-object
        return false;
      }
      current = current[part];
    }

    current[lastPart] = value;
    return true;
  }

  /**
   * Clean up the path in the object by removing empty objects
   */
  cleanupEmptyObjects(obj: Record<string, any>, path: string): void {
    if (!obj || !path) {
      return;
    }

    const parts = path.split(PATH_CONSTANTS.DOT_SEPARATOR);
    
    // Handle simple path (one level)
    if (parts.length === 1) {
      const key = parts[0];
      if (isEmptyObject(obj[key])) {
        delete obj[key];
      }
      return;
    }
    
    // Handle multi-level path
    const currentPart = parts[0];
    const restPath = parts.slice(1).join(PATH_CONSTANTS.DOT_SEPARATOR);
    
    if (obj[currentPart] && typeof obj[currentPart] === 'object') {
      this.cleanupEmptyObjects(obj[currentPart], restPath);
      
      // After recursion, check if the current object becomes empty
      if (isEmptyObject(obj[currentPart])) {
        delete obj[currentPart];
      }
    }
  }
} 