//===============================================================================
//== PageModel : Gestion de la page global
//===============================================================================
function pageModel(titrePage) {
    var listeWarning = [];
    var tempo;
    var duration = 4000; // temps d 'affichage des messages
    var refresh = 1000;
    var needReseau = false;
    var _servicesToClean = function () {}; // Fonction globale de nettoyage
    var _buttonsBloc;
    var _connexionTime = 10;
    var _ligthBox, _popUp;

    // Les différentts éléments dynamique géré par le pageModel
    var body = document.getElementById("body"); // on cible le body au cas ou
    var container = document.getElementById("container"); // on cible le container
    var page = document.getElementById("page"); // Ne pas toucher à container
    var titre = document.getElementById("header_title");
    var messsageZone = document.getElementById("errors");
    var loading = document.getElementById("loading");
    var waiting = document.getElementById("wait");
    var bb = document.getElementById("backButton");
    var ob = document.getElementById("offButton");

    //===============================================================================
    //===============================================================================
    // Fonction privées
    //===============================================================================
    //===============================================================================
    // declare the view model used within the page
    function _ViewModel() {
        var self = this;
    }

    //=====================================
    // Envoi un message au SW (si on en a un)
    //=====================================
    function _sendMsg(msg) {
        return new Promise(function (resolve, reject) {
            if (navigator.serviceWorker.controller) {
                var msg_chan = new MessageChannel();

                msg_chan.port1.onmessage = function (event) {
                    if (event.data.error) {
                        reject(event.data.error);
                    } else {
                        resolve(event.data);
                    }
                };

                navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
            } else reject("Pas de service Worker?");
        })
    }

    //=====================================
    // inscrit un cookie
    //=====================================
    function _setCookie(cname, cvalue, exminutes) {
        var d = new Date();
        d.setTime(d.getTime() + (exminutes * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    //=====================================
    // recupère un cookie
    //=====================================
    function _getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    //=====================================
    // Inscrit le user
    //=====================================
    function _authenticate(user) {
        if (_getCookie(user) == "") { // Si jamais connecté on connecte
            _setCookie(user, "playing...", _connexionTime);
            return true;
        }
        return false;
    };

    //=====================================
    // Supprime le user
    //=====================================
    function _killAuthenticate(user) {
        if (_getCookie(user) != "") { // Si il existe on le supprime
            _setCookie(user, "", 0);
            return true;
        }
        return false;
    };

    //=====================================
    // ré-inscrit le user et test si pas
    // encore expirée
    //=====================================
    function _needAuthentication(user) {
        if (_getCookie(user) != "") { // Si il existe on relance
            _setCookie(user, "playing...", _connexionTime);
            return true;
        }
        return false;
    };

    //=====================================
    // Besoin de réseau ou pas ??
    //=====================================
    function _needReseau(reseau, callBackOnline, callBackOffline) {
        window.removeEventListener('online', function () {}, false);
        window.removeEventListener('offline', function () {}, false);

        if (reseau) { // On veut du réseau !! Rien ne fonctionnera sans ... Na!!
            if (!navigator.onLine) {
                _addWarningMessage("Réseau désactivé!");
                callBackOffline();
            }

            window.addEventListener('online', function () {
                _addWarningMessage("Réseau activé!");
                callBackOnline();
            }, false);

            window.addEventListener('offline', function (e) {
                _addWarningMessage("Réseau désactivé!");
                callBackOffline();
            }, false);
        }
    }

    //=====================================
    // Génération d'un identifiant unique
    //=====================================
    function _generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    //=====================================
    // Supprime un message
    //=====================================
    function _supAnyMessage(id) {
        var elem = document.getElementById(id);
        if (elem !== null) elem.parentNode.removeChild(elem);
    }

    //=====================================
    // Gere suppression des warnings automatiquement
    //=====================================
    function _gereWarning() {
        var now = Date.now();
        for (var w in listeWarning) {
            if (now - listeWarning[w].date > duration) {
                _supAnyMessage(listeWarning[w].id);
                listeWarning.splice(w, 1);
            }
        }
    }

    //=====================================
    // supprime tous les warnings
    //=====================================
    function _supprimeWarning() {
        for (var w in listeWarning) {
            _supAnyMessage(listeWarning[w].id);
        }
        listeWarning.splice(0);
    }

    //=====================================
    // Ajoute message d'erreur
    //=====================================
    function _addErrorMessage(msg) {
        var errorMessage = document.createElement("div");
        errorMessage.setAttribute("class", "error");
        var id = _generateUUID();
        errorMessage.setAttribute("id", id);
        errorMessage.innerHTML = msg;
        messsageZone.appendChild(errorMessage);
        listeWarning.push({
            'id': id,
            'date': Date.now()
        });
        return id;
    }

    //=====================================
    // Ajoute message de warning
    //=====================================
    function _addWarningMessage(msg) {
        var warningMessage = document.createElement("div");
        warningMessage.setAttribute("class", "warning");
        var id = _generateUUID();
        warningMessage.setAttribute("id", id);
        warningMessage.innerHTML = msg;
        messsageZone.appendChild(warningMessage);
        listeWarning.push({
            'id': id,
            'date': Date.now()
        });
        return id;
    }

    //=====================================
    // Ajoute message normal
    //=====================================
    function _addMessage(msg) {
        var message = document.createElement("div");
        message.setAttribute("class", "normal");
        var id = _generateUUID();
        message.setAttribute("id", id);
        message.innerHTML = msg;
        messsageZone.appendChild(message);
        listeWarning.push({
            'id': id,
            'date': Date.now()
        });
        return id;
    }

    //=====================================
    // mise à jour de la dureation ou du refresh
    //=====================================
    function _refreshWarning() {
        clearInterval(tempo);
        tempo = setInterval(_gereWarning, refresh);
    }

    //=====================================
    // Efface la zone des boutons
    //=====================================
    function _resetButtons() {
        _buttonsBloc = document.createElement("div");
        _buttonsBloc.setAttribute("class", "buttons");

        bb.style.display = "none";
        bb.removeEventListener('onClic', function () {}, false);
        ob.style.display = "none";
        ob.removeEventListener('onClic', function () {}, false);
    }

    //=====================================
    // Efface service de la page sortante
    //=====================================
    function _cleanServices(callBack) {
        _servicesToClean = callBack;
    }

    //=====================================
    // On a besoin d'un goBack
    //=====================================
    function _needGoBack(callBack) {
        bb.style.display = "inline";
        bb.setAttribute("onclick", callBack);
    }

    //=====================================
    // On a besoin d'une deconnexion
    //=====================================
    function _needOffButton(callBack) {
        ob.style.display = "inline";
        ob.setAttribute("onclick", callBack);
    }

    //=====================================
    // Ajoute un bouton dans la zone bouton
    //=====================================
    function _addButton(fonction, couleur, callBack, css) {
        var _b;
        _b = document.createElement("button");
        _b.setAttribute("class", "action-button shadow animate " + couleur + " " + css);
        _b.setAttribute("onclick", callBack);
        _b.innerHTML = fonction;
        return (_b);
    }

    //=====================================
    // Ajoute une image
    //=====================================
    function _addImage(url, css) {
        var _i;
        _i = document.createElement("img");
        _i.setAttribute("class", css);
        _i.setAttribute("src", url);
        return (_i);
    }

    //=====================================
    // Ajoute un radio bouton
    //=====================================
    function _addRadio(name, value, attributs) {
        var _r;
        _r = document.createElement("input");
        _r.setAttribute("type", "radio");
        _r.setAttribute("name", name);
        _r.setAttribute("value", value);

        for (key in attributs) _r.setAttribute(key, attributs[key]);
        return (_r);
    }

    //=====================================
    // Ajoute un check box
    //=====================================
    function _addCheckBox(attributs) {
        var _r;
        _r = document.createElement("input");
        _r.setAttribute("type", "checkbox");

        for (key in attributs) _r.setAttribute(key, attributs[key]);
        return (_r);
    }

    //=====================================
    // Ajoute une labelled check box
    //=====================================
    function _addLabelledCheckBox(name, attributs) {
        var _s, _s1;
        _s = document.createElement("span");
        _s1 = document.createElement("span");
        _s1.innerHTML = name;

        _s.appendChild(_addCheckBox(attributs));
        _s.appendChild(_s1);

        return (_s);
    }

    //=====================================
    // Ajoute input avec libellé
    //=====================================
    function _addLabelledInput(label, attributs) {
        var _d, _t, _i;
        _d = document.createElement("div");
        _d.setAttribute("class", "bdiv");

        _t = document.createElement("label");
        _t.setAttribute("class", "labelTitre");

        _t.innerHTML = label;
        _d.appendChild(_t);

        _i = document.createElement("input");
        _i.setAttribute("type", "text");
        _i.setAttribute("class", "myInput");

        for (key in attributs) {
            _i.setAttribute(key, attributs[key]);
        }
        _d.appendChild(_i);

        return _d;
    }

    //=====================================
    // Ajoute un a ref simple
    //=====================================
    function _addLink(nom, attributs) {
        var _d, _a;
        _d = document.createElement("div");
        _d.setAttribute("class", "bdiv");

        _a = document.createElement("a");
        //_a.setAttribute("class", "myInput");
        _a.innerHTML = nom;

        for (key in attributs) {
            _a.setAttribute(key, attributs[key]);
        }
        _d.appendChild(_a);

        return _d;
    }
    //=====================================
    // Ajoute une input simple
    //=====================================
    function _addInput(attributs) {
        var _d, _i;
        _d = document.createElement("div");
        _d.setAttribute("class", "bdiv");

        _i = document.createElement("input");
        _i.setAttribute("type", "text");
        _i.setAttribute("class", "myInput");

        for (key in attributs) {
            _i.setAttribute(key, attributs[key]);
        }
        _d.appendChild(_i);

        return _d;
    }

    //=====================================
    // Ajoute un select
    //=====================================
    function _addLabelledSelect(label, attributs) {
        var _d, _s, _l;
        _d = document.createElement("div");
        _d.setAttribute("class", "bdiv");

        _l = document.createElement("label");
        _l.setAttribute("class", "labelTitre");

        _l.innerHTML = label;
        _d.appendChild(_l);

        _s = document.createElement("select");
        _s.setAttribute("class", "myInput");

        for (key in attributs) {
            _s.setAttribute(key, attributs[key]);
        }
        _d.appendChild(_s);

        return _d;
    }

    //=====================================
    // affiche loading
    //=====================================
    function _loading(on) {
        if (on) {
            loading.style.visibility = "visible";
            waiting.style.visibility = "visible";
        } else {
            loading.style.visibility = "hidden";
            waiting.style.visibility = "hidden";
        }
    }

    function _addJson(type, url, data, retour) {
        var jsons = [];

        jsons.push({
            id: _generateUUID()
        });
    }

    //=====================================
    // ajoute un div lightBoxante...
    //=====================================
    function _addLB() {
        _d = document.createElement("div");
        _d.setAttribute("class", "lb lbHide");
        _d.setAttribute("id", "lb");

        body.insertBefore(_d, body.firstChild);
        _ligthBox = _d;
    }

    function _showLB() {
        _ligthBox.className = "lb lbShow";
    }

    function _hideLB() {
        _ligthBox.className = "lb lbHide";
    }

    //=====================================
    // ajoute une aide
    //=====================================
    function _getHelpButton(callBack) {
        var _d;

        _d = document.createElement("div");
        _d.setAttribute("class", "rounded");
        _d.setAttribute("id", "help");

        _d.setAttribute("onclick", callBack);
        _d.innerHTML = "?";

        return _d;
    }

    //=====================================
    // ajoute la popup
    //=====================================
    function _addPopUp() {
        var _d, _s, _sc, _a;
        _d = document.createElement("div");
        _d.setAttribute("class", "popUp c vcOut hc5");
        _d.setAttribute("id", "popUp");

        container.insertBefore(_d, container.firstChild);
        _popUp = _d;
    }

    function _showPopUp() {
        _showLB();
        _popUp.setAttribute("class", "popUp c vcIn hc5");
    }

    function _hidePopUp() {
        _hideLB();
        _popUp.setAttribute("class", "popUp c vcOut hc5");
    }

    //=====================================
    // Appel serveur en POST ou GET
    //=====================================
    function _callServer(type, url, data) {
        return new Promise(function (resolve, reject) {
            _loading(true);
            DODDLE.fetch.call(url, data, type)
                .then(function (data) {
                    _loading(false);
                    resolve(data);
                }).catch(function (error) {
                    _loading(false);
                    reject(error);
                });
        });
    }

    //===============================================================================
    //===============================================================================
    // Les actions par défaut
    //===============================================================================
    //===============================================================================
    // Mise en place du titre de la page
    titre.innerHTML = titrePage;

    // Par défaut le refresh des warnings est activée
    _refreshWarning();

    // on met à blanc le bloc boutons
    _resetButtons();

    // On cache le loading
    loading.style.visibility = "hidden";
    waiting.style.visibility = "hidden";

    // On vire le backButton
    bb.style.display = "none";
    ob.style.display = "none";

    // On ajoute la popUp et la lightBox
    _addPopUp();
    _addLB();
    _hideLB();

    //===============================================================================
    //===============================================================================
    // Fonctions publiques
    //===============================================================================
    //===============================================================================
    return {
        vm: new _ViewModel(),
        changeTitle: function (nouveauTitre) {
            titre.innerHTML = nouveauTitre;
        },
        authenticate: function (user) {
            return _authenticate(user);
        },
        killAuthenticate: function (user) {
            return _killAuthenticate(user);
        },
        needAuthentication: function (user) {
            return _needAuthentication(user);
        },
        sendMsg: function (msg) {
            return new Promise(function (resolve, reject) {
                _sendMsg(msg)
                    .then(function (r) {
                        resolve(r);
                    })
                    .catch(function (e) {
                        reject(e);
                    });
            });
        },
        addHelp: function (callBack, url, css) {
            var _d, _i;

            if (css === "undefined") css = "hc50";
            _d = _getHelpButton(callBack);
            _d.setAttribute("class", "fixed rounded " + css);

            return _d;
        },
        getHelp: function (callBack, css) {
            var _d;

            _d = _getHelpButton(callBack);
            _d.setAttribute("class", "rounded " + css);

            return _d;
        },
        showPopUp: _showPopUp,
        hidePopUp: _hidePopUp,
        addPopUpContainer: function (content) {
            _popUp.appendChild(content);
        },
        clearPopUp: function () {
            _popUp.innerHTML = "";
        },
        giveMeUUID: _generateUUID,
        needGoBack: _needGoBack,
        needOffButton: _needOffButton,
        loadingOn: function () {
            _loading(true);
        },
        loadingOff: function () {
            _loading(false);
        },
        addJsons: function (type, url, data, retour) {
            _addJson(type, url, data, retour);
        },
        getJson: function () {
            _read();
        },
        waitJson: function () {
            _waitJson();
        },
        callServer: function (url, data) {
            return new Promise(function (resolve, reject) {
                _callServer("get", url, data)
                    .then(function (r) {
                        resolve(r);
                    })
                    .catch(function (e) {
                        reject(e);
                    });
            });
        },
        callServerPost: function (url, data) {
            return new Promise(function (resolve, reject) {
                _callServer("post", url, data)
                    .then(function (r) {
                        resolve(r);
                    })
                    .catch(function (e) {
                        reject(e);
                    });
            });
        },
        clearButtons: _resetButtons,
        addLink: _addLink,
        addCheckBox: _addCheckBox,
        addLabelledCheckBox: _addLabelledCheckBox,
        addRadio: _addRadio,
        addInput: _addInput,
        addLabelledInput: _addLabelledInput,
        addLabelledSelect: _addLabelledSelect,
        getButtons: function () {
            return _buttonsBloc;
        },
        addButtonsBloc: function () {
            page.append(_buttonsBloc);
        },
        addImage: _addImage,
        createActionButton: function (fonction, callBack) {
            return (_addButton(fonction, "action", callBack, "quatrevingt"));
        },
        createValidationButton: function (fonction, callBack) {
            return (_addButton(fonction, "green", callBack, "cinquante"));
        },
        createAnnulationButton: function (fonction, callBack) {
            return (_addButton(fonction, "red", callBack, "cinquante"));
        },
        addValidationButton: function (fonction, callBack) {
            _buttonsBloc.appendChild(_addButton(fonction, "green", callBack, "cinquante"));
        },
        addAnnulationButton: function (fonction, callBack) {
            _buttonsBloc.appendChild(_addButton(fonction, "red", callBack, "cinquante"));
        },
        addSimpleButton: function (fonction, callBack) {
            _buttonsBloc.appendChild(_addButton(fonction, "blue", callBack, "cinquante"));
        },
        addPlusButton: function (fonction, callBack) {
            _buttonsBloc.appendChild(_addButton(fonction, "yellow", callBack, "cinquante"));
        },
        addToPage: function (elem) {
            page.append(elem);
        },
        loadPage: function (elem) {
            page.innerHTML = elem;
        },
        clearPage: function () {
            _servicesToClean();

            _resetButtons();
            _supprimeWarning();
            page.innerHTML = ""; // Suppression de l'intérieur de la page
        },
        servicesToClean: _cleanServices,
        needReseau: _needReseau,
        gestionAutoWarning: function (auto) {
            if (auto === true) {
                tempo = setInterval(_gereWarning, duree);
            } else {
                clearInterval(tempo);
            }
        },
        setDurationWarning: function (temps) {
            duration = temps;
            _refreshWarning();
        },
        setRefreshWarning: function (temps) {
            refresh = temps;
            _refreshWarning();
        },
        addErrorMessage: _addErrorMessage,
        supAnyMessage: _supAnyMessage,
        addWarningMessage: _addWarningMessage,
        addMessage: _addMessage
    };
}
