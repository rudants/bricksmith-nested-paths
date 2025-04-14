import { PathProcessor, PathType } from '../modules/PathProcessor';
import { NestedObjectPathHandler } from '../modules/handlers/NestedObjectPathHandler';

describe('PathProcessor', () => {
  let pathProcessor: PathProcessor;
  
  beforeEach(() => {
    pathProcessor = new PathProcessor();
    pathProcessor.registerHandler(PathType.NESTED_OBJECT, new NestedObjectPathHandler());
  });
  
  describe('detectPathType', () => {
    it('should detect nested object path', () => {
      expect(pathProcessor.detectPathType('user.address.city')).toBe(PathType.NESTED_OBJECT);
    });
    
    it('should default to NESTED_OBJECT for simple paths', () => {
      expect(pathProcessor.detectPathType('user')).toBe(PathType.NESTED_OBJECT);
    });
  });
  
  describe('getNestedValue', () => {
    const testObj = {
      user: {
        address: {
          city: 'London',
          zipcode: '123456'
        },
        name: 'John'
      }
    };
    
    it('should get nested value', () => {
      expect(pathProcessor.getNestedValue(testObj, 'user.address.city')).toBe('London');
    });
    
    it('should return undefined for non-existent path', () => {
      expect(pathProcessor.getNestedValue(testObj, 'user.location.city')).toBeUndefined();
    });
    
    it('should handle top-level properties', () => {
      expect(pathProcessor.getNestedValue(testObj, 'user')).toEqual(testObj.user);
    });
  });
  
  describe('setNestedValue', () => {
    let testObj: Record<string, any>;
    
    beforeEach(() => {
      testObj = {
        user: {
          address: {
            city: 'London'
          }
        }
      };
    });
    
    it('should set nested value', () => {
      pathProcessor.setNestedValue(testObj, 'user.address.zipcode', '123456');
      expect(testObj.user.address.zipcode).toBe('123456');
    });
    
    it('should create intermediate objects if they do not exist', () => {
      pathProcessor.setNestedValue(testObj, 'user.contact.email', 'test@example.com');
      expect(testObj.user.contact.email).toBe('test@example.com');
    });
    
    it('should skip null values when skipNull is true', () => {
      pathProcessor.setNestedValue(testObj, 'user.name', null, { skipNull: true });
      expect(testObj.user).not.toHaveProperty('name');
    });
    
    it('should not skip null values when preserveNull is true', () => {
      pathProcessor.setNestedValue(testObj, 'user.name', null, { skipNull: true, preserveNull: true });
      expect(testObj.user.name).toBeNull();
    });
    
    it('should skip undefined values when skipUndefined is true', () => {
      pathProcessor.setNestedValue(testObj, 'user.name', undefined, { skipUndefined: true });
      expect(testObj.user).not.toHaveProperty('name');
    });
    
    it('should skip both null and undefined in strict mode', () => {
      pathProcessor.setNestedValue(testObj, 'user.name1', null, { strict: true });
      pathProcessor.setNestedValue(testObj, 'user.name2', undefined, { strict: true });
      expect(testObj.user).not.toHaveProperty('name1');
      expect(testObj.user).not.toHaveProperty('name2');
    });
  });
  
  describe('cleanupEmptyObjects', () => {
    let testObj: Record<string, any>;
    
    beforeEach(() => {
      testObj = {
        user: {
          address: {
            city: 'London'
          },
          contact: {}
        }
      };
    });
    
    it('should remove empty objects', () => {
      pathProcessor.cleanupEmptyObjects(testObj, 'user.contact');
      expect(testObj.user).not.toHaveProperty('contact');
    });
    
    it('should not remove non-empty objects', () => {
      pathProcessor.cleanupEmptyObjects(testObj, 'user.address');
      expect(testObj.user).toHaveProperty('address');
    });
    
    it('should recursively clean up nested empty objects', () => {
      testObj.user.data = { profile: {} };
      pathProcessor.cleanupEmptyObjects(testObj, 'user.data.profile');
      expect(testObj.user).not.toHaveProperty('data');
    });
  });
}); 