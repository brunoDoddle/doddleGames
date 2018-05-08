function clsMeteor(mulX, mulY) {
    var meteors = [];
    var nullableMeteors = [];
    var ctx = undefined;
    var mX = mulX; // Vraiment utile :-)
    var mY = mulY;
    var as = myLoader.getRessource("astro");
    var coin = myLoader.getRessource("coin");
    var energy = myLoader.getRessource("energy");

    var as0 = new Image();
    var as1 = new Image();
    var as2 = new Image();
    var as3 = new Image();
    var as4 = new Image();

    var workingCanvas = document.createElement("canvas");
    var workingContext = workingCanvas.getContext("2d");
    var nbImage = 60;
    var angle = (2 * Math.PI) / nbImage;

    this.maxDestroyedMeteor = 0;

    var scopeDistance = (scopeDistance = 130) * scopeDistance; // Distance pour être dans les narrows

    function computeMeteor(start, t) {
        workingCanvas.width = t * nbImage;
        workingCanvas.height = t;

        for (var i = 0; i < nbImage; i++) {
            workingContext.save();
            workingContext.translate((t) / 2 + (t) * i, (t) / 2);
            workingContext.save();
            workingContext.rotate(i * angle);
            workingContext.drawImage(as,
                0, start, t, t, -(t) / 2, -(t) / 2, (t), (t)
            );
            workingContext.restore();
            workingContext.globalCompositeOperation = "source-atop";
            workingContext.drawImage(as,
                t, start, t, t, -(t) / 2, -(t) / 2, (t), (t)
            );
            workingContext.restore();
        }
        return workingCanvas.toDataURL();
    }

    as0.src = computeMeteor(0, 70);
    as1.src = computeMeteor(70, 50);
    as2.src = computeMeteor(120, 30);
    as3.src = computeMeteor(150, 20);
    as4.src = computeMeteor(170, 10);

    this.init = function (context) {
        ctx = context;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        meteors = [];
        nullableMeteors = [];
        this.maxDestroyedMeteor = 0;
    }

    this.giveMeteors = function () {
        return meteors;
    }

    function base() {
        this.name = "base";
        this.x = 0;
        this.vx = 0;
        this.y = 0;
        this.vy = 0;
        this.scale = 1;
        this.speed = 3;
        this.alive = true;
        this.boom = false;
        this.width = 0;
        this.height = 0;

        this.setBitmap = function (bmp) {
            this.bitmap = bmp;
            this.width = bmp.width;
            this.height = bmp.height;
            this.ray = Math.round((this.width * mX + this.height * mY) / 4);
            this.scale = this.ray * 2;
        }

        this.update = function (ctx) {
            if (this.alive) {
                this.boom = false;
                this.narrow = false;
                this.y += this.vy
                this.x += this.vx;

                //TODO: Voir a mettre gauche et droite :-)
                if (this.y > (ctx.canvas.height + this.scale) || this.x < -50 || this.x > (ctx.canvas.width + 50)) {
                    this.alive = false;
                }
            }
            return this.alive;
        }

        this.giveBound = function () {
            var minimifier = 0.8;
            return {
                x: this.x - (this.ray * minimifier),
                y: this.y - (this.ray * minimifier),
                X: this.x + (this.ray * minimifier),
                Y: this.y + (this.ray * minimifier)
            };
        }

        this.collision = function (otherMeteor) {
            if (this != otherMeteor) {
                var box1 = this.giveBound();
                var box2 = otherMeteor.giveBound();
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
        }

    }

    function Meteor() {
        base.call(this);
        this.name = "METEOR";
        this.angle = 0;
        this.speedRotate = 0;

        this.setBitmap = function (bmp) {
            this.bitmap = bmp;
            this.width = bmp.width / nbImage; // FIXME: Ouerf pas bien voir dégueulasse
            this.height = bmp.height;
            this.ray = Math.round((this.width * mX + this.height * mY) / 4);
            this.scale = this.ray * 2;
        }

        this.animation = function () {
            this.angle += this.speedRotate;
            if (this.angle >= (nbImage - 1)) this.angle = 0; // FIXME: Ouerf pas bien voir dégueulasse

            return (Math.round(this.angle) * this.width);
        }
    }

    function Money() {
        base.call(this);
        this.name = "MONEY";

        this.animation = function () {
            return 0;
        }
    }

    function Energy() {
        base.call(this);
        this.name = "ENERGY";

        this.animation = function () {
            return 0;
        }
    }

    this.addMeteor = function (type, speed, x, speedRotate) {
        var object;
        if (type < 5) {
            object = new Meteor();
            object.type = type;
            if (type == 0)
                object.setBitmap(as0);
            else if (type == 1)
                object.setBitmap(as1);
            else if (type == 2)
                object.setBitmap(as2);
            else if (type == 3)
                object.setBitmap(as3);
            else
                object.setBitmap(as4);

            object.speedRotate = speedRotate
        } else if (type == 5) {
            object = new Money();
            object.type = type;
            object.setBitmap(coin);
        } else {
            object = new Energy();
            object.type = type;
            object.setBitmap(energy);
        }

        object.vy = speed;
        object.x = x;

        object.vx = 0;
        object.y = -70; // Meteor le plus grands
        object.narrow = false;

        meteors.push(object);
    }

    this.garbageMeteor = function () {
        meteors.forEach(meteor => {
            if (!meteor.alive) nullableMeteors.push(meteor);
        })
    }

    this.killDeadMeteors = function () {
        nullableMeteors.forEach(toKill => {
            var i = meteors.indexOf(toKill);
            if (i != -1) meteors.splice(i, 1)
        })
        nullableMeteors = [];
    }

    this.collisions = function (joueur) {
        // les caractéristiques du joueur
        var alive = joueur.getAlive();
        var x = joueur.getX();
        var y = joueur.getY();
        var zbam = joueur.getZbam();
        var collide = [];

        // On prends tous les météors
        var vx, vy, ovx, ovy, vxx, vyy, dist;

        meteors.forEach(meteorToTest => {
            // On regarde si un meteor proche du joueur pour le placer dans la liste des proches (narrow)
            vxx = (vxx = meteorToTest.x - x) * vxx;
            vyy = (vyy = meteorToTest.y - y) * vyy;
            var dist = (vxx + vyy);

            if ((dist < (zbam.size + meteorToTest.ray) * (zbam.size + meteorToTest.ray)) && zbam.cpt != 0 && alive) {
                meteorToTest.alive = false;
                this.maxDestroyedMeteor++;
                collide.push({
                    x: meteorToTest.x,
                    y: meteorToTest.y
                });

            } else {
                if (dist < scopeDistance && alive) {
                    meteorToTest.narrow = true;

                    if (DODDLE.test) {
                        ctx.beginPath();
                        ctx.lineWidth = "1";
                        ctx.strokeStyle = "LawnGreen";
                        ctx.moveTo(x, y);
                        ctx.lineTo(meteorToTest.x, meteorToTest.y);
                        ctx.stroke();
                    }
                }

                // Et maintenant on regarde si par hasard un meteor hit un autre météor...
                if (!meteorToTest.boom && meteorToTest.name == "METEOR") { // On test si par hasard déjà eu une collision
                    var noBoom = meteors.filter(meteor => (!meteor.boom && meteor.name == "METEOR")); // On refais une liste de ce qui ne sont pas collisionnée
                    noBoom.forEach(otherMeteor => {
                        if (meteorToTest.collision(otherMeteor)) {
                            vxx = (vxx = meteorToTest.x - otherMeteor.x) * vxx;
                            vyy = (vyy = meteorToTest.y - otherMeteor.y) * vyy;
                            dist = Math.sqrt(vxx + vyy);
                            meteorToTest.speedRotate += .01;
                            otherMeteor.speedRotate += .01;
                            vx = (otherMeteor.x - meteorToTest.x) / dist;
                            ovx = (meteorToTest.x - otherMeteor.x) / dist;

                            if (meteorToTest.y < otherMeteor.y) {
                                otherMeteor.vy += 2;
                                meteorToTest.vy -= 1;
                            } else {
                                meteorToTest.vy += 2;
                                otherMeteor.vy -= 1;
                            }

                            if (meteorToTest.vy <= 0) meteorToTest.vy = 1;
                            if (otherMeteor.vy <= 0) otherMeteor.vy = 1;

                            meteorToTest.vx -= vx;
                            otherMeteor.vx -= ovx;
                        }
                    })
                }

            }
        })

        return (collide);
    }

    this.update = function () {
        ctx.ImageSmoothingEnabled = false;
        ctx.lineWidth = "1";
        ctx.strokeStyle = "rgb(226, 255, 0)";

        meteors.forEach(meteor => {

            if (meteor.update(ctx)) {

                ctx.save();
                ctx.translate(meteor.x, meteor.y);
                ctx.drawImage(meteor.bitmap,
                    meteor.animation(), 0, meteor.width, meteor.height,
                    (-meteor.width * mX / 2), (-meteor.height * mY / 2), meteor.width * mX, meteor.height * mY
                )
                ctx.restore();

                if (DODDLE.test) { // trace les touchZones du meteor...
                    var m = meteor.giveBound();
                    ctx.beginPath();
                    ctx.rect(m.x, m.y, m.X - m.x, m.Y - m.y);
                    ctx.stroke();
                }
            }
        })
    }
}
