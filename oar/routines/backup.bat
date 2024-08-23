@echo off

rem Obtenir la date actuelle au format dd_mm_yyyy
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set var=%%a_%%b_%%c
)

set file_name=backup_%var%_data.json

rem Exécuter la commande Python pour créer le fichier de sauvegarde
python -Xutf8 manage.py dumpdata > %file_name%

set archive_name=backup_%var%.tar

rem Créer le répertoire s'il n'existe pas
if not exist "C:\media\references" (
    mkdir "C:\media\references"
)

rem Créer l'archive tar
tar -czvf %archive_name% %file_name% C:\media\references

rem Copier l'archive vers le répertoire de sauvegarde
copy %archive_name% C:\backup\

rem Supprimer le fichier de sauvegarde et l'archive temporaire
del %file_name%
del %archive_name%

rem Compter le nombre de sauvegardes dans le répertoire
for /f %%a in ('dir /b /a-d C:\backup ^| find /c /v ""') do set nb=%%a

rem Si plus de 5 sauvegardes, supprimer la plus ancienne
if %nb% gtr 5 (
    for /f "delims=" %%a in ('dir /b /a-d /o-d /t:c C:\backup') do set oldest=%%a
    del C:\backup\%oldest%
)
