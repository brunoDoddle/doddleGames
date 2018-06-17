importScripts("commonJS/ClassServiceWorker.js");

var files = ['/meteroidPrime/json/manifest.json', '/meteroidPrime/index.html', 'commonJS/ClassServiceWorker.js'];

function myOwnFunctions() {
    // Gestion spécifiques des messages de météroid Prime
    this.messages = function (event) {
        console.log("[Proto Specific Messages called] : msg:" + event.data);
        //TODO; Faire les traitements spécifiques des messages...

        //event.ports[0].postMessage("I've no response for you !");
    }
}

// On ajoutes des proto spécifiques
clsServiceWorker.prototype = new myOwnFunctions();

var sw = new clsServiceWorker("meteroidPrime", "0.25", files);
