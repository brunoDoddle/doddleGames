//==============================================================================
//==============================================================================
//= Classe pour sprite animé
//= 04/2011 Copyfree Lentz Bruno
//==============================================================================
//==============================================================================

//==============================================================================
function clsSprite() {
    //==============================================================================
    var _this = null;

    var _img = null;
    var _this = null;

    // L'objet est utilisable de suite
    this.ready = false;
    // Ces propriétées
    // position
    this.x = 0;
    this.y = 0;
    // border (suite x,y,X,Y)
    this.border = null;

    // le centre
    this.xCenter = 0
    this.yCenter = 0;
    // La distance du centre à une bordure
    this.xLeft = 0;
    this.xRight = 0;
    this.yUp = 0;
    this.yDown = 0;

    // taille du graph complet
    this.width = 0;
    this.height = 0;

    // Limite du graph
    this.xBoundarie = 0;
    this.yBoundarie = 0;
    this.widthBoundarie = 0;
    this.heightBoundarie = 0;

    // Utilse pour collision (mouerf...)
    this.rayon = 0;

    // Pour l'animation
    var _globalAnim = false;
    var _cptAni = 0;
    var _cptTempo = 0;
    var _last = 0;
    var _tempo = 0; // tempo global
    var _currentTempo = 0; // tempo tampon au cas ou définie par animated
    var _animated = new Array();

    // Tricks de la mort...
    _this = this;

    //=====================================================================================================
    //=====================================================================================================
    // Méthodes de créations
    //=====================================================================================================
    //=====================================================================================================
    this.set = function (source, width, height) {
        _img = source;
        this.ready = true;

        initSpriteValue(width, height);
    }

    this.load = function (source, width, height) {
        _img = new Image();
        _img.src = source;
        this.ready = false;

        initSpriteValue(width, height);

        _img.onload = function () {
            _this.ready = true;
        }
    }

    function initSpriteValue(width, height) {
        //_this vraiment obligatoire ??
        //à priori trouve pas calculateSpaces sinon ??
        _this.width = width;
        _this.height = height;
        _this.rayon = (this.width / 2 + this.height / 2) / 2;

        _this.xBoundarie = 0;
        _this.yBoundarie = 0
        _this.widthBoundarie = width;
        _this.heightBoundarie = height;
        _this.calculateSpaces();
    }

    //=====================================================================================================
    //=====================================================================================================
    // Méthodes de dessins
    //=====================================================================================================
    //=====================================================================================================
    // Dessine à la postion du sprite avec decalage et center
    this.drawPos = function (context, name, taille) {
        var _pos = this.getCenter();
        this.drawXY(context,
            name,
            _pos.x,
            _pos.y,
            taille);
    }

    // Dessine à une position particulère
    this.drawXY = function (context, name, x, y, taille) {
        // _currentTempo : utilisé pour soit le tempo global, soit le tempo par image
        _currentTempo = _tempo;
        if (!_globalAnim) _cptTempo += 1; // timer finale (pas super content mais ça ira...)

        if (taille == undefined) taille = 1;

        if (_animated[name] != undefined) { // Il faut avoir définit au moins une animation
            if (_animated[name].tempo != null) _currentTempo = _animated[name].tempo
            if (_cptAni >= _animated[name].nb) _cptAni = 0;

            this._drawIt(context, name, x, y, taille);

            if (_cptTempo > _currentTempo) {
                _cptAni++;
                _cptTempo = 0;
            }
        } else throw "Erreur, pas d'animation pour le nom '" + name + "'!";
    }

    // Dessine à une position particulière une frame particulière à l'animation
    this.drawXYF = function (context, name, x, y, frame, taille) {

        if (taille == undefined) taille = 1;
        if (_animated[name] != undefined) { // Il faut avoir définit au moins une animation
            if (frame > _animated[name].nb || frame < 0) {
                frame = 0;
                console.log("La frame " + frame + " demandé est hors de l'animation " + name);
            }
            _cptAni = frame; // On force la courante sur la demande
            this._drawIt(context, name, x, y, taille);

        } else throw "Erreur, pas d'animation pour le nom '" + name + "'!";
    }

    // Fonction interne de drawage.... :-)
    this._drawIt = function (context, name, x, y, taille) {
        context.drawImage(_img,
            _animated[name].list[_cptAni].x,
            _animated[name].list[_cptAni].y,
            _animated[name].width, // Taille à découper
            _animated[name].height,
            x - this.xCenter * taille,
            y - this.yCenter * taille,
            _animated[name].width * taille, // taille sur le context
            _animated[name].height * taille);
    }

    this.globalAnim = function () {
        _cptTempo++;
    }

    this.setGlobalAnim = function (val) {
        _globalAnim = val;
    }
    //=====================================================================================================
    //=====================================================================================================
    // Collision de sprites
    //=====================================================================================================
    //=====================================================================================================
    // Test si les 2 rect colisionnent
    this.testBoundariesCol = function (autreSprite) {
        var a = this.getBoundaries();
        var b = autreSprite.getBoundaries();

        // On vérifie si a dans b et si b dans a
        // ne pas utiliser this, c'est une fonction interne...
        return (test2RectCol(a, b) || test2RectCol(b, a))
    }

    function test2RectCol(a, b) {
        return ((a.x > b.x) && (a.x < b.X) || (a.X > b.x && a.X < b.X)) && ((a.y > b.y && a.y < b.Y) || (a.Y > b.y && a.Y < b.Y));
    }

    // Calcul la distance entre les 2 sprites et en soustrait leur tailles
    this.testCol = function (autreSprite) {
        var a = this.getCenter();
        var b = autreSprite.getCenter();

        // On calcul la distance entre les 2 protagonistes...
        var dist = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

        // Et on regarde si la distance est inférieur à la somme des rayons(enfin si ils se touchent quoi...)
        return (dist < (this.rayon + autreSprite.rayon));
    }

    //=====================================================================================================
    //=====================================================================================================
    // Méthodes de centrages décalages
    //=====================================================================================================
    //=====================================================================================================
    this.setBoundaries = function (x, y, w, h) {
        this.xBoundarie = x;
        this.yBoundarie = y;
        this.widthBoundarie = w;
        this.heightBoundarie = h;

        this.calculateSpaces();
    }

    // Return les limites physique du sprite
    this.getBoundaries = function (modulo) {
        if (modulo == undefined) modulo = 1;
        return ({
            x: this.x + (-this.xCenter + this.xBoundarie) * modulo,
            y: this.y + (-this.yCenter + this.yBoundarie) * modulo,
            X: this.x + (-this.xCenter + this.xBoundarie + this.widthBoundarie) * modulo,
            Y: this.y + (-this.yCenter + this.yBoundarie + this.heightBoundarie) * modulo
        });
    }

    // Retourne le centre du sprite pour affichage avec sprite centré a x,y
    this.getCenter = function (modulo) {
        if (modulo == undefined) modulo = 1;
        return ({
            x: this.x + (-this.xCenter) * modulo,
            y: this.y + (-this.yCenter) * modulo
        });
    }

    // Permet de choisir un centre
    this.setCenter = function (x, y) {
        this.xCenter = x;
        this.yCenter = y;

        this.calculateSpaces();
    }

    // Calcul les distance entre le centre et les bordures du sprite
    this.calculateSpaces = function () {
        this.xLeft = this.xBoundarie;
        this.xRight = (this.xBoundarie + this.widthBoundarie);
        this.yUp = this.yBoundarie;
        this.yDown = (this.yBoundarie + this.heightBoundarie);
    }

    //=====================================================================================================
    //=====================================================================================================
    // Méthode d'animation
    //=====================================================================================================
    //=====================================================================================================
    this.add = function (name, width, height, anim, tempo) {
        // virer width et height et utiliser ceux de l'objet....
        delete _animated.name; // On s'assure qu'il n'y en à pas déja une..
        _animated[name] = new animatedSprite(width, height, anim, tempo);
    }

    this.getAnimNb = function (name) {
        if (_animated[name] != undefined) {
            return _animated[name].nb;
        } else throw "Erreur, pas d'animation pour le nom '" + name + "'!";
        return -1;
    }

    this.setTempo = function (tempo) {
        _tempo = tempo;
    }

    function animatedSprite(width, height, anim, tempo) {
        // anim: [{x,y,nb}]
        // On peut préciser un tempo par type d'animation, sinon on utilise le global
        this.width = width;
        this.height = height;
        this.list = [];
        this.nb = 0;

        if (tempo != undefined) this.tempo = tempo;
        else this.tempo = null;

        for (var n in anim) {
            if (anim[n].nb > 0) {
                for (var m = 0; m < anim[n].nb; m++) {
                    this.list.push({
                        'x': (anim[n].x + m) * this.width,
                        'y': anim[n].y * this.height
                    });
                    this.nb++;
                }
            } else if (anim[n].nb < 0) {
                for (var m = 0; m < Math.abs(anim[n].nb); m++) {
                    this.list.push({
                        'x': (anim[n].x - m) * this.width,
                        'y': anim[n].y * this.height
                    });
                    this.nb++;
                }
            } else {
                this.list.push({
                    'x': (anim[n].x) * this.width,
                    'y': anim[n].y * this.height
                });
                this.nb++;
            }
            //    else if (anim[n].nb==undefined){
            //    this.list.push({'x':(anim[n].x-m)*this.width,'y':anim[n].y*this.height});
            //    this.nb++;
            //    }
        }
    }

}
//==================================================================================================================
//==================================================================================================================
//==================================================================================================================
//==================================================================================================================
