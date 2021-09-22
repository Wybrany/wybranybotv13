import { Client, Collection, Guild, Intents, Message } from "discord.js";
import { Command } from "src/interfaces/client.interface";
import { Guildsettings } from "src/interfaces/guildsettings.interface";
import { Cooldown } from "src/interfaces/cooldown.interface";
import { Game } from "src/interfaces/cah.interface";
import { Vote } from "src/interfaces/vote.interface";
import { MusicConstructorInterface } from "src/interfaces/music.interface";

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>;
    public categories: string[] | null;

    public guildsettings: Map<string, Guildsettings>;
    public guildUsedCommandRecently: Map <string, Cooldown>

    public cahsettings: Map<string, {}>;
    public cahgame: Map<string, Game>;
    public cahlog: string[];

    public music: Map<string, MusicConstructorInterface>

    public currentVote: Map<string, Vote>

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
        this.cahsettings = new Map();
        this.cahgame = new Map();
        this.cahlog = [];

        //Musiccommand
        this.music = new Map();

        //Votecommands
        this.currentVote = new Map();
    }
}