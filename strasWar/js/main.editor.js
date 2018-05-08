//**************************************************************************
//** Les ecrans cartes'editeur de carte
//**************************************************************************
// En cours:
//   - Mettre une tour ou pas ?
//   - faire le radio de la zone correctement...

// Fait :
//   - Lors de l'add mettre le courant sur le nouveau...
//   - Liste de voisin (ajouter un mode, dans ce mode on peut cliquer sur région pour les higlighter en tant que voisins + bouton valider annuler)
//   - appartenance clan
//   - highlight de la zone seletionné

// Reporté:
//   - Tester si la zone est diff avant de l'ecrire (un write en moins)

// A venir:
//   - Recharger
//   - Prb après sauvegarde ? les uuid ne correspondent plus entre zone et radio ??

DODDLE.editor = {
    DELAY: 500,
    clicks: 0,
    timer: null,
    war: "Wacken'War", // Il faut l'UUID pas le nom..
    map: {},
    zones: [],
    bounds: {},
    currentZone: {},
    mapOptions: {
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scaleControl: false,
        streetViewControl: false,
        disableDoubleClickZoom: true,
        panControl: false,
        clickableIcons: false,
        options: {
            disableDefaultUI: true,
            draggable: true,
            minZoom: 5,
            maxZoom: 19,
            scrollwheel: true,
            noClear: true
        },
    },
    menu: undefined,
    mode: 0, // Dessin ou voisins ??
    lines: []
};

//*********************************************
DODDLE.editor.load = function () {
    // On définit l'objet page...
    DODDLE.editor.page = new pageModel("editor");

    DODDLE.editor.page.callServer("getWars", {})
        .then(
            function (data) {
                DODDLE.editor.war = data[0];
                console.log(DODDLE.editor.war);
                // On charge les clans pour faire une listeBox
                DODDLE.editor.page.callServerPost("getClans", {
                    war: DODDLE.editor.war.uuid
                }).then(
                    function (data) {
                        DODDLE.editor.clans = data;
                        DODDLE.editor.start();
                    }
                );
            }
        ).catch();
};
//*********************************************
DODDLE.editor.start = function () {
    // Page appelé par le pilotage globale pas besoin de clearPage (géré par pilotage)
    var _map, _b, attributs;

    _map = document.querySelector("#map-canvas");

    // On cherche le menu
    DODDLE.editor.menu = document.querySelector("#page");
    // Et on ajoutes le bouton nouvelle zone
    _b = DODDLE.editor.page.createActionButton("Ajouter", "DODDLE.editor.addNewZone();");
    DODDLE.editor.menu.appendChild(_b);
    // Et on ajoutes le bouton sauvegarde
    _b = DODDLE.editor.page.createActionButton("Sauvegarder", "DODDLE.editor.sauveZones();");
    DODDLE.editor.menu.appendChild(_b);
    // Et on ajoutes le bouton changement de mode
    _b = DODDLE.editor.page.createActionButton("Change mode", "DODDLE.editor.changeMode();");
    DODDLE.editor.menu.appendChild(_b);

    attributs = {
        id: "started"
    };
    if (DODDLE.editor.war.started) attributs.checked = "checked";
    _c = DODDLE.editor.page.addLabelledCheckBox("Start", attributs);
    DODDLE.editor.menu.appendChild(_c);

    // On cible la map dans ma page
    DODDLE.editor.map = new google.maps.Map(_map, DODDLE.editor.mapOptions);

    // Ajout du click
    // remplir par défaut currentZone
    // boutton ajoute zones
    // faire une liste de radio pour les zones avec un nom (gestion par uuid)
    google.maps.event.addListener(DODDLE.editor.map, 'click', function (e) {
        if (DODDLE.editor.currentZone !== undefined) {
            // On cherche le z de la zone courante
            //for(var z in DODDLE.editor.zones) if (DODDLE.editor.zones[z].uuid == DODDLE.editor.currentZone) break;
            var z = DODDLE.editor.searchZoneByUUID(DODDLE.editor.currentZone)
            // Et on ajoute le nouveau point
            DODDLE.editor.zones[z].markers.push(DODDLE.editor.addMarker(e.latLng));
            DODDLE.editor.redrawZoneByUUID(DODDLE.editor.currentZone, true);
        } else {
            console.log("pas de zone selectionnées");
        }
    });

    DODDLE.editor.page.callServer("getZones", {
            war: DODDLE.editor.war.uuid
        } // A remplacer par un UUID... Ralalaaaaaaa..
    ).then(
        function (data) {
            if (data.etat == 'ko')
                DODDLE.editor.page.addWarningMessage(data.msg);
            else {
                DODDLE.editor.loadZones(data);
                DODDLE.editor.drawZones();
                // On selectionne le dernier ajouté par défaut..
                DODDLE.editor.currentZone = DODDLE.editor.zones[DODDLE.editor.zones.length - 1].uuid;
                DODDLE.editor.redrawZoneByUUID(DODDLE.editor.currentZone, true);
                DODDLE.editor.map.fitBounds(DODDLE.editor.bounds); // On cadre
            }
        }
    ).catch(
        function () {}
    );
};

