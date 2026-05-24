/** @type {import("prettier").Config} */
export default {
  // Print width for line wrapping
  printWidth: 100,

  // Number of spaces per indentation level
  tabWidth: 2,

  // Use spaces instead of tabs
  useTabs: false,

  // Add trailing commas where valid in ES5
  trailingComma: 'es5',

  // Print spaces between brackets in object literals
  bracketSpacing: true,

  // Put the > of a multi-line JSX element at the end of the last line
  bracketSameLine: false,

  // Include parentheses around a sole arrow function parameter
  arrowParens: 'always',

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Add semicolons where valid
  semi: true,

  // Prose wrapping for markdown
  proseWrap: 'preserve',

  // End of line handling
  endOfLine: 'lf',

  // Quote props
  quoteProps: 'as-needed',
};
