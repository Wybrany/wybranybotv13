# wybranybotv13

This is my personal discordbot that I've been developing for some time. Recoded with discord.js v13 in mind and also trying out typescript.

This project is WORK IN PROGRESS.

## Installation

Download the repo using:

```bash
git clone https://github.com/Wybrany/wybranybotv13.git
```

## Setting up

After downloading the repo you have to download the node-modules using:

```bash
npm install
```

Create a .env file at the root directory and fill in the following environment variables:

```
#Your TOKEN for your client.
TOKEN=YOURCLIENTTOKEN  

#Change to "src" when developing, "dist" when running the complied js file.
BASE_PATH=src

#Change the standard prefix here. Command is available to change prefix per guild.
PREFIX=_

#Change to your discord id to bypass some restrictions suchas: owneronly commands, developer mode, permissions restrictions etc.
OWNERID=SOMEID
```

Some scripts are also available when developing/deploying:

```bash
npm run dev    #Utilizes ts-node-dev and restars the compiler on any filechange to get live feedback. Use only during development.
npm run build  #Compiles the typescript project into dist.
npm run start  #Runs the compiled typescript project located in dist.
```

## License
[MIT](https://choosealicense.com/licenses/mit/)