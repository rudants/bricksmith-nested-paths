import { PathType, PathHandler, ValueOptions } from '../types';
import { PATH_CONSTANTS } from '../constants/path';
import { containsWildcard, containsDotSeparator } from '../utils';

/**
 * Class for determining path type and delegating processing to the appropriate handler
 */
export class PathProcessor {
  private handlers: Map<PathType, PathHandler> = new Map();

  /**
   * Register a handler for a specific path type
   * 
   * @param type - Path type
   * @param handler - Path handler
   */
  registerHandler(type: PathType, handler: PathHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Determines the path type based on its structure
   * 
   * @param path - Path string to analyze
   * @returns Path type
   */
  detectPathType(path: string): PathType {
    if (containsWildcard(path)) {
      return PathType.WILDCARD_ARRAY;
    }
    
    if (containsDotSeparator(path)) {
      return PathType.NESTED_OBJECT;
    }
    
    return PathType.NESTED_OBJECT; // Default type for simple paths
  }

  /**
   * Get a value by nested path
   * 
   * @param obj - Source object
   * @param path - Path string
   * @returns Value at the specified path or undefined
   */
  getNestedValue(obj: Record<string, any>, path: string): any {
    const handler = this.getHandlerForPath(path);
    return handler.getNestedValue(obj, path);
  }

  /**
   * Set a value by nested path
   * 
   * @param obj - Target object
   * @param path - Path string
   * @param value - Value to set
   * @param options - Options for value handling
   * @returns True if the value was set, otherwise false
   */
  setNestedValue(
    obj: Record<string, any>, 
    path: string, 
    value: any, 
    options: ValueOptions = {}
  ): boolean {
    const handler = this.getHandlerForPath(path);
    return handler.setNestedValue(obj, path, value, options);
  }

  /**
   * Clean up empty objects from the target object
   * 
   * @param obj - Target object
   * @param path - Path to start cleanup from
   */
  cleanupEmptyObjects(obj: Record<string, any>, path: string): void {
    const handler = this.getHandlerForPath(path);
    handler.cleanupEmptyObjects(obj, path);
  }

  /**
   * Get the appropriate handler for the given path
   * 
   * @param path - Path to analyze
   * @returns Appropriate handler
   * @throws Error if handler is not found
   */
  private getHandlerForPath(path: string): PathHandler {
    const pathType = this.detectPathType(path);
    const handler = this.handlers.get(pathType);
    
    if (!handler) {
      throw this.createNoHandlerError(pathType);
    }
    
    return handler;
  }

  /**
   * Creates an error for the case when a handler is not found
   */
  private createNoHandlerError(pathType: PathType): Error {
    return new Error(`No handler registered for path type: ${pathType}`);
  }
}

// Re-export for backwards compatibility
export { PathType, PATH_CONSTANTS }; 