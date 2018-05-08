function clsStore(name, version) {
    var cacheName = name + "_v" + version;
    var blocker = $("#block");

    // Récupère un objet du cache
    this.get = function (name) {
        blocker.show();
        return new Promise(function (resolve, reject) {
            caches.open(cacheName).then(cache => {
                cache.match(name).then(function (response) {
                    response.json().then(function (json) {
                        blocker.hide();
                        resolve(json);
                    })
                }).catch(function (e) {
                    blocker.hide();
                    reject(e);
                });
            })
        })
    }

    // Sauve dans le cache
    this.put = function (name, data) {
        blocker.show();
        const jsonResponse = new Response(JSON.stringify(data), {
            headers: {
                'content-type': 'application/json'
            }
        });

        caches.open(cacheName).then(cache => {
            cache.put(name, jsonResponse);
            blocker.hide();
        }).catch(function () {
            blocker.hide();

        })
    }

    // Promise.All
    //https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise/all
    // Reduce
    // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/reduce

    // Renvois le contenu complet du cache
    this.directory = function () {
        blocker.show();
        return new Promise(function (resolve, reject) {
            var result = []; // Les résultats en json
            var promises = []; // la liste de promesses

            caches.open(cacheName).then(cache => {
                cache.matchAll().then(function (response) {
                    // On fait une liste de promesse
                    response.forEach((element) => {
                        promises.push(element.json().then(function (json) {
                            return (json);
                        }))
                    });
                    // On attends que tout soit résolue pour rendre la main...
                    Promise.all(promises).then(function (result) {
                        blocker.hide();
                        resolve(result);
                    })
                }).catch(function (e) {
                    blocker.hide();
                    resolve([]);
                });
            }).catch(function () {
                blocker.hide();
                resolve([]);
            });
        })
    }

    // Supprime un objet du cache
    this.del = function (name) {
        blocker.show();
        return new Promise(function (resolve, reject) {
            caches.open(cacheName).then(cache => {
                cache.delete(name, {
                    //ignoreSearch: true
                }).then(function (e) {
                    blocker.hide();
                    resolve(e);
                });
            }).catch(function () {
                blocker.hide();
                reject();
            });
        })
    }
}
