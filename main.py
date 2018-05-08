#!/usr/bin/env python
# -*- coding: latin-1 -*-
import os
import os.path
import jinja2
import webapp2
import logging

jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

#############################################################################
# VARIABLE de travail
#############################################################################

#############################################################################
# INIT
#############################################################################
class main(webapp2.RequestHandler):
    def get(self):
        logging.info("Demarrage")
        template = jinja_environment.get_template('index.html')
    
        self.response.out.write(template.render())

#############################################################################
#############################################################################
#############################################################################
app = webapp2.WSGIApplication([

('/', main)
], debug=True)