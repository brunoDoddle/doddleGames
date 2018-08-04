#!/usr/bin/env python
# -*- coding: latin-1 -*-
import os
import os.path
import jinja2
import webapp2
import logging
import json
import uuid
import yaml
import sys
import datetime
import hashlib
import base64
from io import BytesIO
import struct

from PIL import Image, ImageChops, ImageOps

from tools import *

from google.appengine.ext import ndb
from google.appengine.ext.webapp import template

############################################################################
############################################################################
### Modifications à faire
############################################################################
############################################################################
# TODO: Gérer l'elimination d'un clan... oui faudrait le faire :-)
#
############################################################################
############################################################################

class dbWar(ndb.Model):
    nom = ndb.StringProperty()
    started = ndb.BooleanProperty(default=False)
    turn =  ndb.IntegerProperty(default=0)
    endTurn =  ndb.IntegerProperty(default=10)

    @classmethod
    def chercheNom(cls,nom):
        return cls.query(cls.nom==nom)

    @classmethod
    def all(cls):
        return cls.query().order(-cls.nom)

class dbClan(ndb.Model):
    # dbWar sera son ancetre
    nom = ndb.StringProperty()
    couleur = ndb.StringProperty()
    alive = ndb.BooleanProperty(default=True) # permet de savoir si le clan est encore actif

    @classmethod
    def chercheNomClan(cls, nom):
        return cls.query(cls.nom==nom)

    @classmethod
    def listeClan(cls, ancestor_key):
        # TODO: Utiliser alive pour savoir si clan en vie ou pas..
        return cls.query(ancestor=ancestor_key).order(cls.nom)

class dbUser(ndb.Model):
    # dbClan sera son ancetre
    userId = ndb.StringProperty()
    nom = ndb.StringProperty()
    mdp = ndb.StringProperty()
    connected = ndb.BooleanProperty(default=False)
    score = ndb.IntegerProperty(default=0)

    lastModified = ndb.DateTimeProperty(auto_now=True) # La date au cas ou historisation

    @classmethod
    def chercheUserId(cls, userId):
        return cls.query(cls.userId==userId)

    @classmethod
    def listeUsers(cls, ancestor_key):
        return cls.query(ancestor=ancestor_key).order(cls.userId)

"""Sauvegarde de l'état précédent de la map complète
    Le json contient l'uuid de la zone et sa couleur en direct
"""
class dbHistory(ndb.Model):
    etat = ndb.JsonProperty()        # json uuid de zone + couleur


class dbZone(ndb.Model):
    # ancetre = war
    geographie = ndb.JsonProperty()     # Sa forme et dans les infos en dur...
    nom = ndb.StringProperty()          # Le nom
    centre = ndb.StringProperty()
    clan = ndb.KeyProperty(kind=dbClan)            # le clan, et surtout sa couleur :-)
    voisins = ndb.StringProperty(repeated=True)    # la liste de voisin
    tour = ndb.IntegerProperty()         # le style de tour sur la zone , utilité ??

    @classmethod
    def compteTour(cls, clan):
        return cls.query(cls.clan==clan,cls.tour==1).count()

    @classmethod
    def deleteAll(cls, ancestor_key):
        toDel = cls.query(ancestor=ancestor_key).fetch()
        for d in toDel:
            d.key.delete()

    @classmethod
    def listeZones(cls, ancestor_key):
        return cls.query(ancestor=ancestor_key)

    @classmethod
    def chercheNom(cls, nom):
        return cls.query(cls.nom == nom)

# devient la liste des événement arrivée durant les tours
class dbEventResult(ndb.Model):
    # ancetre = war
    event = ndb.StringProperty(choices=['war', 'revolt', 'sickness'])
    zone = ndb.KeyProperty(kind=dbZone) # Ou se passe la bagarre
    previousClan = ndb.KeyProperty(kind=dbClan) # Le proprio precedent
    winnerClan = ndb.KeyProperty(kind=dbClan) # Qui l'a gagne
    #participants = ndb.KeyProperty(kind=dbUser,repeated=True) # La liste des participants
    timestamp = ndb.DateTimeProperty(auto_now_add=True) # La date au cas ou historisation
    zonesHistory = ndb.KeyProperty(kind=dbHistory)  # Historique de la zone (couleur et précédent proprio) -> utilité previousClan ???
    tour = ndb.IntegerProperty()    # Le tour quand est arrivée l'event

    timeLine = ndb.JsonProperty()        # la timeline principale de l'animation

    @classmethod
    def selectConcerned(cls, user_key):
        return cls.query(cls.participants == user_key).order(-cls.timestamp).fetch()

    @classmethod
    def deleteAll(cls, ancestor_key):
        toDel = cls.query(ancestor=ancestor_key).fetch()
        for d in toDel:
            d.key.delete()

    """Récupère les 1à derniers événements"""
    @classmethod
    def selectLast(cls, ancestor_key):
        return cls.query(ancestor=ancestor_key).order(-cls.tour).fetch(10)

