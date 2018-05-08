function messages() {
    var msgs = [];

    $('#bigMsg').removeClass('vcInFade');
    $('#bigMsg').empty();

    this.init = function () {
        msgs = [{
            time: -1
        }, {
            time: -1
        }, {
            time: -1
        }];
        for (var msgIdx in msgs) {
            $('#msg' + msgIdx).removeClass('vcInFade');
            $('#msg' + msgIdx).empty();
        }
        $('#bigMsg').removeClass('vcInFade');
        $('#bigMsg').empty();
    }

    this.add = function (msg) {
        for (var msgIdx in msgs) {
            if (msgs[msgIdx].time == -1) {
                msgs[msgIdx].time = 100;
                $('#msg' + msgIdx).addClass('vcInFade');
                $('#msg' + msgIdx).text(msg);
                break;
            }
        }
    }

    //FIXME: Ne marche que si le message à été mis à blanc avant... (empty) .. Mouerf... Depends on navigateur ??
    this.addBigMsg = function (msg) {
        $('#bigMsg').removeClass('vcInFade');
        $('#bigMsg').addClass('vcInFade');
        $('#bigMsg').text(msg);
    }

    this.update = function () {
        // Gestion de la pile de messages
        for (var msgIdx in msgs) {
            if (msgs[msgIdx].time > 0) msgs[msgIdx].time--;
            else {
                if (msgs[msgIdx].time > -1) {
                    $('#msg' + msgIdx).removeClass('vcInFade');
                    $('#msg' + msgIdx).empty();
                    msgs[msgIdx].time = -1;
                }
            }
        }
    }
}
