DODDLE.strasWar = {
    customMap: [
        {
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f2dda2"
      }
    ]
  },
        {
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
      }
    ]
  },
        {
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#523735"
      }
    ]
  },
        {
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "color": "#f5f1e6"
      }
    ]
  },
        {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#c9b2a6"
      }
    ]
  },
        {
            "featureType": "administrative.land_parcel",
            "stylers": [
                {
                    "visibility": "off"
      }
    ]
  },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#dcd2be"
      }
    ]
  },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#ae9e90"
      }
    ]
  },
        {
            "featureType": "administrative.neighborhood",
            "stylers": [
                {
                    "visibility": "off"
      }
    ]
  },
        {
            "featureType": "landscape.natural",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#dfd2ae"
      }
    ]
  },
        {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#dfd2ae"
      }
    ]
  },
        {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#93817c"
      }
    ]
  },
        {
            "featureType": "poi.park",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#41e252"
      }
    ]
  },
        {
            "featureType": "poi.park",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#1b6f24"
      }
    ]
  },
        {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#447530"
      }
    ]
  },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f5f1e6"
      }
    ]
  },
        {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#fdfcf8"
      }
    ]
  },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f8c967"
      }
    ]
  },
        {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#dc8f5d"
      }
    ]
  },
        {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#8a531a"
      },
                {
                    "weight": 3
      }
    ]
  },
        {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#e98d58"
      }
    ]
  },
        {
            "featureType": "road.highway.controlled_access",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "color": "#db8555"
      }
    ]
  },
        {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#806b63"
      }
    ]
  },
        {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#dfd2ae"
      }
    ]
  },
        {
            "featureType": "transit.line",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#8f7d77"
      }
    ]
  },
        {
            "featureType": "transit.line",
            "elementType": "labels.text.stroke",
            "stylers": [
                {
                    "color": "#ebe3cd"
      }
    ]
  },
        {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#dfd2ae"
      }
    ]
  },
        {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [
                {
                    "color": "#5097d6"
      }
    ]
  },
        {
            "featureType": "water",
            "elementType": "geometry.stroke",
            "stylers": [
                {
                    "visibility": "off"
      }
    ]
  },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#92998d"
      }
    ]
  }
]
};

DODDLE.strasWar = {
    version: "v1.5",
    test: false, // Foncionnalités utiles pour tester
    default_color: "#333333",
    map: null,
    survId: null,
    options: {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 2000
    },
    marker: null,
    page: null,
    war: {
        id: null,
        name: null,
        turn: 0,
        endTurn: 0
    },
    clan: null, // Le clan courant
    clans: [], // La liste des clans de la war
    zones: [], // Les zones du jeux
    tours: [], // Les tours présentent sur le jeux, mais pour quoi faire ???
    bounds: {}, // Mais pourquoi ai-je besoin des bounds dans srasWAr ???
    position: {}, // Position récupéré du GPS pour positionner l'armée sur la région
    infoPos: "", // Texte de position sur la carte
    joueur: {
        uuid: 0,
        name: "",
        userid: "",
        color: undefined,
        score: 0,
        fini: false, // Plus rien à faire, tour fini
        unites: [], // Lu par un getUnites
        maxUnites: 0 // Règle gérer au serveur
    },
    mapOptions: {
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scaleControl: false,
        streetViewControl: false,
        disableDoubleClickZoom: true,
        panControl: false,
        clickableIcons: false,
        styles: DODDLE.strasWar.customMap, // NOTE: Définit au dessus et ça marche, la javascript c'est magique...
        options: {
            disableDefaultUI: true,
            draggable: false,
            minZoom: 5,
            maxZoom: 19,
            scrollwheel: false,
            noClear: true
        },
    },
    ctrl_mod: undefined,
    ctrl_add: undefined,
    markerCible: undefined, // Marker choisi (pour supp ou modif)
    nbUnites: 0 // Interface affichage nbr unites..
};
