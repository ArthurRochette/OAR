"""
WSGI config for oar project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application
if os.environ.get('STATE') == '3':
    print("#################################################")
    print("############### DOCKERIZED PROD #################")
    print("#################################################")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oar.settings_docker')# test and prod are dockerized
    os.environ.setdefault('WSGIPassAuthorization', 'On')
elif os.environ.get('STATE') == '2':
    print("#################################################")
    print("############### DOCKERIZED TEST #################")
    print("#################################################")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oar.settings_docker')
    os.environ.setdefault('WSGIPassAuthorization', 'On')
    
else:
    print("#################################################")
    print("############### LIVE DEV ########################")
    print("#################################################")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oar.settings')
    os.environ.setdefault('WSGIPassAuthorization', 'On')
    



application = get_wsgi_application()
