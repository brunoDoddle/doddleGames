function animated(map) {
    this.objets = [];
    this.map = map;

    this.init = function () {
        this.objets = [];
    };

    this.play = function () {
        for (var o in this.objets) {
            this.objets[o].play();
        }
    };

    this.addAnim = function (anim) {
        this.objets.push(anim);
    };

    this.init();
}

// = Classe d'animation globales
// =========================================
function myAnim(position, icon, map) {
    this.duration = 10;
    this.run = false;
    this.map = map;

    this.marker = new google.maps.Marker({
        position: position,
        icon: icon,
        optimized: false,
        zIndex: 2000
    });

    this.show = function () {
        this.marker.setMap(this.map);
        this.run = true;
    };

    this.hide = function () {
        this.marker.setMap(null);
        this.run = false;
    };

    this.setDuration = function (duration) {
        this.duration = duration;
    };

    // Ne marche pas !!!
    this.noOptimization = function (zindex) {
        this.marker.optimized = false;
        this.marker.setZIndex(zindex);
    };

    this.setChain = function (nextAnim) {
        this.nextAnim = nextAnim;
    };

    this.play = function () {
        if (this.run) {
            this._play();
        }
    };

    this.end = function () {
        this.hide();
        if (this.nextAnim !== undefined) this.nextAnim.show();
    };

    this._play = function () {};
}

// = class des Bam explosion de combat
// =========================================
function animBam(position, map) {
    this.icon = {
        url: DODDLE.fetch.getImageUrl("bam"),
        scaledSize: new google.maps.Size(90, 90),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(45, 90)
    };

    myAnim.call(this, position, this.icon, map); // On 'dérive'	

    this._play = function () {
        this.duration--;
        if (this.duration <= 0) {
            this.end();
        }
    };
}

// = Classe d'animation de sang des fléches
// =========================================
function animBlood(position, map) {
    this.icon = {
        url: DODDLE.fetch.getImageUrl("blood"),
        scaledSize: new google.maps.Size(60, 60),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(30, 60)
    };

    myAnim.call(this, position, this.icon, map); // On 'dérive'	

    this._play = function () {
        this.duration--;
        if (this.duration <= 0) {
            this.end();
        }
    };
}


// = Classe d'animation des fléches
// =========================================
function animFleche() {
    this.icon = {
        url: DODDLE.fetch.getImageUrl("fleche"), // il faut une image fleche (attention 2 ref à modifier)
        scaledSize: new google.maps.Size(30, 30),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 15)
    };

    myAnim.call(this, undefined, this.icon); // On 'dérive'	
    this.velX = 0;
    this.velY = 0;
    this.distance = 0;
    this.positionDepart = {};
    this.positionCourante = {};

    this.setDirection = function (m1, m2) {
        var p1, p2, pv;
        this.map = m1.getMap();

        p1 = DODDLE.tools.latLngToPixel(m1.position, this.map);
        p2 = DODDLE.tools.latLngToPixel(m2.position, this.map);
        pv = new google.maps.Point(p1.x - p2.x, p1.y - p2.y);

        // Angle de la fleche
        angle = (Math.atan2(pv.y, pv.x) - Math.PI / 2.0);
        this.icon.url = DODDLE.tools.rotateImage("fleche", angle);
        this.marker.setIcon(this.icon);

        // Distance à parcourir
        this.distance = Math.sqrt(pv.x * pv.x + pv.y * pv.y);
        // Vecteur vitesse
        this.velX = (pv.x / this.distance);
        this.velY = (pv.y / this.distance);
        // la position en pixel
        this.positionDepart = new google.maps.Point(p1.x, p1.y - 20);
        this.positionCourante = new google.maps.Point(p1.x, p1.y - 20);
    };

    this._play = function () {
        this.positionCourante.x -= this.velX * 30;
        this.positionCourante.y -= this.velY * 30;

        var np = DODDLE.tools.pixelToLatLng(this.positionCourante, this.map);

        var distanceParcouru = Math.sqrt(Math.pow(this.positionDepart.x - this.positionCourante.x, 2) + Math.pow(this.positionDepart.y - this.positionCourante.y, 2));
        if (distanceParcouru >= this.distance) {
            this.end();
        }
        this.marker.setPosition(np);
    };
}