DODDLE.editor.changeMode = function () {
    DODDLE.editor.mode = 1 - DODDLE.editor.mode;
    DODDLE.editor.drawZones(); // On efface tout
    DODDLE.editor.drawSelectedZone();

    if (DODDLE.editor.mode === 0) { // Mode dessin
        //TODO: supprimer partie voisins
        DODDLE.editor.clearVoisinLine();
    } else if (DODDLE.editor.mode == 1) { // Mode voisin
        //TODO: Ajouter partie voisin
        DODDLE.editor.drawVoisins(DODDLE.editor.currentZone);
    }
};

// == Zones
// ===================================
DODDLE.editor.drawZones = function () {
    var globalBounds = new google.maps.LatLngBounds();

    for (var z in DODDLE.editor.zones) {
        var b = DODDLE.editor.redrawZone(z, false);
        globalBounds.extend(b.getNorthEast());
        globalBounds.extend(b.getSouthWest());
    }
    DODDLE.editor.bounds = globalBounds;
};

DODDLE.editor.redrawZone = function (z, active) {
    var path = [];
    var opacite = 0.35;
    var bounds = new google.maps.LatLngBounds();

    if (active) opacite = 0.7;

    for (var m in DODDLE.editor.zones[z].markers) {
        // Affichage des markers que si en mode dessin...
        if (active && DODDLE.editor.mode === 0) {
            DODDLE.editor.zones[z].markers[m].setMap(DODDLE.editor.map);
        } else
            DODDLE.editor.zones[z].markers[m].setMap(null);

        path.push(DODDLE.editor.zones[z].markers[m].position);
        bounds.extend(DODDLE.editor.zones[z].markers[m].position);
    }

    // On efface le polygon précédent
    if (DODDLE.editor.zones[z].polygon !== undefined) DODDLE.editor.zones[z].polygon.setMap(null);
    var polygon = new google.maps.Polygon({
        uuid: DODDLE.editor.zones[z].uuid,
        paths: path,
        strokeColor: DODDLE.editor.zones[z].couleur,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: DODDLE.editor.zones[z].couleur,
        fillOpacity: opacite,
        map: DODDLE.editor.map
    });

    google.maps.event.addListener(polygon, 'click', function () {
        if (DODDLE.editor.mode == 1) {
            console.log('AddVoisin :' + this.uuid);
            DODDLE.editor.addVoisin(this.uuid);
        }
    });
    DODDLE.editor.zones[z].polygon = polygon;
    return bounds;
};

DODDLE.editor.redrawZoneByUUID = function (uuid, active) {
    var z = DODDLE.editor.searchZoneByUUID(uuid);
    if (z != -1) DODDLE.editor.redrawZone(z, active);
};

