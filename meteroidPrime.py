#!/usr/bin/env python
# -*- coding: latin-1 -*-
import os
import os.path
import json
import jinja2
import webapp2
import logging

from google.appengine.ext import ndb

jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))
#############################################################################
# Bases de données
#############################################################################
class dbPlayer(ndb.Model):
    nom = ndb.StringProperty()     # Le nom
    guid = ndb.StringProperty()    # Id de l'appareil (mais est-ce utile?)

    @classmethod
    def search(cls,nom,guid):
        p = cls.query()
        p1 = p.filter(cls.nom == nom)
        p2 = p1.filter(cls.guid == guid)

        return p2.get()

############################
############################
class dbLevel(ndb.Model):
    data = ndb.JsonProperty()     # Sa forme et dans les infos en dur...
    creator = ndb.KeyProperty(kind=dbPlayer)
    creatorName = ndb.ComputedProperty(lambda self: self.creator.get().nom)
    name = ndb.StringProperty()

    @classmethod
    def directory(cls):
        # Faire un aggregat par nom de creator
        level = cls.query().order(cls.creatorName).fetch(10)
        result = []
        if len(level) > 0:
            groupe = {"creatorName":level[0].creatorName,"levels":[]}

            n = 0
            for l in level:
                if (groupe["creatorName"] <> l.creatorName):
                    if (groupe <> None):
                        result.append(groupe)
                        n = 0
                    groupe = {"creatorName":l.creatorName,"levels":[]}
                groupe["levels"].append({"name":l.name,"key":l.key.urlsafe()})
                n = n + 1
            result.append(groupe)

        logging.info(result)
        return result

    @classmethod
    def highScore(cls,uuid):
        ancetre = ndb.Key(urlsafe=uuid).get()
        if (ancestor!=None):
            return dbScorer.query(ancestor=ancestor.key).order(dbScorer.nb).limit(0)
        else:
            return None

    @classmethod
    def highPlayed(cls,key):
        ancestor = cls.query(cls.key==key).get()
        if (ancestor!=None):
            return dbPlayed.query(ancestor=ancestor.key).order(dbMeteorer.nb)
        return None

############################
# Highscorees
############################
# Le highscore
############################
class dbScorer(ndb.Model):
    # ancetre = dbLevel
    player = ndb.KeyProperty(kind=dbPlayer)
    nbCoin = ndb.IntegerProperty(default=0)
    nbMeteor = ndb.IntegerProperty(default=0)
    ended = ndb.BooleanProperty(default=False);
    score = ndb.ComputedProperty(lambda self: self.calcScore(self.nbCoin,self.nbMeteor,self.ended))

    @classmethod
    def get(cls,key):
        result = []
        list = dbScorer.query(ancestor=key).order(-dbScorer.score).fetch(5)
        for l in list:
            result.append({
                'name':l.player.get().nom,
                'score':l.score
            })
        return result

    @classmethod
    def calcScore(self,nbCoin,nbMeteor,ended):
        logging.info(ended)
        score = 0

        if (ended == True):
            logging.info("+500")
            score = 500
        score = score + nbCoin * 50 + nbMeteor * 100
        return score

# Plus de partie joué
############################
class dbPlayed(ndb.Model):
    # ancetre = dbLevel
    player = ndb.KeyProperty(kind=dbPlayer)
    nb = ndb.IntegerProperty(default=0)

#############################################################################
# VARIABLE de travail
#############################################################################

#############################################################################
# CLASSES de travail
#############################################################################
class Result:
    def __init__(self):
        self.result = {
            'error': False,
            'msg': "",
            'data': {}
        }

    def error(self):
        return self.result["error"]

    def setError(self,msg):
        self.result["error"] = True
        self.result["msg"] = msg

    def setWarning(self,msg):
        self.result["error"] = False
        self.result["msg"] = msg

    def addData(self,key,val):
        self.result["data"][key] = val

    def getResult(self):
        return self.result

#############################################################################
# INIT
#############################################################################
class main(webapp2.RequestHandler):
    def get(self):
        logging.info("Demarrage")
        template = jinja_environment.get_template('/meteroidPrime/index.html')

        self.response.out.write(template.render())

