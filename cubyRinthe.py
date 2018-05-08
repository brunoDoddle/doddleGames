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
# INIT
#############################################################################
class main(webapp2.RequestHandler):
    def get(self):
        logging.info("Demarrage")
        template = jinja_environment.get_template('/cubyRinthe/index.html')

        self.response.out.write(template.render())

class toto(webapp2.RequestHandler):
    def get(self):
        logging.info("Toto called!!")

        self.response.headers['Content-Type'] = 'application/json'
        json.dump({},self.response.out)


#############################################################################
#############################################################################
#############################################################################
app = webapp2.WSGIApplication([
('/cubyRinthe/index.html', main),
('/cubyRinthe/toto', toto),
('/cubyRinthe/', main)
], debug=True)
