export function closest (arr, target) {
  if (!arr || !arr.length) { return null }
  if (arr.length === 1) { return arr[0] }
  for (let i = 1; i < arr.length; i++) {
    // As soon as a number bigger than target is found, return the previous or current
    // number depending on which has smaller difference to the target.
    if (arr[i] > target) {
      const p = arr[i - 1]
      const c = arr[i]
      return Math.abs(p - target) < Math.abs(c - target) ? i - 1 : i
    }
  }
  // No number in array is bigger so return the last.
  return arr.length - 1
}
