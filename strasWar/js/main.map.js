//**************************************************************************
//** Les ecrans cartes
//**************************************************************************
//*********************************************
//*********************************************
// Affiche la liste des guerres du joueur courant
//*********************************************
//*********************************************
DODDLE.strasWar.listOfWar = function () {
    DODDLE.strasWar.page.needGoBack("DODDLE.strasWar.pilotage('main');");
    // var _div, _titre, _liste;

    // // **************************************
    // // ** Fonctions internes à la page
    // // **************************************
    // function afficheListeResultWar(data) {
    //     var _liste, attributs = {},
    //         listeLien = [];
    //     var liste = localStorage.getItem("visitedLink");
    //     if (liste !== null) listeLien = liste.split("|");

    //     _liste = document.getElementById("list");

    //     for (var n in data) {
    //         if (listeLien.indexOf(data[n].uuid) != -1)
    //             attributs = {
    //                 "onclick": "DODDLE.strasWar.listOfWarChoose('" + data[n].uuid + "');",
    //                 "class": "visited"
    //             };
    //         else
    //             attributs = {
    //                 "onclick": "DODDLE.strasWar.listOfWarChoose('" + data[n].uuid + "');"
    //             };
    //         _liste.appendChild(DODDLE.strasWar.page.addLink("jour " + data[n].tour + ", " + data[n].zone, attributs));
    //     }
    // }

    // // **************************************
    // // **************************************

    // _div = document.createElement("div");
    // _div.setAttribute("class", "verticalAlign");

    // _titre = document.createElement("h2");
    // _titre.innerHTML = "Liste des guerres";
    // _div.appendChild(_titre);

    // _liste = document.createElement("div");
    // _liste.setAttribute("class", "centre");
    // _liste.setAttribute("id", "list");
    // _div.appendChild(_liste);

    // DODDLE.strasWar.page.addToPage(_div);


    DODDLE.strasWar.page.callServer("getEvent",{
        war: DODDLE.strasWar.war.id
    }).then(function (html) {
        DODDLE.strasWar.page.loadPage(html);
    }).catch(function (error) {
        DODDLE.strasWar.page.addErrorMessage("Page non trouvé !");
    })

    // DODDLE.strasWar.page.callServer("getMyWarResult", {
    //         userUuid: DODDLE.strasWar.joueur.uuid
    //     })
    //     .then(
    //         function (data) {
    //             if (data.etat == 'ko')
    //                 DODDLE.strasWar.page.addWarningMessage(data.msg);
    //             else {
    //                 afficheListeResultWar(data);
    //             }
    //         }
    //     ).catch(
    //         function (error) {
    //             DODDLE.strasWar.page.addErrorMessage("Problème lecture:" + error);
    //         }
    //     );
};

//DODDLE.strasWar.listOfWarChoose = function (uuid) {
//    var listeLien;
//    var liste = localStorage.getItem("visitedLink");
//
//    if (liste !== null)
//        listeLien = liste.split("|");
//    else
//        listeLien = [];
//
//    if (listeLien.indexOf(uuid) == -1) localStorage.setItem("visitedLink", liste + "|" + uuid);
//
//    DODDLE.strasWar.pilotage('playWar', uuid);
//};

