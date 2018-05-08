function gameObjects() {
    var gift = new clsSprite();
    var goal = false;
    var nb, max;
    var obj;

    this.init = function (nbObj) {
        obj = $('#oBox');

        obj.removeClass("goalOk");

        gift.set(myLoader.getRessource("giftToCollect"));
        gift.add("position1", 50, 50, [{
            x: 0,
            y: 0,
            nb: 19
        }], 1);
        gift.setCenter(25, 25);
        gift.setGlobalAnim(true);
        goal = false;
        nb = 0;
        max = nbObj;
        this.setScore(0);
    }

    this.setScore = function (n) {
        obj.text(n + "/" + max);
    }

    /*    this.goalReached = function () {
            if (!goal) {
                if (objects.length <= 0) {
                    obj.addClass("goalOk");
                    goal = true;
                    return true;
                }
            }
            return false;
        }*/

    /*    this.blit = function (context, dX, dY) {
            var coords = [];
            for (var objectIdx in objects) {
                gift.drawXY(context,
                    "position1",
                    dX * objects[objectIdx].x + dX / 2,
                    dY * objects[objectIdx].y + dY / 2,
                    1);
                coords.push({
                    x: objects[objectIdx].x,
                    y: objects[objectIdx].y
                });
            }
            gift.globalAnim();
            return coords;
        }*/

    /*    this.getOrNot = function (x, y) {
            for (var objectIdx in objects) {
                if (objects[objectIdx].x == x && objects[objectIdx].y == y) {
                    nb++;
                    setScore();
                    objects.splice(objectIdx, 1);
                    break;
                }
            }
        }*/
}
