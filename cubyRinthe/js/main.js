"use strict";
//import b4w from "js/bw4.min.js";

var worker = navigator.serviceWorker.register('/cubyRinthe/sw-cuby.js');
var DODDLE = {
    test: false // Pour mettre  en débug...
};

// Bibli communes
DODDLE.noSleep = new NoSleep();
DODDLE.commons = new commons();

$(document).ready(function () {
    DODDLE.b4w = new ClassB4w();
});
