function clsSound() {
    var contexteAudio;
    var listeDeSon = [];

    // FONCTION_PRIVEE region
    function search(id) {
        var sonTrouve = listeDeSon.find(function (son) {
            return son.id === id;
        });
        return sonTrouve != undefined ? sonTrouve.source : sonTrouve;
    }

    function searchIndex(id) {
        var sonTrouve = listeDeSon.findIndex(function (son) {
            return son.id === id;
        });
        return sonTrouve;
    }

    function supprime(id) {
        var index = searchIndex(id);
        listeDeSon.splice(index, 1);
    }

    function ajoute(id, source) {
        listeDeSon.push({
            "id": id,
            "source": source
        });
    }
    // endregion

    // FONCTION_PUBLIQUE region
    this.clear = function () {
        // On stop les sons existant
        listeDeSon.forEach(son => {
            son.source.stop();
        })
        // Et on met la liste à blanc
        listeDeSon = [];
    }

    this.init = function (contexte) {
        if (contexte == undefined) {
            contexteAudio = new(window.AudioContext || window.webkitAudioContext)(); // définition du contexte audio
            return contexteAudio
        } else contexteAudio = contexte;

        this.clear();
    }

    // Methode de play interne
    function playSound(id, volume) {
        if (volume == undefined) volume = 1;

        var gainVolume = contexteAudio.createGain();
        var source = contexteAudio.createBufferSource();
        var flux = myLoader.getRessource(id);
        source.buffer = flux;

        source.connect(gainVolume);
        gainVolume.connect(contexteAudio.destination);
        gainVolume.gain.value = volume;

        source.start(0);

        return source;
    }

    // N'est joué qu'une fois
    this.playOnce = function (id, volume) {
        playSound(id, volume);
    }

    // Peut-être contrôlé avec un stop
    this.play = function (id, volume) {
        source = search(id);

        // Si le son n'existe pas on le cré
        if (source == undefined) {
            var sonSource = playSound(id, volume);
            ajoute(id, sonSource);

            // Se supprime tout seul à la fin...
            sonSource.onended = function (e) {
                // Normalement le son est fini, reste à le supprimer de la liste
                supprime(id);
            }
            return sonSource;
        }
        return source;
    }

    // Attention necessite un stop !
    this.playLoop = function (id, volume) {
        var sonSource = playSound(id, volume);
        sonSource.loop = true;
        ajoute(id, sonSource);
    }

    this.stop = function (id, volume) {
        source = search(id);
        if (source != undefined) {
            source.stop();
            supprime(id);
        };
    }
    // endregion
}
