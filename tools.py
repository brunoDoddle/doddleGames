#!/usr/bin/env python
# -*- coding: latin-1 -*-
import logging
from math import sqrt

class clsGuerriers:
    debug = False

    def __init__(self):
        self.listeGuerriers = []
        self.combats = []
        self.timeLine = []

    def add(self,unite):
        guerrier = clsGuerrier(unite)
        self._print("Guerrier ("+str(guerrier.num)+"/"+str(unite.modele)+") de " + unite.user.get().nom + " du clan " + unite.clan.get().nom )
        self.listeGuerriers.append(guerrier)

    def execute(self):
        if len(self.listeGuerriers) > 0:
            return self._combats()
        else:
            self._print("pas de guerrier disponible!")
            return None

    def quiAGagne(self):
        gagnant = None
        liste = self._listeGuerriers()
        for guerrier in liste:  # On cherche le gagnant (dernier "guerrier" en vie)
            if (guerrier.estVivant()):
                gagnant = guerrier.clan

        return gagnant

    def _print(self,texte):
        if self.debug:
            logging.info(texte)

    """Créer une liste de guerrier"""
    def _listeGuerriers(self):
        list = []
        for soldat in self.listeGuerriers:
            if soldat.modele != 3:
                list.append(soldat)
        return list

    """Créer une liste d'archer"""
    def _listeArchers(self):
        list = []
        for soldat in self.listeGuerriers:
            if soldat.modele == 3:
                list.append(soldat)
        return list

    def _combats(self):
        # Ici on possede une liste de guerrier pour une zone
        # On a plus qu'a se mettre sur la gueule
        encore = True
        combats = []
        tour = 1    # Pour le debug, affiche le round courant...

        self._print("Nombre de guerrier dans la zone>" + str(len(self.listeGuerriers)))
        c = clsCombat("A")         # On fait un premier combat

        players = []    # Player global (timeline principale)
        player = []     # Player unitaire regroupant les meme actions

        # recuperation des guerrier pour l'init du player
        for guerrier in self.listeGuerriers:
            guerrier.writeOrder('I',player)

        # Ordres d'init fait, on ajoute au players global
        players.append(player)
        del(player)
        player = []

        # veridier l'affectation des guerriers.. Il devrait rester a leur place dasn un combat
        # multi round ( en fait le premier a perddu son ennemi) deccale le reste... hmmmm
        while encore:
            self._print("=====================================")
            self._print("= Round n="+str(tour))
            self._print("=====================================")
            self._print("Tour des archers")
            self._print("=====================================")
            for archer in self._listeArchers():
                if (archer.readyToFight(None)):                     # est-il libre ??
                    for ennemi in self._listeGuerriers():           # on cherche le guerrier le plus proche
                        if (ennemi.readyToFight(archer)): # La c'est mieux...
                            c.add(archer)     # Inutile de le faire plusieurs fois.. Mais bon..
                            c.longueur(ennemi)  # On regarde si l'ennemi est loin

                    # Ici on a normalement parcouru tout les ennemis et on peut valider le combat (ou pas)
                    if (c.valideCible()):  # Si true c'est qu'on a un ennemi
                        c.printVersus()
                        combats.append(c)

                    # On libere et on prevois le prochain combat
                    del(c)
                    c = clsCombat("A")

            if (len(combats) > 0):
                self._print("Nombre d'archers>"+str(len(combats)))
                # On execute les combats obtenus
                for combat in combats:
                    combat.fight()  # Le fight libere les guerriers
                    combat.writeOrder('C',player)
                    combat.result()

                # Ordres de comabts fait, on ajoute au players global
                players.append(player)
                # et on prepare le prochain player
                del(player)
                player = []
                combats = []

            del(c)
            c = clsCombat("C")

            self._print("Tour des guerriers")
            self._print("=====================================")
            for guerrier in self._listeGuerriers():
                if (guerrier.readyToFight(None)):                   # est-il libre ??
                    for ennemi in self._listeGuerriers():           # on cherche le guerrier le plus proche
                        if (ennemi.readyToFight(guerrier)):
                            c.add(guerrier)     # Inutile de le faire plusieurs fois.. Mais bon..
                            c.longueur(ennemi)  # On regarde si l'ennemi est loin

                    # Ici on a normalement parcouru tout les ennemis et on peut valider le combat (ou pas)
                    if (c.valideEnnemi()):  # Si true c'est qu'on a un ennemi
                        c.printVersus()
                        c.writeOrder('M',player)
                        combats.append(c)

                    # On libere et on prevois le prochain combat
                    del(c)
                    c = clsCombat("C")

            # Ordres de mouvement fait, on ajoute au players global
            players.append(player)
            del(player)
            player = []

            # Augmentation du round
            tour = tour + 1

            if (len(combats) == 0): # Si plus de combats possible c'est fini...
                self._print("Fin du combat")
                encore = False
            else:
                self._print("Nombre de combat>"+str(len(combats)))
                # On execute les combats obtenus
                for combat in combats:
                    combat.fight()  # Le fight libere les guerriers
                    combat.writeOrder('C',player)
                    combat.result()

                # Ordres de comabts fait, on ajoute au players global
                players.append(player)
                # et on prepaare le prochain player
                del(player)
                player = []

                # On supprime les combats inutiles
                for n in range(len(combats)-1,-1,-1):
                    logging.info("test indice :"+str(n) + " " + str(combats[n].fini))

                    if combats[n].fini:
                        logging.info("supprime:"+str(n))
                        del(combats[n])

                c = clsCombat("C")

            # Limitateur au cas ou...
            if tour==10:
                encore = False

        # Timeline disponible pour warResult
        self.timeLine = players

        self._print("----------------------------------------------------------")
        self._print("----------------------------------------------------------")
        self._print(players)
        self._print("----------------------------------------------------------")
        self._print("----------------------------------------------------------")

        return self.quiAGagne()

