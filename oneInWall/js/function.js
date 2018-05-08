// ========================================================
// == FONCTIONS GENERALES
// ========================================================
//TODO: a mettre dans drawGridMap...


/*function testMur(val) {
    if (val == 1) return true;
    else return false;
}

function testTrou(val) {
    if (val >= 4 && val <= 18) return true;
    else return false;
}*/

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/*
//TODO: Ajouter une méthode qui ne trace que la case données et celle au dessus (redraw case derriere le joueur ou animation du cube qui monte)
function drawGridMap(can, level) {
    var ctx = can.getContext("2d");
    var dx, dy;
    var nullCase = 0;
    var start = {};
    var end = undefined;
    var objets = [];
    var board = new Image();
    var lx, ly, map;
    var data;
    // Si changeemnt de board, ne pas oublier de repporter les tailles...
    var bx = 33, // Largeur de la brique
        by = 33, // Profondeur de la brique
        bh = 11, // Hauteur de la brique
        prop = bh / by;
    board = myLoader.getRessource("board");

    jsonMap = JSON.parse(level);

    myTMXDecodeur.width = jsonMap.width;
    myTMXDecodeur.height = jsonMap.height;
    dx = can.width / myTMXDecodeur.width;
    //dy = can.height / myTMXDecodeur.height;
    dy = dx * ((bx - bh) / by);
    //    console.log(dx + " <> " + dy + " p " + prop);
    //    console.log(" h " + (dy * prop));

    if (jsonMap.layers[0].compression == "gzip" && jsonMap.layers[0].encoding == "base64")
        data = myTMXDecodeur.decodeB64Gzip(jsonMap.layers[0].data);
    else
        data = jsonMap.layers[0].data;

    // Dezip et debase64
    map = myTMXDecodeur.intoMap(data);

    if (jsonMap["backgroundcolor"] != undefined) {
        // On colorie le fond de la bonne couleur
        ctx.beginPath();
        ctx.fillStyle = jsonMap["backgroundcolor"];
        ctx.rect(0, 0, can.width, can.height);
        ctx.fill();
    } else ctx.clearRect(0, 0, can.width, can.height);

    // On trace d'abord les pixels
    if (map != undefined) {
        for (var n = 0; n < myTMXDecodeur.height; n++) {
            for (var m = 0; m < myTMXDecodeur.width; m++) {
                if (map[n][m] == 0) { // Un sol vide
                    nullCase++;
                } else if (testDepart(map[n][m])) { // le départ
                    start = {
                        x: m,
                        y: n
                    };
                    nullCase++;
                } else if (testObjets(map[n][m])) { // les objets à collecter
                    objets.push({
                        x: m,
                        y: n
                    });
                    nullCase++;
                } else {
                    if (testArrivee(map[n][m])) { // l'arrivée
                        end = {
                            x: m,
                            y: n
                        };
                        nullCase++;
                    }
                    var y = Math.floor((map[n][m] - 1) / 16);
                    var x = Math.round(map[n][m] - 1) % 16;
                    ctx.drawImage(
                        board, // source
                        x * bx, // xs
                        y * by, // ys
                        bx, // ws
                        by, // hs
                        m * dx, // xd
                        n * dy - (dy * prop) - 15, // yd - On décale avec le gh rapporté à la taille dx,dy
                        dx, // wd
                        dy + (dy * prop) + 15 // h - la hauteur + son decalage triangulé par la taille brique/case
                    )
                }
            }
        }
    }

    // Puis on fait la grille
    ctx.lineWidth = 1;
    ctx.setLineDash([0]);
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();

    for (var m = 0; m <= myTMXDecodeur.width; m++) {
        ctx.moveTo(m * dx, 0);
        ctx.lineTo(m * dx, can.height);
    }

    for (var n = 0; n <= myTMXDecodeur.height; n++) {
        ctx.moveTo(0, n * dy, 0);
        ctx.lineTo(can.width, n * dy);
    }

    ctx.closePath();
    ctx.stroke();

    return {
        dX: dx,
        dY: dy,
        start: start,
        end: end,
        nullCase: nullCase,
        objets: objets
    };
}*/

function convertImgToUri(src) {
    var canvas = document.createElement('canvas');
    canvas.width = src.naturalWidth;
    canvas.height = src.naturalHeight;
    canvas.getContext('2d').drawImage(src, 0, 0);
    return (canvas.toDataURL('image/png'));
}

// ****************************************************************************
// ****************************************************************************
// ****************************************************************************

DODDLE.game.prototype = convertImgToUri;
