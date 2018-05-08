// Mouerf,ça perd un peu de son charme un classe JS...les this partout j'aime pas...
class clsRange {
    constructor(context) {
        this.ctx = context;
        this.x = 10;
        this.ecart = 0;
        this.marge = 150;
        this.height = context.canvas.height - this.marge;
        this.width = 6;
    }

    init(distanceToWin) {
        this.ecart = this.height / distanceToWin;
    }

    update(y) {
        this.ctx.fillStyle = "rgba(255,255,255,.2)";
        this.ctx.fillRect(
            this.x, this.marge / 2,
            this.width, this.ctx.canvas.height - this.marge
        );

        this.ctx.fillStyle = "rgba(255,0,0,.5)";
        this.ctx.fillRect(
            this.x, this.ctx.canvas.height - (this.marge / 2) - (y * this.ecart),
            this.width, (y * this.ecart)
        );
    }
}


/*
function clsRange(context) {
    var ctx = context;
    var x = 10,
        width = 6,
        ecart = 0;
    var marge = 150;
    var height = context.canvas.height - marge;

    this.init = function (distanceToWin) {
        ecart = height / distanceToWin;
    }

    this.update = function (y) {
        ctx.fillStyle = "rgba(255,255,255,.2)";
        ctx.fillRect(
            x, marge / 2,
            width, context.canvas.height - marge
        );
        ctx.fillStyle = "rgba(255,0,0,.5)";
        ctx.fillRect(
            x, context.canvas.height - (marge / 2) - (y * ecart),
            width, (y * ecart)
        );
    }
}*/
