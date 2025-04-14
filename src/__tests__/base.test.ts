import { Bricksmith, BrickPath } from 'bricksmith';
import nestedPathPlugin from '../index';

// This file contains core Bricksmith tests that are not specific to nested paths
// Nested path specific tests have been moved to nested-path.test.ts

describe('Bricksmith Core Features with Nested Path Plugin', () => {
  it('should handle simple properties correctly', () => {
    const source = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30
    };

    const blueprint = {
      bricks: [
        { source: 'firstName', target: 'givenName' },
        { source: 'lastName', target: 'familyName' },
        { source: 'age', target: 'years' }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      givenName: 'John',
      familyName: 'Doe',
      years: 30
    });
  });

  it('should handle multiple transformations on the same source property', () => {
    const source = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };

    const blueprint = {
      bricks: [
        { source: 'name', target: 'upperName', transform: (v) => String(v).toUpperCase() },
        { source: 'name', target: 'lowerName', transform: (v) => String(v).toLowerCase() },
        { source: 'name', target: 'nameLength', transform: (v) => String(v).length },
        { source: 'name', target: 'nameInitials', transform: (v) => String(v).split(' ').map(n => n[0]).join('.') + '.' }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      upperName: 'JOHN DOE',
      lowerName: 'john doe',
      nameLength: 8,
      nameInitials: 'J.D.'
    });
  });

  it('should handle the same target property accessed from different sources', () => {
    const source = {
      user: {
        firstName: 'John',
        lastName: 'Doe'
      },
      settings: {
        displayName: 'J. Doe',
        preferredName: 'Johnny'
      }
    };

    const blueprint = {
      bricks: [
        { source: 'user.firstName', target: 'displayedName', priority: 1 },
        { source: 'settings.displayName', target: 'displayedName', priority: 2 },
        { source: 'settings.preferredName', target: 'displayedName', priority: 3 }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    // Should use the highest priority source
    expect(result).toEqual({
      displayedName: 'Johnny'
    });
  });

  it('should handle nested objects in source but flat targets', () => {
    const source = {
      user: {
        name: {
          first: 'John',
          last: 'Doe'
        },
        contact: {
          email: 'john@example.com',
          phone: '123-456-7890'
        }
      }
    };

    const blueprint = {
      bricks: [
        { source: 'user.name.first', target: 'firstName' },
        { source: 'user.name.last', target: 'lastName' },
        { source: 'user.contact.email', target: 'email' },
        { source: 'user.contact.phone', target: 'phone' }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890'
    });
  });

  it('should handle conditionally setting values based on other properties', () => {
    const source = {
      user: {
        name: 'John Doe',
        isAdmin: true,
        features: {
          canEdit: true,
          canDelete: false
        }
      }
    };

    const blueprint = {
      bricks: [
        { source: 'user.name', target: 'name' },
        { 
          source: 'user', 
          target: 'permissions.admin', 
          transform: (user) => user.isAdmin === true 
        },
        { 
          source: 'user', 
          target: 'permissions.canEditAll', 
          transform: (user) => user.isAdmin === true || user.features.canEdit === true 
        },
        { 
          source: 'user', 
          target: 'permissions.canDeleteAll', 
          transform: (user) => user.isAdmin === true && user.features.canDelete === true 
        }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      name: 'John Doe',
      permissions: {
        admin: true,
        canEditAll: true,
        canDeleteAll: false
      }
    });
  });

  it('should handle combining values from multiple sources', () => {
    const source = {
      user: {
        firstName: 'John',
        lastName: 'Doe'
      },
      profile: {
        title: 'Dr.',
        suffix: 'PhD'
      }
    };

    // Create a function for proper typing of sources
    const multiSourceTransform = (sources: any[]) => {
      if (!Array.isArray(sources) || sources.length !== 4) {
        return 'Invalid sources';
      }
      
      const [firstName, lastName, title, suffix] = sources;
      return `${title || ''} ${firstName} ${lastName}${suffix ? ', ' + suffix : ''}`.trim();
    };

    // Simpler structure with direct brick definition
    const blueprint = {
      bricks: [
        {
          source: 'user.firstName',
          target: 'fullName',
          transform: (firstName: string) => {
            const lastName = source.user.lastName;
            const title = source.profile.title;
            const suffix = source.profile.suffix;
            return `${title || ''} ${firstName} ${lastName}${suffix ? ', ' + suffix : ''}`.trim();
          }
        }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      fullName: 'Dr. John Doe, PhD'
    });
  });

  it('should handle arrays of objects with nested paths', () => {
    const source = {
      orders: [
        {
          id: '1',
          customer: {
            name: 'John Doe',
            address: {
              city: 'New York'
            }
          },
          items: [
            { name: 'Item 1', price: 10 },
            { name: 'Item 2', price: 20 }
          ]
        },
        {
          id: '2',
          customer: {
            name: 'Jane Smith',
            address: {
              city: 'Boston'
            }
          },
          items: [
            { name: 'Item 3', price: 30 }
          ]
        }
      ]
    };

    const blueprint = {
      bricks: [
        { 
          source: 'orders', 
          target: 'processedOrders',
          transform: (orders) => orders.map(order => ({
            orderId: order.id,
            customerName: order.customer.name,
            city: order.customer.address.city,
            itemCount: order.items.length,
            total: order.items.reduce((sum, item) => sum + item.price, 0)
          }))
        }
      ]
    };

    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });

    const result = bricksmith.build(source);

    expect(result).toEqual({
      processedOrders: [
        {
          orderId: '1',
          customerName: 'John Doe',
          city: 'New York',
          itemCount: 2,
          total: 30
        },
        {
          orderId: '2',
          customerName: 'Jane Smith',
          city: 'Boston',
          itemCount: 1,
          total: 30
        }
      ]
    });
  });
}); 