class dbUnite(ndb.Model):
    # son ancetre = pas d'ancetre
    modele = ndb.IntegerProperty()
    strategie = ndb.IntegerProperty()
    user = ndb.KeyProperty(kind=dbUser)            # le user qui la pose avec son ancetre clan
    clan = ndb.ComputedProperty(lambda self: self.user.parent())
    zone = ndb.KeyProperty(kind=dbZone)            # la zone ou elle est pose
    position = ndb.JsonProperty()
    timestamp = ndb.DateTimeProperty(auto_now=True) # timeStamp de modification (!= auto_now_add)

    @classmethod
    def unitesSurZone(cls, zone):
        unites =  cls.query(cls.zone==zone).order(cls.timestamp).fetch()
        for u in unites:     # Une fois recuperes on les supprimes
            u.key.delete()
        return unites

    @classmethod
    def uniteDuUser(cls, user):
        return cls.query(cls.user==user)

    @classmethod
    def uniteDuClan(cls, clan):
        return cls.query(cls.clan==clan).fetch()

    @classmethod
    def chercheParKey(cls, key):
        return cls.query(cls.key==key).get()


jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

#############################################################################
# VARIABLE de travail
#############################################################################
joueurs = []
TIME_OUT = 11 # Une minute plus longue que le cookies
DEFAULT_COL = "#333333"

def hex2rgb(col):
    h = col.lstrip('#')
    rgb = tuple(int(h[i:i+2], 16) for i in (0, 2 ,4))
    return rgb

def tint_image(src, color="#FFFFFF"):
    src.load()
    r, g, b, alpha = src.split()
    gray = ImageOps.grayscale(src)
    result = ImageOps.colorize(gray, (0, 0, 0, 0), color) 
    result.putalpha(alpha)
    return result

def giveMeColouredSprite(path,size,index,tint_color, start=(0,0)):
    buffered = BytesIO()
    sprite = Image.new('RGBA',(size[0],size[1]))
    color = Image.new('RGBA',(size[0],size[1]))

    path = os.path.join(os.path.dirname(__file__), path)
    img = Image.open(path)

    sprite.paste(img,(-(start[0]+size[0]*index[0]),-start[1]))

    color = img.crop(
        (start[0]+size[0]*index[0],
        start[1]+size[1],
        start[0]+size[0]*(index[0]+1),
        start[1]+size[1]*2)
    )
    
    color = tint_image(color,tint_color)

    sprite.paste(color,(0,5),mask=color)
    sprite.save(buffered, format="PNG")
    str = base64.b64encode(buffered.getvalue())
    return str

def searchTower(zone,zones,tower,zoneList):
    # On sauve le caln initiale
    clan = zone.clan
    zone.done = True
    zoneList.append(zone)

    #logging.info("searchTower>" +zone.nom)
    # A-t'on un tour ?
    if zone.tour == 1:
        tower = True

    #logging.info("y a til un voisin ?")
    # On cherche si il y'a un voisin du meme clan
    for voisin in zone.voisins:
        zoneVoisine = searchZoneInfo(voisin,zones)
        #logging.info("teste le voisin " + zoneVoisine.nom)
        # Si du meme clan est pass encore traité
        if zoneVoisine.clan == clan and zoneVoisine.done == False:
            #logging.info("oui !")
            tower = tower | searchTower(zoneVoisine,zones,tower,zoneList)
        #else:
            #logging.info("non !")

    # On a fait tou les voisins, on espère avoir trouvé une tour.
    return tower

"""Recherche la zone voisine données"""
def searchZoneInfo(voisin,zones):
    for zone in zones:
        if zone.key.urlsafe() == voisin:
            return zone
    return dbZone()