class clsGuerrier:
    num = 0
    # 0 - soldat / 1 - piquier / 2 - cheval / 3 - Archer
    modele = 0
    pv = 3  # 3 PV par defaut
    debug = False
    orientation = "D"

    def __init__(self,unite):
        self.nom = unite.user.get().key
        self.clan = unite.clan.get().key
        self.couleur = unite.clan.get().couleur
        self.modele = unite.modele
        self.position = unite.position
        self.num = clsGuerrier.num
        # Pour affichage uniquement
        self.nomClan = unite.clan.get().nom
        self.nomUser = unite.user.get().nom
        self.libereDelivre()    # Par defaut le guerrier est libre

        clsGuerrier.num = clsGuerrier.num + 1 # Ordre d'arrivee (mais je pense que c'est inutile)

    def _print(self,texte):
        if self.debug:
            logging.info(texte)

    # Ordres individuels
    def writeOrder(self,ordre,ordres):
        if ordre == 'I':    # Init
            ordres.append({
                'ordre':'I',
                'num':self.num,
                'modele':self.modele,
                'position':self.position,
                'nom':self.nomUser,
                'couleur':self.couleur,
                'pv':self.pv
            })
        elif ordre == 'M':  # Move
            ordres.append({
                'ordre':'M',
                'num':self.num,
                'position':self.position,
                'orientation':self.orientation
            })
        else:
            logging.info("Erreur ordre inconnu:" + str(ordre))

    def sontEnnemi(self,ennemi):
        if (self.clan == ennemi.clan):
            return False
        else:
            return True

    def prendsUneFleche(self):
        self.pv = self.pv - 1

    def auTravail(self):
        self.utilise = True

    def libereDelivre(self):
        self.utilise = False

    def readyToFight(self,guerrier):
        if self.estVivant() and self.utilise == False:
            if guerrier != None:
                if  self.sontEnnemi(guerrier):
                    return True
                else:
                    return False
            return True
        else:
            return False

    def estVivant(self):
        if (self.pv>0):
            return True
        else:
            return False