//*********************************************
// Affiche Carte pour REJOUER UNE GUERRE
//*********************************************
//*********************************************
// FIXME: si soldat déja eu un combat et que retournée prochain combat reste dans le mauvais sens après déplacement > voir le cr de combat
DODDLE.strasWar.playWar = function (uuid) {
    var _map;
    var _winnerClan = "",
        _currentZone = "";
    _map = document.createElement("div");
    _map.setAttribute("id", "map-canvas-all");
    var bounds = new google.maps.LatLngBounds();
    var _cptPause = 0,
        _frameRate = 1000 / 25;

    this.markerDeadImages = [
        {
            url: DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, "#ffffff", 5),
            scaledSize: new google.maps.Size(45, 65),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 62)
        }, {
            url: DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, "#ffffff", 6),
            scaledSize: new google.maps.Size(45, 65),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 62)
        }, {
            url: DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, "#ffffff", 7),
            scaledSize: new google.maps.Size(45, 65),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 62)
        }, {
            url: DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, "#ffffff", 8),
            scaledSize: new google.maps.Size(45, 65),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 62)
        }, {
            url: DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, "#ffffff", 9),
            scaledSize: new google.maps.Size(45, 65),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(20, 62)
        }
    ]

    this.markerImage = {
        url: "",
        scaledSize: new google.maps.Size(45, 65),
        size: new google.maps.Size(45, 65),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 62)
    };

    // Les variables d'animations
    clearInterval(DODDLE.strasWar.playWar.tempo);
    DODDLE.strasWar.playWar.next = false;
    DODDLE.strasWar.playWar.sequence = 0; // La séquence 0 est l'init
    DODDLE.strasWar.anim = new animated(DODDLE.strasWar.map);

    //==============================================================
    //==============================================================
    // Fonctions du tableau
    //==============================================================
    //==============================================================

    // Color la zone de bagarre...
    //==============================================================
    //==============================================================
    function colorZone(clanUUID, zoneUUID) {
        var _color;
        if (clanUUID != "") { // Si on est pas dans un match nul, on recolor la zone...
            _color = searchColor(clanUUID);
            DODDLE.strasWar.zones.forEach(zone => {
                if (zone.uuid == zoneUUID) {
                    zone.setOptions({
                        strokeColor: _color,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: _color,
                        fillOpacity: 0.5
                    });
                };
            });
        }
    }

    function searchColor(clanUUID) {
        var _color = DODDLE.strasWar.default_color; // Si on trouve pas on est de couleur défault, que j'aime ta couleyur défault..
        DODDLE.strasWar.clans.forEach(clan => {
            if (clan.uuid == clanUUID) _color = clan.couleur;
        });
        return _color;
    }

    // Renvois un picto "mort"
    //==============================================================
    //==============================================================
    function giveMeADead() {
        var a = Math.floor(Math.random() * DODDLE.strasWar.markerDeadImages.length);
        return DODDLE.strasWar.markerDeadImages[a];
    }

    // Dessine les unités d'origine(init)
    //==============================================================
    //==============================================================
    function drawUnits(data) {
        // On sauvegardes la zone et le gagnant pour réinjection à la fin
        _winnerClan = data.clanGagnant;
        _currentZone = data.zone;

        // recherche du cadrage + ajout d'unites sur la carte
        for (var u in data.timeLine[0]) { // 0 est la phase d'init
            var s = data.timeLine[0][u];
            var marker = DODDLE.strasWar.drawUnites(
                s.nom,
                s.couleur,
                s.modele,
                0, // Stratégie
                s.position,
                0, // Zone... c'est quoi ?????
                s.num
            );
            marker.pv = s.pv; // On stock des infos additionnelles
            DODDLE.strasWar.joueur.unites.push(marker);
            bounds.extend(marker.position);
        }
        DODDLE.strasWar.map.fitBounds(bounds);
        var z = DODDLE.strasWar.map.getZoom();
        DODDLE.strasWar.map.setZoom(z);
        DODDLE.strasWar.drawZones(); // zoom, important pour les tours
        DODDLE.strasWar.playWar.tempo = setInterval(animator, _frameRate);

    }

    //==============================================================
    // Envois le timer d'animation
    //==============================================================
    function littlePause() {
        // Gestion de l'animList quand même
        DODDLE.strasWar.anim.play();
        if (_cptPause >= 20) {
            clearInterval(DODDLE.strasWar.playWar.tempo);
            DODDLE.strasWar.playWar.tempo = setInterval(animator, _frameRate);
        }
        _cptPause++;
    }
    //==============================================================
    function animator() {
        var _this = DODDLE.strasWar;
        var sequence, marker, marker2, lng;
        var timeLine = _this.playWar.timeLine;
        var p1, p2, pv, ll, np;
        var anim = DODDLE.strasWar.anim;
        var _cptGo = 0;
        var _b;


        // Gestion de l'animList
        anim.play();

        if (_this.playWar.next) { // on passe a l'étape suivante
            _this.playWar.sequence++;
            // Verification et intialisation des actions
            if (_this.playWar.sequence >= timeLine.length - 1) { // -1 car une séquence vide à la fin
                colorZone(_winnerClan, _currentZone); // On met la couleur de fin
                // On prepare la popup
                DODDLE.strasWar.page.clearPopUp();
                var _d = document.createElement("div");
                var _d3 = document.createElement("div");
                _d.setAttribute("class", "ctrl");

                if (_winnerClan == "") { // Le gagnant est la mort :-)
                    _d3 = DODDLE.strasWar.page.addImage(DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, searchColor(_winnerClan), 5 + Math.floor(Math.random() * 5)), "roi");
                } else { // La on a un vrai gagnant
                    _d3 = DODDLE.strasWar.page.addImage(DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, searchColor(_winnerClan), 4), "roi");
                }
                _d = DODDLE.strasWar.page.createActionButton("Le gagnant est...", "DODDLE.strasWar.page.hidePopUp();DODDLE.strasWar.pilotage('listOfWar');");
                DODDLE.strasWar.page.addPopUpContainer(_d);
                DODDLE.strasWar.page.addPopUpContainer(_d3);
                DODDLE.strasWar.page.showPopUp();
                clearInterval(DODDLE.strasWar.playWar.tempo);
            } else {
                for (var s in timeLine[_this.playWar.sequence]) {
                    sequence = timeLine[_this.playWar.sequence][s];
                    switch (sequence.ordre) {
                        case "M":
                            marker = _this.searchUnitesByUUID(sequence.num);
                            if (marker !== null) {
                                ll = new google.maps.LatLng(sequence.position.lat, sequence.position.lng);
                                p1 = DODDLE.tools.latLngToPixel(ll, DODDLE.strasWar.map);

                                // Direction du soldat, direction D par défaut donc on modifie rien si c'est pas utile
                                if (sequence.orientation == "D") {
                                    p1.x -= 22;
                                    np = DODDLE.tools.pixelToLatLng(p1, DODDLE.strasWar.map);
                                    sequence.position.lng = np.lng();
                                } else {
                                    p1.x += 22;
                                    np = DODDLE.tools.pixelToLatLng(p1, DODDLE.strasWar.map);
                                    sequence.position.lng = np.lng();
                                    DODDLE.strasWar.markerImage.url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60,
                                        marker.couleur,
                                        marker.modele,
                                        marker.pv,
                                        sequence.orientation);
                                    marker.setIcon(DODDLE.strasWar.markerImage);
                                }
                                marker.orientation = sequence.orientation;

                                p2 = DODDLE.tools.latLngToPixel(marker.position, DODDLE.strasWar.map);
                                pv = new google.maps.Point(p1.x - p2.x, p1.y - p2.y);
                                lng = Math.sqrt(pv.x * pv.x + pv.y * pv.y);
                                sequence.velX = (pv.x / lng);
                                sequence.velY = (pv.y / lng);
                                sequence.go = true;
                            }
                            break;
                        case "F": // TOTEST
                            marker = _this.searchUnitesByUUID(sequence.num1);
                            marker2 = _this.searchUnitesByUUID(sequence.num2);
                            if (marker !== null && marker2 !== null) {
                                var fronde = new animFronde();
                                fronde.show();
                                anim.addAnim(fronde);
                                var blood = new animBlood(marker2.position, DODDLE.strasWar.map);
                                fronde.setChain(blood);
                                anim.addAnim(blood);
                                sequence.go = true;
                            }
                        case "T":
                            marker = _this.searchUnitesByUUID(sequence.num1);
                            marker2 = _this.searchUnitesByUUID(sequence.num2);
                            if (marker !== null && marker2 !== null) {
                                var fleche = new animFleche();
                                fleche.setDirection(marker, marker2);
                                fleche.show();
                                anim.addAnim(fleche);
                                var blood = new animBlood(marker2.position, DODDLE.strasWar.map);
                                fleche.setChain(blood);
                                anim.addAnim(blood);
                                sequence.go = true;
                            }
                            break;
                        case "C":
                            marker = _this.searchUnitesByUUID(sequence.num1);
                            marker2 = _this.searchUnitesByUUID(sequence.num2);
                            if (marker !== null && marker2 !== null) sequence.go = true;
                            break;
                    }
                }
            }
            _this.playWar.next = false;
        } else { // ici on anime
            // Réalisation des actions
            for (var s in timeLine[_this.playWar.sequence]) {
                sequence = timeLine[_this.playWar.sequence][s];
                if (sequence.go) {
                    _cptGo++;
                    switch (sequence.ordre) {
                        case "M": // un déplacement
                            marker = _this.searchUnitesByUUID(sequence.num);
                            ll = new google.maps.LatLng(sequence.position.lat, sequence.position.lng);

                            p1 = DODDLE.tools.latLngToPixel(ll, DODDLE.strasWar.map);
                            p2 = DODDLE.tools.latLngToPixel(marker.position, DODDLE.strasWar.map);
                            pv = new google.maps.Point(p1.x - p2.x, p1.y - p2.y);
                            lng = Math.sqrt(pv.x * pv.x + pv.y * pv.y);

                            if (lng > 1) { // On s'approche à 20 pixel pres
                                p2.x += sequence.velX * 2;
                                p2.y += sequence.velY * 2;
                                np = DODDLE.tools.pixelToLatLng(p2, DODDLE.strasWar.map);
                                marker.setPosition(np);
                            } else {
                                sequence.go = false; // Fin de la marche on est arrivée au combat
                            }
                            break;
                        case "T": // C'est un tir à l'arc
                            //marker = _this.searchUnitesByUUID(sequence.num1);
                            marker2 = _this.searchUnitesByUUID(sequence.num2);

                            if (sequence.pv2 <= 0) {
                                marker2.setIcon(giveMeADead());
                                marker2.set('labelContent', '');
                            } else {
                                marker2.pv = sequence.pv2;
                                DODDLE.strasWar.markerImage.url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60,
                                    marker2.couleur,
                                    marker2.modele,
                                    marker2.pv,
                                    marker2.orientation);
                                marker2.setIcon(DODDLE.strasWar.markerImage);
                            }
                            sequence.go = false;

                            break;
                        case "C": // C'est un combat
                            marker = _this.searchUnitesByUUID(sequence.num1);
                            marker2 = _this.searchUnitesByUUID(sequence.num2);

                            // On ajoute un BAM au milieu
                            var pb = new google.maps.LatLng(((marker.position.lat() + marker2.position.lat()) / 2) - 0.0001,
                                ((marker.position.lng() + marker2.position.lng()) / 2));

                            var bam = new animBam(pb, DODDLE.strasWar.map);
                            bam.show(DODDLE.strasWar.map);
                            bam.noOptimization(2000);
                            anim.addAnim(bam);

                            // On redemande une image pour pouvoir afficher correctement la jauge de PVIE
                            // ou parce qu'on est mort
                            if (sequence.pv1 <= 0) {
                                marker.setIcon(giveMeADead());
                                marker.set('labelContent', '');
                            } else {
                                DODDLE.strasWar.markerImage.url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60,
                                    marker.couleur,
                                    marker.modele,
                                    sequence.pv1,
                                    marker.orientation);
                                marker.setIcon(DODDLE.strasWar.markerImage);
                                marker.pv = sequence.pv1;
                            }
                            if (sequence.pv2 <= 0) {
                                marker2.setIcon(giveMeADead());
                                marker2.set('labelContent', '');
                            } else {
                                DODDLE.strasWar.markerImage.url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60,
                                    marker2.couleur,
                                    marker2.modele,
                                    sequence.pv2,
                                    marker2.orientation);
                                marker2.setIcon(DODDLE.strasWar.markerImage);
                                marker2.pv = sequence.pv2;
                            }
                            sequence.go = false;

                            break;
                    }
                }
            }
            if (_cptGo == 0) {
                // On passe à la prochaine animation
                _this.playWar.next = true;
                // On part sur une pause on remet le compteur à 0
                _cptPause = 0;
                clearInterval(DODDLE.strasWar.playWar.tempo);
                DODDLE.strasWar.playWar.tempo = setInterval(littlePause, _frameRate);
            }
            _cptGo = 0;
        }
    }
    //==============================================================
    //==============================================================

    DODDLE.strasWar.page.addToPage(_map);
    DODDLE.strasWar.page.needGoBack("DODDLE.strasWar.pilotage('listOfWar');");

    // On cible la map dans ma page
    DODDLE.strasWar.map = new google.maps.Map(_map, DODDLE.strasWar.mapOptions);
    // Centrage de carte
    DODDLE.strasWar.map.fitBounds(DODDLE.strasWar.bounds); // On cadre
    var z = DODDLE.strasWar.map.getZoom();
    DODDLE.strasWar.map.setZoom(z);
    DODDLE.strasWar.drawZones();

    DODDLE.strasWar.page.callServer("getWarResult", {
            warUuid: uuid
        })
        .then(
            function (data) {
                if (data.etat == 'ko')
                    DODDLE.strasWar.page.addWarningMessage(data.msg);
                else {
                    DODDLE.strasWar.playWar.timeLine = data.timeLine;
                    DODDLE.strasWar.setColor(data.history);
                    drawUnits(data);
                }
            }
        ).catch(
            function (error) {
                DODDLE.strasWar.page.addErrorMessage("Problème lecture:" + error);
            }
        );

    DODDLE.strasWar.page.servicesToClean(function () {
        clearInterval(DODDLE.strasWar.playWar.tempo);
        DODDLE.strasWar.setColor(); // On remet l'état précédent en sortant
        DODDLE.strasWar.joueur.unites = [];
    });
};

