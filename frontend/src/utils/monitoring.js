export const detectTabSwitching = () => {
  return document.visibilityState === "hidden"
}

export const detectAppSwitching = () => {
  return !document.hasFocus()
}