"""Sauve l'état de la carte complet"""
def sauveHistorique(zones):
    history = []

    # On sauvegarde forcement les etats des zones avants
    for zone in zones:
        clan = zone.clan
        if clan != None:
            couleur = clan.get().couleur
        else:
            couleur = DEFAULT_COL

        history.append(
            {
                "uuid": zone.key.urlsafe(),
                "color": couleur
            }
        )
        h = dbHistory()
        h.etat = history
        return h.put()  # On sauvegarde l'historique des zones avants combats


#############################################################################
# INIT
#############################################################################
class main(webapp2.RequestHandler):
    def get(self):
        logging.info("Demarrage")
        template = jinja_environment.get_template('strasWar/index.html')

        results = dbWar.all().fetch()

        # A virer un jour
        if len(results) == 0 :
            init(self)
        else:
            logging.info("Base deja initialisee")

        self.response.out.write(template.render())

class editor(webapp2.RequestHandler):
    def get(self):
        template = jinja_environment.get_template('strasWar/editor.html')
        self.response.out.write(template.render())

def init(self):
        logging.info("initialisation")

        war = dbWar()
        war.nom = "Wacken'War"
        war.titre = "La guerre du mutMut"
        warKey = war.put()

        folder = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(folder, 'strasWar/data/wackenWar.yaml')
        with open(file_path, 'r') as stream:
            try:
                data = yaml.load(stream)
            except yaml.YAMLError as exc:
                logging.info(exc)

        logging.info("Creation clan:")
        for clan in data["clan"]:
            logging.info(">>" + clan)
            c = dbClan(parent=warKey)
            c.nom = clan
            c.couleur = data["clan"][clan]["couleur"]
            c.put()

        logging.info("Creation zone:")
        for zone in data["zones"]:
            logging.info(">>" + zone)
            z = dbZone(parent=warKey)
            z.nom = zone
            z.clan = None
            z.tour = data["zones"][zone]['tour']
            z.geographie = data["zones"][zone]['geographie']
            z.voisins = [] # data["zones"][zone]['voisins']
            if ('clan' in data["zones"][zone]):
                logging.info("----->clan:" + data["zones"][zone]['clan'])
                clan = dbClan.chercheNomClan(data["zones"][zone]['clan']).fetch(1)
                if len(clan) > 0 :
                    logging.info("------->trouve!"+clan[0].nom)
                    z.clan = clan[0].key
            z.put()

"""Récupère les zones d'une war et cherche si région séparé d'un chateau -> devient neutre"""
class revolt(webapp2.RequestHandler):
    def get(self):
        logging.info("revolt")
        # J'ai toute les guerres
        wars = dbWar.all().fetch()
        for war  in wars:
            # listes des traitées
            tower = False
            zoneList = []

            # On récupère les zones du jeux
            zones = dbZone.listeZones(war.key).fetch()
            historyKey = None

            # On ajoute un attribut 'done' à la liste de zone, afin de savoir si déjà traité
            for zone in zones:
                setattr(zone,'done',False)

            # On cherche des zones qui appartiennent à qqu'un
            for zone in zones:
                if zone.clan != None and zone.done == False:
                    tower = searchTower(zone,zones,tower,zoneList)
                    # ici on devrait avoir une réponse sur les zones
                    if tower==False:
                        logging.info("Revolution zon plus associé à une tour ! " + str(tower))
                        for z in zoneList:
                            logging.info(z.nom + " " + str(z.key.urlsafe()))
                            searchedZoneKey = ndb.Key(urlsafe=z.key.urlsafe())
                            searchedZone = searchedZoneKey.get()
                            sauveClan = searchedZone.clan
                            searchedZone.clan = None
                            searchedZone.put()

                            if historyKey==None:
                                # On sauvegarde forcement les etats des zones avants (si le combra précéden l'a changé)
                                historyKey = sauveHistorique(zones)

                            # Et on ajoute l'événement dans l'histo
                            e = dbEventResult(parent=war.key,event='revolt')
                            e.zone = searchedZoneKey
                            e.zonesHistory = historyKey
                            e.previousClan = sauveClan.get().key
                            e.winnerClan = None
                            e.tour = war.turn
                            e.timeline = ""
                            e.put()

                    zoneList = []
                    tower = False