DODDLE.strasWar.setColor = function (zones) {
    function colorize(zones) {
        DODDLE.strasWar.zones.forEach(zone => {
            zones.forEach(zoneNew => {
                if (zone.uuid == zoneNew.uuid) {
                    zone.setOptions({
                        strokeColor: zoneNew.color,
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: zoneNew.color,
                        fillOpacity: 0.5
                    });
                }
            });
        });
    }

    if (zones === undefined) {
        zones = DODDLE.strasWar.oldZones;
    } else {
        // On sauvegarde l'état précédent pour pouvoir y revenir facilement
        DODDLE.strasWar.oldZones = [];
        DODDLE.strasWar.zones.forEach(zone => {
            DODDLE.strasWar.oldZones.push({
                uuid: zone.uuid,
                color: zone.get("fillColor")
            })
        });
    }
    colorize(zones);
}

//*********************************************
//*********************************************
// Affiche Carte pour positionnement
// des soldats
//*********************************************
//*********************************************
DODDLE.strasWar.ecranCarte = function () {
    // Page appelé par le pilotage globale pas besoin de clearPage (géré par pilotage)
    var _map, _this, _div, _nbUnit = 0,
        _infoPos;

    _this = DODDLE.strasWar.page;
    DODDLE.strasWar.towers = true;

    function addControl() {
        var controlDiv = document.createElement('div');
        controlDiv.setAttribute("class", "tower");

        // Setup the click event listeners: simply set the map to Chicago.
        controlDiv.addEventListener('click', function() {
            DODDLE.strasWar.showHideTowers();
        });

        controlDiv.index = 1;

        return controlDiv;
    }    

    // Créé les controles ADD et MOD si-besoin
    DODDLE.strasWar.ctrl();

    // On ne veut pas que l'écran s'éteigne
    DODDLE.strasWar.noSleep.enable();

    // FIXME: Etrange parfois pas à blanc ?? Malgres le fait que pas d'unit dans le retour sql ??
    // Je mets à blanc la liste des soldats mais il faut la charger !!
    if (DODDLE.strasWar.joueur.unites !== undefined) {
        DODDLE.strasWar.joueur.unites.forEach(unit => {
            unit.setMap(null)
        });
    }
    DODDLE.strasWar.joueur.unites = [];

    _map = document.createElement("div");
    _map.setAttribute("id", "map-canvas");
    DODDLE.strasWar.page.addToPage(_map);

    // On cible la map dans ma page
    DODDLE.strasWar.map = new google.maps.Map(_map, DODDLE.strasWar.mapOptions);
    if (DODDLE.strasWar.test) DODDLE.strasWar.map.draggable=true;

    _this.needGoBack("DODDLE.strasWar.ecranCarteGoBack();");

    _div = document.createElement("div");
    _div.setAttribute("id", "ctrl");

    _div.appendChild(DODDLE.strasWar.ctrl_add);
    _this.addToPage(_div);

    // Compteur d'unités affiché sur la map
    DODDLE.strasWar.nbUnites = document.createElement("div");
    DODDLE.strasWar.nbUnites.setAttribute("id", "nbUnites");
    DODDLE.strasWar.majUnites();
    DODDLE.strasWar.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(DODDLE.strasWar.nbUnites);

    DODDLE.strasWar.infoPos = document.createElement("div");
    DODDLE.strasWar.infoPos.setAttribute("class", "fontMap");
    DODDLE.strasWar.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(DODDLE.strasWar.infoPos);

    DODDLE.strasWar.towersOnOff = document.createElement("div");
    DODDLE.strasWar.towersOnOff = addControl();
    DODDLE.strasWar.map.controls[google.maps.ControlPosition.TOP_LEFT].push(DODDLE.strasWar.towersOnOff);

    DODDLE.fetch.call("svg/target.svg").then(function (img) {
        var targetIcon = {
            url: img.src,
            //url: DODDLE.fetch.getImageUrl("target"),
            scaledSize: new google.maps.Size(50, 50), // scaled size
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(25, 25)
        };

        // On ajoute la cible centrale
        DODDLE.strasWar.marker = new google.maps.Marker({
            icon: targetIcon,
            position: DODDLE.strasWar.map.getCenter(),
            draggable: false,
            map: DODDLE.strasWar.map,
        });
    }).catch(function () {
        DODDLE.strasWar.page.addErrorMessage("Ressource Target absente !");
    })

    DODDLE.strasWar.drawZones();

    // On efface les voisins
    DODDLE.strasWar.clearVoisinLine();
    //zone.clan
    //zone.uuid
    //zone.voisins (uuid)

    DODDLE.strasWar.zones.forEach(zone => {
        if (zone.clan == DODDLE.strasWar.clan) {
            // Si c'est notre clan
            DODDLE.strasWar.drawVoisins(zone);
        }
    })

    DODDLE.strasWar.page.callServer("getUnites", {
        userid: DODDLE.strasWar.joueur.userid
    }).then(
        function (data) {
            if (data.etat == 'ko')
                DODDLE.strasWar.page.addWarningMessage(data.msg);
            else {
                DODDLE.strasWar.redrawUnites(data);
            }
        }
    ).catch(
        function () {
            DODDLE.strasWar.page.addWarningMessage("Problème de récupération des armées...");
        }
    );

    // Hmmmm pas utile du tout...
    if (!navigator.geolocation) {
        DODDLE.strasWar.page.addWarningMessage("Merci d'autoriser la géolocalisation!");
    } else {
        DODDLE.strasWar.surveillePos();
    }

    // Les services à débrancher quand on quitte
    DODDLE.strasWar.page.servicesToClean(function () {
        navigator.geolocation.clearWatch(DODDLE.strasWar.survId);
        // On supprime la liste vu qu'on la rechrge tous le temps...
        DODDLE.strasWar.joueur.unites.forEach(unit => {
            unit.setMap(null)
        });
        DODDLE.strasWar.joueur.unites = [];
        DODDLE.strasWar.noSleep.disable();
    });

};

