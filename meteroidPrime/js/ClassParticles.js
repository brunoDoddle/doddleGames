class Particle {
    constructor() {
        this.x = 0;
        this.oX = 0;
        this.vx = 0;
        this.y = 0;
        this.oY = 0;
        this.vy = 0;
        this.scale = 1;
        this.speed = 3;
        this.speedRotate = 0;
        this.rotate = 0;
    }

    update(ctx) {
        this.x += this.speed * this.vx;
        this.y += this.speed * this.vy;
        this.color *= 2;

        if (this.x > ctx.canvas.width || this.x < 0 || this.y > ctx.canvas.height || this.y < 0) {
            this.x = this.oX;
            this.y = this.oY;
            this.color = 1;
            this.speed = clsParticle.randomFloat(3, 10);
            this.scale = clsParticle.randomFloat(1, 3);
        }

        this.speed += .5;
        this.scale += .2;
    }
}

class clsParticle {
    constructor() {
        this.particles = [];
        this.ctx = undefined;

    }


    init(context) {
        this.particles = [];
        this.ctx = context;
    }

    createSky(x, y) {
        var count = 50;

        for (var angle = 0; angle < 360; angle += Math.round(360 / count)) {
            var particle = new Particle();

            particle.x = x;
            particle.oX = x;
            particle.y = y;
            particle.oY = y;
            particle.scale = clsParticle.randomFloat(1, 3);
            particle.speedRotate = clsParticle.randomFloat(1, 15);
            particle.speed = clsParticle.randomFloat(3, 10);
            particle.color = 1;

            var speed = clsParticle.randomFloat(1, 2);

            particle.vx = speed * Math.cos(angle * Math.PI / 180.0);
            particle.vy = speed * Math.sin(angle * Math.PI / 180.0);

            this.particles.push(particle);
        }

    }

    static randomFloat(min, max) {
        return min + Math.random() * (max - min);
    }


    update() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.particles.forEach(particle => {
            particle.update(this.ctx);

            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotate);
            particle.rotate += particle.speedRotate;

            this.ctx.fillStyle = "rgba(" + particle.color + "," + particle.color + "," + particle.color + ",1)";
            this.ctx.fillRect(0 - particle.scale / 2, 0 - particle.scale / 2, particle.scale, particle.scale);
            this.ctx.restore();
        })
    }
}
