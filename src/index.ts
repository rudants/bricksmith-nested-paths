import type { Brick, Blueprint } from 'bricksmith';

export interface WorkSpace<Source = any, Target = any> {
  blueprint: Blueprint<Source, Target>;
  options?: {
    skipNull?: boolean;
    skipUndefined?: boolean;
    strict?: boolean;
    [key: string]: any;
  };
}

export interface BrickTool<Source = any, Target = any> {
  name: string;
  beforeBuild?: (materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
  beforeBrick?: (brick: Brick<Source, Target>, materials: Source, workspace: WorkSpace<Source, Target>) => Source | null;
  afterBrick?: (brick: Brick<Source, Target>, value: unknown, result: Target, workspace: WorkSpace<Source, Target>) => void;
  afterBuild?: (result: Target, workspace: WorkSpace<Source, Target>) => void;
}

/**
 * Plugin for processing nested paths in source and target objects
 * 
 * This plugin allows using dot notation to access nested properties in both source and target objects.
 * It automatically handles path resolution and creation of object structures.
 * 
 * @example
 * ```typescript
 * import { Bricksmith } from 'bricksmith';
 * import nestedPathPlugin from '@bricksmith/nested-path';
 * 
 * const bricksmith = new Bricksmith(blueprint, {
 *   tools: [nestedPathPlugin]
 * });
 * ```
 */
export class NestedPathPlugin<Source = any, Target = any> implements BrickTool<Source, Target> {
  name = 'nested-path';

  /**
   * Gets a value from an object by nested path
   * 
   * @param obj - Source object
   * @param path - Dot notation path (e.g., 'user.address.city')
   * @returns Value at the specified path or undefined if the path doesn't exist
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc, part) => {
      if (acc === undefined || acc === null) {
        return acc;
      }
      return acc[part];
    }, obj);
  }

  /**
   * Checks if an object is empty (has no own properties)
   * 
   * @param obj - Object to check
   * @returns True if the object is empty, false otherwise
   */
  private isEmptyObject(obj: any): boolean {
    return obj !== null && 
           typeof obj === 'object' && 
           !Array.isArray(obj) && 
           Object.keys(obj).length === 0;
  }

  /**
   * Removes empty objects from a target object
   * Recursively checks and removes objects that have no properties
   * 
   * @param obj - Target object
   * @param path - Path to start cleanup from
   */
  private cleanupEmptyObjects(obj: Record<string, any>, path: string): void {
    const parts = path.split('.');
    
    // If we're looking at a path with only one part
    if (parts.length === 1) {
      if (this.isEmptyObject(obj[parts[0]])) {
        delete obj[parts[0]];
      }
      return;
    }
    
    // For multi-part paths, recursively check each part
    const current = parts[0];
    const rest = parts.slice(1).join('.');
    
    if (obj[current] && typeof obj[current] === 'object') {
      this.cleanupEmptyObjects(obj[current], rest);
      
      // After recursion, check if the current object is now empty
      if (this.isEmptyObject(obj[current])) {
        delete obj[current];
      }
    }
  }

  /**
   * Sets a value in an object by nested path
   * Creates intermediate objects if they don't exist
   * 
   * @param obj - Target object
   * @param path - Dot notation path (e.g., 'user.address.city')
   * @param value - Value to set
   * @param options - Options for value handling
   * @returns True if value was set, false if it was skipped
   */
  private setNestedValue(
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
    // Skip setting null values if skipNull is true and preserveNull is not true
    if (value === null && options.skipNull && !options.preserveNull) {
      return false;
    }
    
    // Skip setting undefined values if skipUndefined is true
    if (value === undefined && options.skipUndefined) {
      return false;
    }
    
    // In strict mode, skip both null and undefined unless preserveNull is true for null
    if (options.strict) {
      if (value === undefined || (value === null && !options.preserveNull)) {
        return false;
      }
    }

    const parts = path.split('.');
    const last = parts.pop()!;
    const target = parts.reduce((acc, part) => {
      if (acc[part] === undefined) {
        acc[part] = {};
      }
      return acc[part];
    }, obj);
    
    target[last] = value;
    return true;
  }

  /**
   * Processes nested paths in the source object
   */
  beforeBrick(brick: Brick<Source, Target>, materials: Source, _workspace: WorkSpace<Source, Target>): Source | null {
    if (typeof brick.source === 'string' && brick.source.includes('.')) {
      const value = this.getNestedValue(materials as Record<string, any>, brick.source);
      return { ...materials, [brick.source]: value } as Source;
    }
    return null;
  }

  /**
   * Processes nested paths in the target object
   * Only creates nested object structure, not the dot-notation field
   * Respects skipNull, skipUndefined, and strict options
   */
  afterBrick(brick: Brick<Source, Target>, value: unknown, result: Target, workspace: WorkSpace<Source, Target>): void {
    if (typeof brick.target === 'string' && brick.target.includes('.')) {
      // Get options from workspace
      const options = workspace.options || {};
      
      // Create only the nested structure, not the dot-notation field
      const valueWasSet = this.setNestedValue(
        result as Record<string, any>, 
        brick.target, 
        value, 
        {
          skipNull: options.skipNull,
          skipUndefined: options.skipUndefined,
          strict: options.strict,
          preserveNull: brick.preserveNull
        }
      );
      
      // If value was not set due to option constraints, clean up any empty objects
      if (!valueWasSet) {
        this.cleanupEmptyObjects(result as Record<string, any>, brick.target);
      }
      
      // Remove the dot-notation field if it was automatically added by Bricksmith
      if ((result as any)[brick.target] !== undefined) {
        delete (result as any)[brick.target];
      }
    }
  }

  /**
   * After building, clean up any empty objects in the result
   */
  afterBuild(result: Target, _workspace: WorkSpace<Source, Target>): void {
    // Recursively check and remove all empty objects in the result
    for (const key in result) {
      if (this.isEmptyObject(result[key])) {
        delete result[key];
      }
    }
  }
}

export default new NestedPathPlugin(); 