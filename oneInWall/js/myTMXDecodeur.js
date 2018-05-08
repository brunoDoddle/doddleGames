var myTMXDecodeur = {
    nativeBase64: (typeof ($.atob) == 'function'),
    width: null,
    height: null,
    cumuledMap: [],
}

myTMXDecodeur.decodeASBytesArray = function (input, bytes) {
    bytes = bytes || 1;

    var ar = [],
        i, j, len;

    for (i = 0, len = input.length / bytes; i < len; i++) {
        ar[i] = 0;
        for (j = bytes - 1; j >= 0; --j) {
            ar[i] += input.charCodeAt((i * bytes) + j) << (j << 3);
        }
    }
    return ar;
};

myTMXDecodeur.decodeB64Gzip = function (encodedData) {
    var gzip = JXG.decompress(encodedData); // A voir si pas intégrable
    var arrayOfBytes = this.decodeASBytesArray(gzip, 4);
    return arrayOfBytes;
}


myTMXDecodeur.intoMap = function (arrayOfBytes) {
    var _map = [],
        idx = 0;

    if (arrayOfBytes.length != this.width * this.height) {
        console.error('Taille decode du TMX incorrecte ');
        return -1;
    }

    for (var y = 0; y < this.height; y++) {
        _map[y] = [];
        for (var x = 0; x < this.width; x++) {
            _map[y][x] = arrayOfBytes[idx++];
        }
    }

    return _map;
}

myTMXDecodeur.generateNullMap = function () {
    var _map = [];

    for (var y = 0; y < this.height; y++) {
        _map[y] = [];
        for (var x = 0; x < this.width; x++) {
            _map[y][x] = 0;
        }
    }

    return _map;
}

myTMXDecodeur.cumulRawMap = function (name, arrayOfBytes) {
    if (this.cumuledMap == undefined) this.cumuledMap = [];

    var _map = this.intoMap(arrayOfBytes);

    this.cumulMap(name, _map);
}

myTMXDecodeur.cumulMap = function (name, map) {
    for (var y = 0; y < this.height; y++) {
        if (this.cumuledMap[y] == undefined) this.cumuledMap[y] = [];
        for (var x = 0; x < this.width; x++) {
            if (this.cumuledMap[y][x] == undefined) {
                var o = new Object();
                o[name] = map[y][x];
                this.cumuledMap[y][x] = o;
            } else this.cumuledMap[y][x][name] = map[y][x];
        }
    }
}
