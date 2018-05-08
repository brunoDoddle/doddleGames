// Appel le serveur et cache les réponses de type json dans un cache spécifiques
function clsFetch(name, version) {
    var blocker = $("#block");
    var cacheName = name + "_v" + version;
    var headers = new Headers();
    _this = this;

    this.killCache = function () {
        caches.delete(cacheName);
    }

    this.callPost = function (url, data) {
        var body;
        return new Promise(function (resolve, reject) {
            body = JSON.stringify(data);
            _this.call(url, body).then(function (e) {
                resolve(e)
            }).catch(function (e) {
                reject(e);
            })
        })
    }

    this.callGet = function (url, data) {
        var query = "?";
        return new Promise(function (resolve, reject) {
            for (q in data) query += q + "=" + data[q] + "&";
            url += query;
            _this.call(url, null).then(function (e) {
                resolve(e)
            }).catch(function (e) {
                reject(e);
            })
        })
    }

    this.call = function (url, data) { //resolve,reject
        //navigator.online pour test si réseau ?? ou laisser plantage fetch ???
        return new Promise(function (resolve, reject) {
            blocker.show();
            var params = {
                headers: headers,
                mode: 'cors',
                method: 'GET'
            }
            // Pour le body du post, si renseigner alors que GET on plante bizarrement ??
            if (data != null) {
                params.body = data;
                params.method = 'POST';
            }
            fetch(url, params)
                .then(function (response) {
                    // On commence par dupliquer la reponse sinon a la moindre manip elle est invalide
                    var saveResponse = response.clone();
                    if (response.ok) { // Le serveur réponds
                        var contentType = response.headers.get("content-type");
                        // On ne supporte que le json
                        if (contentType.indexOf("application/json") !== -1) {
                            return response.json().then(function (json) {
                                // On as une réponse on la cache
                                caches.open(cacheName).then(cache => {
                                    cache.put(url, saveResponse);
                                })
                                json.cached = false; // C'est une vraie réponse du serveur
                                blocker.hide();
                                resolve(json);
                            });
                        } else {
                            console.error("Type de réponse non supporté: " + contentType);
                            blocker.hide();
                            reject("Type de réponse non supporté: " + contentType);
                        }
                    } else {
                        console.error('Http:' + response.status);
                        blocker.hide();
                        reject(response.status);
                    }
                })
                .catch(function (error) { // Pas de réponse du serveur ?? OffLine ??
                    // On cherche dans le cache dédié
                    caches.open(cacheName).then(cache => {
                        cache.match(url).then(function (response) {
                            response.json().then(function (json) {
                                json.cached = true; // Indique que ça vient du cache
                                blocker.hide();
                                resolve(json);
                            })
                        }).catch(function (e) {
                            blocker.hide();
                            reject(e);
                        });
                    })
                });
        })
    }

    this.sendMessage = function (message) {
        return new Promise(function (resolve, reject) {
            if (navigator.serviceWorker.controller != null) {
                var msg_chan = new MessageChannel();
                msg_chan.port1.onmessage = function (event) {
                    if (event.data.error) {
                        reject(event.data.error);
                    } else {
                        resolve(event.data);
                    }
                };
                navigator.serviceWorker.controller.postMessage(message, [msg_chan.port2]);
            } else reject("ServiceWorker not active!");
        });
    }
}
