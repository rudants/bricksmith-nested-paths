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
      undefinedField: undefined
    });
    expect(result).not.toHaveProperty('metaTags');
    expect(result).not.toHaveProperty('nullField');
  });

  it('should handle preserveNull option correctly', () => {
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
        { source: 'meta.tags' as BrickPath, target: 'metaTags', preserveNull: true },
        { source: 'meta.nullValue' as BrickPath, target: 'nullField', preserveNull: true },
        { source: 'meta.undefinedValue' as BrickPath, target: 'undefinedField' }
      ]
    };

    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      skipNull: true
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      metaTags: null,
      nullField: null,
      undefinedField: undefined
    });
  });

  it('should clean up empty objects', () => {
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
        { source: 'test.deep.nested.path' as BrickPath, target: 'test.deep.nested.path' }
      ]
    };

    // Default behavior includes undefined values, which creates the empty objects
    const bricksmith = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      test: { deep: { nested: { path: undefined } } }
    });

    // With skipUndefined option, the empty objects should be cleaned up
    const bricksmithSkipUndefined = new Bricksmith<Source, Target>(blueprint, {
      tools: [nestedPathPlugin],
      skipUndefined: true
    });

    const resultSkipUndefined = bricksmithSkipUndefined.build(source);

    expect(resultSkipUndefined).toEqual({});
    expect(resultSkipUndefined).not.toHaveProperty('test');
  });
}); 