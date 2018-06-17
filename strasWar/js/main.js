// FUTURE utilisé des customs tiles, récuperer tiles google et les remaper 256*256 et faire dessins...
// FUTURE: voir à utiliser pushAPi -> faire un menu configuration pour autoriser...
// TEST: Utiliser les postMessages pour dispo bases, à tester

// On lance le serviceWorker sans attendre...
if ('serviceWorker' in navigator) {
    DODDLE.worker = navigator.serviceWorker.register('/strasWar/sw-straswar.js')
}

// Les biblis aditionnelles
DODDLE.commons = new commons();

// La page principale est chargé on lance le reste
$(document).ready(
    function () {
        DODDLE.strasWar.start();
    }
);

DODDLE.strasWar.start = function () {

    // Partie on/off line...
    window.addEventListener("offline", function () {
        DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
        DODDLE.strasWar.pilotage("offLine");
    }, false);
    window.addEventListener("online", function () {
        DODDLE.strasWar.load();
    }, false);

    // Objet de gestion de la page
    DODDLE.strasWar.page = new pageModel('StrasWar ' + DODDLE.strasWar.version);

    var nav = navigator.geolocation ? true : false;
    var res = navigator.onLine ? true : false;
    // Si on a du résau on charge, sinon ben on dis qu'on fout rien :-)
    if (!nav || !res)
        DODDLE.strasWar.pilotage("offLine", {
            "nav": nav,
            "res": res
        });
    else
        DODDLE.strasWar.load();
};

DODDLE.strasWar.load = function () {
    DODDLE.strasWar.page.loadingOn();

    DODDLE.fetch.init();
    // TODO: Faire un fetch direct. Les images sont en caches donc loading direct... Pas d'interets à utiliser un loader...
    //DODDLE.fetch.add("wars", "getWars");
    //DODDLE.fetch.add("target", "svg/target.svg");
    DODDLE.fetch.add("tour", "png/tour30x40.png");
    DODDLE.fetch.add("soldats", "png/soldats.png");
    DODDLE.fetch.add("bam", "png/bam90x90.png");
    DODDLE.fetch.add("blood", "png/blood60x60.png");
    DODDLE.fetch.add("fleche", "png/fleche.png");
    DODDLE.fetch.add("army", "png/army.png");
    DODDLE.fetch.add("laCene", "png/laCene.png");
    // On envois le chargement

    DODDLE.fetch.execute(DODDLE.strasWar.run);
}

DODDLE.strasWar.run = function () {
    DODDLE.strasWar.page.loadingOff();
    DODDLE.strasWar.pilotage();
    DODDLE.strasWar.noSleep = new NoSleep();
};

// https://dbwriteups.wordpress.com/2015/11/16/service-workers-part-3-communication-between-sw-and-pages/
DODDLE.strasWar.pilotage = function (pil, data) {
    // Création minimum de la réponse contenu dans data
    if (data == undefined) data = {};
    if (data.msg == undefined) data.msg = ""; // Pour affichage de message venant d'un autre écran
    if (data.ok == undefined) data.ok = ""; // etat de la réponse (mais ça veut rien dire??)

    DODDLE.strasWar.page.clearPage(); // Nettoyage de page et des services
    switch (pil) {
        // Ecran sans autentification
        // =====================================
        case undefined:
        case 'start':
            DODDLE.strasWar.login(data);
            break;
        case 'offLine':
            DODDLE.strasWar.ecranOffLine(data);
            break;
        case "chooseWar":
            DODDLE.strasWar.chooseWar(data);
            break;
        case "chooseClan":
            DODDLE.strasWar.chooseClan(data);
            break;
        case "createAccount":
            DODDLE.strasWar.createAccount(data);
            break;
            // Ecrans avec autentification
            // =====================================
        case "main":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.main(data);
            break;
        case "mainHelp":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.mainHelp(data);
            break;
        case "map":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.ecranCarte(data);
            break;
        case "ecranCarteHelp":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.ecranCarteHelp(data);
            break;
        case "showMap":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.ecranShowCarte(data);
            break;
        case "playWar":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.playWar(data);
            break;
        case "listOfWar":
            DODDLE.strasWar.testAuthentication();
            DODDLE.strasWar.listOfWar(data);
            break;
        default:
            console.error("Pilotage inconnu:" + pil);
    }
};

