export const importLazy = (promise, {globalName}={}) => (
  promise.then((result) => {
    if (result && result.default) {
      return result.default;
    } else if (window && globalName) {
      return window[globalName];
    }
  })
);
