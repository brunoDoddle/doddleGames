//https://cloud.google.com/appengine/docs/standard/python/taskqueue/push/ <- parait pas être la bonne soluce...
importScripts("commonJS/ClassServiceWorker.js");

var files = [
    'favicon.ico',
    'index.html',
    'html/main.html',
    'html/mainHelp.html',
    'html/main.html',
    'css/page.css',
    'css/pageModel.css',
    '/fonts/PressStart2P.woff',
    'js/main.params.js',
    'js/main.js',
    'js/main.map.js',
    'js/pageModel.js',
    'js/tools.js',
    'js/fetch.js',
    'js/animated.js',
    'js/markerWithLabel.js',
    'json/manifest.json',
    'commonJS/sha.min.js',
    'commonJS/common.js',
    'commonJS/noSleep.js',
    'commonJS/zepto.min.js',
    'commonJS/ClassServiceWorker.js',
    'svg/wait.svg',
    'svg/back.svg',
    'svg/target.svg',
    'svg/off.svg',
    'png/sword.png',
    'png/army.png',
    'png/soldats.png',
    'png/tour30x40.png',
    'png/bam90x90.png',
    'png/fleche.png',
    'png/laCene.png',
    "png/cycle.png"
];

var sw = new clsServiceWorker("strasWar", "0.03", files);