DODDLE.editor.redrawZoneByUUIDMarker = function (uuid) {
    for (var z in DODDLE.editor.zones) {
        var trouve = false;
        for (var m in DODDLE.editor.zones[z].markers) {
            // On cherche le polygon dont le point à été modifié..
            if (DODDLE.editor.zones[z].markers[m].uuid == uuid) {
                DODDLE.editor.zones[z].polygon.setMap(null);
                trouve = z;
                break;
            }
        }
        if (trouve !== false) {
            DODDLE.editor.redrawZone(z, true);
            break;
        }
    }
};

DODDLE.editor.searchZoneByUUID = function (uuid) {
    for (var z in DODDLE.editor.zones)
        if (DODDLE.editor.zones[z].uuid == uuid) return z;
    console.error("UUID non trouvé dans zones : " + uuid);
    return -1;
};

DODDLE.editor.sauveZones = function () {
    var _data = [],
        _nom, _clan, _tour;
    var started = document.querySelector("#started");

    // Sauvegarde etat de la wr
    DODDLE.editor.page.callServer("setWarStart", {
        uuid: DODDLE.editor.war.uuid,
        started: started.checked ? true : false
    }).then();

    // Et de ces zones de combats
    // On construit la zone
    for (var z in DODDLE.editor.zones) {
        // Bon sortie de l'objet, utilité ??
        _nom = document.getElementById("nom_" + DODDLE.editor.zones[z].uuid);
        _clan = document.getElementById("clan_" + DODDLE.editor.zones[z].uuid);
        _tour = document.getElementById("tour_" + DODDLE.editor.zones[z].uuid);
        // Et on fabrique l'objet
        _data.push({
            uuid: DODDLE.editor.zones[z].uuid,
            nom: _nom.value,
            geographie: [], // Remplis plus bas
            voisins: DODDLE.editor.zones[z].voisins,
            clan: _clan.value,
            tour: _tour.checked ? 1 : 0
        });

        // On y remplis sa géographie...
        for (var m in DODDLE.editor.zones[z].markers) _data[_data.length - 1].geographie.push(DODDLE.editor.zones[z].markers[m].position);
    }

    DODDLE.editor.page.callServerPost("setZones", {
        war: DODDLE.editor.war,
        data: _data
    }).then(
        function (data) {
            if (data.etat == 'ko')
                DODDLE.editor.page.addWarningMessage(data.msg);
            else {
                // On enleve les marker de toutes les zones pour commencer
                for (var zzz in DODDLE.editor.zones) DODDLE.editor.redrawZoneByUUID(DODDLE.editor.zones[zzz].uuid, false);
                DODDLE.editor.page.addMessage("Sauvegarde ok");
                // et ont maj les zones ajoutés
                console.log("Nouveaux territoires:" + data.new.length);
                for (var z in data.new) {
                    // Maj de la liste Box (id)
                    var ref = data.new[z].old;
                    console.log(ref);
                    var e = document.querySelectorAll("input[value=" + ref + "]");
                    var e1 = document.getElementById("clan_" + ref);
                    var e2 = document.getElementById("nom_" + ref);
                    var e3 = document.getElementById("tour_" + ref);
                    if (e.length == 1) {
                        e[0].value = data.new[z].new; // On met à jour la value du radioBoutton
                        e1.id = "clan_" + data.new[z].new; // On met à jour du clan
                        e2.id = "nom_" + data.new[z].new; // On met à jour nom
                        e3.id = "tour_" + data.new[z].new; // On met à jour la tour
                        // Maj de la liste des zones
                        var zz = DODDLE.editor.searchZoneByUUID(data.new[z].old);
                        if (zz != -1) DODDLE.editor.zones[zz].uuid = data.new[z].new;
                    } else if (e.length === 0) {
                        console.error("Pas de correspondance trouvé !");
                    } else if (e.length > 1) {
                        console.error("Trop de correspondances trouvés !");
                    }
                }
            }
        }
    ).catch();
};

