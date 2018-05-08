importScripts("commonJS/ClassServiceWorker.js");

var files = ['/cubyRinthe/json/manifest.json', '/cubyRinthe/index.html', 'commonJS/ClassServiceWorker.js'];

var sw_cuby = new clsServiceWorker("cubyRinthe", "0.10", files);
