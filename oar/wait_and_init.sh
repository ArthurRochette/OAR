if [ ! -d venv ]; then \
    echo "Creating venv" \
    && python3 -m venv venv \
; fi
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt
chmod +x routines/backup.sh
echo "Waiting for postgres..."
while ! nc -z $DB_HOST $DB_PORT; do 
  sleep 1 
done
echo "PostgreSQL started"
echo "OAR database"
source /oar/venv/bin/activate
python manage.py migrate
  
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18 && nvm use 18
npm install --global cross-env
cd /oar/theme/static_src/
npm install tailwindcss --save-dev
cd /oar/
python manage.py tailwind build
python manage.py collectstatic --noinput

if [ -f /oar/restore/*.tar ]; then
  # if multiple tar files, we take the last one
  tarfile=$(ls -t /oar/restore/*.tar | head -1)
  echo "Restoring from $tarfile"
  mkdir /oar/restore/tmp  
  tar -xvf $tarfile -C /oar/restore/tmp
  jsonfiles=$(ls /oar/restore/tmp/*.json)
  python3 manage.py loaddata $jsonfiles
  cp -r /oar/restore/tmp/media/* /media/
  rm -rf /oar/restore/tmp
  rm $tarfile
fi
if [ -f /oar/restore/*.json ];
then
  jsonfiles=$(ls /oar/restore/*.json)
  python3 manage.py loaddata $jsonfiles
fi

(echo "00 23 * * 1-5 /bin/bash /oar/routines/backup.sh") | crontab

echo "Here we go !"
python manage.py runserver 0.0.0.0:8000
exec "$@"