//**************************************************************************
//**************************************************************************
//** Les différents ecrans
//**************************************************************************
//**************************************************************************
// Gestion du contenu d'un écran
// !! Ne pas oublier !!
// Le gestionnaire de desinscription à alimenter via servicesToClean, il
// est appelé par le clearPage
// ->     DODDLE.strasWar.page.servicesToClean(function(){});

//**************************************************************************
//** L'ecran du createAccount
//**************************************************************************
DODDLE.strasWar.createAccount = function (data) {
    var _div, _div1, _titre, _par;

    _div = document.createElement("div");
    _div.setAttribute("class", "verticalAlign");

    _titre = document.createElement("h2");
    _titre.setAttribute("class", "second_title");
    _titre.innerHTML = "Création de compte";
    _div.appendChild(_titre);

    _div1 = document.createElement("div");
    _div1.setAttribute("class", "verticalAlign_content animatedMargin");
    _div.appendChild(_div1);

    _par = document.createElement("p");
    _par.innerHTML = "Saisir un userid<br/>et un mot de passe pour valider la création...";
    _div1.appendChild(_par);

    _div1.appendChild(DODDLE.strasWar.page.addLabelledInput("Nouveau userId", {
        id: "userid",
        placeholder: "userId",
        autocomplete: "off"
    }));
    _div1.appendChild(DODDLE.strasWar.page.addLabelledInput("Mot de passe", {
        id: "mdp",
        placeholder: "Mot de passe",
        type: "password",
        autocomplete: "off"
    }));

    // Les boutons de validation/annulation
    DODDLE.strasWar.page.addAnnulationButton("Annuler", "DODDLE.strasWar.pilotage('chooseClan');");
    DODDLE.strasWar.page.addValidationButton("Valider", "DODDLE.strasWar.createAccountValidation()");
    _div.appendChild(DODDLE.strasWar.page.getButtons());

    DODDLE.strasWar.page.addToPage(_div);
    DODDLE.strasWar.page.servicesToClean(function () {});
}

DODDLE.strasWar.createAccountValidation = function () {
    var _userid, _mdp, _error = false;
    _userid = document.getElementById("userid");
    _mdp = document.getElementById("mdp");

    _error = DODDLE.strasWar.controlUserMdp(_userid, _mdp);

    if (!_error) {
        DODDLE.strasWar.joueur.userid = sha1.hex(_userid.value);
        if (DODDLE.strasWar.page.authenticate(DODDLE.strasWar.joueur.userid)) {
            DODDLE.strasWar.page.callServerPost("validationAccount", {
                    userid: DODDLE.strasWar.joueur.userid,
                    nom: _userid.value,
                    mdp: _mdp.value,
                    war: DODDLE.strasWar.war.id,
                    clan: DODDLE.strasWar.clan,
                })
                .then(
                    function (data) {
                        if (data.etat == 'ko') {
                            DODDLE.strasWar.page.addWarningMessage(data.msg);
                            DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
                        } else {
                            DODDLE.strasWar.zones = []; // Pour forcer le rechargement et compter le nombre de soldat possible
                            DODDLE.strasWar.joueur.name = _userid.value;
                            DODDLE.strasWar.joueur.uuid = data.uuid;
                            DODDLE.strasWar.war.name = data.nom;
                            DODDLE.strasWar.war.turn = data.turn;
                            DODDLE.strasWar.war.endTurn = data.endTurn;
                            DODDLE.strasWar.pilotage("main");
                        }
                    })
                .catch(
                    function (error) {
                        DODDLE.strasWar.page.addWarningMessage("Problème de serveur! " + error);
                        DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
                    }
                );
        } else {
            DODDLE.strasWar.page.addErrorMessage("Joueur déjà connecté!");
            DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
        }
    }
};