DODDLE.strasWar.showHideTowers = function(){
    DODDLE.strasWar.towers=!DODDLE.strasWar.towers;
    DODDLE.strasWar.tours.forEach(tour => {
    if (DODDLE.strasWar.towers)
        tour.setMap(DODDLE.strasWar.map);
    else
        tour.setMap(null);
    });
};

// region DRAW_VOISIN

DODDLE.strasWar.drawVoisins = function (zone) {
    var c = zone.getBoundsCenter();
    // https://stackoverflow.com/questions/23198372/polylines-with-start-and-end-of-location-in-google-maps-v3
    zone.voisins.forEach(voisin => {
        var zz = DODDLE.strasWar.searchZoneByUUID(voisin);
        if (zz) {
            if (zz.clan != DODDLE.strasWar.clan) {
                var vc = zz.getBoundsCenter();
                var dLng = vc.lng() - c.lng();        // Pente sur la longitude
                var dLat = vc.lat() - c.lat(); // Pente sur la latitude
                var dist = 20;      // Ecart en pourcent avec les centres des régions...

                var a = new google.maps.LatLng(c.lat() + dLat*dist/100,c.lng() + dLng*dist/100);
                var b = new google.maps.LatLng(c.lat() + dLat*(100-dist)/100,c.lng() + dLng*(100-dist)/100);

                // On fait la fléche entre les 2 régions
                var line = new google.maps.Polyline({
                    path: [a, b],
                    strokeColor: '#000000',
                    strokeOpacity: 1.0,
                    strokeWeight: 5,
                    icons: [{
                        icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            fillOpacity: 1
                        },
                        offset: '100%'
                    }]
                });
                line.setMap(DODDLE.strasWar.map);
                DODDLE.strasWar.lines.push(line);
            }
        }
    })
};

DODDLE.strasWar.searchZoneByUUID = function (uuid) {
    for (var z in DODDLE.strasWar.zones)
        if (DODDLE.strasWar.zones[z].uuid == uuid) return DODDLE.strasWar.zones[z];
    console.error("UUID non trouvé dans zones : " + uuid);
    return undefined;
};

