function clsBoum(context) {
    var bam = myLoader.getRessource("boum");
    var listBoum = [];
    var nullableBoum = [];
    var ctx = context;
    var width = 100,
        height = 100;
    var maxAnim = 70;

    this.init = function () {
        listBoum = [];
        nullableBoum = [];
    }

    this.add = function (x, y, size) {
        if (size == undefined) size = 2;
        listBoum.push({
            x: x,
            y: y,
            cptAnim: 0,
            size: size
        });
    }

    this.update = function () {
        listBoum.forEach(boum => {
            ctx.save();
            ctx.translate(boum.x, boum.y);
            ctx.globalCompositeOperation = "soft-light";
            ctx.drawImage(bam, Math.round(boum.cptAnim) * width, 0, width, height, (-width / 2) * boum.size, (-height / 2) * boum.size, width * boum.size, height * boum.size);
            ctx.restore();
            boum.cptAnim += 2;
            if (boum.cptAnim > maxAnim) nullableBoum.push(boum);
        })
    }

    this.killDeadBoum = function () {
        nullableBoum.forEach(toKill => {
            var i = listBoum.indexOf(toKill);
            if (i != -1) listBoum.splice(i, 1)
        })
        nullableBoum = [];
    }

}