"""Recupere lles evenements sur qques tours"""
class getEvent(webapp2.RequestHandler):
    def get(self):
        warId = self.request.get("war")
        logging.info("getEvent:"+ warId)
        wR = ndb.Key(urlsafe=warId)
        w = wR.get()

        # Récupère les 10 derniers events du jeux...
        events = dbEventResult.selectLast(w.key);
        eventTurn = []
        turns = []

        #logging.info(events)

        num = None
        for event in events:
            #if num == None or num == event.tour:
            if num != None and num != event.tour:
                turns.append({
                    'num':num,
                    'events':eventTurn
                })
                eventTurn = []
                
            num = event.tour
            # Y'a t'il un gagnant
            if event.winnerClan == None:
                gagnant = ""
            else:
                gagnant = event.winnerClan.get().nom

            # Y'a t'il un clan precedent
            if event.previousClan == None:
                perdant = ""
            else:
                perdant = event.previousClan.get().nom

            num = event.tour
            eventTurn.append({
                'type': event.event, 
                'gagnant':gagnant,
                'perdant':perdant,
                'zone':event.zone.get().nom,
				'uuid':event.key.urlsafe()
            })

        # Ne pas oublier d'ajouter si encore qqchoses dans eventTurn
        if len(eventTurn)>0:
            turns.append({
                'num':num,
                'events':eventTurn
            })

        template_values = { "turns": turns }        

        path = os.path.join(os.path.dirname(__file__), 'strasWar/templates/eventList.html')
        self.response.out.write(template.render(path,template_values))                

"""Recupere la liste des clan dans l'ordre des gagnants"""
class getHighScore(webapp2.RequestHandler):
    def get(self):
        warId = self.request.get("war")
        logging.info("getHighScore:"+ warId)
        wR = ndb.Key(urlsafe=warId)
        w = wR.get()

        clans = {}
        zones = []
        # Liste des régions de la war
        results = dbZone.listeZones(w.key).fetch()
        for r in results:
            if (r.clan != None):
                clan = r.clan.get()
                couleur = clan.couleur
                if clans.get(clan.nom):
                    clans[clan.nom].nbRegion = clans[clan.nom].nbRegion + 1
                    if r.tour == 1:
                        clans[clan.nom].nbRegion = clans[clan.nom].nbRegion + 2
                else:
                    bonus = 1
                    if r.tour == 1:
                        bonus = 3
                    clans[clan.nom] = {
                        "couleur": couleur,
                        "nbRegion": bonus
                    }

        logging.info(clans)

        listClans = []
        for k,v in clans.items():
            listClans.append({
                'nom': k,
                'couleur': v['couleur'],
                'nbRegion': v['nbRegion'],
                'img':giveMeColouredSprite('strasWar/png/soldats.png',(45,65),(4,0),v['couleur'])
            })

        sorted(listClans,key = lambda clan: clan['nbRegion'])
        template_values = { "clans": listClans }        

        path = os.path.join(os.path.dirname(__file__), 'strasWar/templates/highScore.html')
        self.response.out.write(template.render(path,template_values))                

"""Recupere la liste des combats ou le joueur courant a participe"""
class getMyWarResult(webapp2.RequestHandler):
    def get(self):
        user = self.request.get("userUuid")
        logging.info("getConcernedWar for:"+user)
        u = ndb.Key(urlsafe=user).get()

        # On recupere les resultat de guerre qui ont un rapport avec le joueur
        wr = dbEventResult.selectConcerned(u.key)

        results = []
        # On ne récupère que le nom et l'uuid sous forme de liste
        for result in wr:
            results.append({
                'zone':result.zone.get().nom,
                'tour':result.tour,
                'uuid':result.key.urlsafe()
            })

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(results,self.response.out)

"""Recupere un resultat de combat par rapport à un UUID"""
class getWarResult(webapp2.RequestHandler):
    def get(self):
        uuid = self.request.get("warUuid")
        logging.info("getConcernedWar for:"+uuid)
        er = ndb.Key(urlsafe=uuid).get()

        # Y'a t'il un gagnant
        if er.winnerClan == None:
            gagnant = ""
        else:
            gagnant = er.winnerClan.urlsafe()

        # Y'a t'il un clan precedent
        if er.previousClan == None:
            previousClan = ""
        else:
            previousClan = er.previousClan.urlsafe()

        results = {
            'event': er.event,  # A traité niveau client
            'clanGagnant':gagnant,
            'previousClan':previousClan,
            'zone':er.zone.urlsafe(),
            'timeLine': er.timeLine,
            'history':er.zonesHistory.get().etat
        }

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(results,self.response.out)

