#!/bin/bash
# find the latest backup file
source ../venv/bin/activate
backup_file=$(ls -t /backup/ | head -1)
# decompress the backup file
tar -xzvf /backup/$backup_file -C /backup
# restore the database
backup=$(ls -t /backup/ | grep .json | head -1)
echo $backup
python /oar/manage.py loaddata /backup/$backup --exclude auth.permission --exclude contenttypes 
mv /backup/media /

rm -rf /backup/$backup
rm -rf /backup/media


echo "Pensez a reactualiser le cache"