//**************************************************************************
//** L'ecran du chooseWar
//**************************************************************************
DODDLE.strasWar.chooseWar = function () {
    var _div, _div1, _map, _titre;

    function warLoaded(dataWarHouse) {
        var _war;
        _war = document.getElementById("war");
        _titre = document.getElementById("etatWar");

        for (var w in dataWarHouse) {
            _option = document.createElement("option");
            _option.setAttribute("value", dataWarHouse[w].uuid);
            _option.innerHTML = dataWarHouse[w].nom;
            _war.appendChild(_option);
        }
        _war.setAttribute("value", dataWarHouse[0].uuid); // On preselectionne la premmière
        loadZones(dataWarHouse[0].uuid);

        if (dataWarHouse[w].started) {
            _titre.innerHTML = "En cours, ";
            _titre.innerHTML += "tour " + dataWarHouse[0].turn + "/" + dataWarHouse[0].endTurn;
        } else
            _titre.innerHTML = "Partie non démarré.";
    }

    function loadZones(id) {
        DODDLE.strasWar.page.callServer("getZones", {
                war: id
            })
            .then(
                function (data) {
                    if (data.etat == 'ko')
                        DODDLE.strasWar.page.addWarningMessage(data.msg);
                    else {
                        // On cible la map dans ma page
                        DODDLE.strasWar.map = new google.maps.Map(_map, DODDLE.strasWar.mapOptions);

                        DODDLE.strasWar.loadZones(data);
                        DODDLE.strasWar.map.fitBounds(DODDLE.strasWar.bounds); // On cadre

                        google.maps.event.addListenerOnce(DODDLE.strasWar.map, 'idle', function () {
                            //La carte est chargé et resizé correctement
                            DODDLE.strasWar.drawZones();
                        });
                    }
                }
            ).catch(
                function (error) {
                    DODDLE.strasWar.page.addErrorMessage("Problème lecture:" + error);
                }
            );
    }

    _div = document.createElement("div");
    _div.setAttribute("class", "verticalAlign");
    DODDLE.strasWar.page.addToPage(_div);

    _titre = document.createElement("h2");
    _titre.setAttribute("class", "second_title");
    _titre.innerHTML = "Choix de la War";
    _div.appendChild(_titre);

    _div1 = document.createElement("div");
    _div1.setAttribute("class", "verticalAlign_content animatedMargin");
    _div.appendChild(_div1);

    _map = document.createElement("div");
    _map.setAttribute("id", "map-canvas-short");
    _div1.appendChild(_map);
    _div1.appendChild(DODDLE.strasWar.page.addLabelledSelect("War selectionné", {
        id: "war",
        placeholder: "selectionnez",
        onChange: "loadZone(this.value);"
    }));

    _titre = document.createElement("h3");
    _titre.setAttribute("id", "etatWar");
    _div1.appendChild(_titre);

    // Les boutons de validation/annulation
    DODDLE.strasWar.page.addAnnulationButton("Précédent", "DODDLE.strasWar.pilotage();");
    DODDLE.strasWar.page.addValidationButton("Suivant", "DODDLE.strasWar.chooseWarValidation()");
    _div.appendChild(DODDLE.strasWar.page.getButtons());

    DODDLE.strasWar.page.servicesToClean(function () {});

    DODDLE.strasWar.page.callServer("getWars").then(function (data) {
        warLoaded(data);
    })
}