class getClans(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        uuid = data["war"]
        logging.info("getClans:"+uuid)
        wr = ndb.Key(urlsafe=uuid).get()

        # TODO: tester si j'ai une valeur.... la je pars sur le principe que j'ai forcément un clan, pas bien...
        clan = []
        results = dbClan.listeClan(wr.key).fetch()

        logging.info("Nombre de clans:"+str(len(results)))
        for r in results:
            #logging.info(r.nom)
            #logging.info("____________________________")
            clan.append({
                    'nom':r.nom,
                    'couleur':r.couleur,
                    'uuid':r.key.urlsafe()
                })

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(clan,self.response.out)

class getWars(webapp2.RequestHandler):
    def get(self):
        logging.info("getWars")
        results = dbWar.all().fetch()
        war = []
        for r in results:
            war.append({
                    'nom':r.nom,
                    'uuid':r.key.urlsafe(),
                    'turn':r.turn,
                    'endTurn':r.endTurn,
                    'started':r.started
                })

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(war,self.response.out)

# Recupere les users d'un claan
class getUsers(webapp2.RequestHandler):
    def get(self):
        clan = self.request.get("clan")
        logging.info("getUsers:"+clan)
        cR = ndb.Key(urlsafe=clan)
        c = cR.get()
        #c = dbClan.chercheNomClan(clan).fetch()

        users = []
        results = dbUser.listeUsers(c.key).fetch()

        logging.info("longueur:"+str(len(results))  )
        for r in results:
            logging.info(r.userId)
            users.append({
                   'userId':r.nom
            })

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(users,self.response.out)

class setZones(webapp2.RequestHandler):
    def post(self):
        newKey = []
        data = json.loads(self.request.body)
        war = data["war"]
        logging.info("setZones:"+str(war['nom']))

        wR = ndb.Key(urlsafe=war['uuid'])
        w = wR.get()
        #w = dbWar.chercheNom(war).fetch()

        #On supprime tous les postes...
        #dbZone.deleteAll(w[0].key);
        for zone in data['data']:
            logging.info("Zone: " + str(zone['nom']) + " id:" + str(zone['uuid']) + " clan:" + str(zone['clan']))
            # ici lecture du clan
            if zone['clan'] != 'None':
                cR = ndb.Key(urlsafe=zone["clan"])
                c = cR.get()
                clan = c.key
            else:
                clan = None

            if zone['uuid'].startswith("new"):
                logging.info("on ajoute>")
                z = dbZone(parent=w.key)
                z.nom = zone["nom"]
                z.clan = clan
                z.centre = centre
                z.tour = zone['tour']
                z.geographie = zone['geographie']
                z.voisins = zone['voisins']
                newKey.append({"old":zone['uuid'],"new":z.put().urlsafe()})
            else:
                logging.info("on met a jour")
                z = ndb.Key(urlsafe=zone["uuid"])
                r = z.get()
                # ajouter un test pour voir si differents
                # est-ce vraiment utile ?? A voir si trop de write dans la console...
                r.nom = zone["nom"]
                r.clan = clan
                r.centre = centre
                r.tour = zone['tour']
                r.geographie = zone['geographie']
                r.voisins = zone['voisins']
                r.put()

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({"etat": "ok","new":newKey },self.response.out)

class compteTour(webapp2.RequestHandler):
    def get(self):
        clan = self.request.get("clan")
        print "compteTour>" + str(clan)
        cr = ndb.Key(urlsafe=clan).get()

        result = dbZone.compteTour(cr.key)
        if result != 0:
            result = result + 1

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            'tour':result
        },self.response.out)

