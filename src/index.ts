import type { Brick, BrickTool, WorkSpace } from 'bricksmith';
import { PathProcessor } from './modules/PathProcessor';
import { PathType, ExtendedWorkspaceOptions } from './types';
import { PATH_CONSTANTS } from './constants/path';
import { NestedObjectPathHandler } from './modules/handlers/NestedObjectPathHandler';
import { WildcardArrayPathHandler } from './modules/handlers/WildcardArrayPathHandler';

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
  private pathProcessor: PathProcessor;

  constructor() {
    // Initialize the path processor
    this.pathProcessor = new PathProcessor();
    
    // Register handler for nested objects
    this.pathProcessor.registerHandler(
      PathType.NESTED_OBJECT, 
      new NestedObjectPathHandler()
    );
    
    // Register handler for wildcard arrays
    this.pathProcessor.registerHandler(
      PathType.WILDCARD_ARRAY,
      new WildcardArrayPathHandler()
    );
    
    // In the future, other handlers for different path types can be registered here
  }

  /**
   * Processes nested paths in the source object
   */
  beforeBrick(brick: Brick<Source, Target>, materials: Source, _workspace: WorkSpace<Source, Target>): Source | null {
    if (typeof brick.source === 'string' && (brick.source.includes(PATH_CONSTANTS.DOT_SEPARATOR) || brick.source.includes(PATH_CONSTANTS.WILDCARD_PATTERN))) {
      const value = this.pathProcessor.getNestedValue(materials as Record<string, any>, brick.source);
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
    if (typeof brick.target === 'string' && (brick.target.includes(PATH_CONSTANTS.DOT_SEPARATOR) || brick.target.includes(PATH_CONSTANTS.WILDCARD_PATTERN))) {
      // Get options from workspace
      const options = workspace.options as ExtendedWorkspaceOptions || {};
      
      // Create only the nested structure, not the dot-notation field
      const valueWasSet = this.pathProcessor.setNestedValue(
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
        this.pathProcessor.cleanupEmptyObjects(result as Record<string, any>, brick.target);
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
    const isEmpty = (obj: any): boolean => {
      return obj !== null && 
             typeof obj === 'object' && 
             !Array.isArray(obj) && 
             Object.keys(obj).length === 0;
    };
    
    for (const key in result) {
      if (isEmpty(result[key])) {
        delete result[key];
      }
    }
  }
}

// Reexport types and constants for convenience
export { PathType, PATH_CONSTANTS };

export default new NestedPathPlugin(); 