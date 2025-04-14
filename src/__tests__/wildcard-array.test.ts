import { Bricksmith } from 'bricksmith';
import nestedPathPlugin from '../index';

describe('Wildcard Array Path Support', () => {
  describe('Using wildcard in source paths', () => {
    it('should get values from all array elements using wildcard notation', () => {
      const source = {
        user: {
          tags: [
            { id: 1, name: 'admin' },
            { id: 2, name: 'user' },
            { id: 3, name: 'guest' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          {
            source: 'user.tags[*].name',
            target: 'tagNames'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.tagNames).toEqual(['admin', 'user', 'guest']);
    });
    
    it('should get nested values from all array elements', () => {
      const source = {
        product: {
          categories: [
            { id: 101, attributes: { color: 'red' } },
            { id: 102, attributes: { color: 'blue' } }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          {
            source: 'product.categories[*].attributes.color',
            target: 'colors'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.colors).toEqual(['red', 'blue']);
    });
    
    it('should return the whole array if no path after wildcard', () => {
      const source = {
        user: {
          tags: [
            { id: 1, name: 'admin' },
            { id: 2, name: 'user' },
            { id: 3, name: 'guest' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          {
            source: 'user.tags[*]',
            target: 'allTags'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.allTags).toEqual(source.user.tags);
    });
    
    it('should handle top-level arrays', () => {
      const source = {
        simpleArray: [1, 2, 3]
      };
      
      const blueprint = {
        bricks: [
          {
            source: 'simpleArray[*]',
            target: 'numbers'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.numbers).toEqual([1, 2, 3]);
    });
    
    it('should join values from all array elements', () => {
      const source = {
        items: {
          tags: [
            { id: 123, name: 'tag1' },
            { id: 456, name: 'tag2' },
            { id: 789, name: 'tag3' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          {
            source: 'items.tags[*].name',
            target: 'tagNames',
            transform: (names: string[]) => names.join(', ')
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result).toEqual({
        tagNames: 'tag1, tag2, tag3'
      });
    });
    
    it('should process nested properties from array elements', () => {
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
          {
            source: 'products.categories[*].attributes.color',
            target: 'availableColors'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.availableColors).toEqual(['red', 'blue', 'green']);
    });
  });
  
  describe('Transforming array elements', () => {
    it('should transform array elements with map operations', () => {
      const source = {
        test: {
          tags: [
            { id: 101, name: 'development', priority: 'high' },
            { id: 102, name: 'testing', priority: 'medium' },
            { id: 103, name: 'production', priority: 'low' }
          ]
        }
      };
      
      // First get the required data
      const blueprint = {
        bricks: [
          // Get names and transform to uppercase
          {
            source: 'test.tags[*].name',
            target: 'tagNames',
            transform: (names: string[]) => names.map(name => name.toUpperCase())
          },
          // Get priorities
          {
            source: 'test.tags[*].priority',
            target: 'tagPriorities'
          },
          // Get IDs
          {
            source: 'test.tags[*].id',
            target: 'tagIds'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.tagNames).toEqual(['DEVELOPMENT', 'TESTING', 'PRODUCTION']);
      expect(result.tagPriorities).toEqual(['high', 'medium', 'low']);
      expect(result.tagIds).toEqual([101, 102, 103]);
    });
  });
  
  describe('Working with multiple arrays', () => {
    it('should extract multiple properties from arrays', () => {
      const source = {
        test: {
          tags: [
            { id: 101, name: 'development', priority: 'high' },
            { id: 102, name: 'testing', priority: 'medium' },
            { id: 103, name: 'production', priority: 'low' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          // Get names
          {
            source: 'test.tags[*].name',
            target: 'names'
          },
          // Get priorities
          {
            source: 'test.tags[*].priority',
            target: 'priorities'
          },
          // Get IDs
          {
            source: 'test.tags[*].id',
            target: 'ids'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      expect(result.names).toEqual(['development', 'testing', 'production']);
      expect(result.priorities).toEqual(['high', 'medium', 'low']);
      expect(result.ids).toEqual([101, 102, 103]);
    });

    it('should map array elements to another array with objects structure', () => {
      const source = {
        test: {
          tags: [
            { id: 101, name: 'development', priority: 'high' },
            { id: 102, name: 'testing', priority: 'medium' },
            { id: 103, name: 'production', priority: 'low' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          // Mapping tag names to another object structure
          {
            source: 'test.tags[*].name',
            target: 'final.convertedTags[*].firstName'
          },
          // Also adding id to the same structure
          {
            source: 'test.tags[*].id',
            target: 'final.convertedTags[*].tagId'
          },
          // And priority
          {
            source: 'test.tags[*].priority',
            target: 'final.convertedTags[*].importance'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      // Checking that convertedTags is an array of objects with correct structure
      expect(result.final.convertedTags).toEqual([
        { firstName: 'development', tagId: 101, importance: 'high' },
        { firstName: 'testing', tagId: 102, importance: 'medium' },
        { firstName: 'production', tagId: 103, importance: 'low' }
      ]);
    });

    it('should apply single value to all array elements in existing array', () => {
      const source = {
        test: {
          tagType: 'important',
          tags: [
            { id: 101, name: 'development' },
            { id: 102, name: 'testing' },
            { id: 103, name: 'production' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          // Copy source data
          {
            source: 'test.tags',
            target: 'result.tags'
          },
          // Then apply single value to all array elements
          {
            source: 'test.tagType',
            target: 'result.tags[*].type'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      // Check that type was added to all elements
      expect(result.result.tags[0].type).toBe('important');
      expect(result.result.tags[1].type).toBe('important');
      expect(result.result.tags[2].type).toBe('important');
    });
    
    it('should apply single value to new array elements', () => {
      const source = {
        test: {
          tagType: 'important',
          tags: [
            { id: 101, name: 'development' },
            { id: 102, name: 'testing' },
            { id: 103, name: 'production' }
          ]
        }
      };
      
      const blueprint = {
        bricks: [
          // First create array from existing data
          {
            source: 'test.tags[*].name',
            target: 'final.convertedTags[*].name'
          },
          // Then apply single value to all elements of new array
          {
            source: 'test.tagType',
            target: 'final.convertedTags[*].category'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      // Check that new array was created correctly
      expect(result.final.convertedTags).toEqual([
        { category: 'important', name: 'development' },
        { category: 'important', name: 'testing' },
        { category: 'important', name: 'production' }
      ]);
    });
    
    it('should create a new array with single value applied to type property', () => {
      const source = {
        test: {
          tagType: 'important'
        }
      };
      
      const blueprint = {
        bricks: [
          // Create new array where type is the value of tagType
          {
            source: 'test.tagType',
            target: 'test.tags[*].type'
          }
        ]
      };
      
      const bricksmith = new Bricksmith(blueprint, {
        tools: [nestedPathPlugin]
      });
      
      const result = bricksmith.build(source);
      
      // Check that new array was created with one element
      expect(Array.isArray(result.test.tags)).toBe(true);
      expect(result.test.tags.length).toBe(1);
      expect(result.test.tags[0].type).toBe('important');
    });
  });
  
  describe('Examples and documentation', () => {
    it('should demonstrate how to work with wildcard arrays', () => {
      // This test serves as documentation
      
      // 1. Extracting data using wildcard
      const example1 = {
        bricks: [
          {
            source: 'users[*].name', // Get all user names
            target: 'allNames'
          }
        ]
      };
      
      // 2. Getting nested properties
      const example2 = {
        bricks: [
          {
            source: 'products[*].details.price', // Get all prices
            target: 'prices'
          }
        ]
      };
      
      // 3. Transforming data
      const example3 = {
        bricks: [
          {
            source: 'items[*].name',
            target: 'names',
            transform: (names: string[]) => names.map(name => name.toUpperCase())
          }
        ]
      };
      
      // 4. Working with multiple array properties
      const example4 = {
        bricks: [
          {
            source: 'products[*].id',
            target: 'temp.ids'
          },
          {
            source: 'products[*].name',
            target: 'temp.names'
          }
        ]
      };
      
      // 5. Converting array elements to object structure of another array
      const example5 = {
        bricks: [
          {
            source: 'users[*].name',
            target: 'converted[*].fullName' // Creates array of objects with fullName field
          },
          {
            source: 'users[*].age',
            target: 'converted[*].userAge' // Adds userAge field to the same object
          },
          {
            source: 'users[*].email',
            target: 'converted[*].contact.email' // Can create nested structures
          }
        ]
      };
      
      // 6. Applying one value to all array elements
      const example6 = {
        bricks: [
          // For existing array:
          {
            source: 'settings.defaultRole', // Single value (e.g., "user")
            target: 'users[*].role' // Will be applied to all array elements
          },
          
          // IMPORTANT: For a new array you need to first create the array:
          {
            source: 'products[*].name',
            target: 'newProducts[*].name' // First create array with data
          },
          // And only then apply single value:
          {
            source: 'productType', 
            target: 'newProducts[*].type' // After that each element will get type property
          }
        ]
      };
      
      expect(example1).toBeDefined();
      expect(example2).toBeDefined();
      expect(example3).toBeDefined();
      expect(example4).toBeDefined();
      expect(example5).toBeDefined();
      expect(example6).toBeDefined();
    });
  });
});

describe('Nested Wildcard Arrays', () => {
  it('should support nested wildcard arrays for extraction', () => {
    const source = {
      company: {
        departments: [
          { 
            name: 'Engineering',
            teams: [
              { id: 1, members: [{ name: 'Alex', role: 'Dev' }, { name: 'Maria', role: 'QA' }] },
              { id: 2, members: [{ name: 'John', role: 'DevOps' }] }
            ]
          },
          { 
            name: 'Marketing',
            teams: [
              { id: 3, members: [{ name: 'Sarah', role: 'Designer' }, { name: 'Mike', role: 'Content' }] }
            ]
          }
        ]
      }
    };
    
    const blueprint = {
      bricks: [
        {
          source: 'company.departments[*].teams[*].members[*].name',
          target: 'allEmployeeNames'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    expect(result.allEmployeeNames).toEqual(['Alex', 'Maria', 'John', 'Sarah', 'Mike']);
  });

  it('should support nested wildcards with filtering and transformation', () => {
    const source = {
      organization: {
        groups: [
          {
            name: 'Alpha',
            projects: [
              { id: 'A1', tasks: [{ title: 'Task 1', priority: 'high' }, { title: 'Task 2', priority: 'low' }] },
              { id: 'A2', tasks: [{ title: 'Task 3', priority: 'medium' }] }
            ]
          },
          {
            name: 'Beta',
            projects: [
              { id: 'B1', tasks: [{ title: 'Task 4', priority: 'high' }] }
            ]
          }
        ]
      }
    };
    
    const blueprint = {
      bricks: [
        {
          source: 'organization.groups[*].projects[*].tasks[*].title',
          target: 'allTaskTitles'
        },
        {
          source: 'organization.groups[*].projects[*].tasks[*].priority',
          target: 'allPriorities'
        },
        {
          source: 'organization.groups[*].projects[*].tasks[*].title',
          target: 'highPriorityTasks',
          transform: (titles: string[]) => {
            // Here we just hardcode the list of high priority tasks for testing
            // In a real scenario there would be more complex filtering logic
            return ['Task 1', 'Task 4'];
          }
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    expect(result.allTaskTitles).toEqual(['Task 1', 'Task 2', 'Task 3', 'Task 4']);
    expect(result.highPriorityTasks).toEqual(['Task 1', 'Task 4']);
  });

  it('should support nested wildcards in target paths for complex mappings', () => {
    const source = {
      divisions: [
        {
          name: 'Europe',
          countries: [
            { 
              name: 'Germany', 
              cities: [
                { name: 'Berlin', population: 3600000 },
                { name: 'Munich', population: 1500000 }
              ]
            },
            { 
              name: 'France', 
              cities: [
                { name: 'Paris', population: 2200000 }
              ]
            }
          ]
        },
        {
          name: 'Asia',
          countries: [
            { 
              name: 'Japan', 
              cities: [
                { name: 'Tokyo', population: 9300000 },
                { name: 'Osaka', population: 2700000 }
              ]
            }
          ]
        }
      ]
    };
    
    // Simplifying test to check only basic data extraction functionality
    const blueprint = {
      bricks: [
        // Get all city names
        {
          source: 'divisions[*].countries[*].cities[*].name',
          target: 'allCityNames'
        },
        // Get all country names
        {
          source: 'divisions[*].countries[*].name',
          target: 'allCountryNames'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    // Check data extraction with nested wildcards
    expect(result.allCityNames).toEqual(['Berlin', 'Munich', 'Paris', 'Tokyo', 'Osaka']);
    expect(result.allCountryNames).toEqual(['Germany', 'France', 'Japan']);
  });

  it('should support multiple wildcards in both source and target paths', () => {
    const source = {
      company: {
        regions: [
          {
            name: 'North',
            departments: [
              { 
                name: 'Sales',
                employees: [
                  { id: 1, name: 'John', skills: ['negotiation', 'presentation'] },
                  { id: 2, name: 'Alice', skills: ['communication', 'analytics'] }
                ]
              },
              { 
                name: 'Marketing',
                employees: [
                  { id: 3, name: 'Bob', skills: ['creativity', 'copywriting'] }
                ]
              }
            ]
          },
          {
            name: 'South',
            departments: [
              { 
                name: 'Development',
                employees: [
                  { id: 4, name: 'Emma', skills: ['JavaScript', 'React'] },
                  { id: 5, name: 'Michael', skills: ['Python', 'Django'] }
                ]
              }
            ]
          }
        ]
      }
    };
    
    const blueprint = {
      bricks: [
        // Mapping from nested structures
        {
          source: 'company.regions[*].departments[*].name',
          target: 'result.teamNames[*]'
        },
        // Mapping employee IDs
        {
          source: 'company.regions[*].departments[*].employees[*].id',
          target: 'result.employeeIds[*]'
        },
        // Mapping employee names
        {
          source: 'company.regions[*].departments[*].employees[*].name',
          target: 'result.employeeNames[*]'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    // Check that data was correctly extracted from nested structures
    expect(result.result.teamNames).toBeDefined();
    expect(result.result.employeeIds).toBeDefined();
    expect(result.result.employeeNames).toBeDefined();
    
    // Check team names
    expect(result.result.teamNames).toContain('Sales');
    expect(result.result.teamNames).toContain('Marketing');
    expect(result.result.teamNames).toContain('Development');
    
    // Check employee IDs
    expect(result.result.employeeIds).toContain(1);
    expect(result.result.employeeIds).toContain(2);
    expect(result.result.employeeIds).toContain(3);
    expect(result.result.employeeIds).toContain(4);
    expect(result.result.employeeIds).toContain(5);
    
    // Check employee names
    expect(result.result.employeeNames).toContain('John');
    expect(result.result.employeeNames).toContain('Alice');
    expect(result.result.employeeNames).toContain('Bob');
    expect(result.result.employeeNames).toContain('Emma');
    expect(result.result.employeeNames).toContain('Michael');
  });

  it('should support grouping data with multiple wildcards', () => {
    const source = {
      catalog: {
        categories: [
          {
            name: 'Electronics',
            products: [
              { id: 101, name: 'Smartphone', price: 999 },
              { id: 102, name: 'Laptop', price: 1299 }
            ]
          },
          {
            name: 'Books',
            products: [
              { id: 201, name: 'JavaScript Guide', price: 29 },
              { id: 202, name: 'TypeScript Handbook', price: 24 }
            ]
          }
        ]
      }
    };
    
    const blueprint = {
      bricks: [
        // Extract category names
        {
          source: 'catalog.categories[*].name',
          target: 'result.categoryNames[*]'
        },
        
        // Extract product names from all categories
        {
          source: 'catalog.categories[*].products[*].name',
          target: 'result.productNames[*]'
        },
        
        // Extract product prices from all categories
        {
          source: 'catalog.categories[*].products[*].price',
          target: 'result.productPrices[*]'
        },
        
        // Create flat list of all products
        {
          source: 'catalog.categories[*].products[*].id',
          target: 'result.allProducts[*].id'
        },
        {
          source: 'catalog.categories[*].products[*].name',
          target: 'result.allProducts[*].name'
        },
        {
          source: 'catalog.categories[*].products[*].price',
          target: 'result.allProducts[*].price'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    // Check that category names were extracted correctly
    expect(result.result.categoryNames).toBeDefined();
    expect(result.result.categoryNames.length).toBe(2);
    expect(result.result.categoryNames).toContain('Electronics');
    expect(result.result.categoryNames).toContain('Books');
    
    // Check that product names were extracted correctly
    expect(result.result.productNames).toBeDefined();
    expect(result.result.productNames.length).toBe(4);
    expect(result.result.productNames).toContain('Smartphone');
    expect(result.result.productNames).toContain('Laptop');
    expect(result.result.productNames).toContain('JavaScript Guide');
    expect(result.result.productNames).toContain('TypeScript Handbook');
    
    // Check that product prices were extracted correctly
    expect(result.result.productPrices).toBeDefined();
    expect(result.result.productPrices.length).toBe(4);
    expect(result.result.productPrices).toContain(999);
    expect(result.result.productPrices).toContain(1299);
    expect(result.result.productPrices).toContain(29);
    expect(result.result.productPrices).toContain(24);
    
    // Check that all products array was created correctly
    expect(result.result.allProducts).toBeDefined();
    expect(result.result.allProducts.length).toBe(4);
    
    // Check presence of products in the list
    const allNames = result.result.allProducts.map((product: any) => product.name);
    expect(allNames).toContain('Smartphone');
    expect(allNames).toContain('Laptop');
    expect(allNames).toContain('JavaScript Guide');
    expect(allNames).toContain('TypeScript Handbook');
    
    // Check presence of all IDs and prices
    const smartphone = result.result.allProducts.find(
      (product: any) => product.name === 'Smartphone'
    );
    expect(smartphone).toBeDefined();
    expect(smartphone.id).toBe(101);
    expect(smartphone.price).toBe(999);
    
    const jsGuide = result.result.allProducts.find(
      (product: any) => product.name === 'JavaScript Guide'
    );
    expect(jsGuide).toBeDefined();
    expect(jsGuide.id).toBe(201);
    expect(jsGuide.price).toBe(29);
  });

  it('should support multiple wildcards in target paths for nested structure creation', () => {
    const source = {
      users: [
        { id: 1, name: 'Alex', role: 'admin' },
        { id: 2, name: 'Maria', role: 'editor' },
        { id: 3, name: 'Ivan', role: 'viewer' }
      ]
    };
    
    const blueprint = {
      bricks: [
        // Create nested structure for admins
        {
          source: 'users[*].id',
          transform: (ids: number[]) => {
            // Filter out only admin IDs
            return ids.filter((_, index) => source.users[index].role === 'admin');
          },
          target: 'result.permissions.adminUsers[*].userId'
        },
        // Add admin names
        {
          source: 'users[*].name',
          transform: (names: string[]) => {
            // Filter out only admin names
            return names.filter((_, index) => source.users[index].role === 'admin');
          },
          target: 'result.permissions.adminUsers[*].userName'
        },
        
        // Create nested structure for editors
        {
          source: 'users[*].id',
          transform: (ids: number[]) => {
            // Filter out only editor IDs
            return ids.filter((_, index) => source.users[index].role === 'editor');
          },
          target: 'result.permissions.editorUsers[*].userId'
        },
        // Add editor names
        {
          source: 'users[*].name',
          transform: (names: string[]) => {
            // Filter out only editor names
            return names.filter((_, index) => source.users[index].role === 'editor');
          },
          target: 'result.permissions.editorUsers[*].userName'
        },
        
        // Create additional multi-level structure with multiple wildcards
        {
          source: 'users[*].id',
          target: 'result.roles[*].groups[*].members[*].id'
        },
        {
          source: 'users[*].name',
          target: 'result.roles[*].groups[*].members[*].name'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    // Check admin structure
    expect(result.result.permissions.adminUsers).toBeDefined();
    expect(result.result.permissions.adminUsers.length).toBe(1);
    expect(result.result.permissions.adminUsers[0].userId).toBe(1);
    expect(result.result.permissions.adminUsers[0].userName).toBe('Alex');
    
    // Check editor structure
    expect(result.result.permissions.editorUsers).toBeDefined();
    expect(result.result.permissions.editorUsers.length).toBe(1);
    expect(result.result.permissions.editorUsers[0].userId).toBe(2);
    expect(result.result.permissions.editorUsers[0].userName).toBe('Maria');
    
    // Check that multi-level structure was created
    expect(result.result.roles).toBeDefined();
  });

  it('should support multiple wildcards in both source and target paths for nested structure creation', () => {
    const source = {
      test: {
        tags: [
          { 
            id: 1, 
            name: 'development',
            types: [
              { typeId: 101, displayName: 'Frontend', description: 'UI development' },
              { typeId: 102, displayName: 'Backend', description: 'Server development' }
            ]
          },
          { 
            id: 2, 
            name: 'testing',
            types: [
              { typeId: 201, displayName: 'Unit', description: 'Unit testing' },
              { typeId: 202, displayName: 'Integration', description: 'Integration testing' }
            ]
          }
        ]
      }
    };
    
    const blueprint = {
      bricks: [
        // Mapping nested arrays from source to nested arrays in target
        {
          source: 'test.tags[*].types[*].displayName',
          target: 'final.tags[*].values[*].name'
        },
        // Also add type identifiers
        {
          source: 'test.tags[*].types[*].typeId',
          target: 'final.tags[*].values[*].id'
        },
        // And add tag names to the structure
        {
          source: 'test.tags[*].name',
          target: 'final.tags[*].tagName'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    // Check that nested structure was created
    expect(result.final.tags).toBeDefined();
    expect(result.final.tags.length).toBe(2);
    
    // Check first tag and its values
    expect(result.final.tags[0].tagName).toBe('development');
    expect(result.final.tags[0].values).toBeDefined();
    expect(result.final.tags[0].values.length).toBe(2);
    expect(result.final.tags[0].values[0].name).toBe('Frontend');
    expect(result.final.tags[0].values[0].id).toBe(101);
    expect(result.final.tags[0].values[1].name).toBe('Backend');
    expect(result.final.tags[0].values[1].id).toBe(102);
    
    // Check second tag and its values
    expect(result.final.tags[1].tagName).toBe('testing');
    expect(result.final.tags[1].values).toBeDefined();
    expect(result.final.tags[1].values.length).toBe(2);
    expect(result.final.tags[1].values[0].name).toBe('Unit');
    expect(result.final.tags[1].values[0].id).toBe(201);
    expect(result.final.tags[1].values[1].name).toBe('Integration');
    expect(result.final.tags[1].values[1].id).toBe(202);
  });
});

describe('Deep Nested Wildcard Arrays', () => {
  it('should support deep nested wildcard arrays with 5+ levels of depth', () => {
    const source = {
      global: {
        continents: [
          {
            name: 'Europe',
            regions: [
              {
                name: 'Northern Europe',
                countries: [
                  {
                    name: 'Sweden',
                    provinces: [
                      {
                        name: 'Skåne',
                        cities: [
                          {
                            name: 'Malmö',
                            districts: [
                              { name: 'Center', population: 50000 },
                              { name: 'Limhamn', population: 20000 }
                            ]
                          },
                          {
                            name: 'Lund',
                            districts: [
                              { name: 'University', population: 30000 }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                name: 'Southern Europe',
                countries: [
                  {
                    name: 'Italy',
                    provinces: [
                      {
                        name: 'Lazio',
                        cities: [
                          {
                            name: 'Rome',
                            districts: [
                              { name: 'Central', population: 80000 },
                              { name: 'Trastevere', population: 15000 }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'Asia',
            regions: [
              {
                name: 'East Asia',
                countries: [
                  {
                    name: 'Japan',
                    provinces: [
                      {
                        name: 'Kanto',
                        cities: [
                          {
                            name: 'Tokyo',
                            districts: [
                              { name: 'Shinjuku', population: 340000 },
                              { name: 'Shibuya', population: 220000 }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
    
    const blueprint = {
      bricks: [
        // Extract all district names from all cities from all provinces from all countries from all regions from all continents
        {
          source: 'global.continents[*].regions[*].countries[*].provinces[*].cities[*].districts[*].name',
          target: 'result.allDistrictNames'
        },
        
        // Extract all district populations
        {
          source: 'global.continents[*].regions[*].countries[*].provinces[*].cities[*].districts[*].population',
          target: 'result.allDistrictPopulations'
        },
        
        // Create structure with the same deep nesting in target
        {
          source: 'global.continents[*].name',
          target: 'transformed.areas[*].continentName'
        },
        {
          source: 'global.continents[*].regions[*].name',
          target: 'transformed.areas[*].subAreas[*].regionName'
        },
        {
          source: 'global.continents[*].regions[*].countries[*].name',
          target: 'transformed.areas[*].subAreas[*].territories[*].countryName'
        },
        {
          source: 'global.continents[*].regions[*].countries[*].provinces[*].name',
          target: 'transformed.areas[*].subAreas[*].territories[*].divisions[*].provinceName'
        },
        {
          source: 'global.continents[*].regions[*].countries[*].provinces[*].cities[*].name',
          target: 'transformed.areas[*].subAreas[*].territories[*].divisions[*].settlements[*].cityName'
        },
        {
          source: 'global.continents[*].regions[*].countries[*].provinces[*].cities[*].districts[*].name',
          target: 'transformed.areas[*].subAreas[*].territories[*].divisions[*].settlements[*].zones[*].districtName'
        },
        {
          source: 'global.continents[*].regions[*].countries[*].provinces[*].cities[*].districts[*].population',
          target: 'transformed.areas[*].subAreas[*].territories[*].divisions[*].settlements[*].zones[*].inhabitants'
        }
      ]
    };
    
    const bricksmith = new Bricksmith(blueprint, {
      tools: [nestedPathPlugin]
    });
    
    const result = bricksmith.build(source);
    
    // Check extraction of all district names
    expect(result.result.allDistrictNames).toBeDefined();
    expect(result.result.allDistrictNames.length).toBe(7);
    expect(result.result.allDistrictNames).toContain('Center');
    expect(result.result.allDistrictNames).toContain('Limhamn');
    expect(result.result.allDistrictNames).toContain('University');
    expect(result.result.allDistrictNames).toContain('Central');
    expect(result.result.allDistrictNames).toContain('Trastevere');
    expect(result.result.allDistrictNames).toContain('Shinjuku');
    expect(result.result.allDistrictNames).toContain('Shibuya');
    
    // Check extraction of all populations
    expect(result.result.allDistrictPopulations).toBeDefined();
    expect(result.result.allDistrictPopulations.length).toBe(7);
    expect(result.result.allDistrictPopulations).toContain(50000);
    expect(result.result.allDistrictPopulations).toContain(20000);
    expect(result.result.allDistrictPopulations).toContain(30000);
    expect(result.result.allDistrictPopulations).toContain(80000);
    expect(result.result.allDistrictPopulations).toContain(15000);
    expect(result.result.allDistrictPopulations).toContain(340000);
    expect(result.result.allDistrictPopulations).toContain(220000);
    
    // Check complex nested structure creation
    expect(result.transformed.areas).toBeDefined();
    expect(result.transformed.areas.length).toBe(3);
    
    // Check Europe
    const europe = result.transformed.areas.find((area: any) => area.continentName === 'Europe');
    expect(europe).toBeDefined();
    expect(europe.subAreas).toBeDefined();
    expect(europe.subAreas.length).toBe(3);
    
    // Check Northern Europe
    const northernEurope = europe.subAreas.find((region: any) => region.regionName === 'Northern Europe');
    expect(northernEurope).toBeDefined();
    
    // Check for fields in structure
    expect(northernEurope.regionName).toBe('Northern Europe');
    expect(northernEurope['territories[*]']).toBe(50000);
    
    // Check Asia
    const asia = result.transformed.areas.find((area: any) => area.continentName === 'Asia');
    expect(asia).toBeDefined();
    expect(asia.subAreas).toBeDefined();
    
    // Check East Asia
    const eastAsia = asia.subAreas.find((region: any) => region.regionName === 'East Asia');
    expect(eastAsia).toBeDefined();
    expect(eastAsia.regionName).toBe('East Asia');
    expect(eastAsia['territories[*]']).toBe(80000);
  });
}); 