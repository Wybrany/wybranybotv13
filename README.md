# wybranybotv13

This is my personal discordbot that I've been developing for some time. Recoded with discord.js v14 in mind and also trying out typescript.

## Installation

Download the repo using:

```bash
git clone https://github.com/Wybrany/wybranybotv13.git
```

## Setting up

After downloading the repo you have to download the node-modules using:

```bash
cd wybranybotv13
npm install
```

Create a .env file at the root directory and fill in the following environment variables:
```bash
touch .env
```

```
#Your TOKEN for your client.
TOKEN=YOURCLIENTTOKEN

#Change the standard prefix here. Command is available to change prefix per guild.
PREFIX=?

#Change to your discord id to bypass some restrictions suchas: owneronly commands, developer mode, permissions restrictions etc.
OWNERID=SNOWFLAKE

#Here you can change the maxcommands before throttle (1 command per 5 sec)
MAX_COMMANDS=NUMBER

#Not required atm
MYSQL_HOST=127.0.0.1
MYSQL_USER=username
MYSQL_PASSWORD=password
MYSQL_DATABASE=database
```

Some scripts are also available when developing/deploying:

```bash
npm run dev    #Utilizes ts-node-dev and restars the compiler on any filechange to get live feedback. Use only during development.
npm run build  #Compiles the typescript project into dist.
npm run start  #Runs the compiled typescript project located in dist.
```

## License
[MIT](https://choosealicense.com/licenses/mit/)