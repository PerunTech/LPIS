/**
 * Truncate a string if it's longer than a certain number of characters
 * @param  {String} string The string that will be truncated
 * @param  {Number} n The number against which we're going to check the string length
 * @param  {Boolean} useWordBoundary Last word boundary (i.e. if the string should be truncated to the last whole word)
 */
export function truncate (string, n, useWordBoundary) {
  if (string.length <= n) return string
  const subString = string.substring(0, n - 1)
  return (useWordBoundary ? subString.substring(0, subString.lastIndexOf(' ')) : subString) + '...'
}
