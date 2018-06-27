function clsJoueur(width, height, mulX, mulY) {
    var alive = true;
    var vs = myLoader.getRessource("vaisseau");
    var zb = myLoader.getRessource("zbam");
    var x, y;
    var mX = mulX;
    var mY = mulY;
    var w = width;
    var h = height;
    var ctx;
    var img = 0; // Pour l'animation du vaisseau
    var down = [];
    var zbamCptMax = 30;
    var zbamCpt = 0;
    var zbamSize = 170;
    var zbamLimit = 81;
    var zbamImg = 0;
    var idMoney = $("#money");
    var nbCoin = 0;
    var idEnergy = $("#energy");
    var energyModel = '<img src="ressources/burn.png" class="picto"/>';
    var acc = {
        x: 0,
        y: 0
    };
    var oldGamma = null,
        oldBeta = null;
    var divisor = 2; // Diminue le retour de l'accelerometre

    var gw = 53, // taille du vaisseau en dur...
        gh = 68;

    var dirGD = 0;
    this.maxEnergy = 0;
    this.maxCoin = 0;

    this.getAlive = function () {
        return alive;
    }

    this.getX = function () {
        return x;
    }

    this.getY = function () {
        return y;
    }

    this.getZbam = function () {
        return {
            size: zbamLimit, // Size et limit différents vu que le graf est plus grand aà cause du glow...
            cpt: zbamCpt
        };
    }

    this.bindAll = function () {
        if (DODDLE.commons.testPhone()) {
            console.log("Phone mode");
            $(document).on('touchstart', addAZbam);
            move = movePhone;
        } else {
            console.log("Desk mode");
            $(document).keydown(function (e) {
                down[e.keyCode] = true;
                e.preventDefault(); // prevent the default action (scroll / move caret)
            });
            $(document).keyup(function (e) {
                down[e.keyCode] = false;
            });
            move = moveKey;
        }

    }

    function addAZbam() {
        if ($("#energy > *").length > 0 && zbamCpt <= 0) {
            console.log("ZbammmmmMmmmmmmmm...");
            zbamCpt = zbamCptMax;
            $("#energy > *").first().remove();
        }
    }

    function movePhone() {
        const o = gyro.getOrientation(); // retrieves the last measures
        dirGD = 0;
        x += o.gamma / divisor;
        y += o.beta / divisor;
        testLimit();
    }

    function moveKey() {
        var vit = 5;
        dirGD = 0;

        if (down[37]) // left
        {
            x -= vit;
            dirGD = 1;
        }
        if (down[39]) // right
        {
            x += vit;
            dirGD = 2
        }

        if (down[38]) { // up
            y -= vit;
        }
        if (down[40]) { // down
            y += vit;
        }

        if (down[32]) { //space
            addAZbam();
        }
        testLimit();
    }

    function testLimit() {
        if (x - (gw / 2) < 0) x = gw / 2;
        if (x + (gw / 2) > w) x = w - gw / 2;
        if (y - (gh / 2) < 0) y = gh / 2;
        if (y + (gh / 2) > h) y = h - gh / 2;
    }

    this.init = function (context) {
        alive = true;
        zbamCpt = 0;
        x = w / 2;
        y = h * 0.80;
        ctx = context;
        oldBeta = null;
        oldGamma = null;
        nbCoin = 0;
        idMoney.text(" 0");
        idEnergy.empty();
        this.maxEnergy = 0;
        this.maxCoin = 0;
    }

    this.cleaner = function () {
        $(document).unbind("keydown");
        $(document).unbind("keyup");
        $(document).unbind("touchstart");

        window.removeEventListener("deviceorientation", function () {});
    }

    this.collision = function (narrow) {
        if (alive) {
            var bodyBounds = {
                x: x - 11 * mX,
                y: y - 31 * mY,
                X: x + 11 * mX,
                Y: y + 20 * mY
            };
            var wingBounds = {
                x: x - 25 * mX,
                y: y - 7 * mY,
                X: x + 25 * mX,
                Y: y + 13 * mY
            };

            if (DODDLE.test) {
                ctx.fillStyle = "rgba(50,255,50,.5)";
                ctx.fillRect(bodyBounds.x, bodyBounds.y, bodyBounds.X - bodyBounds.x, bodyBounds.Y - bodyBounds.y);
                ctx.fillRect(wingBounds.x, wingBounds.y, wingBounds.X - wingBounds.x, wingBounds.Y - wingBounds.y);
            }

            // On test les 2 bounding du vaisseau...
            narrow.forEach((meteor) => {
                var meteorToTest = meteor.giveBound();
                if (testBound(meteorToTest, wingBounds) || testBound(meteorToTest, bodyBounds)) {
                    switch (meteor.name) {
                        case "METEOR":
                            alive = false;
                            break;
                        case "ENERGY":
                            if ($('#energy > *').length < 3) {
                                DODDLE.sound.playOnce("bip", 0.3);
                                idEnergy.append(energyModel);
                                meteor.alive = false;
                                this.maxEnergy++;
                            }
                            break;
                        case "MONEY":
                            DODDLE.sound.playOnce("argent", 0.5);
                            nbCoin++;
                            idMoney.text(" " + nbCoin);
                            meteor.alive = false;
                            this.maxCoin++;
                            break;
                    }
                }
            });
            return !alive; // On a rien touché....
        }
        return false; // Pas spécialement utile
    }

    function testBound(box1, box2) {
        if ((box2.x >= box1.X) // trop à droite
            ||
            (box2.X <= box1.x) // trop à gauche
            ||
            (box2.y >= box1.Y) // trop en bas
            ||
            (box2.Y <= box1.y)) // trop en haut
            return false;
        else
            return true;
    }

    this.update = function () {
        if (alive) { // On est en vie
            move(); // Fonction défnit par testPhone

            ctx.ImageSmoothingEnabled = false;
            ctx.save();
            ctx.translate(x, y);

            ctx.drawImage(vs,
                ((dirGD * 2) + img) * gw, 0, gw, gh, -(gw * mX) / 2, -(gh * mY) / 2,
                gw * mX,
                gh * mY);

            if (zbamCpt > 0) {
                DODDLE.sound.play("bouclier");
                zbamCpt--;
                ctx.globalCompositeOperation = "color-burn";
                ctx.drawImage(zb,
                    180 * zbamImg, 0, 180, 180, -zbamSize / 2 * 1.3 * mX, -zbamSize / 2 * 1.3 * mY, zbamSize * 1.3 * mX, zbamSize * 1.3 * mY);
                zbamImg++;
                if (zbamImg > 4) zbamImg = 0
            } else DODDLE.sound.stop("bouclier");

            ctx.restore();
            // On passe à l'image suivante
            img++;
            if (img > 1) img = 0;
        }
    }
}