// Charges les zones, crée la liste de marker poignées + affectation de la fonction de change sur la liste de zones
DODDLE.editor.loadZones = function (dataMap) {
    var _ul;

    DODDLE.editor.zones = dataMap;
    //DODDLE.editor.menu.innerHTML = "";    // TODO: A voir quand même si ça n'avait pas une utilitée...

    _ul = document.createElement("ul");
    _ul.setAttribute("class", "maListe");

    // On cree l'enveloppe UL pour y ajouter les LI avec Radio)
    DODDLE.editor.menu.appendChild(_ul);

    for (var z in DODDLE.editor.zones) {
        var markers = [];
        console.log("Loading zone nommé:>" + DODDLE.editor.zones[z].nom);
        // Pour chaques point on crée un UUID pour le rattacher à son marker
        for (var p in DODDLE.editor.zones[z].geographie) {
            markers.push(DODDLE.editor.addMarker(DODDLE.editor.zones[z].geographie[p]));
        }

        DODDLE.editor.zones[z].markers = markers;
        // Puis on appel le menu pour ajouter une entrée
        DODDLE.editor.addNewEntryMenu(z);
    }
};

DODDLE.editor.addNewZone = function () {
    var _nz, nb;

    DODDLE.editor.mode = 0;
    DODDLE.editor.drawZones();
    DODDLE.editor.clearVoisinLine();

    // Eléments à initialiser pour avoir une zone
    _nz = {
        nom: "New",
        markers: [],
        uuid: "new" + DODDLE.editor.page.giveMeUUID(),
        voisins: [],
        clan: undefined,
        tour: 0
    };

    nb = DODDLE.editor.zones.push(_nz);
    DODDLE.editor.addNewEntryMenu(nb - 1);

    DODDLE.editor.redrawZoneByUUID(DODDLE.editor.currentZone, false);
    DODDLE.editor.currentZone = _nz.uuid;
};

DODDLE.editor.drawSelectedZone = function () {
    var radio = document.querySelector("input[name='zones']:checked");
    DODDLE.editor.currentZone = radio.value;
    DODDLE.editor.redrawZoneByUUID(radio.value, true);
};
// == Voisins
// ===================================

DODDLE.editor.addVoisin = function (nouveauVoisin) {
    if (nouveauVoisin != DODDLE.editor.currentZone) {
        var z = DODDLE.editor.searchZoneByUUID(DODDLE.editor.currentZone);
        for (var v in DODDLE.editor.zones[z].voisins) {
            if (DODDLE.editor.zones[z].voisins[v] == nouveauVoisin) {
                console.log(" on supprime un voisin !");
                DODDLE.editor.zones[z].voisins.splice(v, 1);
                DODDLE.editor.drawVoisins(DODDLE.editor.currentZone);
                return false;
            }
        }
        // Ici on est pas son propre voisin et il n'est pas dans la liste immédiate...
        DODDLE.editor.zones[z].voisins.push(nouveauVoisin);
        DODDLE.editor.drawVoisins(DODDLE.editor.currentZone);
        return true;
    } else console.log("On ne peux tre son propre vosiin!");
    return false;
};

DODDLE.editor.drawVoisins = function (uuid) {
    var z = DODDLE.editor.searchZoneByUUID(uuid);
    var c = DODDLE.editor.getZoneCenter(z);

    DODDLE.editor.clearVoisinLine();

    for (var v in DODDLE.editor.zones[z].voisins) {
        var zz = DODDLE.editor.searchZoneByUUID(DODDLE.editor.zones[z].voisins[v]);
        if (zz != -1) {
            var vc = DODDLE.editor.getZoneCenter(zz);
            var line = new google.maps.Polyline({
                path: [c, vc],
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                    },
                    offset: '100%'
                }]
            });
            line.setMap(DODDLE.editor.map);
            DODDLE.editor.lines.push(line);
            console.info("drawn!");
        }
    }
};