class clsCombat:
    debug = False
    fini = False

    def __init__(self,type):
        self.position = 0
        self.resetEnnemi()
        self.libre = True
        self.type = type
        self.guerrier1 = None
        self.guerrier2 = None

    def _print(self,texte):
        if self.debug:
            logging.info(texte)

    # Ordres collectifs
    def writeOrder(self,ordre,ordres):
        if ordre == 'C':    # Combat
            if self.type == "C":
                ordres.append({
                    'ordre':'C',
                    'num1':self.guerrier1.num,
                    'num2':self.guerrier2.num,
                    'pv1':self.guerrier1.pv,
                    'pv2':self.guerrier2.pv
                })
            else:
                ordres.append({
                    'ordre':'T',
                    'num1':self.guerrier1.num,
                    'num2':self.guerrier2.num,
                    'pv2':self.guerrier2.pv
                })

        elif ordre == 'M':  # Mouvement collectif :-)
            self.guerrier1.writeOrder('M',ordres)
            self.guerrier2.writeOrder('M',ordres)
        else:
            logging.info("Erreur ordre inconnu:" + str(ordre))

    def printVersus(self):
        if self.type == "C":
            self._print("Guerrier (" + str(self.guerrier1.num) + "/"+ str(self.guerrier1.modele) +") " + self.guerrier1.nomUser + " de " + self.guerrier1.nomClan + " VERSUS " + "Guerrier (" + str(self.guerrier2.num) + "/"+ str(self.guerrier2.modele) +") " + self.guerrier2.nomUser + " de " + self.guerrier2.nomClan )
        else:
            self._print("Archer (" + str(self.guerrier1.num) + "/"+ str(self.guerrier1.modele) +") " + self.guerrier1.nomUser + " de " + self.guerrier1.nomClan + " VERSUS " + "Guerrier (" + str(self.guerrier2.num) + "/"+ str(self.guerrier2.modele) +") " + self.guerrier2.nomUser + " de " + self.guerrier2.nomClan )

    def add(self,guerrier):
        guerrier.auTravail()
        self.guerrier1 = guerrier

    def valideCible(self):
        # On valide si guerrier 2 existe..
        if (isinstance(self.guerrier2,clsGuerrier)):
            self.guerrier2.auTravail()
            self.libre = False
            self.resetEnnemi()
            return True
        else:
            return False

    def valideEnnemi(self):
        # On valide si guerrier 2 existe..
        if (isinstance(self.guerrier2,clsGuerrier)):
            self.guerrier2.auTravail()
            self.moyenne()
            self.libre = False
            self.resetEnnemi()
            return True
        else:
            return False

    def estComplet(self):
        if (isinstance(self.guerrier1,clsGuerrier) and isinstance(self.guerrier2,clsGuerrier)):
            return True
        else:
            return False

    def fight(self):
        # A c'est un tir d'archer
        # C c'est un combat
        if self.type == "C":
            if((self.guerrier1.modele == 0 and self.guerrier2.modele == 1) or # soldat > piquier
               (self.guerrier1.modele == 1 and self.guerrier2.modele == 2) or #piquier > chevalier
               (self.guerrier1.modele == 2 and self.guerrier2.modele == 0)): # chevalier > soldat
                self.guerrier1.pv = self.guerrier1.pv -1 # On perd un point de vie
                self.guerrier2.pv = 0 # et l'autre meurt
            elif (self.guerrier1.modele == self.guerrier2.modele):
                self.guerrier1.pv = self.guerrier1.pv -2 # On perd un point de vie
                self.guerrier2.pv = self.guerrier2.pv -2 # On perd un point de vie
            elif((self.guerrier1.modele == 0 and self.guerrier2.modele == 2) or # soldat < chevalier
               (self.guerrier1.modele == 2 and self.guerrier2.modele == 1) or # chevalier < piquier
               (self.guerrier1.modele == 1 and self.guerrier2.modele == 0)): # piquier < soldat
                self.guerrier1.pv = 0 # on meurt
                self.guerrier2.pv = self.guerrier2.pv -1 # et l'autre perd un point de vie

            # Combat fini on libere si y'a des morts, d'ailleurs on libère tous le monde
            if self.guerrier2.pv <= 0 :
                self.guerrier1.libereDelivre()
                self.guerrier2.libereDelivre()
                self.fini = True
            if self.guerrier1.pv <= 0 :
                self.guerrier1.libereDelivre()
                self.guerrier2.libereDelivre()
                self.fini = True
        else:
            self.guerrier2.prendsUneFleche()
            self.guerrier2.libereDelivre()
            self.fini = True


    def longueur(self,autreGuerrier):
        self.distance = sqrt((self.guerrier1.position["lat"] - autreGuerrier.position["lat"])**2 + (self.guerrier1.position["lng"] - autreGuerrier.position["lng"])**2)
        if (self.distance < self.plusProche):
            self.plusProche = self.distance
            self.guerrier2 = autreGuerrier

    def moyenne(self):
        p1 = {}
        p1["lat"] = (self.guerrier1.position["lat"] + self.guerrier2.position["lat"]) /2
        p1["lng"] = (self.guerrier1.position["lng"] + self.guerrier2.position["lng"]) /2

        if self.guerrier1.position["lat"] >= self.guerrier2.position["lat"]:
            self.guerrier1.orientation = "G"
            self.guerrier2.orientation = "D"
        else:
            self.guerrier1.orientation = "D"
            self.guerrier2.orientation = "G"

        # On les fait combatre au centre, c'est le js qui calculera l'eloignement
        self.guerrier1.position = p1
        self.guerrier2.position = p1

    def resetEnnemi(self):
        self.plusProche = 999999
        self.distance = 0

    def result(self):
        self._print("Resultat: " + str(self.fini))
        self._print("---------")
        self._print("Guerrier (" + str(self.guerrier1.num) + "/"+ str(self.guerrier1.modele) +") " + self.guerrier1.nomUser + " de " + self.guerrier1.nomClan + " a " + str(self.guerrier1.pv) + " pv")
        self._print("Guerrier (" + str(self.guerrier2.num) + "/"+ str(self.guerrier2.modele) +") " + self.guerrier2.nomUser + " de " + self.guerrier2.nomClan + " a " + str(self.guerrier2.pv)  + " pv")
