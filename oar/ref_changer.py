from django.contrib.auth import get_user_model
import django
import os

# Initialiser Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'oar.settings')

django.setup()

from bs4 import BeautifulSoup
from oar.models import *
import http.cookiejar as cookiejar
import mechanize
import hashlib
from time import sleep
import re

def sanitize_filename(filename):
    # Remplace les caractères invalides par des underscores
    return re.sub(r'[<>:"/\\|?*]', '_', filename)


# Exclure les URLs vides et filtrer celles contenant 'mycol'
full = Reference.objects.exclude(url="").filter(url__contains="mycol")

failed_files_ref = []

def calculate_file_hash(file_path):
    hasher = hashlib.sha256()
    
    with open(file_path, 'rb') as file:
        chunk = file.read(8192)
        while chunk:
            hasher.update(chunk)
            chunk = file.read(8192)
    
    return hasher.hexdigest()

# Initialiser CookieJar et mechanize.Browser
cj = cookiejar.CookieJar()
br = mechanize.Browser()
br.set_handle_robots(False)
br.set_cookiejar(cj)

# Ouvrir la page de connexion et soumettre le formulaire
br.open("https://mycol.interne.o-lambret.fr/jcms/por_2000181/col-portail-jsp-collection-default?redirect=https%3A%2F%2Fmycol.interne.o-lambret.fr%2Fjcms%2Fcor_2067217%2Fuk-consensus-2022&jsp=front%2Flogin.jsp")
br.select_form(nr=1)
br.form.controls[0].value = ""  # Remplacez par le bon identifiant
br.form.controls[1].value = ""  # Remplacez par le bon mot de passe
br.submit()


md5s = []
files = []

# Traitement des références
for ref in full:
    print(ref.url)
    
    # Ouvrir la page de la référence
    br.open(ref.url)
    response = br.response()
    
    if response.code == 200:  # Utilisez `response.code` au lieu de `response.status_code`
        soup = BeautifulSoup(response.read(), 'html.parser')
        
        # Trouver la balise <a> avec l'attribut download
        a = soup.find("a", attrs={'download': True})
        
        if a:
            file_url = mechanize._rfc3986.urljoin("https://mycol.interne.o-lambret.fr/", a["href"])  # Obtenir l'URL absolue du fichier
            file_name = a.get('download', file_url.split('/')[-1])  # Nom du fichier à partir de l'attribut 'download' ou de l'URL
            
            file_name = sanitize_filename(file_name)
            # Télécharger le fichier
            br.retrieve(file_url, file_name)
            
            temp_md5 = calculate_file_hash(file_name)
            
            if temp_md5 in md5s:
                index = md5s.index(temp_md5)
                os.remove(file_name)
                file_name = files[index]
            else:
                os.rename(file_name, f"C:/media/references/{file_name}")
                file_name = f"references/{file_name}"
                md5s.append(temp_md5)
                files.append(file_name)
                print(f"Fichier téléchargé : {file_name}")
            
            ref.file = file_name  
            ref.url = "" 
            ref.save()  
            sleep(1)

        else:
            failed_files_ref.append((ref.url, ref.id))
            print("Lien de téléchargement non trouvé.")
    else:
        failed_files_ref.append((ref.url, ref.id))
        print(f"Échec de la récupération de la page : {ref.url}")
        
        
        
print(failed_files_ref)
