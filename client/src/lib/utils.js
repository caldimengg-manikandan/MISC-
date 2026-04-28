// src/lib/utils.js
// Utility function compatible with shadcn/ui pattern
// Merges class names without requiring clsx/tailwind-merge packages

/**
 * Combines class names, filtering out falsy values.
 * Drop-in replacement for the shadcn/ui cn() utility.
 * @param {...(string|boolean|null|undefined)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(" ");
}

