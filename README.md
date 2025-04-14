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

## Limitations

1. Paths must use dot notation (e.g., `user.address.city`)
2. Array access is not supported (e.g., `users[0].name`)
3. Special characters in property names are not supported

## Best Practices

1. Use descriptive property names in paths
2. Keep path depth reasonable (avoid deeply nested paths)
3. Handle optional properties appropriately
4. Use transform functions for complex value transformations
5. Consider using `preserveNull` when null values are meaningful

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

### Complex Transformation

```typescript
const source = {
  user: {
    name: 'John Doe',
    address: {
      coordinates: {
        lat: 40.7128,
        lng: -74.0060
      }
    }
  }
};

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
    },
    {
      source: 'user.address.coordinates.lng',
      target: 'location.coordinates.longitude',
      transform: (lng) => Number(lng.toFixed(2))
    }
  ]
};

const bricksmith = new Bricksmith(blueprint, {
  tools: [nestedPathPlugin]
});

const result = bricksmith.build(source);
// {
//   fullName: 'JOHN DOE',
//   location: {
//     coordinates: {
//       latitude: 40.71,
//       longitude: -74.01
//     }
//   }
// }
```

## License

MIT 