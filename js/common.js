(function (root) {
    // constructeur de commons
    var commons = function () {
        // Ne fait vraiment rien...
        return this;
    }

    commons.prototype.testPhone = function () {
        if (navigator.userAgent.match(/(android|iphone|blackberry|symbian|symbianos|symbos|netfront|model-orange|javaplatform|iemobile|windows phone|samsung|htc|opera mobile|opera mobi|opera mini|presto|huawei|blazer|bolt|doris|fennec|gobrowser|iris|maemo browser|mib|cldc|minimo|semc-browser|skyfire|teashark|teleca|uzard|uzardweb|meego|nokia|bb10|playbook)/gi)) {
            return true;
        }
        return false;
    }

    // Plus utilisé normalement...
    // Gére les caches sur la même URL
    // -> obligation due au PWA gérer sur le même site (sinon on nettois le cache des autres applis)
    commons.prototype.giveMeCache = function (app) {
        var version = "_v1.5"; // Cache ou on force l'installation
        //var runtime = "_runtime"; // Cache alimentez par l'appli à la volée
        var offline = "_offline"; // cache spécifique pour gérer la partie offline

        var other = []; // Liste des cahces à ne pas détruire
        var appName; // nom de l'appli utilisé

        var apps = {
            strasWar: "SW",
            oneInWall: "OIW"
        };

        if (apps.hasOwnProperty(app)) {
            appName = apps[app];
            for (var prop in apps) {
                if (apps[prop] != appName) {
                    other.push(apps[prop] + version);
                    other.push(apps[prop] + offline + version);
                }
            }
            console.log("App>" + appName + " other>" + other);
            return {
                ONLINE: appName + version,
                OFFLINE: appName + offline + version,
                OTHER: other
            }
        } else throw "Pas de cache prévu pour '" + app + "'!";
    }

    commons.prototype.getQuery = function(param) {
        var vars = {};
        window.location.href.replace( location.hash, '' ).replace( 
            /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
            function( m, key, value ) { // callback
                vars[key] = value !== undefined ? value : '';
            }
        );

        if ( param ) {
            return vars[param] ? vars[param] : null;    
        }
        return vars;
    }


    root.commons = commons;

})(this);