DODDLE.strasWar.chooseWarValidation = function () {
    var _war, _error = false;

    _war = document.getElementById("war");

    if (_war.value.length === 0) {
        DODDLE.strasWar.page.addWarningMessage("Merci de saisir une 'war'");
        _war.setAttribute("class", "myInput error");
        _error = true;
    }

    if (!_error) {
        DODDLE.strasWar.war.id = _war.value;
        DODDLE.strasWar.pilotage("chooseClan");
    }
}

//**************************************************************************
//** L'ecran du chooseClan
//**************************************************************************
//NOTE: Attention à toujours ajouter la map a document avant manip !!
DODDLE.strasWar.chooseClan = function () {
    var _list, _lb, _div, _div1, _option;

    function clanLoaded(data) {
        var _clan = document.getElementById("clan");
        DODDLE.strasWar.clans = data; // On garde les clans en memoire pour ne pas avoir à tester sur serveur

        if (DODDLE.strasWar.clan == undefined || DODDLE.strasWar.clan == null) DODDLE.strasWar.clan = data[0].uuid;
        for (var c in data) {
            _option = document.createElement("option");
            _option.setAttribute("value", data[c].uuid); // On ne valorise plus le titre
            _option.innerHTML = data[c].nom;
            _clan.appendChild(_option);
            if (DODDLE.strasWar.clan == data[c].uuid) _option.setAttribute("selected", "selected");
        }
        DODDLE.strasWar.chooseClanZoom(DODDLE.strasWar.clan);
    }

    _div = document.createElement("div");
    _div.setAttribute("class", "verticalAlign");
    DODDLE.strasWar.page.addToPage(_div);

    _titre = document.createElement("h2");
    _titre.setAttribute("class", "second_title");
    _titre.innerHTML = "Choix de ton Clan";
    _div.appendChild(_titre);

    _div1 = document.createElement("div");
    _div1.setAttribute("class", "verticalAlign_content animatedMargin");
    _div.appendChild(_div1);

    _map = document.createElement("div");
    _map.setAttribute("id", "map-canvas-short");
    _div1.appendChild(_map);

    // On cible la map dans ma page
    DODDLE.strasWar.map = new google.maps.Map(_map, DODDLE.strasWar.mapOptions);
    DODDLE.strasWar.map.fitBounds(DODDLE.strasWar.bounds); // On cadre

    google.maps.event.addListenerOnce(DODDLE.strasWar.map, 'idle', function () {
        //La carte est chargé et resizé correctement
        DODDLE.strasWar.drawZones();
    });

    _contain = document.createElement("div");
    _contain.setAttribute("class", "ctrl");
    _s = document.createElement("div");
    _s1 = document.createElement("div");
    _contain.appendChild(_s);
    _contain.appendChild(_s1);
    _s.setAttribute("class", "p85");
    _s1.setAttribute("class", "centered");

    _l = DODDLE.strasWar.page.addLabelledSelect("Clan selectionné", {
        id: "clan",
        placeholder: "selectionnez",
        onChange: "DODDLE.strasWar.chooseClanZoom(this.value);"
    });
    _s.appendChild(_l);

    _h = DODDLE.strasWar.page.getHelp("DODDLE.strasWar.chooseClanUsers()", "");
    _s1.appendChild(_h);

    _div1.appendChild(_contain);

    // Les boutons de validation/annulation
    DODDLE.strasWar.page.addAnnulationButton("Précédent", "DODDLE.strasWar.pilotage('chooseWar');");
    DODDLE.strasWar.page.addValidationButton("Suivant", "DODDLE.strasWar.chooseClanValidation()");
    _div.appendChild(DODDLE.strasWar.page.getButtons());

    DODDLE.strasWar.page.servicesToClean(function () {});
    DODDLE.strasWar.page.callServerPost("getClans", {
            "war": DODDLE.strasWar.war.id
        })
        .then(function (data) {
            clanLoaded(data);
        })
        .catch(function () {
            DODDLE.strasWar.page.addErrorMessage("Problème réseau!");
        });
}

