import { Client, Collection, Guild, Intents, Message } from "discord.js";
import { Command } from "src/interfaces/client.interface";
import { Guildsettings } from "src/interfaces/guildsettings.interface";
import { Cooldown } from "src/interfaces/cooldown.interface";
import { Game, CurrentSettings, CAH_Settings } from "src/interfaces/cah.interface";
import { Vote } from "src/interfaces/vote.interface";
import { MusicConstructorInterface } from "src/interfaces/music.interface";
import { Autoclass_Interface } from "src/interfaces/auto.interface";

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>;
    public categories: string[] | null;

    public guildsettings: Map<string, Guildsettings>;
    public guildUsedCommandRecently: Map<string, Cooldown>

    public member_troll_list: Map<string, Autoclass_Interface>

    public cah_settings_embed: Map<string, CAH_Settings>
    public cahsettings: Map<string, CurrentSettings>;
    public cahgame: Map<string, Game>;
    public cahlog: string[];

    public music: Map<string, MusicConstructorInterface>

    public currentVote: Map<string, Vote>

    constructor(){
        super({
            intents: [
                Intents.FLAGS.GUILDS, 
                Intents.FLAGS.GUILD_MESSAGES, 
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.GUILD_MEMBERS
            ]
        });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.categories = null;

        //Here I use my global variables.

        //GUILDSTUFF
        this.guildsettings = new Map();
        this.guildUsedCommandRecently = new Map();

        //Autotroll
        this.member_troll_list = new Map();

        //CAH
        this.cah_settings_embed = new Map();
        this.cahsettings = new Map();
        this.cahgame = new Map();
        this.cahlog = [];

        //Musiccommand
        this.music = new Map();

        //Votecommands
        this.currentVote = new Map();
    }
}