// Utility functions for monitoring suspicious activities

// Detect tab switching
export const detectTabSwitching = () => {
  return document.visibilityState === "hidden"
}

// Detect app switching
export const detectAppSwitching = () => {
  return !document.hasFocus()
}

// In a real application, you would implement more sophisticated monitoring
// such as tracking mouse movements, keyboard inputs, and using browser APIs
// to detect other suspicious behaviors