DODDLE.strasWar.chooseClanZoom = function (clanId) {
    var bounds = new google.maps.LatLngBounds();

    DODDLE.strasWar.zones.forEach(zone => {
        if (zone.clan == clanId) {
            zone.getPath().forEach(p => {
                bounds.extend(p);
            });
        }
    });

    DODDLE.strasWar.bounds = bounds;
    DODDLE.strasWar.map.fitBounds(DODDLE.strasWar.bounds); // FIXME: On cadre panToBounds
    DODDLE.strasWar.clan = clanId;

    google.maps.event.addListenerOnce(DODDLE.strasWar.map, 'idle', function () {
        //La carte est chargé et resizé correctement
        DODDLE.strasWar.drawZones();
    });

}

DODDLE.strasWar.chooseClanValidation = function () {
    var _clan, _error = false,
        _found = false;
    _clan = document.getElementById("clan");

    if (_clan.value.length === 0) {
        DODDLE.strasWar.page.addWarningMessage("Merci de saisir un 'clan'");
        _clan.setAttribute("class", "myInput error");
        _error = true;
    }

    if (!_error) {
        DODDLE.strasWar.clan = _clan.value;
        // On cherche la couleur du clan
        for (var c in DODDLE.strasWar.clans) {
            if (DODDLE.strasWar.clans[c].uuid == DODDLE.strasWar.clan) {
                DODDLE.strasWar.joueur.color = DODDLE.strasWar.clans[c].couleur;
                break;
            }
        }
        DODDLE.strasWar.pilotage("createAccount");
    }
};

DODDLE.strasWar.chooseClanUsers = function () {
    var _texte, _list, _b, _bOK;
    // On prepare la popup
    DODDLE.strasWar.page.clearPopUp();
    _texte = document.createElement("div");
    _texte.setAttribute("class", "popUpContainer");
    _texte.innerHTML = "Joueur(s) dans le clan:";

    _ul = document.createElement("ul");
    _texte.appendChild(_ul);

    DODDLE.strasWar.page.callServer("getUsers", {
        "clan": DODDLE.strasWar.clan
    }).then(function (data) {
        var _l;
        _ul.innerHTML = "";
        if (data.length != 0) {
            for (var u in data) {
                _l = document.createElement("li");
                _l.innerHTML = data[u].userId;
                _ul.appendChild(_l);
            }
        } else {
            _l = document.createElement("li");
            _l.innerHTML = "Snif, clan vide..."
            _ul.appendChild(_l);
        }
    }).catch(function () {
        DODDLE.strasWar.page.addErrorMessage("Problème résea!");
    });

    _b = document.createElement("div");
    _b.setAttribute("class", "popUpBoutonBloc");
    _bOK = DODDLE.strasWar.page.createActionButton("Retour", "DODDLE.strasWar.page.hidePopUp();");
    _b.appendChild(_bOK);

    DODDLE.strasWar.page.addPopUpContainer(_texte);
    DODDLE.strasWar.page.addPopUpContainer(_b);
    DODDLE.strasWar.page.showPopUp();
}