DODDLE.editor.clearVoisinLine = function () {
    for (var l in DODDLE.editor.lines) {
        DODDLE.editor.lines[l].setMap(null);
    }
    DODDLE.editor.lines = [];
};

DODDLE.editor.getZoneCenter = function (z) {
    var bounds = new google.maps.LatLngBounds();
    var zone = DODDLE.editor.zones[z];

    for (var m in zone.markers) {
        bounds.extend(zone.markers[m].position);
    }
    return bounds.getCenter();
};

// == Markers
// ===================================
DODDLE.editor.addMarker = function (position) {
    var marker = new google.maps.Marker({
        uuid: DODDLE.editor.page.giveMeUUID(),
        position: position,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4,
            strokeColor: '#000000',
            strokeWeight: 1,
            fillOpacity: 1,
        },
        draggable: true,
    });

    // On retrace apres le dragend
    google.maps.event.addListener(marker, 'dragend', function (e) {
        DODDLE.editor.redrawZoneByUUIDMarker(this.uuid);
    });

    // Gestion de la suppression de point et du split
    google.maps.event.addListener(marker, "click", function (e) {
        // On supprime sur un click
        DODDLE.editor.clicked = this; // Mouerf mais bon hein...
        DODDLE.editor.clicks++;
        if (DODDLE.editor.clicks === 1) {
            DODDLE.editor.timer = setTimeout(function () {
                console.log("Simple Click");
                DODDLE.editor.deleteMarkerByUUID(DODDLE.editor.clicked.uuid);
                DODDLE.editor.clicks = 0;
            }, DODDLE.editor.DELAY);
        } else {
            // On split sur un double click
            console.log("Double click");
            var m, z;
            // On cherche le polygon dont le point à été modifié..
            for (z in DODDLE.editor.zones) {
                trouve = false;
                for (m in DODDLE.editor.zones[z].markers) {
                    if (DODDLE.editor.zones[z].markers[m].uuid == this.uuid) {
                        trouve = z;
                        break;
                    }
                }
                if (trouve !== false) break;
            }
            m = Number(m);
            // On vérifie qu'on essai pas d'ajouter des points pret d'une borne de la zone...
            if (m >= 1 || m < (DODDLE.editor.zones[z].markers.length - 1)) {
                var p1 = new google.maps.LatLng(
                    (DODDLE.editor.zones[z].markers[m - 1].position.lat() + DODDLE.editor.zones[z].markers[m].position.lat()) / 2,
                    (DODDLE.editor.zones[z].markers[m - 1].position.lng() + DODDLE.editor.zones[z].markers[m].position.lng()) / 2
                );
                var p2 = new google.maps.LatLng(
                    (DODDLE.editor.zones[z].markers[m].position.lat() + DODDLE.editor.zones[z].markers[m + 1].position.lat()) / 2,
                    (DODDLE.editor.zones[z].markers[m].position.lng() + DODDLE.editor.zones[z].markers[m + 1].position.lng()) / 2
                );
                // D'abords le point le plus loin pour ne pas changer l'ordre...
                DODDLE.editor.zones[z].markers.splice(m + 1, 0, DODDLE.editor.addMarker(p2));
                DODDLE.editor.zones[z].markers.splice(m, 0, DODDLE.editor.addMarker(p1));

                DODDLE.editor.redrawZoneByUUIDMarker(this.uuid);
            } else console.log("Point sur une borne de la zone!");

            clearTimeout(DODDLE.editor.timer); //prevent single-click action
            DODDLE.editor.clicks = 0; //after action performed, reset counter
        }
    });

    return marker;
};

DODDLE.editor.deleteMarkerByUUID = function (uuid) {
    for (var z in DODDLE.editor.zones) {
        var trouve = false;
        for (var m in DODDLE.editor.zones[z].markers) {
            // On cherche le polygon dont le point à été modifié..
            if (DODDLE.editor.zones[z].markers[m].uuid == uuid) {
                DODDLE.editor.zones[z].polygon.setMap(null);
                trouve = z;
                break;
            }
        }
        if (trouve !== false) {
            DODDLE.editor.zones[z].markers[m].setMap(null);
            DODDLE.editor.zones[z].markers.splice(m, 1);
            DODDLE.editor.redrawZone(z, true);
            break;
        }
    }
};

