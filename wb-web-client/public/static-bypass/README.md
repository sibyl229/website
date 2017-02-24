# bypass Webpack (hack)

`static-bypass/` folder will be copied to `build/` directory during build.

Normally, using `script-loader` is sufficient to process legacy modules.
In that case, you won't need this `static-bypass/` directory.

This directory is for modules that will break when processed by loaders.
For example, arbor.js.

> Arbor does some automatic path finding because it uses web workers, meaning you have to directly include it in a <script> in your <head>. Therefore, you can not combine arbor.js with your other JavaScript files — as you probably would as a part of the minification of the scripts in your webapp.
