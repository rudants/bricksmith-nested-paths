import { PathHandler } from '../../types';
import { PATH_CONSTANTS } from '../../constants/path';
import { 
  isEmptyObject, 
  getValueByPath, 
  setValueByPath,
  extractPathAfterWildcard,
  parsePath,
  findWildcardIndex,
  isTopLevelArrayPath,
  splitPathByWildcards,
  hasNestedWildcards,
  countWildcards,
  parsePathForNestedWildcards
} from '../../utils';

/**
 * Handler for wildcard array paths
 * For example, 'object.parameter.tags[*].name'
 */
export class WildcardArrayPathHandler implements PathHandler {
  /**
   * Maps array elements to their values at the specified path
   */
  private mapArrayElementsToValues(array: any[], path: string): any[] {
    if (!Array.isArray(array)) return [];
    
    return array.map(item => {
      if (item === null || typeof item !== 'object') return undefined;
      
      const cleanPath = path.startsWith(PATH_CONSTANTS.DOT_SEPARATOR) ? 
        path.substring(1) : path;
      return getValueByPath(item, cleanPath);
    });
  }

  /**
   * Extracts a value from a top-level array
   */
  private getValueFromTopLevelArray(obj: Record<string, any>, path: string): any {
    const wildcardIndex = findWildcardIndex(path);
    const arrayName = path.substring(0, wildcardIndex);
    const afterArray = extractPathAfterWildcard(path);
    
    if (!Array.isArray(obj[arrayName])) return undefined;
    
    if (!afterArray) return obj[arrayName];
    
    return this.mapArrayElementsToValues(obj[arrayName], afterArray);
  }

  /**
   * Extracts a value from a nested path
   */
  private getValueFromNestedPath(obj: Record<string, any>, path: string): any {
    const { beforeArray, arrayPath, afterArray } = parsePath(path);
    
    let parentObj = obj;
    if (beforeArray) {
      parentObj = getValueByPath(obj, beforeArray);
      if (!parentObj) return undefined;
    }
    
    const array = parentObj[arrayPath];
    
    if (!array || !Array.isArray(array)) return undefined;
    
    if (!afterArray) return array;
    
    return this.mapArrayElementsToValues(array, afterArray);
  }
  
  /**
   * Extracts values from nested paths with wildcards
   */
  private getNestedWildcardValues(obj: Record<string, any>, path: string): any[] {
    if (!obj || typeof obj !== 'object') return [];
    
    const segments = splitPathByWildcards(path);
    let currentValues: any[] = [obj];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const newValues: any[] = [];
      
      // Process first segment
      if (i === 0) {
        if (segment) {
          const nextObj = getValueByPath(obj, segment);
          if (nextObj === undefined || nextObj === null) return [];
          currentValues = [nextObj];
        }
        continue;
      }
      
      // Process remaining segments
      for (const currentValue of currentValues) {
        if (!currentValue || !Array.isArray(currentValue)) continue;
        
        for (const item of currentValue) {
          if (item === null || typeof item !== 'object') continue;
          
          const isLastSegment = i === segments.length - 1;
          let nextValue;
          
          if (segment) {
            try {
              nextValue = getValueByPath(item, segment);
            } catch (error) {
              continue;
            }
          } else {
            nextValue = item;
          }
          
          if (nextValue === undefined) continue;
          
          if (isLastSegment) {
            if (Array.isArray(nextValue)) {
              newValues.push(...nextValue);
            } else {
              newValues.push(nextValue);
            }
          } else {
            newValues.push(nextValue);
          }
        }
      }
      
      currentValues = newValues;
      if (currentValues.length === 0) break;
    }
    
