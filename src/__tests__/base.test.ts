import { Bricksmith, Blueprint, BrickPath } from 'bricksmith';
import nestedPathPlugin from '../index';

interface Source {
  user: {
    name: string;
    age: number;
    address: {
      city: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
  };
  settings: {
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  meta?: {
    tags?: string[];
    nullValue: null;
    undefinedValue: undefined;
  };
}

interface Target {
  fullName: string;
  age: number;
  city: string;
  latitude: number;
  longitude: number;
  location: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  preferences: {
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  metaTags?: string[];
  nullField?: null;
  undefinedField?: undefined;
}

describe('NestedPathPlugin', () => {
  it('should handle nested paths in source and target', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'user.age' as BrickPath, target: 'age' },
        { source: 'user.address.city' as BrickPath, target: 'city' },
        { source: 'user.address.coordinates.lat' as BrickPath, target: 'latitude' },
        { source: 'user.address.coordinates.lng' as BrickPath, target: 'longitude' },
        { source: 'user.address.city' as BrickPath, target: 'location.city' },
        { source: 'user.address.coordinates.lat' as BrickPath, target: 'location.coordinates.latitude' },
        { source: 'user.address.coordinates.lng' as BrickPath, target: 'location.coordinates.longitude' },
        { source: 'settings.theme' as BrickPath, target: 'preferences.theme' },
        { source: 'settings.notifications.email' as BrickPath, target: 'preferences.notifications.email' },
        { source: 'settings.notifications.push' as BrickPath, target: 'preferences.notifications.push' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      age: 30,
      city: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      location: {
        city: 'New York',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      },
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    });
  });

  it('should work with transform functions', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { 
          source: 'user.name' as BrickPath,
          target: 'fullName',
          transform: (value: unknown, _source: Source) => (value as string).toUpperCase()
        },
        {
          source: 'user.age' as BrickPath,
          target: 'age',
          transform: (value: unknown, _source: Source) => Number((value as number).toFixed(2))
        },
        {
          source: 'user.address.coordinates.lat' as BrickPath,
          target: 'latitude',
          transform: (value: unknown, _source: Source) => Number((value as number).toFixed(2))
        },
        {
          source: 'user.address.coordinates.lng' as BrickPath,
          target: 'longitude',
          transform: (value: unknown, _source: Source) => Number((value as number).toFixed(2))
        },
        {
          source: 'user.address.coordinates.lat' as BrickPath,
          target: 'location.coordinates.latitude',
          transform: (value: unknown, _source: Source) => Number((value as number).toFixed(2))
        },
        {
          source: 'user.address.coordinates.lng' as BrickPath,
          target: 'location.coordinates.longitude',
          transform: (value: unknown, _source: Source) => Number((value as number).toFixed(2))
        }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'JOHN DOE',
      age: 30,
      latitude: 40.71,
      longitude: -74.01,
      location: {
        coordinates: {
          latitude: 40.71,
          longitude: -74.01
        }
      }
    });
  });

  it('should handle non-existent nested paths', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'test.field' as BrickPath, target: 'test.field' }
      ]
    };

    // Default behavior includes undefined values
    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      test: { field: undefined }
    });

    // With skipUndefined option, the empty object should not be included
    const bricksmithSkipUndefined = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      skipUndefined: true
    });

    const resultSkipUndefined = bricksmithSkipUndefined.build(source);

    // Result should be empty as `test.field` is undefined and skipped
    expect(resultSkipUndefined).toEqual({});
    expect(resultSkipUndefined).not.toHaveProperty('test');
  });

  it('should handle optional properties', () => {
    const sourceWithoutOptional: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    };

    const optionalBlueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'user.age' as BrickPath, target: 'age' },
        { source: 'user.address.city' as BrickPath, target: 'city' },
        { source: 'user.address.coordinates.lat' as BrickPath, target: 'latitude' },
        { source: 'user.address.coordinates.lng' as BrickPath, target: 'longitude' },
        { source: 'user.address.city' as BrickPath, target: 'location.city' },
        { source: 'user.address.coordinates.lat' as BrickPath, target: 'location.coordinates.latitude' },
        { source: 'user.address.coordinates.lng' as BrickPath, target: 'location.coordinates.longitude' },
        { source: 'settings.theme' as BrickPath, target: 'preferences.theme' },
        { source: 'settings.notifications.email' as BrickPath, target: 'preferences.notifications.email' },
        { source: 'settings.notifications.push' as BrickPath, target: 'preferences.notifications.push' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(optionalBlueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(sourceWithoutOptional);

    expect(result).toEqual({
      fullName: 'John Doe',
      age: 30,
      city: 'New York',
      latitude: 40.7128,
      longitude: -74.0060,
      location: {
        city: 'New York',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      },
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    });
  });

  it('should process nested paths correctly', () => {
    const source = {
      user: {
        name: 'John',
        age: 30
      }
    };

    const blueprint: Blueprint<typeof source, { fullName: string; userAge: number }> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'user.age' as BrickPath, target: 'userAge' }
      ]
    };

    const bricksmith = new Bricksmith<typeof source, { fullName: string; userAge: number }>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John',
      userAge: 30
    });
  });

  it('should handle null values correctly', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should handle skipNull option correctly', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      skipNull: true
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      undefinedField: undefined
    });
  });

  it('should handle skipUndefined option correctly', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      skipUndefined: true
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      nullField: null
    });
  });

  it('should handle strict option correctly', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      strict: true
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should combine skipNull, skipUndefined and preserveNull options correctly', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags', preserveNull: true },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField', preserveNull: true }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      skipNull: true,
      skipUndefined: true
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      undefinedField: undefined
    });
  });

  it('should handle null fields', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should handle undefined fields', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should handle strict mode (all properties required)', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should handle null and undefined fields together', () => {
    const source: Source = {
      user: {
        name: 'John Doe',
        age: 30,
        address: {
          city: 'New York',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        }
      },
      settings: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      },
      meta: {
        tags: null as any,
        nullValue: null,
        undefinedValue: undefined
      }
    };

    const blueprint: Blueprint<Source, Target> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'fullName' },
        { source: 'meta.tags' as BrickPath, target: 'metaTags' },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField' },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'John Doe',
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should not create dot notation fields in the result object', () => {
    const source = {
      user: {
        name: 'John',
        profile: {
          bio: 'Developer',
          skills: ['TypeScript', 'JavaScript']
        }
      }
    };

    const blueprint: Blueprint<typeof source, any> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'userName' },
        { source: 'user.profile.bio' as BrickPath, target: 'user.bio' },
        { source: 'user.profile.skills' as BrickPath, target: 'user.abilities' }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      userName: 'John',
      user: {
        bio: 'Developer',
        abilities: ['TypeScript', 'JavaScript']
      }
    });

    expect(Object.keys(result)).not.toContain('user.bio');
    expect(Object.keys(result)).not.toContain('user.abilities');
    
    expect(typeof result.user).toBe('object');
    expect(result.user.bio).toBe('Developer');
    expect(Array.isArray(result.user.abilities)).toBe(true);
  });

  it('should not include undefined and null values in nested paths based on options', () => {
    const source = {
      user: {
        name: 'John',
        profile: {
          bio: null,
          skills: undefined
        }
      }
    };

    const blueprint: Blueprint<typeof source, any> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'userName' },
        { source: 'user.profile.bio' as BrickPath, target: 'user.bio' },
        { source: 'user.profile.skills' as BrickPath, target: 'user.abilities' }
      ]
    };

    // Test with skipNull
    const bricksmithSkipNull = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin],
      skipNull: true
    });

    const resultSkipNull = bricksmithSkipNull.build(source);
    
    // Should not have user.bio (null value) but should have user object
    expect(resultSkipNull).toEqual({
      userName: 'John',
      user: {
        abilities: undefined
      }
    });
    expect(resultSkipNull.user).not.toHaveProperty('bio');

    // Test with skipUndefined
    const bricksmithSkipUndefined = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin],
      skipUndefined: true
    });

    const resultSkipUndefined = bricksmithSkipUndefined.build(source);
    
    // Should not have user.abilities (undefined value) but should have user object
    expect(resultSkipUndefined).toEqual({
      userName: 'John',
      user: {
        bio: null
      }
    });
    expect(resultSkipUndefined.user).not.toHaveProperty('abilities');

    // Test with preserveNull override
    const blueprintWithPreserve: Blueprint<typeof source, any> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'userName' },
        { source: 'user.profile.bio' as BrickPath, target: 'user.bio', preserveNull: true },
        { source: 'user.profile.skills' as BrickPath, target: 'user.abilities' }
      ]
    };

    const bricksmithWithPreserve = new Bricksmith(blueprintWithPreserve, {
      tools: [nestedPathPlugin],
      skipNull: true
    });

    const resultWithPreserve = bricksmithWithPreserve.build(source);
    
    // Should have user.bio despite skipNull because preserveNull is true
    expect(resultWithPreserve).toEqual({
      userName: 'John',
      user: {
        bio: null,
        abilities: undefined
      }
    });
  });

  it('should not create empty objects when values are skipped', () => {
    const source = {
      user: {
        name: 'John',
        profile: {
          bio: null,
          details: undefined
        }
      }
    };

    // All nested properties are null or undefined
    const blueprint: Blueprint<typeof source, any> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'userName' },
        { source: 'user.profile.bio' as BrickPath, target: 'data.user.bio' },
        { source: 'user.profile.details' as BrickPath, target: 'data.user.details' }
      ]
    };

    // Test with skipNull and skipUndefined
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin],
      skipNull: true,
      skipUndefined: true
    });

    const result = bricksmith.build(source);
    
    // 'data' object should not exist in the result since all its nested properties were skipped
    expect(result).toEqual({
      userName: 'John'
    });
    
    // Explicitly verify data property doesn't exist
    expect(result).not.toHaveProperty('data');

    // Test with one value that should be included
    const blueprintWithPreserve: Blueprint<typeof source, any> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'userName' },
        { source: 'user.profile.bio' as BrickPath, target: 'data.user.bio', preserveNull: true },
        { source: 'user.profile.details' as BrickPath, target: 'data.user.details' }
      ]
    };

    const bricksmithWithPreserve = new Bricksmith(blueprintWithPreserve, {
      tools: [nestedPathPlugin],
      skipNull: true,
      skipUndefined: true
    });

    const resultWithPreserve = bricksmithWithPreserve.build(source);
    
    // 'data.user.details' should still be skipped, but 'data.user.bio' should be included
    expect(resultWithPreserve).toEqual({
      userName: 'John',
      data: {
        user: {
          bio: null
        }
      }
    });

    // Test with empty object in original source
    const sourceWithEmpty = {
      user: {
        name: 'John',
        profile: {
          bio: null,
          empty: {}
        }
      }
    };

    const blueprintWithEmpty: Blueprint<typeof sourceWithEmpty, any> = {
      bricks: [
        { source: 'user.name' as BrickPath, target: 'userName' },
        { source: 'user.profile.bio' as BrickPath, target: 'data.user.bio' },
        { source: 'user.profile.empty' as BrickPath, target: 'data.user.empty' }
      ]
    };

    const bricksmithWithEmpty = new Bricksmith(blueprintWithEmpty, {
      tools: [nestedPathPlugin],
      skipNull: true
    });

    const resultWithEmpty = bricksmithWithEmpty.build(sourceWithEmpty);
    
    // Empty objects should be preserved
    expect(resultWithEmpty).toEqual({
      userName: 'John',
      data: {
        user: {
          empty: {}
        }
      }
    });
  });
}); 