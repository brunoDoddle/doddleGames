#!/usr/bin/env python
# -*- coding: latin-1 -*-
import os
import os.path
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
        template = jinja_environment.get_template('/oneInWall/index.html')

        self.response.out.write(template.render())


#############################################################################
#############################################################################
#############################################################################
app = webapp2.WSGIApplication([
('/oneInWall/index.html', main),
('/oneInWall/', main)
], debug=True)
