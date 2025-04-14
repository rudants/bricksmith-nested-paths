# bricksmith-nested-paths

A plugin for Bricksmith that enables dot-notation path support for accessing nested properties in both source and target objects.

## Installation

```bash
npm install bricksmith-nested-paths
```

## Usage

```typescript
import { Bricksmith } from 'bricksmith';
import nestedPathPlugin from 'bricksmith-nested-paths';

const bricksmith = new Bricksmith(blueprint, {
  tools: [nestedPathPlugin]
});
```

## Features

### Nested Path Support

The plugin allows you to use dot notation to access nested properties:

```typescript
const blueprint = {
  bricks: [
    { source: 'user.name', target: 'fullName' },
    { source: 'user.address.city', target: 'location.city' },
    { source: 'user.address.coordinates.lat', target: 'location.coordinates.latitude' }
  ]
};
```

### Array Wildcards

Supports wildcard operations for arrays:

```typescript
const blueprint = {
  bricks: [
    {
      source: 'user.tags[*].name',
      target: 'tagNames'
    }
  ]
};

// Will extract the 'name' property from each tag in the array
// Result: { tagNames: ['admin', 'user', 'guest'] }
```

### Optional Properties

Handles optional properties gracefully:

```typescript
interface Source {
  user: {
    address?: {
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
}
```

### Transform Functions

Works seamlessly with transform functions:

```typescript
const blueprint = {
  bricks: [
    {
      source: 'user.name',
      target: 'fullName',
      transform: (name) => name.toUpperCase()
    },
    {
      source: 'user.address.coordinates.lat',
      target: 'location.coordinates.latitude',
      transform: (lat) => Number(lat.toFixed(2))
    }
  ]
};
```

### Null Value Handling

Supports `preserveNull` option to maintain null values:

```typescript
const blueprint = {
  bricks: [
    {
      source: 'user.address.street',
      target: 'location.street',
      preserveNull: true
    }
  ]
};
```

## Type Safety

The plugin is fully type-safe and works with TypeScript's type system:

```typescript
interface Source {
  user: {
    name: string;
    address: {
      city: string;
      street: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
}

interface Target {
  fullName: string;
  location: {
    city: string;
    street: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

const bricksmith = new Bricksmith<Source, Target>(blueprint, {
  tools: [nestedPathPlugin]
});
```

## Architecture

The plugin uses a modular, extensible architecture:

- `src/modules/PathProcessor.ts`: Core class that detects path types and delegates to appropriate handlers
- `src/types/index.ts`: Contains interfaces and types used across the project
- `src/constants/path.ts`: Constants used for path parsing and processing
- `src/modules/handlers/`: Implementations of different path handlers:
  - `NestedObjectPathHandler.ts`: Handles dot notation paths (e.g., 'user.address.city')
  - `WildcardArrayPathHandler.ts`: Handles array wildcard notation (e.g., 'users[*].name')

This design allows for easy extension to support different path formats in the future:

```typescript
enum PathType {
  NESTED_OBJECT = 'NESTED_OBJECT',
  WILDCARD_ARRAY = 'WILDCARD_ARRAY',
  // Future path types can be added here
}
```

### Adding a Custom Path Handler

You can extend the system with your own path handler:

```typescript
import { PathHandler, PathType } from 'bricksmith-nested-paths/types';
import { PathProcessor } from 'bricksmith-nested-paths/modules/PathProcessor';

// Define a new path type
enum CustomPathType {
  MY_CUSTOM_TYPE = 'MY_CUSTOM_TYPE'
}

// Implement a handler for your custom path type
class MyCustomPathHandler implements PathHandler {
  getNestedValue(obj, path) { /* implementation */ }
  setNestedValue(obj, path, value, options) { /* implementation */ }
  cleanupEmptyObjects(obj, path) { /* implementation */ }
}

// Register your handler with the path processor
const pathProcessor = new PathProcessor();
pathProcessor.registerHandler(
  CustomPathType.MY_CUSTOM_TYPE,
  new MyCustomPathHandler()
);
```

## Limitations

1. Paths must use dot notation (e.g., `user.address.city`)
2. Only wildcard array access is supported (e.g., `users[*].name`) for bulk operations
3. Special characters in property names are not supported

## Examples

### Basic Usage

```typescript
const source = {
  user: {
    name: 'John Doe',
    address: {
      city: 'New York',
      street: 'Broadway'
    }
  }
};

const blueprint = {
  bricks: [
    { source: 'user.name', target: 'fullName' },
    { source: 'user.address.city', target: 'location.city' },
    { source: 'user.address.street', target: 'location.street' }
  ]
};

const bricksmith = new Bricksmith(blueprint, {
  tools: [nestedPathPlugin]
});

const result = bricksmith.build(source);
// {
//   fullName: 'John Doe',
//   location: {
//     city: 'New York',
//     street: 'Broadway'
//   }
// }
```

### Array Wildcard Example

```typescript
const source = {
  products: {
    categories: [
      { id: 101, attributes: { color: 'red', size: 'small' } },
      { id: 102, attributes: { color: 'blue', size: 'medium' } },
      { id: 103, attributes: { color: 'green', size: 'large' } }
    ]
  }
};

const blueprint = {
  bricks: [
    { source: 'products.categories[*].attributes.color', target: 'colors' },
    { source: 'products.categories[*].id', target: 'categoryIds' }
  ]
};

const result = bricksmith.build(source);
// {
//   colors: ['red', 'blue', 'green'],
//   categoryIds: [101, 102, 103]
// }
```

## License

MIT 