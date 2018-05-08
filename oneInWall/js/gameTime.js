function gameTime() {
    var startTime, time, goal = false,
        limit = 0;

    this.go = false;

    function place() {
        // On ajoute la zone
        time = $("#time");
    }

    this.show = function () {
        time.addClass("vcIn");
        time.removeClass("vcOut");
    }

    this.hide = function () {
        time.removeClass("vcIn");
        time.removeClass('timeGoal');
        time.removeClass('timeOut');
        time.addClass("vcOut");
    }

    this.init = function () {
        this.show();
        // Init des valeurs de comptages
        startTime = Date.now();
        goal = false;
        limit = 0;
        this.go = false;
    }

    this.setCounterTime = function (inputLimit) {
        var t = inputLimit.split(":");
        var min = parseInt(t[0]);
        var sec = parseInt(t[1]);
        limit = (sec + 1) * 1000 + (min * 60 * 1000);
    }

    this.timeGoal = function () {
        if (!goal) {
            time.addClass('timeGoal');
            goal = true;
        }
    }

    function timeOut() {
        if (!goal) {
            time.addClass('timeOut');
            DODDLE.messages.add('Plus de temps');
            time.text("0:00");
            goal = true;
        }
    }

    this.isEndOfTime = function () {
        if ((startTime + limit) <= Date.now()) {
            timeOut();
            return true;
        } else return false;
    }

    this.update = function () {
        if (!this.go) startTime = Date.now();

        var times;
        if (limit != 0)
            times = new Date((startTime + limit) - Date.now());
        else
            times = new Date(Date.now() - (startTime + limit));
        var min = "00" + times.getSeconds();
        time.text(times.getMinutes() + ":" + min.substring(min.length - 2));
    }

    place();
}