//**************************************************************************
//** L'ecran principale
//**************************************************************************
DODDLE.strasWar.main = function () {
    var _div, _div1, _titre, _b, _h;

    _div = document.createElement("div");
    _div.setAttribute("class", "verticalAlign");

    _titre = document.createElement("h2");
    _titre.innerHTML = DODDLE.strasWar.war.name + ",jour " + DODDLE.strasWar.war.turn + "/" + DODDLE.strasWar.war.endTurn;
    _div.appendChild(_titre);

    _titre = document.createElement("h2");
    _titre.innerHTML = "Que veux tu faire<br/>" + DODDLE.strasWar.joueur.name + "?";
    _div.appendChild(_titre);

    // FIXME: to corrige... plud d'image ?? etre moin con, mettre un load de fecth en début de page pour les ressources conssmomé plutot qu'un load unitaire...
    //DODDLE.fetch.call("png/laCene.png").then(function (img) { // ????
    //  var _i = DODDLE.strasWar.page.addImage(img.src); //DODDLE.tools.giveMeColouredSprite(img, 214, 76, DODDLE.strasWar.joueur.color));
    var _i = DODDLE.strasWar.page.addImage(DODDLE.tools.giveMeColouredSprite("laCene", 214, 76, DODDLE.strasWar.joueur.color));
    _i.setAttribute("class", "pictoGrand");
    _div.appendChild(_i);
    /*}).catch(function () {
        DODDLE.strasWar.page.addErrorMessage("Ressource laCene absente !");
    })
*/
    _div1 = document.createElement("div");
    _div1.setAttribute("class", "verticalAlign_content animatedMargin");
    _div.appendChild(_div1);

    // Les boutons de validation/annulation
    _div1.appendChild(DODDLE.strasWar.page.createActionButton("Carte du royaume", "DODDLE.strasWar.pilotage('showMap');"));
    _b = DODDLE.strasWar.page.createActionButton("Voir les Guerres", "DODDLE.strasWar.pilotage('listOfWar');");
    //_b.setAttribute("disabled","disabled");
    _div1.appendChild(_b);
    _div1.appendChild(DODDLE.strasWar.page.createActionButton("Deplacement des armées", "DODDLE.strasWar.pilotage('map');"));

    // -> envois vers une page d'aide global
    _h = DODDLE.strasWar.page.addHelp("DODDLE.strasWar.pilotage('mainHelp')", "", "hc80");

    DODDLE.strasWar.page.addToPage(_h);
    DODDLE.strasWar.page.addToPage(_div);

    DODDLE.strasWar.page.needOffButton("DODDLE.strasWar.deconnecte();");

    // Chainage des différentes infos utiles
    // A voir pour mettre chargement en chaines des infos...
    if (DODDLE.strasWar.zones.length === 0)
        DODDLE.strasWar.page.callServer("getZones", {
            war: DODDLE.strasWar.war.id
        })
        .then(
            function (data) {
                if (data.etat == 'ko')
                    DODDLE.strasWar.page.addWarningMessage(data.msg);
                else {
                    DODDLE.strasWar.loadZones(data);
                    DODDLE.strasWar.page.callServer("compteTour", {
                        clan: DODDLE.strasWar.clan
                    }).then(function (data) {
                        DODDLE.strasWar.joueur.maxUnites = data.tour;
                    }).catch(function (e) {
                        console.log("prob de lecture!!!" + e.msg)
                    });
                }
            }
        ).catch(
            function (error) {
                DODDLE.strasWar.page.addErrorMessage("Problème lecture:" + error);
            }
        );

    DODDLE.strasWar.page.servicesToClean(function () {});
};

//**************************************************************************
//** L'ecran d'aide de Main
//**************************************************************************
DODDLE.strasWar.mainHelp = function (data) {
    DODDLE.strasWar.page.callServer("html/mainHelp.html").then(function (html) {
        DODDLE.strasWar.page.loadPage(html);
    }).catch(function (error) {
        DODDLE.strasWar.page.addErrorMessage("Page non trouvé !");
    })
    DODDLE.strasWar.page.needGoBack("DODDLE.strasWar.pilotage('main');");
};
//**************************************************************************
//** L'ecran du login
//**************************************************************************
DODDLE.strasWar.login = function (data) {
    var _div, _div1, _titre, _par;

    _div = document.createElement("div");
    _div.setAttribute("class", "verticalAlign");

    _div1 = document.createElement("div");
    _div1.setAttribute("class", "verticalAlign_content animatedMargin");
    _div.appendChild(_div1);

    DODDLE.strasWar.page.callServer("html/main.html").then(function (html) {
        _div1.innerHTML = html;
        // Les boutons de validation/annulation
        DODDLE.strasWar.page.addPlusButton("Connexion", "DODDLE.strasWar.loginValidation()");
        DODDLE.strasWar.page.addSimpleButton("Création", "DODDLE.strasWar.pilotage('chooseWar');");

        DODDLE.strasWar.page.addToPage(_div);
        _div.appendChild(DODDLE.strasWar.page.getButtons());
    }).catch(function (error) {
        DODDLE.strasWar.page.addErrorMessage("Page non trouvé !");
    })

    // Do you want somes messages ??
    if (data.msg != "") DODDLE.strasWar.page.addWarningMessage(data.msg);

    DODDLE.strasWar.page.servicesToClean(function () {});
};

