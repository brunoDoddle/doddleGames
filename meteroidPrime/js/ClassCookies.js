//FIXME: Problème, parfois cookie vidé ??? Pourquoi ??? 
function clsCookies() {
    var _this = this;
    // Mouerf voir pour la durée...
    this.put = function (name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        } else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=" + window.location.pathname;
    }

    this.get = function (name) {
        return new Promise(function (resolve, reject) {

            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i].trim();
                if (c.indexOf(nameEQ) == 0) {
                    resolve(c.substring(nameEQ.length, c.length));
                }
            }
            reject(null);
        })
    }

    this.erase = function (name) {
        _this.set(name, "", -1);
    }
}