    return currentValues;
  }

  /**
   * Gets a value from an object by wildcard path
   * 
   * @param obj - Source object
   * @param path - Wildcard path (e.g., 'object.parameter.tags[*].name')
   * @returns Value at the specified path or array of values if wildcard is used
   */
  getNestedValue(obj: Record<string, any>, path: string): any {
    if (!obj || !path || typeof obj !== 'object') return undefined;
    
    if (hasNestedWildcards(path)) {
      return this.getNestedWildcardValues(obj, path);
    }
    
    if (isTopLevelArrayPath(path)) {
      return this.getValueFromTopLevelArray(obj, path);
    }
    
    return this.getValueFromNestedPath(obj, path);
  }

  /**
   * Checks if a value should be skipped based on options
   */
  private shouldSkipValue(
    value: any, 
    options: { 
      skipNull?: boolean; 
      skipUndefined?: boolean; 
      strict?: boolean;
      preserveNull?: boolean; 
    }
  ): boolean {
    if (value === null && options.skipNull && !options.preserveNull) return true;
    if (value === undefined && options.skipUndefined) return true;
    if (options.strict && (value === undefined || (value === null && !options.preserveNull))) return true;
    return false;
  }

  /**
   * Ensures the parent object exists for the given path
   */
  private ensureParentObject(obj: Record<string, any>, path: string | null): Record<string, any> {
    if (!path) return obj;
    
    const parts = path.split(PATH_CONSTANTS.DOT_SEPARATOR);
    return parts.reduce((acc, part) => {
      if (acc[part] === undefined) acc[part] = {};
      return acc[part];
    }, obj);
  }

  /**
   * Ensures an array exists in the object
   */
  private ensureArray(obj: Record<string, any>, arrayPath: string): any[] {
    if (!obj[arrayPath] || !Array.isArray(obj[arrayPath])) {
      obj[arrayPath] = [];
    }
    return obj[arrayPath];
  }

  /**
   * Sets array values to a target array
   */
  private setArrayValueToArray(targetArray: any[], afterArray: string | null, values: any[]): boolean {
    // Expand the array to the required size
    while (targetArray.length < values.length) {
      targetArray.push({});
    }
    
    // Set values
    for (let i = 0; i < values.length; i++) {
      if (targetArray[i] === undefined) {
        targetArray[i] = {};
      }
      
      if (afterArray) {
        setValueByPath(targetArray[i], afterArray, values[i]);
      } else {
        targetArray[i] = values[i];
      }
    }
    
    return true;
  }

  /**
   * Sets a single value to all array elements
   */
  private setSingleValueToArray(targetArray: any[], afterArray: string | null, value: any): boolean {
    if (targetArray.length === 0) {
      targetArray.push({});
    }
    
    for (let i = 0; i < targetArray.length; i++) {
      if (targetArray[i] === undefined || targetArray[i] === null) {
        targetArray[i] = {};
      }
      
      if (afterArray) {
        const itemTarget = targetArray[i];
        if (typeof itemTarget === 'object' && itemTarget !== null) {
          setValueByPath(itemTarget, afterArray, value);
        }
      } else {
        targetArray[i] = value;
      }
    }
    
    return true;
  }

  /**
   * Sets a value using a path with a wildcard pattern
   */
  private setValueWithWildcard(obj: Record<string, any>, path: string, value: any): boolean {
    const { beforeArray, arrayPath, afterArray } = parsePath(path);
    
    const parentObj = this.ensureParentObject(obj, beforeArray);
    const targetArray = this.ensureArray(parentObj, arrayPath);
    
    if (Array.isArray(value)) {
      return this.setArrayValueToArray(targetArray, afterArray, value);
    } else {
      return this.setSingleValueToArray(targetArray, afterArray, value);
    }
  }
  
  /**
   * Checks if a path is a nested wildcard target path
   */
  private isTargetNestedWildcardPath(path: string, value: any): boolean {
    return countWildcards(path) > 1 && Array.isArray(value);
  }

  /**
   * Sets a value for a path with nested wildcards
   */
  private setValueWithNestedWildcards(obj: Record<string, any>, path: string, value: any): boolean {
    const segments = splitPathByWildcards(path);
    
    if (segments.length === 0) return false;
    
    // Prepare the initial object
    let currentObj = obj;
    if (segments[0]) {
      currentObj = this.ensureParentObject(obj, segments[0]);
    }
    
    this.setupNestedWildcardPath(currentObj, segments, 0, value);
    
    return true;
  }
  
  /**
   * Recursively sets up nested paths with wildcards
   */
  private setupNestedWildcardPath(
    obj: Record<string, any>, 
    segments: string[], 
    currentIndex: number, 
    value: any
  ): boolean {
    if (currentIndex >= segments.length - 1) return false;
    
    const currentSegment = segments[currentIndex];
    const nextSegment = segments[currentIndex + 1];
    
    // Get the current object
    let currentObj = obj;
    if (currentSegment) {
      let pathObj = getValueByPath(obj, currentSegment);
      if (!pathObj) {
        pathObj = this.ensureParentObject(obj, currentSegment);
      }
      currentObj = pathObj;
    }
    
    // Prepare the array
    const arrayNameParts = nextSegment.split(PATH_CONSTANTS.DOT_SEPARATOR);
    const arrayName = arrayNameParts[0];
    
    if (!currentObj[arrayName] || !Array.isArray(currentObj[arrayName])) {
      currentObj[arrayName] = [];
    }
    
    const targetArray = currentObj[arrayName];
    
    // Last segment - set values
    if (currentIndex === segments.length - 2) {
      const propertyPath = nextSegment.includes(PATH_CONSTANTS.DOT_SEPARATOR) ? 
        nextSegment.substring(arrayName.length + 1) : '';
      
      if (Array.isArray(value)) {
        return this.setArrayValueToArray(targetArray, propertyPath, value);
      } else {
        return this.setSingleValueToArray(targetArray, propertyPath, value);
      }
    } 
    // Intermediate segment - recursive continuation
    else {
      const restPath = arrayNameParts.slice(1).join(PATH_CONSTANTS.DOT_SEPARATOR);
      
      if (targetArray.length === 0) {
        targetArray.push({});
      }
      
      let dataIndex = 0;
      
      // Process existing array elements
      for (let i = 0; i < targetArray.length; i++) {
        let itemObj = targetArray[i];
        
        if (itemObj === undefined || itemObj === null) {
          itemObj = {};
          targetArray[i] = itemObj;
        }
        
        // Prepare nested path if needed
        if (restPath) {
          this.ensureParentObject(itemObj, restPath);
        }
        
        // Select value for current level
        let currentLevelValue = value;
        if (Array.isArray(value) && dataIndex < value.length) {
          currentLevelValue = value[dataIndex++];
        }
        
        this.setupNestedWildcardPath(targetArray[i], segments, currentIndex + 1, currentLevelValue);
      }
      
      // Add new elements if needed
      if (Array.isArray(value) && dataIndex < value.length) {
        for (let j = dataIndex; j < value.length; j++) {
          const newItemObj = {};
          targetArray.push(newItemObj);
          
          if (restPath) {
            this.ensureParentObject(newItemObj, restPath);
          }
          
          this.setupNestedWildcardPath(newItemObj, segments, currentIndex + 1, value[j]);
        }
      }
      
      return true;
    }
  }

  /**
   * Sets a value for a path with multiple wildcards in the target
   */
  private setNestedWildcardTargetValue(obj: Record<string, any>, path: string, value: any): boolean {
    // Convert value to an array if it's not already
    if (!Array.isArray(value)) {
      value = [value];
    }
    
    // Parse the path into components
    const pathParts = parsePathForNestedWildcards(path);
    
    // Prepare the root object
    let current = obj;
    if (pathParts.rootObject) {
      if (!current[pathParts.rootObject]) {
        current[pathParts.rootObject] = {};
      }
      current = current[pathParts.rootObject];
    }
    
    // Check existence of outer array
    const outerArrayName = pathParts.outerArray;
    if (!outerArrayName) return false;
    
    // Prepare the outer array
    if (!current[outerArrayName]) {
      current[outerArrayName] = [];
    }
    
    // Determine dimensions for value distribution
    const outerSize = value.length > 0 ? 
      Math.ceil(Math.sqrt(value.length)) : 2;
    const innerSize = value.length > 0 ? 
      Math.ceil(value.length / outerSize) : 2;
    
    const outerArray = current[outerArrayName];
    
    // Expand the outer array to the required size
    while (outerArray.length < outerSize) {
      outerArray.push({});
    }
    
    // Extract names for inner array and properties
    const innerArrayName = pathParts.innerArray || '';
    const outerProperty = pathParts.outerProperty || '';
    const innerProperty = pathParts.innerProperty || '';
    
    // Process the outer array
    for (let i = 0; i < outerSize; i++) {
      // Check and prepare the object in the outer array
      if (!outerArray[i] || typeof outerArray[i] !== 'object') {
        outerArray[i] = {};
      }
      
      // Set the outer array property if specified
      if (outerProperty && i < value.length) {
        outerArray[i][outerProperty] = value[i];
        continue;
      }
      
      // Process the inner array if specified
      if (innerArrayName) {
        // Prepare the inner array
        if (!outerArray[i][innerArrayName] || !Array.isArray(outerArray[i][innerArrayName])) {
          outerArray[i][innerArrayName] = [];
        }
        
        const innerArray = outerArray[i][innerArrayName];
        
        // Expand the inner array to the required size
        while (innerArray.length < innerSize) {
          innerArray.push({});
        }
        
        // Process inner array elements
        for (let j = 0; j < innerSize; j++) {
          const flatIndex = i * innerSize + j;
          
          // Check and prepare the object
          if (!innerArray[j] || typeof innerArray[j] !== 'object') {
            innerArray[j] = {};
          }
          
          // Set the inner array property if specified and index is within the value array bounds
          if (innerProperty && flatIndex < value.length) {
            innerArray[j][innerProperty] = value[flatIndex];
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Sets a value in an object by wildcard path
   * Creates intermediate objects and arrays if they don't exist
   * Supports wildcard in both source and target paths
   * 
   * @param obj - Target object
   * @param path - Wildcard path (e.g., 'object.parameter.tags[*].name')
   * @param value - Value to set (can be a single value or an array of values)
   * @param options - Options for value handling
   * @returns True if value was set, false if it was skipped
   */
  setNestedValue(
    obj: Record<string, any>, 
    path: string, 
    value: any, 
    options: { 
      skipNull?: boolean; 
      skipUndefined?: boolean; 
      strict?: boolean;
      preserveNull?: boolean; 
    } = {}
  ): boolean {
    // Check if value should be skipped
    if (this.shouldSkipValue(value, options)) return false;
    
    // If path contains wildcard
    if (path.includes(PATH_CONSTANTS.WILDCARD_PATTERN)) {
      if (hasNestedWildcards(path)) {
        if (this.isTargetNestedWildcardPath(path, value)) {
          return this.setNestedWildcardTargetValue(obj, path, value);
        }
        return this.setValueWithNestedWildcards(obj, path, value);
      }
      
      return this.setValueWithWildcard(obj, path, value);
    }
    
    return false;
  }

  /**
   * Clean up empty objects from the path structure
   */
  cleanupEmptyObjects(obj: Record<string, any>, path: string): void {
    if (!obj || !path) {
      return;
    }

    // Find the parent object for cleanup
    const parent = this.findParentObjectForCleanup(obj, path);
    
    if (!parent) {
      return;
    }
    
    // Check for wildcard in path and clean up array items if needed
    if (path.includes(PATH_CONSTANTS.WILDCARD_PATTERN)) {
      const { beforeArray, arrayPath } = parsePath(path);
      
      // If there's a parent object for the array
      if (beforeArray) {
        const parentObj = getValueByPath(obj, beforeArray);
        if (parentObj && typeof parentObj === 'object') {
          this.cleanupArrayItems(parentObj, arrayPath);
        }
      } else {
        // Array is at the top level
        this.cleanupArrayItems(obj, arrayPath);
      }
    }
  }

  /**
   * Finds the parent object for cleanup operations
   */
  private findParentObjectForCleanup(obj: Record<string, any>, path: string | null): Record<string, any> | null {
    if (!obj || !path) {
      return null;
    }
    
    const wildcardIndex = path.indexOf(PATH_CONSTANTS.WILDCARD_PATTERN);
    
    if (wildcardIndex > 0) {
      // Find the last dot before the wildcard
      const lastDot = path.lastIndexOf(PATH_CONSTANTS.DOT_SEPARATOR, wildcardIndex);
      
      if (lastDot > 0) {
        const parentPath = path.substring(0, lastDot);
        const parent = getValueByPath(obj, parentPath);
        
        if (parent && typeof parent === 'object') {
          return parent;
        }
      }
    }
    
    return obj;
  }

  /**
   * Cleans up empty objects in array items
   */
  private cleanupArrayItems(parentObj: Record<string, any>, arrayPath: string): void {
    const array = parentObj[arrayPath];
    
    if (!array || !Array.isArray(array)) {
      return;
    }
    
    // Remove empty objects from the array
    for (let i = 0; i < array.length; i++) {
      if (isEmptyObject(array[i])) {
        array.splice(i, 1);
        i--; // Adjust index after removing an item
      }
    }
    
    // If the array is empty after cleanup, remove it
    if (array.length === 0) {
      delete parentObj[arrayPath];
    }
  }
} 