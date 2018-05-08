'use strict';
// 1
// Bonus goal terminé, ajouter point avec les caseToWalize qui ne sont pas fini... (durant le winner/looser) Faire pareil avec le restant du compteur de temps...
// 2
// Terminer comptage objets (utilsatio oBax et pBOx)
//---------------------------------------------------------------------------------
// A faire à la maison
//---------------------------------------------------------------------------------
// 1
// menu virer le fond tournant contre une image ou une animation
//---------------------------------------------------------------------------------
// Fait
//---------------------------------------------------------------------------------
//****************************************************************************************
//****************************************************************************************
// Idées pour tableaux:
// =========================================
// objectif temp + cases liés
// objectf case fin lié si existente
// objectif objets lié si exitent
// objets qui font grossir ou rapetissir ?
//****************************************************************************************
//****************************************************************************************
var DODDLE = {
    test: false
};
// Partie principale du jeux
DODDLE.game = new baseGame();
// Certaines fonctions sont isolées dasn function.js
// et d'autre extensions misent dans d'autre 'classe' pour que ce soit plus lisible
DODDLE.particle = new Particle();
DODDLE.messages = new messages();
DODDLE.objects = new gameObjects();
DODDLE.file = new file();
DODDLE.commons = new commons();
DODDLE.noSleep = new NoSleep();
//****************************************************************************************
//****************************************************************************************