"""Login simple du joueur"""
class login(webapp2.RequestHandler):
    def post(self):
        logging.info(">>>login<<<")
        # uuid - id ndb

        # GUID - id de l'appareil
        # nom - Nom du joueur
        result = Result()
        self.response.headers['Content-Type'] = 'application/json'

        # On rrécupère les données
        try:
            data = json.loads(self.request.body)
        except:
            data = ""
            result.setError("Corrupted datas")
            json.dump(result.getResult(),self.response.out)

        p = dbPlayer().search(data['nom'],data['guid'])
        if (p!=None):
            # On a trouvé un joueur
            result.addData('uuid', p.key.urlsafe())
            logging.info("Joueur existant")
        else:
            logging.info("Nouveau Joueur")
            # Si on arrive ici c'est quon doit crééer un joueur
            p = dbPlayer()
            p.nom = data['nom']
            p.guid = data['guid']
            result.addData('uuid', p.put().urlsafe())

        json.dump(result.getResult(),self.response.out)

"""Liste de tableau"""
#TODO: lister par filtres, mais lesquels ??
class directoryWeb(webapp2.RequestHandler):
    def get(self):
        logging.info(">>>directoryWeb<<<")
        result = Result()

        result.addData("groupes",dbLevel.directory())

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result.getResult(),self.response.out)


"""Sauvegarde d'un tableau"""
class saveWeb(webapp2.RequestHandler):
    def post(self):
        logging.info(">>>saveWeb<<<")
        result = Result()

        try:
            data = json.loads(self.request.body)
            c = ndb.Key(urlsafe=data["creator"])
            level = dbLevel()
            level.data = data["level"]
            level.creator = c
            level.name = data["name"]
            levelKey = level.put()
            result.addData('uuid',levelKey.urlsafe())
            result.addData('name',data["name"])
        except:
            data = ""
            result.setError("Corrupted datas")

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result.getResult(),self.response.out)

class readWeb(webapp2.RequestHandler):
    def post(self):
        logging.info(">>>readWeb<<<")
        result = Result()

        try:
            data = json.loads(self.request.body)
            c = ndb.Key(urlsafe=data["id"]).get()
            result.addData('uuid',c.key.urlsafe())
            result.addData('level',c.data)
            result.addData('name',c.name)
        except:
            data = ""
            result.setError("Corrupted datas")

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result.getResult(),self.response.out)

class getHighScore(webapp2.RequestHandler):
    def get(self):
        logging.info(">>>getHighScore<<<")
        levelUuid = self.request.get("uuid")
        result = Result()

        result.addData("scores",dbLevel.highScore(uuid))

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result.getResult(),self.response.out)

class setScore(webapp2.RequestHandler):
    def post(self):
        logging.info(">>>setScore<<<")
        data = json.loads(self.request.body)
        result = Result()
        playerUuid = data["playerUuid"]
        levelUuid = data["levelUuid"]

        p = ndb.Key(urlsafe=playerUuid).get()
        l = ndb.Key(urlsafe=levelUuid).get()

        # On sauvegarde le score
        s = dbScorer(parent=l.key)
        s.player = p.key
        s.nbCoin = data['nbCoin']
        s.nbMeteor = data['nbMeteor']
        s.ended = data['ended']
        s.put()

        # Et on récuppère le top ten...
        list = dbScorer.get(l.key)
        logging.info(list)

        result.addData("highScore",list)
        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result.getResult(),self.response.out)

class setPlayed(webapp2.RequestHandler):
    def get(self):
        logging.info(">>>setPlayed<<<")
        playerUuid = self.request.get("playerUuid")
        levelUuid = self.request.get("levelUuid")
        result = Result()

        p = ndb.Key(urlsafe=playerUuid).get()
        l = ndb.Key(urlsafe=levelUuid).get()

        s1 = dbPlayed.query(ancestor = l.key)
        s0 = s1.filter(dbPlayed.player == p.key)
        s = s0.get()

        if s == None:
            s = dbPlayed(parent=l.key)
            s.player = p.key

        s.nb = s.nb + 1
        s.put()

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result.getResult(),self.response.out)

"""Classe de test"""
class test(webapp2.RequestHandler):
    def get(self):
        logging.info(">>>test<<<")

        result = {
            'test':'salut du le serveur'
        }

        self.response.headers['Content-Type'] = 'application/json'
        json.dump(result,self.response.out)
#############################################################################
#############################################################################
#############################################################################
app = webapp2.WSGIApplication([

('/meteroidPrime/index.html', main),
('/meteroidPrime/setScore', setScore),
('/meteroidPrime/getHighScore', getHighScore),# TODO: a implémenter
('/meteroidPrime/setPlayed', setPlayed),
('/meteroidPrime/directoryWeb', directoryWeb),
('/meteroidPrime/saveWeb', saveWeb),
('/meteroidPrime/readWeb', readWeb),
('/meteroidPrime/login', login),
('/meteroidPrime/', main),
('/meteroidPrime/test', test)
], debug=True)
