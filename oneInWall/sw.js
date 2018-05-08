importScripts("commonJS/ClassServiceWorker.js");

var files = ['index.html', 'css/index.css'];

var sw = new clsServiceWorker("oneInWall", "0.02", files);