DODDLE.strasWar.clearVoisinLine = function () {
    for (var l in DODDLE.strasWar.lines) {
        DODDLE.strasWar.lines[l].setMap(null);
    }
    DODDLE.strasWar.lines = [];
};

/*DODDLE.strasWar.getZoneCenter = function (zone) {
    var bounds = new google.maps.LatLngBounds();

    for (var m in zone.markers) {
        bounds.extend(zone.markers[m].position);
    }
    return bounds.getCenter();
};*/
// endregion

DODDLE.strasWar.ecranCarteHelp = function () {
    DODDLE.strasWar.page.callServer("html/ecranCarteHelp.html").then(function (html) {
        DODDLE.strasWar.page.loadPage(html);
    }).catch(function (error) {
        DODDLE.strasWar.page.addErrorMessage("Page non trouvé !");
    })
    DODDLE.strasWar.page.needGoBack("DODDLE.strasWar.pilotage('map');");
}

// Gère la sortie de l'écran, on vérifie d'abors si il n'y pas eu de modification de liste
DODDLE.strasWar.ecranCarteGoBack = function () {
    var _bNO, _bYES, _texte;
    var list = DODDLE.strasWar.someUnitsChange()
    if (list.length > 0) {
        DODDLE.strasWar.ecranCarteWarning("DODDLE.strasWar.pilotage('main');");
    } else DODDLE.strasWar.pilotage('main');
}

DODDLE.strasWar.ecranCarteGoHelp = function () {
    var _bNO, _bYES, _texte;
    var list = DODDLE.strasWar.someUnitsChange()
    if (list.length > 0) {
        DODDLE.strasWar.ecranCarteWarning("DODDLE.strasWar.pilotage('ecranCarteHelp');");
    } else DODDLE.strasWar.pilotage('ecranCarteHelp');
}

DODDLE.strasWar.ecranCarteWarning = function (pil) {
    // On prepare la popup
    DODDLE.strasWar.page.clearPopUp();

    _texte = document.createElement("div");
    _texte.setAttribute("class", "popUpContainer");
    _texte.innerHTML = "Attention ! Les ordres ne sont pas validés! Si vous quittez la page ils seront perdus.";
    _bNO = DODDLE.strasWar.page.createAnnulationButton("NON!", "DODDLE.strasWar.page.hidePopUp();");
    _bYES = DODDLE.strasWar.page.createValidationButton("Bah oui...", "DODDLE.strasWar.page.hidePopUp();" + pil);


    var _d = document.createElement("div");
    _d.setAttribute("class", "popUpBoutonBloc");
    _d1 = document.createElement("div");
    _d2 = document.createElement("div");
    _d1.setAttribute("class", "cinqantePourcent");
    _d2.setAttribute("class", "cinqantePourcent");
    _d1.appendChild(_bYES);
    _d2.appendChild(_bNO);
    _d.appendChild(_d1);
    _d.appendChild(_d2);

    DODDLE.strasWar.page.addPopUpContainer(_texte);
    DODDLE.strasWar.page.addPopUpContainer(_d);

    DODDLE.strasWar.page.showPopUp();

}

// Recherche une unité par son uuid
DODDLE.strasWar.searchUnitesByUUID = function (uuid) {
    for (var u in DODDLE.strasWar.joueur.unites) {
        if (DODDLE.strasWar.joueur.unites[u].uuid == uuid) return DODDLE.strasWar.joueur.unites[u];
    }
    return null;
};

// Redessine les unites chargé dans unites :-) Quoi ? HEin.. Ptain pas clair...
DODDLE.strasWar.redrawUnites = function (data) {
    var marker;
    for (var unite in data.unites) {
        marker = DODDLE.strasWar.drawUnites(
            data.unites[unite].joueur,
            data.unites[unite].couleur,
            data.unites[unite].modele,
            data.unites[unite].strategie,
            data.unites[unite].position,
            data.unites[unite].zone,
            data.unites[unite].key
        );

        //==============================
        // Si l'unites nous appartient on peut la modifier...
        //==============================
        if (data.unites[unite].joueur == DODDLE.strasWar.joueur.name) {
            marker.addListener('click', function () {
                DODDLE.strasWar.markerCible = this;

                var _t = document.getElementById("ctrl"); // Récupération du controle
                _t.innerHTML = ""; // On le vide
                _t.appendChild(DODDLE.strasWar.ctrl_mod); // Et on y insert linterace de modification d'unité

            });
        }

        marker.etat = "O"; // C'est un perso old (donc lu)
        DODDLE.strasWar.joueur.unites.push(marker);
        DODDLE.strasWar.majUnites();
    }
};

DODDLE.strasWar.someUnitsChange = function () {
    var unites = [];

    for (var unite in DODDLE.strasWar.joueur.unites) {
        if (DODDLE.strasWar.joueur.unites[unite].etat == "N" || DODDLE.strasWar.joueur.unites[unite].etat == "D") {
            unites.push({
                position: DODDLE.strasWar.joueur.unites[unite].position,
                modele: DODDLE.strasWar.joueur.unites[unite].modele,
                zone: DODDLE.strasWar.joueur.unites[unite].zone,
                etat: DODDLE.strasWar.joueur.unites[unite].etat,
                strategie: DODDLE.strasWar.joueur.unites[unite].strategie,
                key: DODDLE.strasWar.joueur.unites[unite].uuid
            });
        }
    }
    return unites;
}

// Valide la selection et l'envois au server
DODDLE.strasWar.validerUnites = function () {
    var unites = DODDLE.strasWar.someUnitsChange();

    DODDLE.strasWar.page.sendMsg("canIModify").then(function (modify) {
        if (modify) {
            if (unites.length > 0) {
                DODDLE.strasWar.page.callServerPost("postUnites", {
                    userid: DODDLE.strasWar.joueur.userid,
                    unites: unites
                }).then(
                    function (data) {
                        if (data.etat == 'ko')
                            DODDLE.strasWar.page.addWarningMessage(data.msg);
                        else {
                            // Il faut faire un clear des unites potentielement présente
                            for (var u in DODDLE.strasWar.joueur.unites) DODDLE.strasWar.joueur.unites[u].setMap(null);
                            // On jete la liste
                            DODDLE.strasWar.joueur.unites = [];
                            // Et on redraw... bourrin mais clean à la fin...
                            DODDLE.strasWar.redrawUnites(data);
                            DODDLE.strasWar.page.addMessage("Ordre validé!");
                        }
                    }
                ).catch(
                    function () {
                        DODDLE.strasWar.page.addErrorMessage("Problème réseau!")
                    }
                );
            } else DODDLE.strasWar.page.addMessage("Pas de nouvel ordre!");
        } else {
            DODDLE.strasWar.page.addErrorMessage("Résolution des combats en cours, modification des armées impossibles!");
        }
    }).catch(function (e) {
        DODDLE.strasWar.page.addErrorMessage("problème de communication local (%1)!", e);
    });

};