class getZones(webapp2.RequestHandler):
    def get(self):
        war = self.request.get("war")
        logging.info("getZones:"+ war)
        wR = ndb.Key(urlsafe=war)
        w = wR.get()

        zones = []
        results = dbZone.listeZones(w.key).fetch()

        logging.info("longueur:"+str(len(results)) )
        for r in results:
            logging.info(r.nom)
            couleur = ""
            uuid = "None"
            if (r.clan == None):
                couleur = DEFAULT_COL
                nom = ""
            else:
                clan = r.clan.get()
                couleur = clan.couleur
                uuid = clan.key.urlsafe()
            logging.info("Nom charge>" + r.nom)
            zones.append({
                    'nom':r.nom,
                    'couleur':couleur,
                    'clan':uuid,
                    'tour':r.tour,
                    'geographie':r.geographie,
                    'voisins':r.voisins,
                    'uuid':r.key.urlsafe()
                })

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(zones,self.response.out)

#Remonte les unites d'un meme clan a partir d'un joueur...
class getUnites(webapp2.RequestHandler):
    def get(self):
        user = self.request.get("userid")
        logging.info("getUnites:"+user)
        userid = dbUser.chercheUserId(user).fetch(1)[0]           # On cherche le userId des unites
        clanid = userid.key.parent()
        unites = []

        etat='ok'
        msg=''
        results = dbUnite.uniteDuClan(clanid)
        #results = dbUnite.uniteDuUser(userid.key).fetch()
        logging.info(results)
        for unite in results:
            unites.append({
                "modele":unite.modele,
                "strategie":unite.strategie,
                "position":unite.position,
                "zone":unite.zone.get().nom,
                "joueur":unite.user.get().nom,
                "couleur":unite.user.get().key.parent().get().couleur,
                "key":unite.key.urlsafe()
            })

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            "msg":msg,
            "etat":etat,
            "unites":unites
        },self.response.out)

class postUnites(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        user = data['userid']
        logging.info("Put unites pour " + user)
        userid = dbUser.chercheUserId(user).fetch(1)[0]           # On cherche le userId des unites

        #logging.info(">>>Recupere>>>" + str(data['unites']))

        unites = []
        etat='ok'
        msg=''

        for unite in data["unites"]:
            if (unite['etat']=='N'):   # Ajout
                u = dbUnite()
                u.modele = int(unite['modele'])
                u.strategie = int(unite['strategie'])
                u.user= userid.key
                zone = dbZone.chercheNom(unite['zone']).fetch(1)[0] #On l'enregistrement de la zone
                u.zone= zone.key
                u.position = unite['position']
                u.put()
                # Et on ajoute le dernier ecris qui n'y est pas encore present (ajout asynchrone par encore commite)
                # (peut-etre resolu avec un Dummy ancestor, mais ca me parait pas terrible...)
                unites.append({
                    "modele":u.modele,
                    "strategie":u.strategie,
                    "position":u.position,
                    "zone":u.zone.get().nom,
                    "joueur":u.user.get().nom,
                    "couleur":u.user.get().key.parent().get().couleur,
                    "key":u.key.urlsafe()
                })
            elif (unite['etat']=='D'): # Supression
                logging.info("Supppression>>" + str(unite["key"]))
                u = ndb.Key(urlsafe=unite["key"])
                u.delete()      # Marche pas a cause de la key.... Ralaalaaaaaaaa

        # On renvois ce qu'on a en stock
        #results = dbUnite.uniteDuUser(userid.key).fetch(10)
        results = dbUnite.uniteDuClan(userid.key.parent().get().key)

        # On lis ce qu'on a en base
        for unite in results:
            unites.append({
                "modele":unite.modele,
                "position":unite.position,
                "strategie":unite.strategie,
                "zone":unite.zone.get().nom,
                "joueur":unite.user.get().nom,
                "couleur":unite.user.get().key.parent().get().couleur,
                "key":unite.key.urlsafe()
            })

        #logging.info(">>>renvois>>>"+str(unites))

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            "msg":msg,
            "etat":etat,
            "unites":unites
        },self.response.out)

class logOff(webapp2.RequestHandler):
    def get(self):
        uuid = self.request.get("uuid")
        logging.info("logOff:"+str(uuid))

        u = ndb.Key(urlsafe=uuid).get()
        u.connected = False
        u.put()

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            "msg":'',
            "etat":'ok'
        },self.response.out)

class imAlive(webapp2.RequestHandler):
    def get(self):
        uuid = self.request.get("uuid")
        logging.info("logOff:"+str(uuid))

        u = ndb.Key(urlsafe=uuid).get()
        u.connected = True
        u.put()

        # La réponse n'est pas obligatoire, on s'en fout m^eme
        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            "msg":'',
            "etat":'ok'
        },self.response.out)
