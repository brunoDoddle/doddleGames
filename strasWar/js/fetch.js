DODDLE = {};

DODDLE.fetch = {
    load: [],
    andNow: {}
};

DODDLE.fetch.init = function () {
    this.load = [];
};

DODDLE.fetch.add = function (nom, url, data, method) {
    for (var l in this.load)
        if (this.load[l].nom == nom) {
            console.log("Nom déja dans la liste de load !!");
            return -1;
        }
    this.load.push(DODDLE.fetch.makeRequest(url, data, method, nom));
};

DODDLE.fetch.makeRequest = function (url, method, data, nom) {
    var req = this.testRequete(url, method, data);

    return {
        loaded: false,
        nom: nom,
        data: req.body,
        url: req.url,
        method: req.method,
        response: undefined
    };
}

DODDLE.fetch.testRequete = function (url, method, data) {
    var query, body;

    if (method === undefined) method = "GET";
    // Préparation des donnéees à envoyer
    if (method.toLowerCase() == "get") {
        query = "?";
        for (q in data) query += q + "=" + data[q] + "&";
        url += query;
    } else {
        body = JSON.stringify(data);
    }

    return ({
        url: url,
        body: body,
        method: method
    });
};

DODDLE.fetch.call = function (url, data, method) {
    this.andNow = function () {};
    return new Promise(function (resolve, reject) {
        var load = DODDLE.fetch.makeRequest(url, method, data);
        DODDLE.fetch.callServer(load)
            .then(function (r) {
                resolve(r);
            })
            .catch(function (e) {
                reject(e);
            });
    });
};

DODDLE.fetch.execute = function (callBack) {
    this.andNow = callBack;
    for (var l in this.load) this.callServer(this.load[l]);
};

DODDLE.fetch.wait = function () {
    for (var l in this.load)
        if (this.load[l].loaded === false) return false;
    if (this.andNow !== undefined) this.andNow();
    return true;
};

DODDLE.fetch.searchRessource = function (nom) {
    for (var l in this.load) {
        if (this.load[l].nom == nom) { // On a la ressource
            if (this.load[l].loaded === false) {
                console.error("ressource pas encore chargé! " + nom);
                return -1;
            }
            return this.load[l];
        }
    }
    console.error("Cette ressource n'existe pas ! " + nom);
    return -1;
};

DODDLE.fetch.get = function (nom) {
    var ressource = this.searchRessource(nom);
    return ressource.response;
};

// plus utile... Mais faudrait un getDataUrl ou faire un etends d'image...
DODDLE.fetch.getImageUrl = function (nom) {
    var ressource = this.searchRessource(nom);
    return ressource.src;
};

DODDLE.fetch.callServer = function (toLoad) {
    if (!self.fetch) {
        console.log("FETCH non supporté");
        return -1;
    }

    return new Promise(function (resolve, reject) {
        var headers = new Headers(); // A voir... si on complète...

        fetch(toLoad.url, {
                headers: headers,
                mode: 'cors',
                method: toLoad.method,
                body: toLoad.data
            })
            .then(function (response) {
                if (response.ok) {
                    var contentType = response.headers.get("content-type");

                    if (contentType) {
                        if (contentType.indexOf("text/html") !== -1) {
                            return response.text().then(function (text) {
                                if (toLoad.nom !== undefined) console.log("text loaded:" + toLoad.nom);
                                console.debug(text); // Affichage contenu du JSON
                                toLoad.loaded = true;
                                toLoad.response = text;
                                DODDLE.fetch.wait();
                                resolve(toLoad.response);
                            });
                        } else if (contentType.indexOf("application/json") !== -1) {
                            return response.json().then(function (json) {
                                if (toLoad.nom !== undefined) console.log("json loaded:" + toLoad.nom);
                                console.debug(json); // Affichage contenu du JSON
                                toLoad.loaded = true;
                                toLoad.response = json;
                                DODDLE.fetch.wait();
                                resolve(toLoad.response);
                            });
                        } else if (contentType.indexOf("image") !== -1) {
                            return response.blob().then(function (myBlob) {
                                var img = new Image();
                                if (toLoad.nom !== undefined) console.log("blob loaded:" + toLoad.nom);
                                toLoad.loaded = true;
                                toLoad.src = URL.createObjectURL(myBlob);
                                img.src = toLoad.src;
                                toLoad.response = img;
                                DODDLE.fetch.wait();
                                resolve(toLoad.response);
                            });
                        } else {
                            console.error("Type de réponse non supporté: " + contentType);
                            reject("Type de réponse non supporté: " + contentType);
                        }
                    }
                } else {
                    console.error('Http:' + response.status);
                    reject(response.status);
                }
            })
            .catch(function (error) {
                console.error('Gros problème:' + error);
                reject(error);
                //if (toLoad.callBackKo) toLoad.callBackKo(error);
            });
    });
};
