function clsServiceWorker(name, version, files) {
    var _radical = name;
    var _version = "v" + version;
    // Pourquoi vouloir en faire 2 ?? Pas forcément d'intéret....
    var _cache = _radical + "_" + _version; // ce qui sera mis en cache à la volée
    var _precache = _radical + "_" + _version; // Ce qu'on veut forcemment mettre en cahce
    var _this = this;

    if (files === undefined) files = []

    // events listener
    // Le pré remplissage du cache
    self.addEventListener('install', function (event) {
        console.log('[ServiceWorker] Install', event);
        event.waitUntil(
            caches.open(_precache).then(function (cache) {
                return cache.addAll(files);
            })
        );
        self.skipWaiting(); // Activate worker immediately
    });

    // Le nettoyage en acs de changement de version
    self.addEventListener('activate', function (event) {
        console.log('[ServiceWorker] Activate', event);
        self.clients.claim();
        event.waitUntil(
            caches.keys().then(function (cacheNames) {
                return Promise.all(
                    cacheNames.filter(function (cacheName) {
                        // On ne supprime que les caches qui nous appartiennent...
                        if (cacheName.startsWith(_radical)) {
                            if (cacheName.indexOf(_version) == -1) { // Et encore quand il ne sont pas dans la bonne version
                                console.log("Supression ->" + cacheName + " >> " + _radical + _version);
                                return true;
                            }
                        }
                    }).map(function (cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    });

    // La gestion des messages
    //    self.addEventListener('message', messages, false);
    self.addEventListener('message', function (event) {
        console.log('[ServiceWorker] Message', event);

        // Si on a défini un proto messages on l'utilises
        if (_this.messages) _this.messages(event);

        // Traitement requete super simple et commun...
        switch (event.data) {
            case "version": // renvois la version actuel du service worker
                event.ports[0].postMessage(_version);
                break;
            default:
                event.ports[0].postMessage("?");
                break;
        }
    });

    // Les réponses au requetes
    //TODO: requete préfixé par _ pas misent en cache...
    self.addEventListener('fetch', function (event) {
        // Et celle vers les sites externes ??? crosssitting (oarf oarf) ???
        // Les requetes sans extension sont sytématiquement uniquement serveur ? La ont dit que oui...
        // Si on a une extention on cherche dans le cache... postulat: extension = ressource
        var url = parseURL(event.request.url);
        if (url.indexOf(".") != -1) {
            console.log('[ServiceWorker] Cache ' + url, event);
            event.respondWith(
                // Cache, puis serveur et mise en cache
                caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    } else
                        return caches.open(_cache).then(cache => {
                            return fetch(event.request).then(response => {
                                return cache.put(event.request, response.clone())
                                    .then(() => {
                                        return response;
                                    })
                                    .catch(() => {
                                        return response;
                                    });
                            });
                        });
                })
            )
        } else {
            console.log('[ServiceWorker] Fetch ' + url, event);
            event.respondWith( // Sinon c'est serveur... -> utilisatin de la classe fetch si besoin particulier...}
                fetch(event.request)
            )
        }
    });

    // Et la synchronisation...
    // A voir ce qu'on peut en faire...
    self.addEventListener('sync', function (event) {
        console.log('[ServiceWorker] Sync', event);
    });

    function parseURL(url) {
        var urlListe = url.split("/");
        url = urlListe[urlListe.length - 1];
        var query = url.indexOf("?");
        if (query != -1) url = url.substr(0, query);
        return url;
    }

    /*    function messages(event) {
            switch (event.data) {
                case "version": // renvois la version actuel du service worker
                    event.ports[0].postMessage(_version);
                    break;
                default:
                    event.ports[0].postMessage("I've no response for you !");
                    break;
            }
        }*/
}