// Test si il est possible d'attauqer la ou est l'unité
DODDLE.strasWar.canIAttack = function (pos) {
    var _zones = DODDLE.strasWar.zones;

    for (var z in _zones) {
        if (google.maps.geometry.poly.containsLocation(pos, _zones[z])) {
            // Je sais quelle zone j'attaque
            if (_zones[z].clan != DODDLE.strasWar.clan) { // Si c'est pas chez nous
                // Il faut rechercher si c'est contigu à une zone à nous
                for (var v in _zones[z].voisins) {
                    var _voisin = _zones[z].voisins[v];

                    for (var zz in _zones) { // On cherche a qui appartienne les voisins
                        if (_zones[zz].uuid == _voisin) { // On cherche dans liste des clans si on trouve le voisin
                            if (_zones[zz].clan == DODDLE.strasWar.clan) {
                                // On en a un qui nous appartient !! L'attaque est justifié !!!
                                return _zones[z]; // A l'attaque !!
                            }
                        }
                    }
                }
                return false;
            } else return _zones[z]; // Défense la zone est à nous...
        }
    }
    return false;
};

// Dessine une seule unité
DODDLE.strasWar.drawUnites = function (nomChef, couleur, modele, strategie, position, zone, uuid, dir) {
    var _url, marker, markerImage;

    switch (parseInt(modele)) {
        case 0: // soldat
            _url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, couleur, 0, 3, dir);
            break;
        case 1: // piquier
            _url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, couleur, 1, 3, dir);
            break;
        case 2: // chevalier
            _url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, couleur, 2, 3, dir);
            break;
        case 3: // Archer
            _url = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, couleur, 3, 3, dir);
            break;
    }

    markerImage = {
        url: _url,
        scaledSize: new google.maps.Size(45, 65),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 62)
    };

    if (uuid === undefined) uuid = "";

    marker = new MarkerWithLabel({
        // Mes donnnées
        uuid: uuid,
        couleur: couleur,
        modele: modele,
        strategie: strategie,
        position: position,
        zone: zone,
        etat: "N", // A inserer car tout neuf
        draggable: false,
        labelContent: nomChef,
        labelAnchor: new google.maps.Point(30, 0),
        labelClass: "labels",
        labelStyle: {
            opacity: 1
        }
    });

    marker.setIcon(markerImage);
    marker.setMap(DODDLE.strasWar.map);

    return marker;
};

// Supprime une unités
DODDLE.strasWar.supUnites = function () {
    if (DODDLE.strasWar.markerCible.etat == 'N')
        DODDLE.strasWar.markerCible.etat = "X"; // Les X on s'en fout...
    else
        DODDLE.strasWar.markerCible.etat = "D"; // Les D il faut demander une suppression en base..

    DODDLE.strasWar.markerCible.setMap(null);
    DODDLE.strasWar.majUnites();
    DODDLE.strasWar.closeUnites();
};

DODDLE.strasWar.compteURUnites = function () {
    var nb = 0;

    DODDLE.strasWar.joueur.unites.forEach(unite => {
        if (unite.labelContent.toLocaleLowerCase() == DODDLE.strasWar.joueur.name.toLowerCase())
            if (unite.etat != "D" && unite.etat != "X") nb++;
    });

    return nb;
}

// Met à jour affichage du nombre d'unites à poser
DODDLE.strasWar.majUnites = function () {
    var _nb = 0,
        _army;

    _nb = DODDLE.strasWar.compteURUnites();

    // On met à jour le nombtre d'unités sur l'écran
    DODDLE.strasWar.nbUnites.innerHTML = "";
    for (var n = 0; n < (DODDLE.strasWar.joueur.maxUnites - _nb); n++) {
        _army = document.createElement("div");
        _army.setAttribute("class", "army");
        DODDLE.strasWar.nbUnites.appendChild(_army);
    }

    return _nb;
};

// ...
DODDLE.strasWar.addUnites = function (pos) {
    var _joueur = DODDLE.strasWar.joueur;
    var _zoneAttack, position;

    if (pos === undefined) pos = DODDLE.strasWar.map.getCenter();

    if (_joueur.maxUnites > DODDLE.strasWar.compteURUnites()) {
        // Est-on dans une zone ?
        _zoneAttack = DODDLE.strasWar.canIAttack(pos);

        if (_zoneAttack) {
            var marker, position;
            var modele = document.querySelector(".unites:checked").value;
            var strategie = 0;

            marker = DODDLE.strasWar.drawUnites(DODDLE.strasWar.joueur.name, DODDLE.strasWar.joueur.color, modele, strategie, pos, _zoneAttack.nom);

            marker.addListener('click', function () {
                DODDLE.strasWar.markerCible = marker;
                var _t = document.getElementById("ctrl"); // Récupération du controle
                _t.innerHTML = ""; // On le vide
                _t.appendChild(DODDLE.strasWar.ctrl_mod); // Et on y insert l'interface de modification d'unité
            });

            DODDLE.strasWar.joueur.unites.push(marker);
            DODDLE.strasWar.majUnites();
        } else DODDLE.strasWar.page.addWarningMessage("Vous n'etes pas dans une zone attaquable!");
    } else DODDLE.strasWar.page.addWarningMessage("Vous ne pouvez plus poser d'unités!");
};

// Ferme l'interface de supression d'unités
DODDLE.strasWar.closeUnites = function () {
    DODDLE.strasWar.markerCible = undefined;

    var _t = document.getElementById("ctrl");
    _t.innerHTML = "";
    _t.appendChild(DODDLE.strasWar.ctrl_add);
};

