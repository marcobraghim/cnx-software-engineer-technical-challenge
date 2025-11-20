import { genBase62FromNumber, decodeBase62FromToken } from './base62.util';

describe('Base62 Util', () => {
  const originalEnv = process.env.BASE62_SECRET_SALT;

  beforeEach(() => {
    // Set a fixed salt for consistent testing
    process.env.BASE62_SECRET_SALT = 'test-salt-12345';
  });

  afterEach(() => {
    process.env.BASE62_SECRET_SALT = originalEnv;
  });

  describe('genBase62FromNumber', () => {
    it('should generate a token from a number', () => {
      const token = genBase62FromNumber(123);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate consistent tokens for the same number', () => {
      const token1 = genBase62FromNumber(123);
      const token2 = genBase62FromNumber(123);
      expect(token1).toBe(token2);
    });

    it('should generate different tokens for different numbers', () => {
      const token1 = genBase62FromNumber(123);
      const token2 = genBase62FromNumber(456);
      expect(token1).not.toBe(token2);
    });

    it('should handle small numbers', () => {
      const token = genBase62FromNumber(1);
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should handle large numbers', () => {
      const token = genBase62FromNumber(999999999);
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should handle zero', () => {
      const token = genBase62FromNumber(0);
      expect(token).toBeDefined();
    });
  });

  describe('decodeBase62FromToken', () => {
    it('should decode a token back to the original number', () => {
      const originalNumber = 123;
      const token = genBase62FromNumber(originalNumber);
      const decoded = decodeBase62FromToken(token);
      expect(decoded).toBe(originalNumber);
    });

    it('should be reversible (encode then decode)', () => {
      const testNumbers = [1, 10, 100, 1000, 12345, 999999];
      
      testNumbers.forEach((num) => {
        const token = genBase62FromNumber(num);
        const decoded = decodeBase62FromToken(token);
        expect(decoded).toBe(num);
      });
    });

    it('should return null for invalid token', () => {
      const decoded = decodeBase62FromToken('invalid-token-!!!');
      expect(decoded).toBeNull();
    });

    it('should return null for empty string', () => {
      const decoded = decodeBase62FromToken('');
      expect(decoded).toBeNull();
    });

    it('should handle tokens generated from different numbers', () => {
      const num1 = 123;
      const num2 = 456;
      
      const token1 = genBase62FromNumber(num1);
      const token2 = genBase62FromNumber(num2);
      
      expect(decodeBase62FromToken(token1)).toBe(num1);
      expect(decodeBase62FromToken(token2)).toBe(num2);
      expect(decodeBase62FromToken(token1)).not.toBe(num2);
    });
  });

  describe('Integration: Encode and Decode', () => {
    it('should maintain consistency across multiple encode/decode cycles', () => {
      const originalNumber = 789;
      const token = genBase62FromNumber(originalNumber);
      
      // Decode multiple times
      const decoded1 = decodeBase62FromToken(token);
      const decoded2 = decodeBase62FromToken(token);
      const decoded3 = decodeBase62FromToken(token);
      
      expect(decoded1).toBe(originalNumber);
      expect(decoded2).toBe(originalNumber);
      expect(decoded3).toBe(originalNumber);
    });

    it('should work with sequential numbers', () => {
      for (let i = 1; i <= 100; i++) {
        const token = genBase62FromNumber(i);
        const decoded = decodeBase62FromToken(token);
        expect(decoded).toBe(i);
      }
    });
  });
});

