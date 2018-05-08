//FIXME: Pour que ça marche, il faudrait refaire les codes des tiles
// GrowingCube Fixé à 34
// Les tiles en cours de poussage devrait avoir un code particulier -> rattacahnt la tile au grow... -> gestion correct du recover
// Inserer au plutot une valeur dasn map afin de pouvoir la gérer correctement (ex: ré-insertion de cube sur une case ou on est déjà passé)
// TODO: Gestion des cases animés, detectés lors du count...

function drawGridMap(canvas, canvas2, level) {
    var ctx;
    var dx, dy;
    var board = new Image();
    var cubeGraph = new Image();
    var testGraph = new Image();
    var lx, ly, map; // Map contient les données du tableaux !!!
    // Si changeemnt de board, ne pas oublier de repporter les tailles...
    var tx = 30, // Largeur de la tile
        ty = 60, // Profondeur de la tile
        bx = 30, // largeur de la brique
        by = 30, // Profondeur de la brique
        bh = 10; // Hauteur de la brique
    //        prop = bh / by;
    var redrawList = [];
    var cubes = [];
    var anims = [];

    board = myLoader.getRessource("board");
    cubeGraph = myLoader.getRessource("cubeGraph");
    testGraph = myLoader.getRessource("test");

    // La liste des tiles
    // Les tils animée utilisés ont un attribut: used à true ajouter lors de la construction du tableau
    // frame est le nombe de partie d'animation
    // animCpt et le tile courant dans le frame
    var tiles = {
        0: {
            nom: "sol",
            src: board,
            anim: [{
                x: 1,
                y: 0,
                nb: 1
            }]
        },
        2: {
            nom: "depart",
            src: board,
            anim: [{
                x: 1,
                y: 0,
                nb: 1
            }]
        },
        3: {
            nom: "arrivee",
            src: board,
            anim: [{
                x: 1,
                y: 0,
                nb: 1
            }]
        },
        4: {
            nom: "trou",
            src: board,
            anim: [{
                x: 1,
                y: 0,
                nb: 1
            }]
        },
        20: {
            nom: "objet",
            src: board,
            anim: [{
                x: 1,
                y: 0,
                nb: 1
            }]
        },
        1: {
            nom: "mur",
            src: board,
            anim: [{
                x: 0,
                y: 0,
                recover: true,
                deadly: true,
                nb: 1
            }]
        },
        5: {
            nom: "murMoving",
            src: cubeGraph,
            anim: [{
                    x: 0,
                    y: 0,
                    nb: 1,
                    repeat: 50
            },
                {
                    x: 1,
                    y: 0,
                    recover: true,
                    deadly: true,
                    nb: 10,
            }]
        },
        // Attention au cube qui sont ajoutés par le joueur
        34: {
            nom: "growingCube",
            src: cubeGraph,
            anim: [{
                x: 0,
                y: 0,
                recover: true,
                deadly: true,
                nb: 11
            }]
        }
    }

    // Pour construire le tableau, place les animés
    function getTile(ref) {
        var tile = tiles[ref];
        tile.animCpt = 0;
        tile.repeatCpt = 0;
        if (tile.repeat === undefined) tile.repeat = 0;
        tile.frame = 0;
        return tile;
    }

    // Retourne la case courante anim comprise
    function getCurrentTile(n, m) {
        var ref = map[n][m];
        var tile = getTile(ref);
        var cur = tile.anim[tile.frame];
        return {
            src: tile.src, // la source
            n: n, // la place dans la map
            m: m,
            x: cur.x + tile.animCpt, // La place dans la source
            y: cur.y,
            recover: cur.recover, // la tile est recouvrante ?
            deadly: cur.deadly // La tile tue ??
        }
    }

    function tileHasRecoverPart(n, m) {
        var tile = getCurrentTile(n, m);
        tile.recover = tile.recover === undefined ? false : tile.recover;
        return tile.recover;
    }

    function tileIsDeadly(n, m) {
        var tile = getCurrentTile(n, m);
        tile.deadly = tile.deadly === undefined ? false : tile.deadly;
        return tile.deadly;
    }

    function tileIsAnimated(n, m) {
        var tile = getTile(map[n][m]);
        return tile.anim.length > 1 ? true : false;
    }

    function nextAnime(tile) {
        tile.cycle = false;
        tile.animCpt++;
        if (tile.animCpt >= tile.anim[tile.frame].nb) {
            tile.animCpt = 0;
            if (tile.repeatCpt < tile.anim[tile.frame].repeat) {
                tile.repeatCpt++;
                tile.animCpt = 0;
            } else {
                tile.frame++;
                if (tile.frame >= tile.anim.length) {
                    tile.repeatCpt = 0;
                    tile.frame = 0;
                    tile.cycle = true; // on a fait un tour
                }
            }
        }
    }

    function init(can, can2, lev) {
        var data;
        ctx = can.getContext("2d");
        if (can2 !== null)
            ctx2 = can2.getContext("2d");

        jsonMap = JSON.parse(lev);

        myTMXDecodeur.width = jsonMap.width;
        myTMXDecodeur.height = jsonMap.height;
        dx = can.width / myTMXDecodeur.width;
        dy = dx * ((bx - bh) / by);

        if (jsonMap.layers[0].compression == "gzip" && jsonMap.layers[0].encoding == "base64")
            data = myTMXDecodeur.decodeB64Gzip(jsonMap.layers[0].data);
        else
            data = jsonMap.layers[0].data;

        // Dezip et debase64
        map = myTMXDecodeur.intoMap(data);
        cubes = [];
        anims = [];
        redrawList = [];

        //TODO: A voir, plus trés utile à moins de le faier à la fin ?? Pour teinter globalment ???
        /*if (jsonMap["backgroundcolor"] != undefined) {
            this.tintMyFace(jsonMap["backgroundcolor"]);
        } else*/
        ctx.clearRect(0, 0, can.width, can.height);
    }

    function isThereACoveringPart(n, m) {
        // Les cases dont m = 1 ?? Pourquoi pas ???
        return map[n][m] == 1 ? true : false;
    }

    this.tintMyFace = function (color) {
        ctx.globalCompositeOperation = "source-over";
        // On colorie le fond de la bonne couleur
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.rect(0, 0, can.width, can.height);
        ctx.fill();
        ctx.globalCompositeOperation = "";
    }

    this.testMur = function (x, y) {
        return tileIsDeadly(x, y);
    }

    this.testTrou = function (x, y) {
        if (map[x][y] == 4) return true;
        else return false;
    }

    this.addDefinitiveCube = function (x, y) {
        map[x][y] = 1; // 1 = gros cube...
    }

    this.addGrowingCube = function (x, y) {
        map[x][y] = 34; //FIXME: Trouver valeur pour les growing...
    }

    this.giveMeMap = function () {
        return map;
    }

    this.testDepart = function (x, y) {
        if (map[x][y] == 2) return true;
        else return false;
    }

    this.testArrivee = function (x, y) {
        if (map[x][y] == 3) return true;
        else return false;
    }

    this.testObjets = function (x, y) {
        if (map[x][y] == 20) return true;
        else return false;
    }

    this.count = function () {
        var nullCase = 0;
        var start = {};
        var end = undefined;
        var objets = [];

        // Adapter les test au focntio ci dessus
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                if (map[n][m] == 0) { // Un sol vide
                    nullCase++;
                } else if (this.testDepart(n, m)) { // le départ
                    start = {
                        x: m,
                        y: n
                    };
                    nullCase++;
                } else if (this.testObjets(n, m)) { // les objets à collecter
                    objets.push({
                        x: m,
                        y: n
                    });
                    nullCase++;
                }
                if (tileIsAnimated(n, m)) {
                    this.addAnim(n, m);
                } else {
                    if (this.testArrivee(n, m)) { // l'arrivée
                        end = {
                            x: m,
                            y: n
                        };
                        nullCase++;
                    }
                };
            }
        }

        return {
            dX: dx,
            dY: dy,
            start: start,
            end: end,
            nullCase: nullCase,
            objets: objets
        };
    }

    function getMapRef(n, m) {
        var y = Math.floor((map[n][m] - 1) / 16);
        var x = Math.round(map[n][m] - 1) % 16;

        return ({
            src: board,
            x: x,
            y: y
        });
    }

    function getTestRef(n, m) {
        var y = Math.floor((map[n][m] - 1) / 16);
        var x = Math.round(map[n][m] - 1) % 16;

        return ({
            src: testGraph,
            x: x,
            y: y
        });
    }

    function getCubeRef(f) {
        if (f >= 11) // maxFrame
            f = 11;

        return ({
            src: cubeGraph,
            x: f,
            y: 0
        });
    }

    // Dessine tout
    this.drawAll = function () {
        var ref;
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                ref = getCurrentTile(n, m);
                this.drawOne(ref);
            }
        }
    }

    // Dessine un seul tile
    this.drawOne = function (ref, dst) {
        if (dst === undefined) dst = ctx;

        dst.drawImage(
            ref.src, // source
            ref.x * tx, // xs
            ref.y * ty, // ys
            tx, // ws
            ty, // hs
            ref.m * dx, // xd
            ref.n * dy - dy, // yd
            dx, // wd
            dy * 2 // hd
        )
    }

    // Dessine seulement la partie couvrante d'un tile
    this.drawOnlyCoveringPart = function (ref, dst) {
        if (dst === undefined) dst = ctx;

        dst.drawImage(
            ref.src, // source
            ref.x * tx, // xs
            ref.y * ty, // ys
            tx, // ws
            ty / 2, // hs
            ref.m * dx, // xd
            ref.n * dy - dy, // yd
            dx, // wd
            dy // hd
        )
    }

    // redessine la liste des tiles dont il faut redraw la partie couvrante
    this.redrawCoveringPart = function () {
        var ref;
        // tester si pas meme case mis plusieurs fois...
        redrawList.forEach(tile => {
            ref = getCurrentTile(tile.x, tile.y);
            this.drawOnlyCoveringPart(ref, ctx2); // Sur le context du joueur et non plus sur celui des tiles
        })
        redrawList = []; // une fois redraw on supprime tout..
    }

    // Test si il faut faire run redraw de la partie couvrante
    this.shouldIRedraw = function (x, y) {
        var found = false;
        // On test si la case du dessous est recouvrante...
        if (isThereACoveringPart(x + 1, y)) {
            // On vérifie que la case n'est pas déjà dans la liste...
            redrawList.forEach(tile => {
                if (tile.name == x + "_" + y) found = true;
            })
            if (!found) {
                redrawList.push({ // Si oui on l'ajoutes à la reDrawList
                    name: x + "_" + y,
                    x: x + 1,
                    y: y
                })

            }
        }
    }

    // ==========================================================
    // == Gestion des cubes qui poussent
    // ==========================================================
    this.addCube = function (y, x) { // On inverse juste ceux-la...
        this.addGrowingCube(x, y); // Avant l'ajout à la liste on met le tile à jour...
        var a = this.getAnAnim(y, x);
        cubes.push(a);
        // Sort pour avoir un affichage de growingCube correct (hmm!)
        cubes.sort(compareY);
    }

    this.addAnim = function (y, x) { // On inverse juste ceux-la...
        var a = this.getAnAnim(x, y);
        anims.push(a);
        // Sort pour avoir un affichage de growingCube correct (hmm!)
        anims.sort(compareY);
        //return a;
    }

    this.getAnAnim = function (y, x) { // On inverse juste ceux-la...
        var tile = getTile(map[x][y]);
        return ({
            src: tile.src,
            n: x,
            m: y,
            cycle: false, // Pour deteter la sortie d'un cycle d'aniation
            frame: tile.frame,
            animCpt: tile.animCpt,
            repeatCpt: tile.repeatCpt,
            anim: tile.anim
        });
    }

    this.getCurrentAnim = function (anim) {
        var cur = anim.anim[anim.frame];
        return {
            src: anim.src, // la source
            n: anim.n, // la place dans la map
            m: anim.m,
            x: cur.x + anim.animCpt, // La place dans la source
            y: cur.y,
            recover: cur.recover, // la tile trecouvre ?
            deadly: cur.deadly // La tile tue ??
        }
    }

    function compareY(a, b) {
        return a.n - b.n;
    }

    this.animThisTiles = function () {
        anims.forEach(anim => {
            ref = this.getCurrentAnim(anim);
            this.drawOne(ref);
            ref = getCurrentTile(anim.n + 1, anim.m);
            this.drawOnlyCoveringPart(ref, ctx2);
            nextAnime(anim); // Après avoir pris le courant on passe au suivant
        })
    }

    this.growingCube = function () {
        var ref;

        cubes.forEach((cube, index, object) => {
            if (!cube.cycle) {
                ref = this.getCurrentAnim(cube);
                this.drawOne(ref);
                ref = getCurrentTile(cube.n + 1, cube.m);
                this.drawOnlyCoveringPart(ref);
                nextAnime(cube); // Après avoir pris le courant on passe au suivant
                // TODO: Certainement ajouter un test de covering + éventuel retraçage..
            } else {
                this.addDefinitiveCube(cube.n, cube.m);
                // On vire le cube de la liste
                cubes.splice(index, 1);
                // Le cube est affiché on ajoute le pourcentage à la jauge..
                DODDLE.percent.add();
            }
        });
    }

    init(canvas, canvas2, level);
}