# cookie de 10 minutes
# à la connexion
# si pas de cookie
#  on fait le cookie et on regarde si le user est connecté
#  si il est connecté et plus utilisé depuis plus de 11 minutes
#    on dit ok
#  sinon
#    on refuse la connexion...
# si cookie
#  on dit non

class loginValidation(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        userid =data["userid"]
        mdp = data["mdp"]
        etat='ok'
        msg=''

        # On crypte le mot de passe pour pouvoir vérifier si même chose en base
        chaine_mot_de_passe = hashlib.sha1(mdp).hexdigest()

        logging.info("loginValidation:" + userid)

        u = dbUser.chercheUserId(userid.lower()).get()
        if (u!=None):
            # on a un joueur, mais as t-on son mot de passe ?
            if u.mdp != chaine_mot_de_passe:
                etat="ko"
                msg="UserId ou mot de passe inconnu!"
            elif u.connected == True:   # le mot de passe correspond...
                then = u.lastModified
                now = datetime.datetime.now()
                delta = now-then
                if (delta.total_seconds() > (60* TIME_OUT)):
                    # le cookie est expirée donc plus web actif, donc on relog...
                    u.connected = True
                    u.put()
                else:
                    # le cookie existe ceainement encore, le joueur est peut-etre actif...
                    etat="ko"
                    msg="UserId deja connecte!"
            else:
                u.connected = True
                u.put()
        else:
            etat="ko"
            msg="UserId inconnu!"

        self.response.headers['Content-Type'] = 'application/json'

        if (etat=="ok"):
            # Recherche de la liste des clans
            clans = dbClan.listeClan(u.key.parent().get().key.parent().get().key).fetch()

            listeClan = []
            for c in clans:
                listeClan.append({
                        'nom':c.nom,
                        'couleur':c.couleur,
                        'uuid':c.key.urlsafe()
                    })

            # On recupere les infos sur la guerre courante
            war = u.key.parent().get().key.parent().get()

            json.dump({
                "msg":msg,
                "etat":etat,
                "nom":u.nom,
                "userid":u.userId,
                "score":u.score,
                "uuid":u.key.urlsafe(),
                "clan":u.key.parent().get().key.urlsafe(),
                "clans":listeClan,    # La liste des clans
                "war":war.key.urlsafe(),    # La ref de la guerre
                "name":war.nom,
                "turn":war.turn,
                "endTurn":war.endTurn,
                "couleur":u.key.parent().get().couleur
            },self.response.out)
        else:
            json.dump({
                "msg":msg,
                "etat":etat,
            },self.response.out)

class validationAccount(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        userid = data["userid"]
        nom = data["nom"]
        mdp = data["mdp"]
        war = data["war"]
        clan = data["clan"]
        msg=''
        etat='ok'
        urlsafe = ''

        # On crypte pour rigoler
        mot_de_passe = hashlib.sha1(mdp).hexdigest()

        logging.info("validationAccount:")
        logging.info("userid:" + userid)
        logging.info("mdp:" + mot_de_passe)
        logging.info("war:" + war)
        logging.info("clan:" + clan)

        cR = ndb.Key(urlsafe=clan)
        resultClan = cR.get()

        wR = resultClan.key.parent().get()

        u = dbUser.chercheUserId(userid.lower()).fetch()
        if (len(u)==0): # Verification si userid pas deja utilise
            if (resultClan) : # On a un clan
                # et on stocke en base
                u = dbUser(parent = resultClan.key)
                u.userId = userid
                u.nom = nom
                u.mdp = mot_de_passe
                u.connected = True
                k = u.put()
                urlsafe = k.urlsafe()
        else:
            etat='ko'
            msg='Le user existe deja'

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            "uuid":urlsafe,
            "msg":msg,
            "etat":etat,
            "nom":wR.nom,
            "turn":wR.turn,
            "endTurn":wR.endTurn
        },self.response.out)

class setWarStart(webapp2.RequestHandler):
    def get(self):
        uuid = self.request.get("uuid")
        started = self.request.get("started")
        logging.info("setWarStart:"+str(uuid) + " started: " + str(started))

        w = ndb.Key(urlsafe=uuid).get()
        if started == "true":
            w.started = True
        else:
            w.started = False
        w.put()

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({
            "msg":'rien',
            "etat":'ok'
        },self.response.out)