DODDLE.strasWar.loginValidation = function () {
    var _userid, _mdp, _error = false;
    _userid = document.getElementById("userid");
    _mdp = document.getElementById("mdp");

    _error = DODDLE.strasWar.controlUserMdp(_userid, _mdp);

    if (!_error) {
        DODDLE.strasWar.joueur.userid = sha1.hex(_userid.value);
        if (DODDLE.strasWar.page.authenticate(DODDLE.strasWar.joueur.userid)) {
            DODDLE.strasWar.page.callServerPost("loginValidation", {
                    userid: DODDLE.strasWar.joueur.userid,
                    mdp: _mdp.value
                })
                .then(
                    function (data) {
                        if (data.etat == 'ko') {
                            DODDLE.strasWar.page.addWarningMessage(data.msg); // Bon ça ne peut-être qu'un user dupliqué..
                            DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
                        } else {
                            DODDLE.strasWar.clan = data.clan;
                            DODDLE.strasWar.clans = data.clans;
                            DODDLE.strasWar.war.id = data.war;
                            DODDLE.strasWar.war.name = data.name;
                            DODDLE.strasWar.war.turn = data.turn;
                            DODDLE.strasWar.war.endTurn = data.endTurn;
                            DODDLE.strasWar.joueur.uuid = data.uuid;
                            DODDLE.strasWar.joueur.name = data.nom; // La honte le mix Francais/anglais... Mais à moitié seulement...
                            DODDLE.strasWar.joueur.score = data.score;
                            DODDLE.strasWar.joueur.color = data.couleur;
                            DODDLE.strasWar.pilotage("main");
                        }
                    }
                ).catch(
                    function (error) {
                        DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
                        DODDLE.strasWar.page.addErrorMessage("Problème de login:" + error);
                    }
                );
        } else {
            DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
            DODDLE.strasWar.page.addErrorMessage("User déjà connecté!");
        }
    }
};

