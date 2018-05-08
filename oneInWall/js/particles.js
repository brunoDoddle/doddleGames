function Particle() {
    var particles = [];

    this.init = function () {
        particles = [];
    }

    function Particle() {
        this.x = 0;
        this.vx = 0;
        this.y = 0;
        this.vy = 0;
        this.scale = 3;
        this.speed = 10;
        this.speedRotate = 0;
        this.rotate = 0;
        this.alive = true;
        var color = getRandomColor();

        this.update = function (map, dx, dy) {
            if (this.speed < 0) this.alive = false;
            var x = Math.round((this.x + this.speed * this.vx - dx / 2) / dx);
            var y = Math.round((this.y + this.speed * this.vy - dy / 2) / dy);
            var left = Math.round((this.x - this.scale / 2 + this.speed * this.vx - dx / 2) / dx);
            var right = Math.round((this.x + this.scale / 2 + this.speed * this.vx - dx / 2) / dx);
            var top = Math.round((this.y - this.scale / 2 + this.speed * this.vy - dy / 2) / dy);
            var bottom = Math.round((this.y + this.scale / 2 + this.speed * this.vy - dy / 2) / dy);

            if (this.alive) {
                /*
                                if (this.y < 0 || this.y > ) {
                                    this.vy = -this.vy;
                                }

                                if (map[y][left] == 1 || map[y][right] == 1) {
                                    this.vx = -this.vx;
                                }*/
                this.x += this.speed * this.vx;
                this.y += this.speed * this.vy;

                this.speedRotate -= 0, 2;
                this.speed -= .5;
            } else {
                this.speedRotate = 0;
            }
        }

        this.draw = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotate);
            this.rotate += this.speedRotate;

            ctx.fillStyle = color;
            ctx.fillRect(0 - this.scale / 2, 0 - this.scale / 2, this.scale, this.scale);
            ctx.restore();
        }
    }

    this.createExplosion = function (x, y) {
        var count = 30;

        for (var angle = 0; angle < 360; angle += Math.round(360 / count)) {
            var particle = new Particle();

            particle.x = x;
            particle.y = y;
            particle.scale = randomFloat(5, 20);
            particle.speedRotate = randomFloat(1, 15);
            particle.speed = randomFloat(10, 15);

            var speed = randomFloat(1, 2);

            particle.vx = speed * Math.cos(angle * Math.PI / 180.0);
            particle.vy = speed * Math.sin(angle * Math.PI / 180.0);

            particles.push(particle);
        }

        function randomFloat(min, max) {
            return min + Math.random() * (max - min);
        }
    }


    this.update = function (context2D, map, dx, dy) {
        // update and draw particles
        for (var i = 0; i < particles.length; i++) {
            var particle = particles[i];

            particle.update(map, dx, dy);
            particle.draw(context2D);
        }
    }
}