class war(webapp2.RequestHandler):
    def get(self):
        logging.info("War is coming soon rapidement !!")

        # J'ai toute les guerres
        wars = dbWar.all().fetch()
        for war in wars:
            # On recupere les zones de la guerre, si elle est demmare et qu'on est pas au dernier tour on traite
            if (war.started == True and war.endTurn >= war.turn):
                currentTurn = war.turn
                zones = dbZone.listeZones(war.key).fetch()
                war.turn = war.turn + 1
                war.put()       # sauvegarde du tour+1
                history = []    # les zones dans leurs etats precedents

                # On sauvegarde forcement les etats des zones avants
                historyKey = sauveHistorique(zones)
                
                for zone in zones:
                    # Debug or Not ??
                    clsGuerriers.debug = True
                    clsGuerrier.debug = True
                    clsCombat.debug = True

                    guerriers = clsGuerriers()
                    gagnant = "?"
                    users = []

                    # Et on cherche les unites presente pour voir si bataille
                    unites = dbUnite.unitesSurZone(zone.key)
                    if len(unites)>0:
                        logging.info("Guerre " + war.nom + ", bagarre dans la zone:" + zone.nom)

                        for unite in unites:
                            # Ici on fait les guerriers pour le combat
                            guerriers.add(unite)

                            key = unite.user.get().key
                            if key not in users:
                                users.append(key)

                        #TODO: si la zone.clan = None ajout de 10 et de 11 neutre
                        nbNeutralPaysan = random.randint(1,3)
                        nbNeutralFronde = random.randint(1,6)
                        

                        lat = random.random() / 100
                        lng = random.random() / 100


                        zone.centre                        

                        gagnant = guerriers.execute()

                    # Ici le combat est fini..
                    if (gagnant != "?"): # Affichage du resutat et maj en base...
                        # Et on attributs le changement de zone
                        logging.info(gagnant)
                        gagnantKey = None
                        if gagnant != None:
                            nomGagnant = gagnant.get().nom
                            gagnantKey = gagnant.get().key
                            logging.info(" > Le gagnant est " + nomGagnant)
                        else:
                            nomGagnant = ""
                            logging.info(" > Pas de gagnant !")

                        # On recupere le proprietaire precedent
                        if zone.clan != None:
                            previousClan = zone.clan.get().key
                        else:
                            previousClan = None
                        # Et on sauvegare le nouveau proprio
                        zone.clan = gagnant
                        z = zone.put()

                        # On ecrit le resultat du combat
                        wr = dbEventResult(parent=war.key)
                        wr.zone = z
                        wr.event  = "war"
                        wr.tour = currentTurn
                        wr.previousClan = previousClan
                        wr.timeLine = guerriers.timeLine
                        #wr.participants = users
                        wr.winnerClan = gagnantKey
                        wr.zonesHistory = historyKey  # On met une sauvegarde sur son territoire précédent
                        wr.put()
                    else:
                        logging.info(" > Pas de combat!")
            else:
                logging.info("War not started!")

#############################################################################
#############################################################################
#############################################################################
app = webapp2.WSGIApplication([
('/strasWar/setWarStart',setWarStart),
('/strasWar/revolt', revolt),
('/strasWar/getEvent', getEvent),
('/strasWar/getHighScore', getHighScore),
('/strasWar/getMyWarResult', getMyWarResult),
('/strasWar/getWarResult', getWarResult),
('/strasWar/getUnites', getUnites),
('/strasWar/postUnites', postUnites),
('/strasWar/compteTour', compteTour),
('/strasWar/getZones', getZones),
('/strasWar/setZones', setZones),
('/strasWar/getUsers', getUsers),
('/strasWar/logOff', logOff),
('/strasWar/imAlive', imAlive),
('/strasWar/getClans', getClans),
('/strasWar/getWars', getWars),
('/strasWar/validationAccount', validationAccount),
('/strasWar/loginValidation', loginValidation),
('/strasWar/init', init),
('/strasWar/editor', editor),
('/strasWar/war', war),
('/strasWar/index.html', main),
('/strasWar/', main)
], debug=True)
