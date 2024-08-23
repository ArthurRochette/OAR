@echo off


rem Trouver le fichier de sauvegarde le plus récent
for /f "delims=" %%a in ('dir /b /a-d /o-d C:\backup') do set backup_file=%%a & goto :found
:found

rem Décompresser le fichier de sauvegarde
tar -xvf C:\backup\%backup_file% -C C:\backup

rem Trouver le fichier JSON de la sauvegarde
for /f "delims=" %%a in ('dir /b /a-d /o-d C:\backup\*.json') do set backup=%%a & goto :json_found
:json_found

echo %backup%

rem Restaurer la base de données
python manage.py loaddata C:\backup\%backup% --exclude auth.permission --exclude contenttypes

rem Déplacer le répertoire "media"
move C:\backup\media C:\

rem Supprimer le fichier de sauvegarde et le répertoire "media"
del /q C:\backup\%backup%
rmdir /s /q C:\backup\media
