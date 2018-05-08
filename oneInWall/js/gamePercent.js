function gamePercent() {
    var percent, percentBar, percentText, percent2Win;
    var current = 0,
        max = 0;
    var done = false;

    function place() {
        // On ajoute la zone
        percent = $("#percent");
        percentBar = $("#percentBar");
        percentText = $("#percentText");
    }

    this.init = function () {
        percentBar.removeClass("percentBarOk");
        this.show();
        // Init des valeurs de comptages
        current = 0;
        max = 0;
        // et reset de la zone de remplissage
        percentText.text("0%");
        percentBar.width("0%");
        done = false;
    }

    this.setPercent2Win = function (value) {
        percent2Win = value;
    }

    this.show = function () {
        percent.addClass("vcIn");
        percent.removeClass("vcOut");
    }

    this.hide = function () {
        percent.removeClass("vcIn");
        percent.addClass("vcOut");
    }

    this.setMax = function (value) {
        max = value;
    }

    this.testNoCase = function (nb) {
        if (nb == 1)
            return true;
        return false;
    }

    this.maj = function (nb) {
        var result = Math.round((max - nb) / max * 100);
        percentText.text(result + "%");
        percentBar.width(result + "%");
        if (result >= parseInt(percent2Win) && !done) {
            percentBar.addClass("percentBarOk");
            DODDLE.messages.add('Cubes OK!')
            done = true;
            return true;
        }
        return false;
    }

    place();
}
