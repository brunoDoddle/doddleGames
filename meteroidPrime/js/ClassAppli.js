// durant partie web, web passe à false et stored à true ?? Ui a fait ça ?? Directory ?? RETRY ??
function clsAppli() {
    // UID de l'appareil...
    var auid = null;
    // UID ndb en base, si vide impossible de se connecter
    var persoUUID = null;
    var levelUUID = null;

    // Récupération des différents éléments interactifs
    var blocker = $("#block");
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var intervalMeteorLaunch = undefined;
    var intervalMeteorLaunchTime = 500; // temps entre rangé d'asteroid
    var interval = undefined;
    var intervalTime = 30; // fps animation
    var launchedMeteors = [];
    var cptLaunchedMeteors = 0;

    var startGame;
    var startMeteor;

    var web = false,
        stored = false,
        levelName = "";

    var worldLength = 30,
        meteorPerRow = 2;

    var level_Ended = false; // Est-ce que ce tableau a été fini un jour ?
    var game_Ended = false; // GEstion de l'affichage à la fin

    var width = window.innerWidth;
    var height = window.innerHeight;
    var mulX = width / 360; // largeur de référence
    var mulY = height / 640; // hauteur de référence

    //=============================
    //= Get uuid
    //=============================
    function giveMeUid() {
        var nav = window.navigator;
        var screen = window.screen;
        var guid = nav.mimeTypes.length;
        guid += nav.userAgent.replace(/\D+/g, '');
        guid += nav.plugins.length;
        guid += screen.height || '';
        guid += screen.width || '';
        guid += screen.pixelDepth || '';

        return guid;
    };
    auid = giveMeUid();
    console.log("[AUID " + auid + "]");
    //=============================
    // A utiliser au bon moment, entrée du nom et au demarrage quand on a un name... Mais pourquoi pas dans COOKIES ??
    //=============================
    function getpersoUUID(nom, auid) {
        return new Promise(function (resolve, reject) {
            console.log("[Search NDBKey: " + nom + " (" + auid + ")]");
            $("#play_web").hide();
            if (nom != "UNKNOW") {
                DODDLE.fetch.callPost("login", {
                    'nom': nom,
                    'guid': auid
                }).then(function (result) {
                    persoUUID = result.data.uuid;
                    resolve(true);
                }).catch(function (e) {
                    persoUUID = null;
                    resolve(false);
                })
            }
        })
    }
    //=============================
    //= GetName
    //=============================
    DODDLE.cookies.get("name").then(function (name) {
        console.log("[Cookies:Joueur déjà identifié]")
        $("#play_playerName").text(name);
        getpersoUUID(name, auid).then(function (e) {
            webLevelAuthorize();
        });
    }).catch(function (e) {
        console.log("[Cookies:Pas de joueur identifié!]")
        $("#play_playerName").text("UNKNOW");
        webLevelAuthorize();
    })
    //=============================
    function showMustGoOn() {
        // On lance les étoiles
        interval = setInterval(function () {
            sky.update()
        }, intervalTime);
        $("#play").removeClass("cOut");
        $("#title").removeClass("cOut");
    }
    //=============================
    //= Online OffLine
    //=============================
    var online = navigator.onLine; // Est-on en ligne ??
    function lineStatus() {
        online = navigator.onLine;
        console.log("[Online Status:" + online + "]");
        getpersoUUID($("#play_playerName").text(), auid).then(function (e) {
            webLevelAuthorize();
        });
        // Ajouter les vérification pour accès onLine quand onLine :-)
    }
    window.addEventListener("offline", lineStatus, false);
    window.addEventListener("online", lineStatus, false);
    lineStatus();
    //=============================
    //= web autorize ?
    //=============================
    // Pour le menu defy Web
    function webLevelAuthorize() {
        if (webAuthorize())
            $("#play_web").show();
        else
            $("#play_web").hide();
    }

    function webAuthorize() {
        // Si on a un UUID c'est qu'on a un nom, donc reste à être online...
        if (persoUUID !== null && online == true)
            return true;
        else
            return false;
    }
    //=============================
    canvas.setAttribute("width", width); // Mappage ecran avec le canvas
    canvas.setAttribute("height", height);
    var sky = new clsParticle(); // Etoiles à la galaga pour le menu
    sky.init(context);
    sky.createSky(canvas.width / 2, canvas.height / 2);
    showMustGoOn();

    var fond = new clsFond(canvas); // Etoile de fond pour le jeux...
    var joueur = new clsJoueur(width, height, mulX, mulY);
    var meteor = new clsMeteor(mulX, mulY);
    var boum = new clsBoum(context);
    var range = new clsRange(context);

    //=============================
    // On cherche la  version du service worker
    DODDLE.fetch.sendMessage("version").then(function (e) {
        $("#version").text(e);
    }).catch(function (e) {
        $("#version").text("updated");
    })

    // On cache la div bloquante
    blocker.hide();

    /*On assigne les différentes actions*/
    /*#######################################*/
    /*Le menu*/
    /*#######################################*/
    //region MENU
    $("#play_playerName").click(function (e) {
        $("#name").removeClass("cOut");
        $("#play").addClass("cOut");
        return false;
    });

    $("#Name_Validate").click(function (e) {
        $("#name").addClass("cOut");
        $("#play").removeClass("cOut");
        var _name = $("#name_playerName").val();
        if (_name.trim() == "") {
            _name = "UNKNOW";
        }

        console.log("Name>" + _name);
        $("#play_playerName").text(_name);
        DODDLE.cookies.set("name", _name);
        // On set le nom
        getpersoUUID(_name, auid).then(function (e) {
            webLevelAuthorize();
        });
        return false;
    });

    $("#Name_Cancel").click(function (e) {
        $("#name").addClass("cOut");
        $("#play").removeClass("cOut");
        $("#name_playerName").val('');
        return false;
    });

    $("#play_GenerateLevel").click(function (e) {
        $("#menu").addClass("cOut");
        $("#generateLevel").removeClass("cOut");
        return false;
    });

    $("#play_Howto").click(function (e) {
        $("#menu").addClass("cOut");
        $("#howToPlay").removeClass("cOut");
        return false;
    });

    $("#level_Cancel").click(function (e) {
        $("#nameLevel").addClass("cOut");
        $("#listLevel").removeClass("cOut");
        $("#level_levelName").val('');
        return false;
    });

    $("#level_Validate").click(function (e) {
        readThisSonOfLevel(levelName).then(function (level) {
            stored = false;
            web = true;
            var data = {
                level: level,
                name: $("#level_levelName").val(),
                creator: persoUUID
            };
            $("#level_levelName").val('');
            DODDLE.fetch.callPost("saveWeb", data).then(function (result) {
                if (result.error) alert(result.msg);
                // On supprime le tableau
                DODDLE.store.del(levelName).then(function (result) {
                    $("#game").removeClass("cOut");
                    $("#selectLevel").addClass("cOut");
                    initGame(false);
                }).catch(function (result) {
                    if (result.error) alert(result.msg);
                });
                stored = false; //result.data.level.stored;
                web = true; //result.data.level.web;
                levelName = result.data.name;
                levelUUID = result.data.uuid;
            }).catch(function (result) {
                if (result.error) alert(result.msg);
            });
        }).catch(function (e) {
            console.log("erreur de lecture!");
        })

        $("#nameLevel").addClass("cOut");
        $("#listLevel").removeClass("cOut");
        return false;
    });

    $("#play_playGame").click(function (e) {
        $("#menu").addClass("cOut");
        $("#selectLevel").removeClass("cOut");
        console.log("[play_playGame]");
        DODDLE.store.directory().then(function (levels) {
            var container = $("#readLevel");
            $("#storeLevel").empty(); // Meme id, donc ont vide...
            container.empty();

            if (levels.length > 0) {
                //$("#selectLevel_validate").show();
                levels.forEach((level, n) => {
                    var li = "<li><span id='level" + n + "'>LEVEL " + n + "</span>";
                    if (webAuthorize() && level.ended) li += "<span class='promote' id='plevel" + n + "'> PRO</span>"; // TODO: Faire une icone...
                    //li += "<span>" + level.maxCoin + "</span>";
                    li += "</li>";
                    container.append(li);
                    $("#level" + n).click(function (e) {
                        console.log("[read level > " + e.target.id + "]");
                        readThisSonOfLevel(e.target.id).then(function (level) {
                            $("#game").removeClass("cOut");
                            $("#selectLevel").addClass("cOut");
                            initGame(false);
                        });
                        return false;
                    });
                    if (webAuthorize()) {
                        // pas très jolie le substring mais il est plus de minuit.. prout...
                        $("#plevel" + n).click(function (e) {
                            console.log("[promote level > " + e.target.id.substr(1) + "]");
                            $("#nameLevel").removeClass("cOut");
                            $("#listLevel").addClass("cOut");
                            levelName = e.target.id.substr(1);
                            return false;
                        });
                    }
                });
            } else {
                container.append("<li >NO SAVED LEVEL</li>");
                container.append("<li >PLEASE</li>");
                container.append("<li >GENERATE ONCE</li>");
            }
        });
        return false;
    });

    $("#play_web").click(function (e) {
        // TODO: ajouter un défilement via la CSS et bouton haut/bas et un accordéon sur le titre du groupe
        $("#menu").addClass("cOut");
        $("#selectWeb").removeClass("cOut");
        console.log("[play_web]");
        var container = $("#readWeb");
        container.empty();
        DODDLE.fetch.callGet("directoryWeb").then(function (result) {
            if (result.data.groupes.length > 0) {
                result.data.groupes.forEach(groupe => {
                    container.append("<menu id='" + groupe.creatorName + "'>" + groupe.creatorName + "</menu>");
                    groupe.levels.forEach(level => {
                        container.append("<li id='" + level.key + "'>" + level.name + "</li>");
                        $("#" + level.key).click(function (e) {
                            var data = {
                                id: e.target.id
                            }
                            DODDLE.fetch.callPost("readWeb", data).then(function (result) {
                                $("#game").removeClass("cOut");
                                $("#selectWeb").addClass("cOut");
                                launchedMeteors = result.data.level.data;
                                stored = false; //result.data.level.stored;
                                web = true; //result.data.level.web;
                                levelName = result.data.level.name;
                                levelUUID = result.data.uuid;
                                initGame(false);
                            });
                        });
                    });
                })
            } else {
                container.append("<li >NO WEB LEVEL</li>");
                container.append("<li >CREATE ONCE</li>");
            }
        }).catch(function (e) {
            console.log("Erreur:" + e);
        });
        return false;
    });

    $("#play_hallOfFame").click(function (e) {
        return false;
    });

    $("#play_quit").click(function (e) {
        return false;
    });
    //endregion MENU

    /*#######################################*/
    /*Le menu*/
    /*#######################################*/
    //region HOWTOPLAY
    $("#howToPlay_close").click(function (e) {
        $("#menu").removeClass("cOut");
        $("#howToPlay").addClass("cOut");
        return false;
    });
    //endregion HOWTOPLAY

    /*#######################################*/
    /*Le generateur de niveau */
    /*#######################################*/
    //region GENERATEUR
    $("#generateLevel_validate").click(function (e) {
        $("#game").removeClass("cOut");
        $("#generateLevel").addClass("cOut");
        initGame();
        return false;
    });

    $("#generateLevel_cancel").click(function (e) {
        $("#menu").removeClass("cOut");
        $("#generateLevel").addClass("cOut");
        return false;
    });
    //endregion GENERATEUR

    /*#######################################*/
    /*Le selecteur de niveau */
    /*#######################################*/
    //region SELECTEUR
    /*
        $("#selectLevel_validate").click(function (e) {
            $("#game").removeClass("cOut");
            $("#selectLevel").addClass("cOut");
            initGame();
        });*/


    $("#selectLevel_cancel").click(function (e) {
        $("#menu").removeClass("cOut");
        $("#selectLevel").addClass("cOut");
        return false;
    });
    //endregion SELECTEUR

    /*#######################################*/
    /*Le selecteur de niveau web */
    /*#######################################*/
    //region SELECTEURWEB    
    /*
        $("#selectWeb_validate").click(function (e) {
            $("#game").removeClass("cOut");
            $("#selectWeb").addClass("cOut");
            initGame();
        });*/

    $("#selectWeb_cancel").click(function (e) {
        $("#menu").removeClass("cOut");
        $("#selectWeb").addClass("cOut");
        return false;
    });
    //endregion SELECTEURWEB    

    /*#######################################*/
    /*La fin du jeux*/
    /*#######################################*/
    //region FINJEUX
    $("#retryGame").click(function (e) {
        $("#endGame").addClass("cOut");
        initMeteor();
        return false;
    });

    $("#hof_Ok").click(function (e) {
        showTryCan();
        $("#endGame").removeClass("cOut");
        return false;
    });

    $("#cancelGame").click(function (e) {
        cancelAnimationFrame(interval);
        cancelAnimationFrame(intervalMeteorLaunch);

        $("#endGame").addClass("cOut");
        $("#game").addClass("cOut");
        $("#menu").removeClass("cOut");

        DODDLE.noSleep.disable();
        joueur.cleaner();
        showMustGoOn();
        return false;
    });

    $("#storeGame").click(function (e) {
        $("#TryCanGame").addClass("cOut");
        $("#store").removeClass("cOut");
        console.log("[storeGame]");
        var cpt = 0;
        var container = $("#storeLevel");

        DODDLE.store.directory().then(function (levels) {
            $("#readLevel").empty();
            container.empty();

            // pour mettre les utilisés d'une autre couleur
            levels.forEach((level, n) => {
                container.append("<li id='level" + n + "'>LEVEL " + n + "</li>");
                $("#level" + n).click(function (e) {
                    console.log("used level> " + e.target.id);
                    storeThisFuckingLevel(e.target.id);
                    showTryCan();
                    $("#store").addClass("cOut");
                });
                cpt++;
            });

            // et les sauvegardes libre
            for (var n = cpt; n < 5; n++) {
                container.append("<li id='level" + n + "'>FREE</li>");
                $("#level" + n).click(function (e) {
                    console.log("free level> " + e.target.id);
                    storeThisFuckingLevel(e.target.id);
                    showTryCan();
                    $("#store").addClass("cOut");
                });
            }
        })
        return false;

    })

    $("#store_Cancel").click(function (e) {
        showTryCan();
        $("#store").addClass("cOut");
        return false;
    })

    function storeThisFuckingLevel(name) {
        stored = true;
        web = false;
        levelName = name;
        var level = {
            worldLength: parseInt($("#generateLevel_sectorSize").val()),
            meteorPerRow: parseInt($("#generateLevel_meteorPerRow").val()),
            nullMeteor: parseInt($("#generateLevel_typeOf_nullMeteor").val()),
            littleMeteor: parseInt($("#generateLevel_typeOf_littleMeteor").val()),
            smallMeteor: parseInt($("#generateLevel_typeOf_smallMeteor").val()),
            mediumMeteor: parseInt($("#generateLevel_typeOf_mediumMeteor").val()),
            bigMeteor: parseInt($("#generateLevel_typeOf_bigMeteor").val()),
            money: parseInt($("#generateLevel_typeOf_money").val()),
            energy: parseInt($("#generateLevel_typeOf_energy").val()),
            data: launchedMeteors,
            name: name,
            auid: auid,
            playerName: $("#name_playerName").val(),
            //stored: stored, // Sauvegardé en session
            //web: web, // Vient du serveur,
            maxCoin: joueur.maxCoin,
            maxEnergy: joueur.maxEnergy,
            maxDestroyedMeteor: meteor.maxDestroyedMeteor,
            ended: level_Ended
        }
        DODDLE.store.put(name, level);
    }

    function readThisSonOfLevel(name) {
        return new Promise(function (resolve, reject) {
            DODDLE.store.get(name).then(function (level) {
                $("#generateLevel_sectorSize").val(parseInt(level.worldLength));
                $("#generateLevel_meteorPerRow").val(parseInt(level.meteorPerRow));
                $("#generateLevel_typeOf_nullMeteor").val(parseInt(level.nullMeteor));
                $("#generateLevel_typeOf_littleMeteor").val(parseInt(level.littleMeteor));
                $("#generateLevel_typeOf_smallMeteor").val(parseInt(level.smallMeteor));
                $("#generateLevel_typeOf_mediumMeteor").val(parseInt(level.mediumMeteor));
                $("#generateLevel_typeOf_bigMeteor").val(parseInt(level.bigMeteor));
                $("#generateLevel_typeOf_money").val(parseInt(level.money));
                $("#generateLevel_typeOf_energy").val(parseInt(level.energy));
                launchedMeteors = level.data;
                web = false; //(level.web == undefined ? false : level.web);
                stored = true; //(level.stored == undefined ? false : level.stored);
                levelName = level.name;
                //game_maxCoin = level.maxCoin;
                //game_maxEnergy = level.maxEnergy;
                //game_maxMeteorDestroyed = level.maxDestroyedMeteor;
                level_Ended = level.ended;
                resolve(level);
            }).catch(function (e) {
                console.error("Read Level Error: " + e);
                reject(e);
            })
        });
    }
    //endregion FINJEUX

    /*#######################################*/
    /*Le jeux*/
    /*#######################################*/
    //region JEUX
    function initGame(meteorToo = true) {
        DODDLE.noSleep.enable();
        clearInterval(interval);
        initMeteor(context);
        // Initialisation du range
        // On ne le remet pas à false...
        level_Ended = level_Ended ? true : false;

        if (meteorToo) {
            gererateMeteorField();
        }
        range.init(launchedMeteors.length);
        joueur.cleaner();
        joueur.bindAll();
    }

    function initMeteor() {
        if (gyro.hasFeature("devicemotion")) {
            gyro.raz(); // Calibrate measurement during the page loading
            gyro.calibrate(); // Calibrate measurement during the page loading
        } else console.error("DeviceOrientationEvent non supporté!");

        startGame = new Date().getTime();
        startMeteor = new Date().getTime();
        game_Ended = false;

        meteor.init(context);
        joueur.init(context);
        boum.init();
        cptLaunchedMeteors = 0;

        // On clear.... Les timers...
        cancelAnimationFrame(interval);
        cancelAnimationFrame(intervalMeteorLaunch);

        // On lance le jeux
        interval = requestAnimationFrame(gameLoop);
        // On met en place le launcher de meteor
        intervalMeteorLaunch = requestAnimationFrame(meteorLoop);
    }

    //*************************************************
    //*************************************************
    // Les loops controller....
    //*************************************************
    //*************************************************
    function gameLoop() {
        interval = requestAnimationFrame(gameLoop);
        var current = Date.now(),
            delta = current - startGame;
        if (delta >= intervalTime) {
            meteorGame();
            startGame = current - (delta % intervalTime);
        }
    }

    function meteorLoop() {
        intervalMeteorLaunch = requestAnimationFrame(meteorLoop);
        var current = Date.now(),
            delta = current - startMeteor;
        if (delta >= intervalMeteorLaunchTime) {
            nextMeteorLaunch();
            startMeteor = current - (delta % intervalMeteorLaunchTime);
        }
    }
    //*************************************************
    //*************************************************

    function makeChance(list, val, number) {
        for (var n = 0; n < number; n++) {
            list.push(val);
        }
        return list;
    }

    function gererateMeteorField() {
        launchedMeteors = [];
        cptLaunchedMeteors = 0;

        worldLength = parseInt($("#generateLevel_sectorSize").val());
        meteorPerRow = parseInt($("#generateLevel_meteorPerRow").val());

        var nullMeteor = parseInt($("#generateLevel_typeOf_nullMeteor").val());
        var littleMeteor = parseInt($("#generateLevel_typeOf_littleMeteor").val());
        var smallMeteor = parseInt($("#generateLevel_typeOf_smallMeteor").val());
        var mediumMeteor = parseInt($("#generateLevel_typeOf_mediumMeteor").val());
        var bigMeteor = parseInt($("#generateLevel_typeOf_bigMeteor").val());
        var money = parseInt($("#generateLevel_typeOf_money").val());
        var energy = parseInt($("#generateLevel_typeOf_energy").val());
        var val;

        web = false;
        stored = false;
        levelName = "";

        var chance = [];
        makeChance(chance, 0, bigMeteor);
        makeChance(chance, 1, mediumMeteor);
        makeChance(chance, 2, smallMeteor);
        makeChance(chance, 3, littleMeteor);
        makeChance(chance, 4, nullMeteor);
        makeChance(chance, 5, money);
        makeChance(chance, 6, energy);

        console.log("max:" + chance.length + " length:" + worldLength);

        for (var m = 0; m < worldLength; m++) {
            var row = [];

            for (var n = 0; n < meteorPerRow; n++) {
                val = randomInt(0, chance.length - 1);

                row.push({
                    type: chance[val],
                    speed: randomInt(5, 10),
                    x: randomInt(10, canvas.width - 10),
                    speedRotate: randomFloat(0, 3)
                });
            }
            launchedMeteors.push(row);
        }
        // On ajoute un peu d'espace histoire de ne pas finir le jeux brutalement
        for (var m = 0; m < 10; m++) launchedMeteors.push(null);
    }

    function randomFloat(min, max) {
        return min + Math.random() * (max - min);
    }

    function randomInt(min, max) {
        return Math.round((min + Math.random() * (max - min)));
    }

    function nextMeteorLaunch() {
        if (cptLaunchedMeteors < launchedMeteors.length) {
            if (launchedMeteors[cptLaunchedMeteors] !== null)
                launchedMeteors[cptLaunchedMeteors].forEach(m => {
                    meteor.addMeteor(m.type, m.speed, m.x, m.speedRotate);
                })
            cptLaunchedMeteors++;
        }
        if (cptLaunchedMeteors >= launchedMeteors.length && !game_Ended) {
            if (joueur.getAlive()) {
                game_Ended = true;
                $("#win").show();
                $("#loose").hide();
                level_Ended = true;
                if (web) {
                    add1Try();
                    saveScore();
                    $("#hof_container").removeClass("cOut");
                    $("#endGame").removeClass("cOut");
                    $("#TryCanGame").addClass("cOut");
                } else if (stored) {
                    // On sauvegarde, si ended_level il faut bien le stocker pour dire qu'on l'a fini et  qu'on peut exporter au web...
                    storeThisFuckingLevel(levelName);
                    $("#hof_container").addClass("cOut");
                    showTryCan();
                    $("#endGame").removeClass("cOut");
                } else {
                    showTryCan();
                    $("#endGame").removeClass("cOut");
                }
            }
        }
    }

    function showTryCan() {
        $("#hof_container").addClass("cOut");
        $("#TryCanGame").removeClass("cOut");
        // Si il est déjà sauvegardé ou si il vient du web impossible de le sauvegarder
        // Impossible a sauvegarder que si il vient du web (il faut l'avoir terminé pour le mettre au web donc plein de sauvegarde)
        if (stored || web) $("#storeGame").hide()
        else $("#storeGame").show()
    }

    function meteorGame() {
        var collidedMeteor = [];
        // On efface le fond
        context.clearRect(0, 0, canvas.width, canvas.height);

        // On draw le fond
        fond.draw();
        // On anim les météors
        meteor.update()
        // On test si les météors restant entre  en collision entr eux
        collidedMeteor = meteor.collisions(joueur);
        // On fait péter les météors ...
        collidedMeteor.forEach(meteor => {
            boum.add(meteor.x, meteor.y, 1);
        })
        // Ici on a la liste des météor proche du vaisseau...
        var narrows = meteor.giveMeteors().filter(meteor => meteor.narrow);
        // On affiche le vaisseau
        joueur.update();
        // Collision vaisseau / joueur
        if (joueur.collision(narrows)) {
            console.log("bam");
            $("#loose").show();
            $("#win").hide();
            level_Ended = false;
            game_Ended = true;
            $("#endGame").removeClass("cOut");
            if (stored) { // Si on est pas du web...
                // Euh on fait quoi si pas web ?? Rien non !!
            } else if (web) {
                add1Try();
                saveScore();
            }
            showTryCan();
            boum.add(joueur.getX(), joueur.getY())
        }
        // Si y'a des boums, ben on les jous...
        boum.update();
        // On cherche les météor ayant besoin de mourir
        meteor.garbageMeteor();
        // On supprime les  meteor 'garbagé'...
        meteor.killDeadMeteors();
        boum.killDeadBoum();
        range.update(cptLaunchedMeteors);
    }

    function saveScore() {
        //maxDestroyedMeteor
        //maxCoin
        //game_Ended
        DODDLE.fetch.callPost("setScore", {
            playerUuid: persoUUID,
            levelUuid: levelUUID,
            nbMeteor: meteor.maxDestroyedMeteor,
            nbCoin: joueur.maxCoin,
            ended: level_Ended
        }).then(function (result) {
            console.log("SetScore ok!");
            console.log(result);


            var container = $("#hofList");
            container.empty();

            result.data.highScore.forEach((score, n) => {
                container.append("<li id='score" + n + "'>" + score.name + "......." + score.score + "</li>");
            })
        });

    }

    function add1Try() {
        DODDLE.fetch.callGet("setPlayed", {
            playerUuid: persoUUID,
            levelUuid: levelUUID
        }).then(function (result) {
            console.log("AddTry ok!");
        });
    }
    //endregion FINJEUX
}