//**************************************************************************
//**************************************************************************
//**************************************************************************
//*** Fonction communes à l'interface
//**************************************************************************
//**************************************************************************
//**************************************************************************
//** Deconnexion du joueur
//**************************************************************************
DODDLE.strasWar.deconnecte = function () {
    DODDLE.strasWar.page.callServer("logOff", {
            uuid: DODDLE.strasWar.joueur.uuid
        })
        .then(
            function (data) {
                if (data.etat == 'ko')
                    DODDLE.strasWar.page.addWarningMessage(data.msg);
                else {
                    DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
                    DODDLE.strasWar.pilotage('start');
                }
                DODDLE.strasWar.joueur = {};
                DODDLE.strasWar.war = {};
                DODDLE.strasWar.zones = [];
                DODDLE.strasWar.clan = null;
            }
        ).catch(
            function (error) {
                DODDLE.strasWar.page.killAuthenticate(DODDLE.strasWar.joueur.userid);
                DODDLE.strasWar.page.addErrorMessage("Problème lecture:" + error);
                DODDLE.strasWar.pilotage('start');
                DODDLE.strasWar.joueur = {};
                DODDLE.strasWar.war = {};
                DODDLE.strasWar.zones = [];
                DODDLE.strasWar.clan = null;
            }
        );
};
//**************************************************************************
//** Test sur l'autentification du joueur
//**************************************************************************
DODDLE.strasWar.testAuthentication = function () {
    // NOTE: Attention de bien attendre le retour du fetch, sinon on obtient un comportement erratique..
    if (!DODDLE.strasWar.page.needAuthentication(DODDLE.strasWar.joueur.userid)) {
        // Le cookie à expiré, on se logOff...
        DODDLE.strasWar.page.callServer("logOff", {
            uuid: DODDLE.strasWar.joueur.uuid
        }).then(
            function () {
                // On supprime aussi les infos
                DODDLE.strasWar.joueur = {};
                DODDLE.strasWar.war = {};
                DODDLE.strasWar.zones = [];
                // et on retourne au début
                DODDLE.strasWar.pilotage('start', {
                    msg: "Session expirée!"
                })
            }
        ).catch(
            function (error) {
                DODDLE.strasWar.page.addErrorMessage("Problème de session: " + error);
            }
        );
    } else { // On precise qu'on est toujours en vie, pour mettre à jour le timeStamp
        DODDLE.strasWar.page.callServer("imAlive", {
            uuid: DODDLE.strasWar.joueur.uuid
        }).then(function () {}).catch(function () {}); // NOTE: Actions à faire sur imAlive ??
    }
};
//**************************************************************************
//** Test validité mot de passe / user
//**************************************************************************
DODDLE.strasWar.controlUserMdp = function (userid, mdp) {
    var _error = false;
    if (userid.value.length === 0) {
        DODDLE.strasWar.page.addWarningMessage("Merci de saisir un userId");
        userid.setAttribute("class", "myInput error");
        _error = true;
    } else if (userid.value.length < 3) {
        DODDLE.strasWar.page.addWarningMessage("Merci de saisir un userId de 3 caractères minimum");
        userid.setAttribute("class", "myInput error");
        _error = true;
    }
    if (mdp.value.length === 0) {
        DODDLE.strasWar.page.addWarningMessage("Merci de saisir un mot de passe");
        mdp.setAttribute("class", "myInput error");
        _error = true;
    } else if (mdp.value.length < 6) {
        DODDLE.strasWar.page.addWarningMessage("Merci de saisir un mot de passe de 6 caractères minimum");
        mdp.setAttribute("class", "myInput error");
        _error = true;
    }
    return _error;
}
//**************************************************************************
//** L'ecran si t'es off d'un truc
//**************************************************************************
DODDLE.strasWar.ecranOffLine = function (data) {
    var _div, _div1, _ul, _li;
    // L'écran n'est pas appelé par le pilotage, d'ou le clean en entrée
    DODDLE.strasWar.page.clearPage();

    _div = document.createElement("div");
    _div.setAttribute("class", "verticalAlign");

    _div1 = document.createElement("div");
    _div1.setAttribute("class", "help verticalAlign_content");
    _div1.innerHTML = "Pour jouer il vous faut les trucs que je dis ci-dessous:";

    _ul = document.createElement("ul");
    _ul.setAttribute("class", "help");

    if (navigator.geolocation ? true : false) {
        _li = document.createElement("li");
        _li.innerHTML = "une connexion réseau... "
        _ul.appendChild(_li);
    }

    if (navigator.onLine ? true : false) {
        _li = document.createElement("li");
        _li.innerHTML = "un GPS activé et autorisant son utilisation..."
        _ul.appendChild(_li);
    }

    _div1.appendChild(_ul);
    _div.appendChild(_div1);
    DODDLE.strasWar.page.addToPage(_div);

    DODDLE.strasWar.page.servicesToClean(function () {});
};

//**************************************************************************
//** Zoom sur toutes les zones de la WAr courante
//**************************************************************************
DODDLE.strasWar.zoomWar = function () {
    var bounds = new google.maps.LatLngBounds();

    DODDLE.strasWar.zones.forEach(zone => {
        zone.getPath().forEach(p => {
            bounds.extend(p);
        });
    })
    DODDLE.strasWar.bounds = bounds;
};
