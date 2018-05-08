function clsFond(canvas) {
    var canvasFond = document.createElement("canvas");
    var contextFond = canvasFond.getContext("2d");

    var canvasFond2 = document.createElement("canvas");
    var contextFond2 = canvasFond2.getContext("2d");

    var y = 0,
        y2 = 0,
        yMax = 0;
    var contextDest = canvas.getContext("2d");

    var asteroid = new Image();
    asteroid = myLoader.getRessource("astro");

    canvasFond.height = canvas.height * 2
    canvasFond.width = canvas.width;
    canvasFond2.height = canvas.height * 2
    canvasFond2.width = canvas.width;

    this.init = function (max) {
        var x, y;
        contextFond.fillStyle = 'white';
        contextFond2.fillStyle = 'lightgrey';

        for (var n = 0; n < 300; n++) {
            y = Math.random() * canvasFond.height / 2;
            x = Math.random() * canvasFond.width;
            contextFond.fillRect(x, y, 2, 2);
        }
        for (var n = 0; n < 300; n++) {
            y = Math.random() * canvasFond.height / 2;
            x = Math.random() * canvasFond.width;
            contextFond2.fillRect(x, y, 1, 1);
            //            contextFond2.drawImage(asteroid, 0, 16, 8, 8, x, y, 16, 16);
        }
        /*
                for (var n = 0; n < 10; n++) {
                    y = Math.random() * canvasFond.height / 2;
                    x = Math.random() * canvasFond.width;
                    contextFond2.drawImage(asteroid, 8, 16, 8, 8, x, y, 16, 16);
                }
                for (var n = 0; n < 10; n++) {
                    y = Math.random() * canvasFond.height / 2;
                    x = Math.random() * canvasFond.width;
                    contextFond2.drawImage(asteroid, 16, 16, 8, 8, x, y, 16, 16);
                }
        */

        yMax = canvasFond.height / 2;
        contextFond.drawImage(canvasFond,
            0, 0, canvasFond.width, canvasFond.height / 2,
            0, canvasFond.height / 2, canvasFond.width, canvasFond.height / 2);
        contextFond2.drawImage(canvasFond2,
            0, 0, canvasFond2.width, canvasFond2.height / 2,
            0, canvasFond2.height / 2, canvasFond2.width, canvasFond2.height / 2);
    }

    this.draw = function () {
        contextDest.drawImage(canvasFond, 0, -yMax + y);
        contextDest.drawImage(canvasFond2, 0, -yMax + y2);
        y2 += 1;
        y += 2;
        if (y >= yMax) y = 0;
        if (y2 >= yMax) y2 = 0;
    }

    this.init(500);
}