//*********************************************
//*********************************************
// Affiche juste la carte complète
//*********************************************
//*********************************************
DODDLE.strasWar.ecranShowCarte = function () {
    var _map;

    function addControl() {
        var controlDiv = document.createElement('div');
        controlDiv.setAttribute("class", "first");

        // Setup the click event listeners: simply set the map to Chicago.
        controlDiv.addEventListener('click', function() {
            DODDLE.strasWar.showHighscore();
        });

        controlDiv.index = 1;

        return controlDiv;
    }   

    _map = document.createElement("div");
    _map.setAttribute("id", "map-canvas-all");
    DODDLE.strasWar.page.addToPage(_map);
    DODDLE.strasWar.page.needGoBack("DODDLE.strasWar.pilotage('main');");

    // On cible la map dans ma page
    DODDLE.strasWar.map = new google.maps.Map(_map, DODDLE.strasWar.mapOptions);
    DODDLE.strasWar.zoomWar();

    DODDLE.strasWar.map.fitBounds(DODDLE.strasWar.bounds); // On cadre
    var z = DODDLE.strasWar.map.getZoom();
    DODDLE.strasWar.map.setZoom(z);
    DODDLE.strasWar.drawZones();

    DODDLE.strasWar.towersOnOff = document.createElement("div");
    DODDLE.strasWar.towersOnOff = addControl();
    DODDLE.strasWar.map.controls[google.maps.ControlPosition.TOP_LEFT].push(DODDLE.strasWar.towersOnOff);    
};

DODDLE.strasWar.showHighscore = function(){
    DODDLE.strasWar.page.clearPopUp();

    _texte = document.createElement("div");
    _texte.setAttribute("class", "popUpContainer");
    _texte.innerHTML = "Le Maitre du monde est";
    _bYES = DODDLE.strasWar.page.createValidationButton("Ok", "DODDLE.strasWar.page.hidePopUp();");

    //DODDLE.tools.giveMeColouredSprite("soldats", 45, 65, searchColor(_winnerClan), 4)

    DODDLE.strasWar.page.callServer("getHighScore",{
        war: DODDLE.strasWar.war.id
    }).then(function (html) {
        _texte.innerHTML = html;
    }).catch(function (error) {
        DODDLE.strasWar.page.addErrorMessage("Page non trouvé !");
    })

    // DODDLE.strasWar.page.callServer("getHighScore", {
    //     war: DODDLE.strasWar.war.id
    // }).then(function(data){
    //     Object.keys(data).forEach(nom => {
    //          _texte.innerHTML += nom  + " " + data[nom].nbRegion + " " + data[nom].couleur
    //     })
    // })
    // .catch(function(){
    //     alert("planté!");
    // })

    var _d = document.createElement("div");
    _d.setAttribute("class", "popUpBoutonBloc");
    _d1 = document.createElement("div");
    _d1.setAttribute("class", "centPourcent");
    _d.appendChild(_bYES);
    //_d.appendChild(_d1);

    DODDLE.strasWar.page.addPopUpContainer(_texte);
    DODDLE.strasWar.page.addPopUpContainer(_d);

    DODDLE.strasWar.page.showPopUp();
};

//***********************************************************************************************************
//***********************************************************************************************************
//***********************************************************************************************************
//***********************************************************************************************************
// Il faut charger les zones en amonts pour pouvoir les utiliser après (necessite loadZone)
//*********************************************
DODDLE.strasWar.drawZones = function () {
    var z, ratio = 1;

    for (var z in DODDLE.strasWar.zones) DODDLE.strasWar.zones[z].setMap(DODDLE.strasWar.map);

    z = DODDLE.strasWar.map.getZoom();
    // Calcul du ratio taille/zoom
    if (z > 17)
        ratio = (z - 17) * 2; // 17 est le zoom par défaut
    else if (z < 17)
        ratio = 1 / ((17 - z) * 2); // 17 est le zoom par défaut

    for (var t in DODDLE.strasWar.tours) {
        // Remettre la size correctement
        DODDLE.strasWar.tours[t].icon.size = new google.maps.Size(Math.round(70 * ratio), Math.round(90 * ratio));
        // Puis jouer sur l'agrandissemeent apres
        DODDLE.strasWar.tours[t].icon.scaledSize = new google.maps.Size(Math.round(70 * ratio), Math.round(90 * ratio));
        DODDLE.strasWar.tours[t].icon.origin = new google.maps.Point(0, 0);
        DODDLE.strasWar.tours[t].icon.anchor = new google.maps.Point(Math.round(35 * ratio), Math.round(86 * ratio));
        DODDLE.strasWar.tours[t].setMap(DODDLE.strasWar.map);
    }
};

// Charges les zones et les stock
//*********************************************
DODDLE.strasWar.loadZones = function (dataMap) {
    var polygon;
    var bounds;
    var globalBounds = new google.maps.LatLngBounds();
    DODDLE.strasWar.zones = []; // En cas de rechargement on supprime le précédent
    DODDLE.strasWar.tours = [];

    for (var z in dataMap) {
        bounds = new google.maps.LatLngBounds();

        polygon = new google.maps.Polygon({
            nom: dataMap[z].nom,
            uuid: dataMap[z].uuid,
            paths: dataMap[z].geographie,
            clan: dataMap[z].clan,
            voisins: dataMap[z].voisins,
            // Si je remontais les clans je pourrai facilement récupérer la couleur plutot que la chopper sur le serveur
            strokeColor: dataMap[z].couleur,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: dataMap[z].couleur,
            fillOpacity: 0.5
        });
        DODDLE.strasWar.zones.push(polygon); // On sauvegarde les polygones, sait-on jamais :-)

        if (DODDLE.strasWar.test) { // Pour ajouter au click des unités (que pour le debug)
            google.maps.event.addListener(polygon, 'click', function (e) {
                DODDLE.strasWar.addUnites(e.latLng);
            });
        }

        // On cherche les limites pour le cadrage
        for (var p in dataMap[z].geographie) {
            bounds.extend(dataMap[z].geographie[p]);
            globalBounds.extend(dataMap[z].geographie[p]);
        }

        // On constitu une liste de chateau/tour..
        if (dataMap[z].tour > 0) {
            _sheet = DODDLE.tools.giveMeColouredSprite("tour", 30, 40, dataMap[z].couleur);

            markerImage = {
                url: _sheet,
                scaledSize: new google.maps.Size(70, 90), // scaled size
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(35, 86),
                fillColor: dataMap[z].couleur
            };

            marker = new google.maps.Marker({
                icon: markerImage,
                position: bounds.getCenter(),
                draggable: false
            });

            DODDLE.strasWar.tours.push(marker);
        }
    }
    DODDLE.strasWar.bounds = globalBounds;
};

