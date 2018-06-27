"use strict";
var worker = navigator.serviceWorker.register('/meteroidPrime/sw-meteor.js');
var DODDLE = {
    test: false // Pour mettre  en débug...
};

// Bibli communes
DODDLE.noSleep = new NoSleep();
DODDLE.commons = new commons();
DODDLE.fetch = new clsFetch("req_meteroidPrime", "0.01");
DODDLE.store = new clsStore("sto_meteroidPrime", "0.01");
DODDLE.cookies = new clsCookies();
DODDLE.sound = new clsSound();

// Utilisatuon du loader (vieux machin...)...
myLoader.init(start);
var ctxAudio = myLoader.setAudioContext();
DODDLE.sound.init(ctxAudio);
myLoader.addImage("astro", "ressources/asteroid.png");
myLoader.addImage("vaisseau", "ressources/vaisseau.png");
myLoader.addImage("boum", "ressources/bam.png");
myLoader.addImage("zbam", "ressources/zbam.png");
myLoader.addImage("coin", "ressources/coin.png");
myLoader.addImage("energy", "ressources/burn.png");
myLoader.addSound("explosion", "ressources/boum.mp3");
myLoader.addSound("bouclier", "ressources/electricité.mp3");
myLoader.addSound("argent", "ressources/coin.mp3");
myLoader.addSound("bip", "ressources/beep.mp3");
myLoader.addSound("ambiance", "ressources/ambiance.mp3");
myLoader.addSound("collision", "ressources/collision.mp3");

$(document).ready(function () {
    myLoader.load();
});

function start() {
    console.log("start game");
    DODDLE.jeux = new clsAppli();
}
