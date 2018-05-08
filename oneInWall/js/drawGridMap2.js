// Les map doivent avoir un rapport de 2,5...

function drawGridMap(level, width, height) {
    const C_DEPART = 4,
        C_ARRIVEE = 3,
        C_OBJET = 5;

    var start = undefined,
        end = undefined,
        nullCase = 0,
        objets = 0;

    width = width != undefined ? width : 0;
    height = height != undefined ? height : 0;

    // Les différends graphs
    var board = new Image();
    var board2Color = new Image();
    var boardColor = new Image();
    var cubeGraph = new Image();
    var pieceGraph = new Image();
    var attendsGraph = new Image();

    var lx, ly, map; // Map contient les données du tableaux !!!

    // Si changeemnt de board, ne pas oublier de repporter les tailles...
    var tx = 90, // Largeur de la tile
        ty = 180, // Profondeur de la tile
        bx = 90, // largeur de la brique
        by = 90, // Profondeur de la brique
        bh = 00; // Hauteur de la brique... Hmm pas très utile au finale...

    var dx, dy; // Taille au finale.. Mais j'utilise tous le temps le mot final..


    // Ici Tiles est utilisable...
    jsonMap = JSON.parse(level);

    myTMXDecodeur.width = jsonMap.width;
    myTMXDecodeur.height = jsonMap.height;

    var color = jsonMap.backgroundcolor;

    dx = width / myTMXDecodeur.width;
    dy = height / myTMXDecodeur.height; //dx * ((bx - bh) / by);

    // Dezip et debase64
    if (jsonMap.layers[0].compression == "gzip" && jsonMap.layers[0].encoding == "base64")
        data = myTMXDecodeur.decodeB64Gzip(jsonMap.layers[0].data);
    else
        data = jsonMap.layers[0].data;

    map = myTMXDecodeur.intoMap(data);
    boardColor = myLoader.getRessource("boardColor");
    board2Color = myLoader.getRessource("board2Color");
    board = generateTintImage(color, boardColor, board2Color);
    cubeGraph = myLoader.getRessource("cubeGraph");
    pieceGraph = myLoader.getRessource("giftToCollect"); // les objets à ramasser...
    attendsGraph = myLoader.getRessource("attends"); // les cube en attente de grossissage...

    // La liste des tiles
    var tiles = {
        0: {
            nom: "null",
            x: 1,
            y: 0,
            empty: false,
        },
        1: {
            nom: "mur",
            x: 0,
            y: 0,
            recover: true,
            deadly: true,
            empty: false,
        },
        2: {
            nom: "sol",
            x: 1,
            y: 0,
        },
        3: {
            nom: "arrivee",
            empty: false,
            x: 3,
            y: 0,
        },
        4: {
            nom: "depart",
            x: 1,
            y: 0,
        },
        5: {
            nom: "objet",
            src: pieceGraph,
            x: 0,
            y: 0,
            nb: 6,
            repeat: 120,
            getable: true,
            after: 2 // Si on prends l'objet le remplacant c'est un sol...
        },
        6: {
            nom: "lanceMur1",
            x: 0,
            y: 0,
            nb: 1,
            next: 21,
            empty: false
        },
        7: {
            nom: "solNonMurable",
            x: 6,
            y: 0,
            empty: false,
        },
        8: {
            nom: "lanceMur2",
            x: 1,
            y: 0,
            nb: 1,
            next: 26,
            empty: false
        },
        // ==========================================================================
        // ==========================================================================
        // == Ici demarage des tiles non gérés via TILED
        // ==========================================================================
        // ==========================================================================
        20: {
            nom: "growingCube",
            src: cubeGraph,
            x: 0,
            y: 0,
            recover: true,
            deadly: true,
            nb: 10,
            next: 1,
            empty: true, // Le growing est un empty pour ne pas etre comptabilisé !!
            globalAnim: false
        },
        21: {
            nom: "mur1",
            src: cubeGraph,
            x: 0,
            y: 0,
            recover: true,
            deadly: true,
            nb: 10,
            next: 22,
            current: true,
            empty: false
        },
        22: {
            nom: "mur1.1",
            x: 0,
            y: 0,
            recover: true,
            deadly: true,
            repeat: 40,
            next: 23,
            empty: false
        },
        23: {
            nom: "mur1.2",
            src: cubeGraph,
            x: 10,
            y: 0,
            recover: true,
            deadly: true,
            nb: -10,
            next: 24,
            empty: false
        },
        24: {
            nom: "mur1.3",
            x: 1,
            y: 0,
            repeat: 40,
            next: 21,
            empty: false
        },
        25: {
            nom: "futurGrowingCube",
            src: attendsGraph,
            x: 0,
            y: 0,
            nb: 7,
            repeat: 10,
            next: 20,
            globalAnim: false
        },
        26: {
            nom: "mur2",
            src: cubeGraph,
            x: 10,
            y: 0,
            recover: true,
            deadly: true,
            nb: -10,
            next: 27,
            empty: false
        },
        27: {
            nom: "mur2.1",
            x: 1,
            y: 0,
            repeat: 40,
            next: 28,
            empty: false
        },
        28: {
            nom: "mur2.2",
            src: cubeGraph,
            x: 0,
            y: 0,
            recover: true,
            deadly: true,
            nb: 10,
            next: 29,
            current: true,
            empty: false
        },
        29: {
            nom: "mur2.3",
            x: 0,
            y: 0,
            recover: true,
            deadly: true,
            repeat: 40,
            next: 26,
            empty: false
        }
    }

    function generateTintImage(color, imgColor, img2Color) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");

        canvas.width = imgColor.width;
        canvas.height = imgColor.height;

        context.drawImage(imgColor, 0, 0);
        context.globalCompositeOperation = "source-in";
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = "source-over";
        context.drawImage(img2Color, 0, 0);

        return canvas;
    }

    // On définit les booleens et compteur par défaut pour toutes les cases
    for (var prop in tiles) {
        var tile = tiles[prop];
        tile.src = tile.src === undefined ? board : tile.src;
        tile.deadly = tile.deadly === undefined ? false : true;
        // La case dépasse ou pas ?
        tile.recover = tile.recover === undefined ? false : true;
        // Ca se prends ?
        tile.getable = tile.getable === undefined ? false : true;
        // Une case vide à remplir ??
        tile.empty = tile.empty === undefined ? true : false;
        // Animation global ou unitaire ?
        tile.globalAnim = tile.globalAnim === undefined ? true : false;
        // les compteurs
        tile.nb = tile.nb === undefined ? 1 : tile.nb;
        tile.cptNb = 0;
        tile.repeat = tile.repeat === undefined ? 0 : tile.repeat; // Pas de repeat
        tile.cptRepeat = 0;
        // Pour les chaines
        tile.current = tile.current === undefined ? true : tile.current;
    };

    // Analyse le fichier MAP et ajoute sa représentation en tile
    function analyse() {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                switch (map[n][m]) {
                    case C_OBJET: // TODO: Mouerf peut mieux faire
                        objets++;
                        break;
                    case C_DEPART:
                        start = {
                            x: m,
                            y: n
                        };
                        break;
                    case C_ARRIVEE:
                        end = {
                            x: m,
                            y: n
                        };
                        break;
                }
                map[n][m] = tiles[map[n][m]]; //On transforme la val de base par son rendu tile
                if (map[n][m].empty) nullCase++;
            }
        }
    };

    this.returnNullCase = function () {
        var nc = 0;
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                if (map[n][m].empty) nc++;
            }
        }
        return nc;
    }

    this.count = function () {
        return {
            dX: dx,
            dY: dy,
            start: start,
            end: end,
            nullCase: nullCase,
            objets: objets
        };
    }

    // TODO: Pas jolie, faire miuex... Mais la il est tard...
    this.testGetable = function (top, bottom, left, right) {
        if (map[top][left].getable) {
            map[top][left] = tiles[map[top][left].after]; // On met un AFTER à la place
            objets--; // On diminue le nombre d'objet
        } else if (map[top][right].getable) {
            map[top][right] = tiles[map[top][right].after];
            objets--;
        } else if (map[bottom][left].getable) {
            map[bottom][left] = tiles[map[bottom][left].after]; // On met un AFTER à la place
            objets--; // On diminue le nombre d'objet
        } else if (map[bottom][right].getable) {
            map[bottom][right] = tiles[map[bottom][right].after];
            objets--;
        };

        return objets;
    }

    this.testMur = function (x, y) {
        return map[x][y].deadly;
    }

    this.testArrivee = function (x, y) {
        if (map[x][y].nom == "arrivee") return true;
        else return false;
    }

    this.giveMeMap = function () {
        return map;
    }


    this.drawEntireTile = function (destination, n, m, tile) {
        destination.drawImage(
            tile.src, // source
            tile.x * tx, // xs
            tile.y * ty, // ys
            tx, // ws
            ty - 1, // hs
            m * dx, // xd
            (n - 1) * dy, // yd
            dx, // wd
            dy * 2 // hd
        )
    }

    //FIXME: compenser l'aggrandissement avec des + sur DX et DY en fonction de taille
    this.drawOnlyCoveringTile = function (destination, n, m, tile) {
        destination.drawImage(
            tile.src, // source
            (tile.x + tile.cptNb) * tx, // xs
            tile.y * ty, // ys
            tx, // ws
            ty / 2, // hs
            m * dx, // xd
            (n - 1) * dy, // yd - On draw sur la case du dessus la partie couvrante !!!
            dx + 1, // wd
            dy + 1 // hd
        )
    }

    this.drawOnlyNonCoveringTile = function (destination, n, m, tile) {
        destination.drawImage(
            tile.src, // source
            (tile.x + tile.cptNb) * tx, // xs
            tile.y * ty + ty / 2, // ys
            tx, // ws
            ty / 2, // hs
            m * dx, // xd
            n * dy, // yd
            dx + 1, // wd
            dy + 1 // hd
        )
    }

    // Dessine la map complète avec les tiles entières
    this.drawMap = function (destination) {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                this.drawEntireTile(destination, n, m, map[n][m]);
            }
        }
    }

    this.drawOnlyCoveringMap = function (destination) {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                this.drawOnlyCoveringTile(destination, n, m, map[n][m]);
            }
        }

    }

    this.drawOnlyNonCoveringMap = function (destination) {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                this.drawOnlyNonCoveringTile(destination, n, m, map[n][m]);
            }
        }
    }

    // Pour voir des animations désychronisées
    function cloneTile(tile) {
        var clonedTile;
        try {
            clonedTile = JSON.parse(JSON.stringify(tile));
        } catch (e) {
            console.error("Problème de clonage !!" + e)
        }
        // L'objet image n'est pas copié... On le force à la mano...
        clonedTile.src = tile.src;
        //clonedTile.cloned = true;
        return clonedTile;
    }

    function animTile(tile) {
        if (tile.nb > 0)
            tile.cptNb++;
        else
            tile.cptNb--;
        if (Math.abs(tile.cptNb) >= Math.abs(tile.nb)) {
            tile.cptNb = 0;
            tile.cptRepeat++;
            if (tile.cptRepeat >= tile.repeat) {
                tile.cptRepeat = 0;
                return true; // On indique la fin d'un cycle complet
            }
        }
    }

    // Anime les tiles de la map qui sont 'cloned', donc non animé par animTilesList
    this.animMapTile = function () {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                if (!map[n][m].globalAnim) {
                    if (map[n][m].nb != 1) { // Evite de ++ pour rien...
                        if (animTile(map[n][m])) { // On anim et si par hasard on passe au suivant...
                            if (map[n][m].next) { // Gestion des chainages de cube
                                map[n][m] = cloneTile(tiles[map[n][m].next]);
                            }
                        }
                    }
                }
            }
        }
    }

    // Lors d'un changement de curent change la tile dans toute la map
    function changeTile(oldTile, newTile) {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                if (Object.is(map[n][m], oldTile)) {
                    map[n][m] = newTile;
                }
            }
        }
    }


    // Anim la liste globale (donc les non clonés)
    this.animTilesList = function () {
        for (var cur in tiles) {
            if (tiles[cur].current) {
                if (tiles[cur].globalAnim) {
                    if (animTile(tiles[cur])) {
                        if (tiles[cur].next) { // Gestion des chainages de cube
                            tiles[cur].current = false; // Changement de current
                            tiles[tiles[cur].next].current = true; // On, active la suivante
                            changeTile(tiles[cur], tiles[tiles[cur].next]); // pourrait ne passr que tile
                        }
                    };
                }
            }
        }
    }

    this.addCube = function (x, y) {
        var cube = cloneTile(tiles[20])
        map[y][x] = cube;
    }

    this.addBlueCase = function (x, y) {
        var cube = cloneTile(tiles[25])
        map[y][x] = cube;
    }

    this.noBlueCase = function (x, y) {
        return map[y][x].nom == "blueCase" ? false : true;
    }

    this.isEmpty = function (x, y) {
        return map[y][x].empty;
    }

    analyse();
}