// Affichage et mise à jour de la position sur la carte
//*********************************************
DODDLE.strasWar.majPosition = function (position) {
    var infoPos = "";

    // on en profite pour placer la map
    var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    DODDLE.strasWar.position = point; // On sauvegarde la position
    DODDLE.strasWar.map.setCenter(point);
    DODDLE.strasWar.marker.setPosition(point); // Le pointeur de position

    // Est-on dans une zone ?
    for (var z in DODDLE.strasWar.zones) {
        if (google.maps.geometry.poly.containsLocation(point, DODDLE.strasWar.zones[z])) {
            infoPos = DODDLE.strasWar.zones[z].nom;
            break; // On trouve on sort, pas possible d'etre dans 2 zones
        }
    }

    // Et on affiche..
    if (DODDLE.strasWar.infoPos.innerHTML != null) DODDLE.strasWar.infoPos.innerHTML = infoPos;
};

// Positionne une erreur sur le GPS
//*********************************************
DODDLE.strasWar.errorPosition = function (error) {
    var info = "";

    switch (error.code) {
        case error.TIMEOUT:
            info += "Timeout !";
            break;
        case error.PERMISSION_DENIED:
            info += "Vous n’avez pas donné la permission";
            break;
        case error.POSITION_UNAVAILABLE:
            info += "La position n’a pu être déterminée";
            break;
        case error.UNKNOWN_ERROR:
            info += "Erreur inconnue";
            break;
    }

    DODDLE.strasWar.page.addWarningMessage(info);
    if (DODDLE.strasWar.infoPos.innerHTML != null) DODDLE.strasWar.infoPos.innerHTML = "";
};

// Met un evenemetn sur le déplacement via le GPS
//*********************************************
DODDLE.strasWar.surveillePos = function () {
    // On déclare la variable survId afin de pouvoir par la suite annuler le suivi de la position
    navigator.geolocation.clearWatch(DODDLE.strasWar.survId);
    // TODO: Vérifier si sur un quit page pas de message innerHtml null !!
    if (DODDLE.strasWar.infoPos.innerHTML != null) DODDLE.strasWar.infoPos.innerHTML = "waiting watch result";
    DODDLE.strasWar.survId = navigator.geolocation.watchPosition(DODDLE.strasWar.majPosition, DODDLE.strasWar.errorPosition, DODDLE.strasWar.options);
};

// Création des interfaces de saisie d'unités
//*********************************************
DODDLE.strasWar.ctrl = function () {
    //if (DODDLE.strasWar.ctrl_add === undefined || DODDLE.strasWar.ctrl_mod === undefined) {
    DODDLE.strasWar.ctrl_add = document.createElement("div");
    DODDLE.strasWar.ctrl_mod = document.createElement("div");

    var _ctrl_add = DODDLE.strasWar.ctrl_add;
    var _ctrl_mod = DODDLE.strasWar.ctrl_mod;
    var ctrl = document.createElement("span");


    ctrl.setAttribute("class", "ctrl");

    //*******************
    // L'interface add
    //*******************
    var _infoPos, _r, _r2, _l, _img, _h;
    var _this = DODDLE.strasWar.page;

    _l = document.createElement("label");
    _l.setAttribute("class", "ctrlUnites");
    _img = document.createElement("img");
    _img.src = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, DODDLE.strasWar.joueur.color, 0);
    _r = _this.addRadio("unites", "0", {
        checked: "checked"
    });
    _r.setAttribute("class", "unites");
    _l.appendChild(_r);
    _l.appendChild(_img);
    ctrl.appendChild(_l);

    _l = document.createElement("label");
    _l.setAttribute("class", "ctrlUnites");
    _img = document.createElement("img");
    _img.src = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, DODDLE.strasWar.joueur.color, 1);
    _r = _this.addRadio("unites", "1");
    _r.setAttribute("class", "unites");
    _l.appendChild(_r);
    _l.appendChild(_img);
    ctrl.appendChild(_l);

    _l = document.createElement("label");
    _l.setAttribute("class", "ctrlUnites");
    _img = document.createElement("img");
    _img.src = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, DODDLE.strasWar.joueur.color, 2);
    _r = _this.addRadio("unites", "2");
    _r.setAttribute("class", "unites");
    _l.appendChild(_r);
    _l.appendChild(_img);
    ctrl.appendChild(_l);

    _l = document.createElement("label");
    _l.setAttribute("class", "ctrlUnites");
    _l.setAttribute("class", "ctrlUnites");
    _img = document.createElement("img");
    _img.src = DODDLE.tools.giveMeColouredSprite("soldats", 45, 60, DODDLE.strasWar.joueur.color, 3);
    _r = _this.addRadio("unites", "3");
    _r.setAttribute("class", "unites");
    _l.appendChild(_r);
    _l.appendChild(_img);
    ctrl.appendChild(_l);

    _d = document.createElement("div");
    _d.setAttribute("class", "centered");
    _h = DODDLE.strasWar.page.getHelp("DODDLE.strasWar.ecranCarteGoHelp()", "");
    _d.appendChild(_h);
    ctrl.appendChild(_d);

    _ctrl_add.appendChild(ctrl);

    // Pour l'instant pa d'utilisation de la stratégie
    /*        _r2 = _this.addRadio("strategie","0",{class:"strategie",checked:"checked"});
            _ctrl_add.appendChild(_r2);
            _r2 = _this.addRadio("strategie","1",{class:"strategie"});
            _ctrl_add.appendChild(_r2);
            _r2 = _this.addRadio("strategie","2",{class:"strategie"});
            _ctrl_add.appendChild(_r2);*/

    _this.addPlusButton("Ajoute", "DODDLE.strasWar.addUnites();");
    _this.addSimpleButton("valider", "DODDLE.strasWar.validerUnites();");
    _ctrl_add.appendChild(DODDLE.strasWar.page.getButtons());
    _this.clearButtons();

    //*******************
    // L'interface mod
    //*******************
    _nbUnites = document.createElement("span");
    _nbUnites.innerHTML = "Confirmer la suppression...";
    _ctrl_mod.appendChild(_nbUnites);

    _ctrl_mod.appendChild(_this.createActionButton("SUPPRIMER ?", "DODDLE.strasWar.supUnites();"));
    _ctrl_mod.appendChild(_this.createActionButton("ABANDONNER", "DODDLE.strasWar.closeUnites();"));
    //}
};