//****************************************************************************************
//* méthode publique
//****************************************************************************************
function baseGame() {
    //*********************************************************
    //* Le service Worker
    //*********************************************************
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/oneInWall/sw.js').then(function (reg) {

            if (reg.installing) {
                console.log('Service worker installing');
            } else if (reg.waiting) {
                console.log('Service worker installed');
            } else if (reg.active) {
                console.log('Service worker active');
            }

        }).catch(function (error) {
            console.log('Registration failed with ' + error);
        });
    }
    //*********************************************************
    //* Constantes
    //*********************************************************
    const C_START = "ST",
        C_INIT = "I",
        C_LOADING = "L",
        C_MENU = "M",
        C_SELECTLEVEL = "S",
        C_SELECTWORLD = "W",
        C_GAME = "G",
        C_ENDGAME = "X";
    //*********************************************************
    //* Variables privées
    //*********************************************************
    var canvas, context; // pour l'affichage final
    var x, y, oldX, oldY, taille, oldTaille;
    var oldPosX, oldPosY;
    var alive = true; // Joueur en vie
    var deadSort = ""; // Comment est mort le joueur...
    var GO = false; // attends avant que le personnage puisse tre commandé

    // Redefinition des objectifs
    var GOALPercent = undefined; // Pourcentage du tableau a remplir
    var GOALObject = undefined; // Nombre d'objets à ramasser
    var GOALCase = undefined; // Case sur laquelle on doit finir
    var GOALTime = undefined; // Temps pour finur le tableau

    var noMoreCase = false; // Encore des case à parcourir ??

    var whereInGame = C_START; // Ou est on dans le jeux (gestion backButton) ?

    var acc = {
        x: 0,
        y: 0,
        z: 0
    }; // Acceleration pour le fake mode browser
    var keyPress = false;

    var dX, dY; // tailles des cases
    var lX = 30; // Nombres de case voulu
    var lY = 60;
    var interval = null; // Timer pour animation fond et fake mode browser
    var timeOut = null; // Timer pour fin de jeux
    var blockOut = null; // Timer pour virer blocking
    var joueur;
    var down = [];
    var gameInterval = 1000 / 25; // Interval pour le jeux (25/seconde)
    var menuInterval = 1000 / 50; // Interval pour le menu
    var endInterval = 2000; // Interval pour la fin du jeux
    var waitGo = 3000; // Interval avant le go
    var currentWorld = undefined;
    var currentLevel = undefined;
    var currentGrid = undefined;
    var cubeGraph;
    var cubes = []; // Liste des cubes a faire grosir
    var tempoCube = 10; // temps pour aficher un cube entier à l'ecran

    var worlds = [
        {
            name: 'Beginning',
            levels: [
                {
                    name: 'w1lvl1',
                    ok: false
                }, {
                    name: 'w1lvl2',
                    ok: false
                }, {
                    name: 'w1lvl3',
                    ok: false
                }, {
                    name: 'w1lvl4',
                    ok: false
                }, {
                    name: 'w1lvl5',
                    ok: false
                }, {
                    name: 'w1lvl6',
                    ok: false
                }
            ],
            picto: 'world1',
            lock: false
            }, {
            name: 'Real live',
            levels: [{
                    name: 'w2lvl1',
                    ok: false
                }, {
                    name: 'w2lvl2',
                    ok: false
                }, {
                    name: 'w2lvl3',
                    ok: false
                }, {
                    name: 'w2lvl4',
                    ok: false
                }, {
                    name: 'w2lvl5',
                    ok: false
                }, {
                    name: 'w2lvl6',
                    ok: false
                }, {
                    name: 'w2lvl7',
                    ok: false
                }, {
                    name: 'w2lvl8',
                    ok: false
                }, {
                    name: 'w2lvl9',
                    ok: false
               }
            ],
            picto: 'world2',
            lock: true
        }
    ]

    function block() {
        $("#blocking").show();
        //TODO: Ajouter tmeOut pour vire le blocking...
        blockOut = setTimeout(function () {
            $("#blocking").hide()
        }, 800);
    }

    //*********************************************************
    //* Méthodes publiques
    //*********************************************************
    // Permet de décider la prochaine étapes
    // ======================================
    // FIXIME: ajouter div qui recouvre l'écran pour empecher double click pendant whatNext
    this.whatsNext = function (options) {
        console.debug("whatNext:" + whereInGame);
        block();
        if (whereInGame == C_START) { // On demmare ici par défaut
            initialize();
        } else if (whereInGame == C_INIT) {
            // En fonction du context on utilise le browser ou le telephone
            if (DODDLE.commons.testPhone()) {
                console.log("mobile mode");
            } else {
                console.log("browser mode");
            }
            onDeviceReady();
        } else if (whereInGame == C_LOADING) {
            $("#loader").hide(); // cache le loader
            $("#game").show(); // affiche la zone de jeu (enfin le fond quoi..)
            // Tout est chargé on créé les affichages qui ne doivent pass être refait systématiquement
            runMenu();
        } else if (whereInGame == C_MENU) {
            hideMenu();
            runSelectWorld();
            showWorld();
        } else if (whereInGame == C_SELECTWORLD) {
            hideWorld();
            runSelectLevel();
            showLevel();
        } else if (whereInGame == C_SELECTLEVEL) {
            if (DODDLE.commons.testPhone()) DODDLE.noSleep.enable();
            hideLevel(); // On cache les élément du level selector
            runGame(options);
        } else if (whereInGame == C_GAME) { // Insertion ici d'un ecran de fin de jeux (gagné perdu ??)
            if (DODDLE.commons.testPhone()) DODDLE.noSleep.disable();
            stopWatchs();
            DODDLE.percent.hide();
            DODDLE.time.hide();
            runEndGame();
            showEndGame();
        } else if (whereInGame == C_ENDGAME) {
            hideEndGame();
            runSelectLevel();
            showLevel();
        }
    };

    // Permet de décider l'étapes précédentes
    // ======================================
    // FIXIME: ajouter div qui recouvre l'écran pour empecher double click pendant whatsPrev
    this.whatsPrev = function (options) {
        if (whereInGame == C_GAME) {
            DODDLE.percent.hide();
            DODDLE.time.hide();
            runSelectLevel();
            showLevel();
        } else if (whereInGame == C_SELECTWORLD) {
            hideWorld();
            showMenu();
        } else if (whereInGame == C_SELECTLEVEL) {
            hideLevel();
            runSelectWorld();
            showWorld();
        } else if (whereInGame == C_MENU) {
            quittAPP();
        }
    };

    //*********************************************************
    //* Méthodes privés
    //*********************************************************
    function initialize() {
        // On cible le canvas cible et son context
        console.log("Initialize");
        whereInGame = C_INIT;

        // On créés les elements ayants besoin du DOM pour exister
        // pourrait être  poser avant dasn la page html (gagne Perdu, selectLevel)..
        DODDLE.percent = new gamePercent();
        DODDLE.time = new gameTime();

        canvas = $('#canvas')[0];
        context = canvas.getContext("2d");

        // On initialize le contexte
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        x = canvas.width / 2;
        y = canvas.height / 2;
        oldX = x;
        oldY = y;
        dX = canvas.width / lX;
        dY = canvas.height / lY;

        context.strokeStyle = "#000000";

        // liée a SEEDDATAS
        DODDLE.file.readLocal("worlds", seedDatas);
    }

    function seedDatas(msg, datas) {
        if (msg == "") { // Si on a un message c'est qu'il n'y pas eu de fichier a lire...
            console.log(datas);
            datas.forEach(dataWorld => {
                worlds.forEach(world => {
                    if (dataWorld.name == world.name) {
                        world.lock = dataWorld.lock; // Le lock sur le world
                        dataWorld.levels.forEach(dataLevel => {
                            world.levels.forEach(level => {
                                if (dataLevel.name == level.name) level.ok = dataLevel.ok; // et la réussite du tableau
                            });
                        });
                    }
                });
            });
        }
        // Si pas de sauvegarde on lance le jeux sans recup de données
        DODDLE.game.whatsNext();
    }

    function quittAPP() {
        console.log("quit APP");
        stopWatchs();
        window.close();
        //        navigator.app.exitApp();
    }

    // deviceready Event Handler
    function onDeviceReady() {
        console.log("loading");
        whereInGame = C_LOADING;

        // Utile que pour cordova, mais ne gène pas pour browserMode
        document.addEventListener('backbutton', onBackButton, false);

        myLoader.init(DODDLE.game.whatsNext); // A la fin du chargement on lance (le truc entre paranthèse)

        //= Ressources à charger -> toujours après l'init
        //=======================
        myLoader.addImage('back', 'png/back.png');
        myLoader.addImage('next', 'png/next.png');
        myLoader.addImage('board2Color', 'png/board2Color.png');
        myLoader.addImage('boardColor', 'png/boardColor.png');
        myLoader.addImage('joueur', 'png/joueur.png');
        myLoader.addImage('logo', 'png/logo.png');
        myLoader.addImage('titre', 'png/titre.png');
        myLoader.addImage('fond', 'png/fond.png');
        myLoader.addImage('world1', 'png/world1.png');
        myLoader.addImage('world2', 'png/world2.png');
        myLoader.addImage('ok', 'svg/ok.svg');
        myLoader.addImage('clock', 'svg/clock.svg');
        myLoader.addImage('gift', 'svg/gift.svg');
        myLoader.addImage('giftToCollect', 'png/piece.png');
        myLoader.addImage('cube', 'svg/cube.svg');
        myLoader.addImage('cubeGraph', 'png/cubeGraph.png');
        myLoader.addImage('attends', 'png/attends.png');

        // Faire une séparation des tableaux sur espace de noms
        myLoader.addText('w1lvl1', 'levels/level1_1.json');
        myLoader.addText('w1lvl2', 'levels/level1_2.json');
        myLoader.addText('w1lvl3', 'levels/level1_3.json');
        myLoader.addText('w1lvl4', 'levels/level1_4.json');
        myLoader.addText('w1lvl5', 'levels/level1_5.json');
        myLoader.addText('w1lvl6', 'levels/level1_6.json');

        myLoader.addText('w2lvl1', 'levels/old/level1.json');
        myLoader.addText('w2lvl2', 'levels/old/level2.json');
        myLoader.addText('w2lvl3', 'levels/old/level3.json');
        myLoader.addText('w2lvl4', 'levels/old/level4.json');
        myLoader.addText('w2lvl5', 'levels/old/level5.json');
        myLoader.addText('w2lvl6', 'levels/old/level6.json');
        myLoader.addText('w2lvl7', 'levels/old/level7.json');
        myLoader.addText('w2lvl8', 'levels/old/level8.json');
        myLoader.addText('w2lvl9', 'levels/old/level9.json');

        // Et c'est le loader qui fera la suite via son callBack
        myLoader.load(); // Ben maintenant on load
    }

    // ========================================================
    // == gestion du bouton de retour
    // ========================================================
    function onBackButton() {
        // Ouah ça dechire...
        DODDLE.game.whatsPrev("back");
    }

    // =====================================================================================================
    // =====================================================================================================
    // == MENU
    // =====================================================================================================
    // =====================================================================================================
    function runMenu() {
        console.log("run menu");
        whereInGame = C_MENU;

        if ($("titre") != null) {
            // Utilisation d'une balise image pour piloter affichage facilement et profiter du loader d'image
            var img = myLoader.getRessource("titre");
            img.setAttribute("class", "c vcIn hc10");
            img.setAttribute("id", "titre");
            $("#game").prepend($(img));
            /*            $("#game").prepend($('<img>', {
                            id: 'titre',
                            class: 'c vcIn hc0',
                            src: convertImgToUri(myLoader.getRessource("titre"))
                        }));    */

            $("#game").prepend($('<div>', {
                id: 'runButton',
                class: 'c vcIn hc50 boutonarticle',
                text: 'RUN'
            }));
            $("#runButton").click(function () {
                DODDLE.game.whatsNext();
            });

            $("#game").prepend($('<div>', {
                id: 'quitButton',
                class: 'c vcIn hc70 boutonarticle',
                text: 'QUIT'
            }));
            $("#quitButton").click(function () {
                quittAPP();
            });
        } else {
            showMenu();
        }

        // On sauve un peu le context, vu qu'on a un fond tournant après..
        context.save();
        // On stop les services au cas ou......
        stopWatchs();

        interval = setInterval(drawFondMenu, menuInterval);
    }

    // A voir si ça vaut vraiment le coups... Ou trouver un fond sympa a afficher ???
    var xx = 0;

    function drawFondMenu() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(Math.PI / 180 / 5);
        if (xx === 0) {
            context.scale(2.5, 2.5);
            xx = 1;
        }
        context.translate(-canvas.width / 2, -canvas.height / 2);
        context.drawImage(myLoader.getRessource("fond"), canvas.width / 2 - 200, canvas.height / 2 - 200);
    }

    function hideMenu() {
        $("#titre").toggleClass('vcIn vcOut');
        $("#runButton").toggleClass('vcIn vcOut');
        $("#quitButton").toggleClass('vcIn vcOut');
    }

    function showMenu() {
        whereInGame = C_MENU;
        $("#titre").toggleClass('vcIn vcOut');
        $("#runButton").toggleClass('vcIn vcOut');
        $("#quitButton").toggleClass('vcIn vcOut');
    }

    // =====================================================================================================
    // =====================================================================================================
    // == SELECT WORLD
    // =====================================================================================================
    // =====================================================================================================
    function runSelectWorld() {
        console.log("run select world");

        if ($('#wButton').length === 0) {
            var b = $("#selectWorld section:first-child").prepend($('<img>', {
                id: 'wButton',
                class: 'backButton',
                src: convertImgToUri(myLoader.getRessource("back"))
            }));
            b.click(function () {
                DODDLE.game.whatsPrev();
            });
        }

        $("#selectWorld > article").empty();

        worlds.forEach((world, n) => {
            $("#selectWorld > article").append("<div class='lvlDsc'><div id='w" + n + "' class='title'></div><img id='imgWrld" + n + "'></img></div>");
            var wrld = $('#w' + n);
            var imgWrld = $('#imgWrld' + n);
            var img = myLoader.getRessource(world.picto);

            imgWrld.attr('num', n);
            imgWrld.attr('src', convertImgToUri(img));
            wrld.text(world.name);

            if (world.lock)
                imgWrld.addClass('greyScale');
            else {
                imgWrld.click(function () {
                    currentWorld = worlds[this.getAttribute('num')];
                    console.log(" world selection " + this.getAttribute('num'));
                    DODDLE.game.whatsNext(this.getAttribute('num'));
                });
            }
        });
    }

    function showWorld() {
        whereInGame = C_SELECTWORLD;
        $("#selectWorld").show();
        $("#selectWorld").addClass('vcIn');
        $("#selectWorld").removeClass('vcOut');
    }

    function hideWorld() {
        $("#selectWorld").addClass('vcOut');
        $("#selectWorld").removeClass('vcIn');
    }
    // =====================================================================================================
    // =====================================================================================================
    // == SELECT LEVEL
    // =====================================================================================================
    // =====================================================================================================
    function runSelectLevel() {
        console.log("run select level");

        if ($('#lButton').length === 0) {
            var b = $("#selectLevel section:first-child").prepend($('<img>', {
                id: 'lButton',
                class: 'backButton',
                src: convertImgToUri(myLoader.getRessource("back"))
            }));
            b.click(function () {
                DODDLE.game.whatsPrev();
            });
        }

        var txt, map, jsonMap, n = 1,
            levelDetails;
        // On supprime tous ce qui doit l'être (mais c'est utile comme commentaire)
        $("#selectLevel > article").empty();

        currentWorld.levels.forEach((level, n) => {
            txt = myLoader.getRessource(level.name);
            jsonMap = JSON.parse(txt);
            // affichage d'un tableau
            //            $("#selectLevel > article").append("<div class='lvlDsc'><span><canvas id='" + level.name + "' class='level' width='80px' height='160px'/></span><span id='dsc" + level.name + "'></span></div>");
            $("#selectLevel > article").append("<div class='lvlDsc' id='" + level.name + "'><span></span></div>");

            //var levelDetails = $('#' + level.name);
            var dsc = $('#' + level.name + ' > span');
            dsc.append($('<div>', {
                text: jsonMap.layers[0].name,
                class: 'title',
                id: 'title_' + level.name
            }));
            var title = $('#title_' + level.name);
            // Affichages des objectifs
            // objectif pourcentages de cubes
            if (jsonMap.properties.objectif != undefined)
                dsc.append($('<div class="title"><img class="imgLevel" src="' + convertImgToUri(myLoader.getRessource("cube")) + '"/><span>' + jsonMap.properties.objectif + '%</span></div>'));
            //         Objectif temps
            if (jsonMap.properties.temps != undefined) {
                dsc.append($('<div class="title"><img class="imgLevel" src="' + convertImgToUri(myLoader.getRessource("clock")) + '"/><span>' + jsonMap.properties.temps + '</span></div>'));
            }
            //var ctx = levelDetails[0].getContext("2d");
            var d = new drawGridMap(txt);
            //d.drawMap(ctx);
            var c = d.count();

            // Objectif case de fin
            if (c.end != undefined) {
                dsc.append($('<div class="title"><img class="imgLevel" src="' + convertImgToUri(myLoader.getRessource("next")) + '"/><span>Finish</span></div>'));
            }
            // Objectif nombre d'objet
            if (c.objets > 0) {
                dsc.append($('<div class="title"><img class="imgLevel" src="' + convertImgToUri(myLoader.getRessource("gift")) + '"/><span>' + c.objets + '</span></div>'));
            }

            //FIXME: a faire autrement
            if (level.ok)
                title.append($('<img class="imgLevel" src="' + convertImgToUri(myLoader.getRessource("ok")) + '"/>'));

            // Affectation du click
            dsc.parent().click(function () {
                console.log(" play " + this.id);
                DODDLE.game.whatsNext(this.id);
            });
        });
    }

    function showLevel() {
        whereInGame = C_SELECTLEVEL;
        $("#selectLevel").show();
        $("#selectLevel").addClass('vcIn');
        $("#selectLevel").removeClass('vcOut');
    }

    function hideLevel() {
        $("#selectLevel").addClass('vcOut');
        $("#selectLevel").removeClass('vcIn');
    }

    // =====================================================================================================
    // =====================================================================================================
    // == GAME
    // =====================================================================================================
    // =====================================================================================================
    function runGame(id) {
        var txt, jsonMap;
        DODDLE.messages.init();

        console.log("run game");

        GO = false;
        whereInGame = C_GAME;
        currentLevel = id;

        DODDLE.particle.init();
        DODDLE.percent.init();
        DODDLE.time.init();
        DODDLE.messages.init();

        cubes = [];
        alive = true;
        taille = 1; // Il faudrait recalculer la taille par rapport au nombre de case en largeur
        oldTaille = taille;
        down = [];

        // NOuveaux objectifs
        GOALPercent = undefined; // Pourcentage du tableau a remplir
        GOALObject = undefined; // Nombre d'objets à ramasser
        GOALCase = undefined; // Case sur laquelle on doit finir
        GOALTime = undefined; // Temps pour finur le tableau

        x = canvas.width / 2;
        y = canvas.height / 2;
        oldX = x;
        oldY = y;
        oldPosX = undefined;
        oldPosY = undefined;

        clearInterval(interval); // On vire l'animation du fond (utile un peu près une fois...)
        context.restore(); // On remet le canvas en état
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Le joueur
        joueur = new clsSprite();
        joueur.set(myLoader.getRessource("joueur"));
        joueur.setBoundaries(11, 67, 49, 32);
        joueur.setCenter(35, 80);
        joueur.add("avance", 70, 100, [{
            x: 0,
            y: 0,
            nb: 40
        }], 1);

        joueur.angle = 0;
        joueur.vitesse = 0;

        // Mouerf on relis le tableaux.. Déjà fait dans le selectLevel..
        txt = myLoader.getRessource(id);
        jsonMap = JSON.parse(txt);

        // Lecture et Placement des objectifs
        GOALPercent = {
            on: false
        };
        if (jsonMap.properties.objectif != undefined) {
            DODDLE.percent.setPercent2Win(jsonMap.properties.objectif);
            GOALPercent.on = true;
            GOALPercent.value = jsonMap.properties.objectif;
            GOALPercent.reach = false;
        }
        GOALTime = {
            on: false
        };
        if (jsonMap.properties.temps != undefined) {
            GOALTime.on = true;
            GOALTime.value = jsonMap.properties.temps;
            GOALTime.reach = false;
            DODDLE.time.setCounterTime(GOALTime.value);
        }

        myTMXDecodeur.width = jsonMap.width;
        myTMXDecodeur.height = jsonMap.height;

        // Si la taille n'est pas précisé on la calcul
        if (jsonMap.properties.taille != undefined) taille = parseFloat(jsonMap.properties.taille);
        else taille = 3.5 / myTMXDecodeur.width;

        // mouerf pas terrible.... Mais obligatoire
        lX = jsonMap.width;
        lY = jsonMap.height;

        // On draw ce dont on a besoin pour le jeux et on calcul les cases vides...
        //var ctx = canvasBoardGame.getContext("2d");
        currentGrid = new drawGridMap(txt, canvas.width, canvas.height);
        var c = currentGrid.count();

        DODDLE.percent.setMax(c.nullCase);
        dX = c.dX;
        dY = c.dY;
        // placement du joueur
        x = (c.start.x + .5) * dX;
        y = (c.start.y + .5) * dY;
        // Mise en place objectif case de fin
        GOALCase = {
            on: false
        };
        if (c.end != undefined) {
            GOALCase.on = true;
            GOALCase.value = c.end;
            GOALCase.reach = false;
        }
        // Mise en place objectif nb objets
        GOALObject = {
            on: false
        };
        if (c.objets > 0) {
            GOALObject.on = true;
            GOALObject.reach = false;
        }

        // Mise en forme du score haut (percent + object)
        $("#oBox").removeClass("score30");
        $("#oBox").empty();
        $("#oBox").removeClass("score100");
        $("#pBox").removeClass("score70");
        $("#pBox").removeClass("score100");
        if (GOALObject.on && GOALPercent.on) {
            DODDLE.objects.init(c.objets);
            $("#oBox").addClass("score30");
            $("#pBox").addClass("score70");
        } else if (GOALObject.on && !GOALPercent.on) {
            DODDLE.objects.init(c.objets);
            $("#oBox").addClass("score100");
        } else if (!GOALObject.on && GOALPercent.on) {
            $("#pBox").addClass("score100");
        }

        oldX = x;
        oldY = y;

        // Juste pour afficher le tableau...
        movePlayer({
            x: 0,
            y: 0,
            z: 0
        });

        DODDLE.messages.add('Ready?');
        timeOut = setTimeout(goGoGame, waitGo);

        if (DODDLE.commons.testPhone() && DODDLE.test == false)
            bindBrowserAccelerometer();
        else
            bindBrowserkey();
    }

    function goGoGame() {
        DODDLE.messages.addBigMsg("GO!");
        GO = true;
        if (GOALTime) DODDLE.time.go = true;
    }

    function bindBrowserAccelerometer() {
        console.log("phone appli ready");
        var divisor = 3; // Pour avoir un mouvement moins rapide à l'écran
        clearInterval(gameInterval);
        interval = setInterval(drawPhone, gameInterval);
        acc = {
            x: 0,
            y: 0,
            z: 0
        }

        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", function () {
                // TODO: Dégueulasse, à refaire... Repenser... Je pense savoir ce que je vouais dire à l'époque mais à brûle-pourpoint la je vois plus :-)
                acc = {
                    x: (-event.gamma) / divisor,
                    y: (event.beta) / divisor,
                    z: (event.alpha) / divisor
                };
                joueur.angle = -(Math.atan2(acc.y, acc.x)) * 180 / Math.PI + 360;
                joueur.angle = joueur.angle % 360;
            }, true);
        } else console.error("DeviceOrientationEvent non supporté!");
    }

    function bindBrowserkey() {
        console.log("browserKey appli ready");
        clearInterval(gameInterval);
        interval = setInterval(drawBrowser, gameInterval);
        $(document).off("keydown");
        $(document).keydown(function (e) {
            down[e.keyCode] = true;
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });
        $(document).keyup(function (e) {
            down[e.keyCode] = false;
        });
    }

    function drawPhone() {
        movePlayer(acc);
    }

    function drawBrowser() {
        if (down[37]) // left
            joueur.angle -= 10;
        if (down[39]) // right
            joueur.angle += 10;

        if (down[38]) { // up
            keyPress = true;
            joueur.vitesse += 1;
            if (joueur.vitesse > 5) joueur.vitesse = 5;
        }
        if (down[40]) { // down
            joueur.vitesse -= 1;
            if (joueur.vitesse < 0) joueur.vitesse = 0;
        }

        if (!keyPress) {
            joueur.vitesse -= 1;
            if (joueur.vitesse < 0) joueur.vitesse = 0;
        }

        if (joueur.angle <= 0) joueur.angle = 360 + joueur.angle;
        if (joueur.angle >= 360) joueur.angle = joueur.angle - 360;

        acc = {
            x: Math.cos(joueur.angle * Math.PI / 180) * joueur.vitesse,
            y: -Math.sin(joueur.angle * Math.PI / 180) * joueur.vitesse,
            z: 0,
        };

        movePlayer(acc);
        keyPress = false;
    }

    // ================================
    // = Boucle principale du jeux
    // ================================
    function movePlayer(acceleration) {
        var curPosX, curPosY, test;
        var left, right, top, bottom;
        var xc, yc;
        var endOfGame = false;

        // affichage du terrain
        context.clearRect(0, 0, canvas.width, canvas.height);
        currentGrid.drawOnlyNonCoveringMap(context);

        // si on est en vie on bouge
        if (alive && GO) {
            x -= acceleration.x;
            y += acceleration.y;
        }

        curPosX = Math.round((x - dX / 2) / dX);
        curPosY = Math.round((y - dY / 2) / dY);
        if (oldPosX == undefined) oldPosX = curPosX;
        if (oldPosY == undefined) oldPosY = curPosY;

        // Detection du changement de case
        if ((curPosX != oldPosX || curPosY != oldPosY) &&
            currentGrid.noBlueCase(oldPosX, oldPosY) &&
            currentGrid.isEmpty(oldPosX, oldPosY)) {
            currentGrid.addBlueCase(oldPosX, oldPosY); // Plus vraiment bleue....
        }

        // Affichage du joueur
        // ===================
        joueur.x = x;
        joueur.y = y;

        // =======================================================
        // = Enclave d'enregistrement
        // =======================================================
        //context.save();
        // =======================================================
        // Affichage du tank
        // ===================
        // Calcul de l'angle pour afficher le bon "tank"
        var frame = Math.round(joueur.angle / 360 * joueur.getAnimNb("avance"));
        if (frame == joueur.getAnimNb("avance")) frame = 0; // La dernière = la première...
        // On blit... et forcément par dessus...
        context.globalCompositeOperation = "source-over";
        if (alive) joueur.drawXYF(context, "avance", x, y, frame, taille);

        currentGrid.drawOnlyCoveringMap(context);
        //        currentGrid.tint(context);

        // ******************************
        // * test de collision
        // ******************************
        // avec le mur
        if (alive) {
            test = joueur.getBoundaries(taille);
            top = Math.round((test.y - dY / 2) / dY);
            bottom = Math.round((test.Y - dY / 2) / dY);
            left = Math.round((test.x - dX / 2) / dX);
            right = Math.round((test.X - dX / 2) / dX);

            if (currentGrid.testMur(top, left) || currentGrid.testMur(top, right) || currentGrid.testMur(bottom, left) || currentGrid.testMur(bottom, right)) {
                deadSort = "wall";
                timeOut = setTimeout(DODDLE.game.whatsNext, endInterval);
                DODDLE.messages.add('bam!');
                DODDLE.particle.createExplosion(x, y);
                alive = false;
            }
            // avec les trous on utilise le centre du véhicule
            xc = Math.round((x - dX / 2) / dX);
            yc = Math.round((y - dY / 2) / dY);
        }

        // =======================================================
        // = Fin de l'enclave on restore
        // =======================================================
        //context.restore();
        // =======================================================

        // gestion des différentes morts
        if (!alive) {
            if (deadSort == "wall")
                DODDLE.particle.update(context, currentGrid.giveMeMap(), dX, dY);
        } else {
            //========================================================================
            // vérifications des objectifs fin de tableau
            //========================================================================
            var caseRestante = currentGrid.returnNullCase();
            if (GOALPercent.on) {
                if (DODDLE.percent.maj(caseRestante)) GOALPercent.reach = true;
                if (GOALPercent.reach) {
                    endOfGame = true;
                } else {
                    endOfGame = false;
                }
            }
            if (GOALObject.on) {
                var objRestant = currentGrid.testGetable(top, bottom, left, right);
                DODDLE.objects.setScore(objRestant);
                if (objRestant <= 0 && !GOALObject.reach) {
                    DODDLE.messages.add('Objects ok!');
                    GOALObject.reach = true;
                }
                if (GOALObject.reach) endOfGame = endOfGame & true;
                else endOfGame = false;
            }
            // Si tous les goal précédents sont ok et qu'on est sur la bonne case on valide
            // la fin
            if (GOALCase.on) {
                if (xc == GOALCase.value.x && yc == GOALCase.value.y && endOfGame == true) {
                    GOALCase.reach = true;
                    DODDLE.messages.add('Goal!');
                } else GOALCase.reach = false;

                if (GOALCase.reach) endOfGame = endOfGame & true;
                else endOfGame = false;
            }
            //========================================================================
            // Les finisseurs de partie (autre que la mort)
            //========================================================================
            if (GOALTime.on) {
                // SI ce n'est pas fini on test si le temp l'est...
                if (!endOfGame) endOfGame = DODDLE.time.isEndOfTime();
            }
            //FIXME: a quoi ça sert ça ??
            /*
                        if (DODDLE.percent.testNoCase(caseRestante)) {
                            DODDLE.messages.add('No more case');
                            noMoreCase = true;
                            endOfGame = true;
                        }*/
            if (endOfGame) {
                DODDLE.time.timeGoal();
                DODDLE.messages.add('End Game!');
                console.log("jeux fini");
                $(document).off("keydown");
                stopWatchs(); // On clear les watchs et met un intervales pour pouvoir lire les messages
                timeOut = setTimeout(DODDLE.game.whatsNext, endInterval);
            } else {
                DODDLE.time.update();
            }
        }
        // Mise a jour de la pile des messages
        DODDLE.messages.update();

        // On lance les différentes animations
        currentGrid.animMapTile();
        currentGrid.animTilesList();

        // Sauvegarde de ce qui doit l'être
        oldX = x;
        oldPosX = curPosX;
        oldY = y;
        oldPosY = curPosY;
    }

    // =====================================================================================================
    // =====================================================================================================
    // == ENDGAME
    // =====================================================================================================
    // =====================================================================================================
    function runEndGame() {
        console.log("runEndGame");

        DODDLE.messages.init();
        var won = true;

        if (GOALPercent.on && !GOALPercent.reach) won = false;
        if (GOALCase.on && !GOALCase.reach) won = false;
        if (GOALObject.on && !GOALObject.reach) won = false;

        $("#endGame .win").hide();
        $("#endGame .loose").hide();

        if (won) {
            console.log("you win!");
            setLevel(true);
            $("#endGame .win").show();
            // controle pour voir si débloquage du monde suivant
            var unlock = true; // Le premier monde est toujours unlock

            worlds.forEach(world => {
                if (world.lock) {
                    if (unlock) {
                        world.lock = false;
                        console.log(world.name + " unlocked!");
                        DODDLE.messages.addBigMsg("next world unlocked");
                    }
                }

                unlock = true;
                world.levels.forEach(level => {
                    unlock = unlock && level.ok;
                });
            });
            console.log("sauvegarde...");
            DODDLE.file.writeLocal("worlds", worlds);
        } else {
            $("#endGame .loose").show();
        }
    }

    function showEndGame() {
        whereInGame = C_ENDGAME;
        $("#endGame").show();
        $("#endGame").addClass('vcIn');
        $("#endGame").removeClass('vcOut');
    }

    function hideEndGame() {
        $("#endGame").addClass('vcOut');
        $("#endGame").removeClass('vcIn');
    }

    // =====================================================================================================
    // =====================================================================================================
    // == FONCTIONS GENERALES, vraiment pas bien ça... Mais bon hein...
    // =====================================================================================================
    // =====================================================================================================
    function stopWatchs() {
        window.removeEventListener("deviceorientation", function () {});
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        if (timeOut) {
            clearTimeout(timeOut);
            timeOut = null;
        }
    }

    function onError() {
        alert('onError!');
    }

    function setLevel(value) {
        for (var level in currentWorld.levels) {
            if (currentLevel == currentWorld.levels[level].name) {
                currentWorld.levels[level].ok = true;
                break;
            }
        }
    };

    // La page principale est chargé on lance le reste
    $(document).ready(
        function () {
            $("#blocking").hide();
            DODDLE.game.whatsNext();
        }
    );
}
