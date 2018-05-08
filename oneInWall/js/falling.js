function falling() {
    var fall = false, noFall = false;
    var vx, vy, angle = 0;
    var xt, yt,taille = 1;

    this.init = function () {
        fall = false;
        taille = 1;
        angle = 0;
        noFall = false;
    }

    this.start = function (x,y,acceleration) {
        vx = acceleration.x*2/3;
        vy = acceleration.y*2/3;
		angle = -(Math.atan2(acceleration.y,acceleration.x)+Math.PI/2);
        xt = x - vx;
        yt = y + vy;
        fall = true;
    }

    this.update = function (ctx,joueur) {
        if (fall) {
            ctx.save();
            ctx.translate(xt, yt)
            ctx.rotate(angle);
	        joueur.drawXY(ctx, "avance", 0, 0, taille);
            ctx.restore();
            xt -= vx;
            yt += vy;
            taille -= .1;
            if (taille <= 0) fall = false;
			vx = vx * .8;
			vy = vy * .8;
		}
    }
}
