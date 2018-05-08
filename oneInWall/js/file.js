// Pour compatibilité CORDOVA
FileError = {
    NOT_FOUND_ERR:0
};

function file() {
    //==========================================
    // Variables Privés
    //==========================================
    var FS = null;
    var FSok = null;

    //==========================================
    // Variables Publiques
    //==========================================

    //==========================================
    // Fonctions publiques
    //==========================================
    //==========================================
    // Main
    //==========================================
    // On test pour connaitre le type de sauvegarde disponible
    this.init = function (callBack) {
        saveFS.callBack = callBack;
        if (typeof (window.requestFileSystem) == "function") {
            window.requestFileSystem(window.PERSISTENT, 0, saveFS, errorHandler);
        } else {
            FSok = false
            callBack();
        }
    }

	// Lit en session ou dans FileSystem en fonction de l'envirronement
    this.read = function (name, callBack) {
        //http://stackoverflow.com/questions/15923735/passing-an-additional-parameter-to-javascript-callback-for-phonegap-file-handlin
        // Passage de paramêtres bidons
        errorHandler.callBack = callBack;
        readFile.callBack = callBack;
        FSok ? FS.root.getFile(name, { create: false, exclusive: false }, readFile, errorHandler) : readSession(name, callBack);
    }

	// Ecrit en session ou dans FileSystem en fonction de l'envirronement
    this.write = function (name, data, callBack = null) {
        // Passage de paramêtres bidons
        errorHandler.callBack = callBack;
        writeFile.callBack = callBack;
        writeFile.data = data;
        FSok ? FS.root.getFile(name, { create: true, exclusive: false }, writeFile, errorHandler) : writeSession(name, data, callBack);
    }

    this.readLocal = function(name,callBack) {
        errorHandler.callBack = callBack;   // pour le cas ou on a une erreur.. Punaize c'est pos du francais...
        var data = JSON.parse(localStorage.getItem(name));
        if (data != null)
            callBack("",data);
        else
            errorHandler({code:FileError.NOT_FOUND_ERR});
    }

    this.writeLocal = function(name, data, callBack) {
        localStorage.setItem(name, JSON.stringify(data));
        if (callBack != undefined) callBack(true);
    }

    //==========================================
    // Fonctions privées
    //==========================================
    //====================
    // Lecture
    //====================
    function readFile (fileEntry) {
        fileEntry.file(function (file) {
            var reader = new FileReader();

            reader.onloadend = function (e) {
                readFile.callBack(JSON.parse(this.result))
            };

            reader.readAsText(file);
        }, errorHandler);
    }

    function readSession(name,callBack) {
        var data = JSON.parse(localStorage.getItem(name));
        if (data != null)
            callBack(data);
        else
            errorHandler({code:FileError.NOT_FOUND_ERR});
    }

    //====================
    // Ecriture
    //====================
    function writeFile(fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function (e) {
                if (writeFile.callBack!=null) writeFile.callBack(1);
            };

            fileWriter.onerror = function (e) {
                alert('Write failed: ' + e.toString());
                if (writeFile.callBack != null) writeFile.callBack(0);
            };

            var txt = JSON.stringify(writeFile.data);
            fileWriter.write(txt);
        }, errorHandler);
    }

    function writeSession(name, data, callBack) {
        localStorage.setItem(name, JSON.stringify(data));
        if (callBack != null) callBack(1);
    }

    //====================
    // Fonctions diverses
    //====================
    function saveFS(fs) {
        FSok = true;
        FS = fs;
        saveFS.callBack();
    }

    function errorHandler(e) {
        var msg = '';

        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'Storage quota exceeded';
		        break;
            case FileError.NOT_FOUND_ERR:
                msg = 'File not found';
                break;
            case FileError.SECURITY_ERR:
                msg = 'Security error';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'Invalid modification';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'Invalid state';
                break;
            default:
                msg = 'Unknown error';
                break;
        };

        console.error(' --- Error : ' + msg);
        // on renvois null car ca peut etre une lecture qui foire et qui du coup attends ces données
        if (errorHandler.callBack != null) errorHandler.callBack(msg,null);
    }
}
