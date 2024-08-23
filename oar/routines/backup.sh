#!/bin/sh

var=$(date +"%d_%m_%Y")
file_name="backup_${var}_data.json"

source /oar/venv/bin/activate
python3 manage.py dumpdata > $file_name

archive_name="backup_${var}.tar"

[ -d "/media/references" ] || mkdir -p "/media/references"

tar -czvf $archive_name $file_name /media/references

cp $archive_name /backup
rm $file_name
rm $archive_name

# count the number of backups
nb=$(ls -1 /backup | wc -l)
# if there are more than 5, delete the oldest
if [ $nb -gt 5 ]
then
  oldest=$(ls -t /backup | tail -1)
  rm /backup/$oldest
fi


