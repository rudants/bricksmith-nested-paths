/**
 * Path types that the system can work with
 */
export enum PathType {
  NESTED_OBJECT = 'NESTED_OBJECT',
  WILDCARD_ARRAY = 'WILDCARD_ARRAY',
}

/**
 * Interface for modules that process different path types
 */
export interface PathHandler {
  getNestedValue(obj: Record<string, any>, path: string): any;
  setNestedValue(
    obj: Record<string, any>, 
    path: string, 
    value: any, 
    options?: ValueOptions
  ): boolean;
  cleanupEmptyObjects(obj: Record<string, any>, path: string): void;
}

/**
 * Options for value processing
 */
export interface ValueOptions {
  skipNull?: boolean; 
  skipUndefined?: boolean; 
  strict?: boolean;
  preserveNull?: boolean;
}

/**
 * Extended options for workspace
 */
export interface ExtendedWorkspaceOptions {
  skipNull?: boolean;
  skipUndefined?: boolean;
  strict?: boolean;
  [key: string]: any;
} 