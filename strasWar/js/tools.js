//===============================================================================
// Récupération d'un data URL
//===============================================================================
Image.prototype.getDataURL = function () {
    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(this, 0, 0);

    var dataURL = canvas.toDataURL("image/png");
    canvas = null;
    ctx = null;

    return dataURL;
};

DODDLE.tools = {};

DODDLE.tools.latLngToPixel = function (latLng, map) {
    var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
    var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
    var scale = Math.pow(2, map.getZoom());
    var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
    return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
};

DODDLE.tools.pixelToLatLng = function (point, map) {
    var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
    var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
    var scale = Math.pow(2, map.getZoom());
    var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
    return map.getProjection().fromPointToLatLng(worldPoint);
};

DODDLE.tools.rotateImage = function (name, rad) {
    var can1 = document.createElement("canvas");
    var ctx1 = can1.getContext("2d");

    var img = DODDLE.fetch.get(name);
    ctx1.ImageSmoothingEnabled = false;
    can1.width = img.width;
    can1.height = img.height;


    ctx1.translate(can1.width / 2, can1.height / 2);
    ctx1.rotate(rad);
    ctx1.translate(-can1.width / 2, -can1.height / 2);

    ctx1.drawImage(img, 0, 0);
    return can1.toDataURL('image/png');
};

DODDLE.tools.giveMeColouredSprite = function (name, w, h, col, offX, PV, dir) {
    if (offX === undefined) offX = 0;
    if (dir === undefined) dir = "D";

    var can1 = document.createElement("canvas");
    var ctx1 = can1.getContext("2d");
    var can2 = document.createElement("canvas");
    var ctx2 = can2.getContext("2d");

    var map = DODDLE.fetch.get(name);
    can1.width = w;
    can1.height = h;
    can2.width = w;
    can2.height = h;

    // affiche le bitmap
    ctx1.globalCompositeOperation = "source-over";
    ctx1.clearRect(0, 0, can1.width, can1.height);
    ctx1.ImageSmoothingEnabled = false;
    // Inversion si besoin
    if (dir == "G") {
        ctx1.translate(can1.width, 0);
        ctx1.scale(-1, 1);
    }
    ctx1.drawImage(map, offX * w, 0, w, h, 0, 0, w, h);

    // On fabrique sa couleur
    ctx2.globalCompositeOperation = "source-over";
    ctx2.clearRect(0, 0, can2.width, can2.height);
    ctx2.ImageSmoothingEnabled = false;
    ctx2.drawImage(map, offX * w, h, w, h, 0, 0, w, h);
    ctx2.globalCompositeOperation = "source-in";
    ctx2.fillStyle = col;
    ctx2.fillRect(0, 0, w, h);

    // On assemble les deux
    ctx1.save();
    ctx1.globalAlpha = 0.7;
    ctx1.drawImage(can2, 0, 0);
    ctx1.restore();

    if (PV !== undefined) {
        if (PV == 3) ctx1.fillStyle = '#00ff00';
        else if (PV == 2) ctx1.fillStyle = '#FF9400';
        else if (PV == 1) ctx1.fillStyle = '#ff0000';
        ctx1.strokeStyle = "black";
        ctx1.lineWidth = 2;
        ctx1.fillRect(0, 1, Math.round(w * PV / 3), 5);
        ctx1.strokeRect(0, 0, Math.round(w * PV / 3), 5);
    }
    return can1.toDataURL('image/png');
};