// == Menu
// ===================================
DODDLE.editor.addNewEntryMenu = function (z) {
    var _ul, _li, _r, _i, _l, _option, _s, _c;
    _ul = DODDLE.editor.menu.querySelector("ul");
    _li = document.createElement("li");

    _r = DODDLE.editor.page.addRadio("zones", DODDLE.editor.zones[z].uuid, {
        class: "zones",
        checked: "none"
    });
    console.log("Ajoute zone>" + DODDLE.editor.zones[z].nom); // Vérifier si le nom est rempli dans zone GQL ??? Ben oui -> a voir...
    _i = DODDLE.editor.page.addInput({
        id: "nom_" + DODDLE.editor.zones[z].uuid
    });

    var _p = {
        id: "tour_" + DODDLE.editor.zones[z].uuid
    };
    if (DODDLE.editor.zones[z].tour !== 0) _p.checked = "checked";
    _c = DODDLE.editor.page.addLabelledCheckBox("tour", _p);

    // Sur un changement on active les marker de magnetisme...
    _r.onchange = function () {
        console.log("Changement de zone >>" + this.value);
        // On réaffiche l'ancienne sans les markers
        DODDLE.editor.redrawZoneByUUID(DODDLE.editor.currentZone, false);
        DODDLE.editor.currentZone = this.value;
        DODDLE.editor.redrawZoneByUUID(DODDLE.editor.currentZone, true);
        if (DODDLE.editor.mode == 1) DODDLE.editor.drawVoisins(DODDLE.editor.currentZone);
    };

    _l = DODDLE.editor.page.addLabelledSelect("à ", {
        id: "clan_" + DODDLE.editor.zones[z].uuid,
        placeholder: "selectionnez"
    });
    _li.appendChild(_r); // Hop le radio dedans le LI
    _li.appendChild(_l); // Le selecteur de clan
    _li.appendChild(_i); // Et son input pour faire cholie
    _li.appendChild(_c); // Et son check pour la tour

    // Et on l'ajoute à la liste non ordonnées
    _ul.appendChild(_li);

    // remplisasge du nom
    _i = document.getElementById("nom_" + DODDLE.editor.zones[z].uuid);
    _i.value = DODDLE.editor.zones[z].nom;

    // remplisasge des options pour selection de clan
    _s = document.getElementById("clan_" + DODDLE.editor.zones[z].uuid);
    _option = document.createElement("option");
    _option.setAttribute("value", "None");
    _option.innerHTML = "Neutre";
    _s.appendChild(_option);

    // Si on chage de clan on change de couleur...
    _s.onchange = function () {
        var z = DODDLE.editor.searchZoneByUUID(this.id.substr(5)); // On cherche la zone à redessiner
        for (var c in DODDLE.editor.clans) {
            DODDLE.editor.zones[z].couleur = "#333333"; // Le gris par defaut
            if (DODDLE.editor.clans[c].uuid == this.value) { // Et la bonne couleur si on trouve :-)
                DODDLE.editor.zones[z].couleur = DODDLE.editor.clans[c].couleur;
                break;
            }
        }
        DODDLE.editor.redrawZone(z, false);
    };

    for (var c in DODDLE.editor.clans) {
        _option = document.createElement("option");
        _option.setAttribute("value", DODDLE.editor.clans[c].uuid); // On utilise l'urlsafe comme value
        _option.innerHTML = DODDLE.editor.clans[c].nom;
        if (DODDLE.editor.clans[c].uuid == DODDLE.editor.zones[z].clan) _option.selected = "selected";
        _s.appendChild(_option);
    }
};

DODDLE.editor.makeEntry = function () {

};
