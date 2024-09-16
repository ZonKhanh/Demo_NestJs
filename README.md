# Quick Sign

Render API for app

### RUN APPLICATION
> * Rename .env.example to .env
> * run command line from powershell
npm install
yarn start

###  COMMANDLINE EXPORT DATABASE
mongodump

###  COMMANDLINE IMPORT DATABASE
mongorestore --drop --host localhost --db quicksign [PATH_TO_DB_FOLDER]
mongorestore --drop --host localhost --db quicksign E:\NodeJS\QuickSign\backend\dump\quicksign