/**
 * Converts a number to base 62 hashid
 * @param num The number to convert
 * @returns Base 62 string representation
 */
export function toBase62(num: number): string {
  // Base 62 alphabet shuffled: 0-9, a-z, A-Z (62 characters, all present, no duplicates)
  // It makes sure that the shortcode is not predictable
  const BASE62_ALPHABET = '1zobMXZWkF6SRPfgJK2dYANILBh8nxeCwviGy70EHTUa3rs4mqDOQplu9cjV5t';

  if (num === 0) return BASE62_ALPHABET[0];

  let result = '';
  let n = num;

  while (n > 0) {
    result = BASE62_ALPHABET[n % 62] + result;
    n = Math.floor(n / 62);
  }
  return result;
}
