import { Client, Collection, Guild, Intents, Message } from "discord.js";
import { Command } from "src/interfaces/client.interface";
import { Guildsettings } from "src/interfaces/guildsettings.interface";
import { Cooldown } from "src/interfaces/cooldown.interface";

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>;
    public categories: string[] | null;

    public guildsettings: Map<string, Guildsettings>;
    public guildUsedCommandRecently: Map <string, Cooldown>

    //public cahsettings: Map<>;
    //public cahgame: Map<>;
    //public players: Map<>;
    public cahlog: string;

    constructor(){
        super({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

        //Here I use my global variables.

        this.commands = new Collection();
        this.aliases = new Collection();
        this.categories = null;

        //GUILDSTUFF
        this.guildsettings = new Map();
        this.guildUsedCommandRecently = new Map();

        //CAH
        //this.cahsettings = new Map();
        //this.cahgame = new Map();
        //this.players = new Map();
        this.cahlog = "";
    }
}