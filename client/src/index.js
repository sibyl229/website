import './index.css';
import '../../root/css/jquery-ui.min.css';
import '../../root/css/main.css';

function main(err) {
  require('../../root/js/wormbase.js');
  // Initiate all other code paths.
  // If there's an error loading the polyfills, handle that
  // case gracefully and track that the error occurred.
}

function browserSupportsAllFeatures() {
  return window.Promise && window.fetch && window.Symbol;
}

if (browserSupportsAllFeatures()) {
  // Browsers that support all features run `main()` immediately.
  main();
} else {
  // All other browsers loads polyfills and then run `main()`.
  import('babel-polyfill').then(() => main());
}
