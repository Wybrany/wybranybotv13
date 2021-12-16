import { Client, Collection, Intents, Snowflake } from "discord.js";
import { Command } from "../interfaces/client.interface";
import { Cooldown } from "../interfaces/cooldown.interface";
import { Game, CAH_Settings } from "../interfaces/cah.interface";
import { Vote } from "../interfaces/vote.interface";
import { Autoclass_Interface } from "../interfaces/auto.interface";
import { Player } from "discord-music-player"

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>;
    public categories: string[] | null;
    public player: Player | null;

    public guildUsedCommandRecently: Map<Snowflake, Cooldown>

    public member_troll_list: Map<Snowflake, Autoclass_Interface>

    public cah_settings_embed: Map<Snowflake, CAH_Settings>
    public cahgame: Map<Snowflake, Game>;
    public cahlog: Map<Snowflake, string>;

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
        this.player = null;

        //Here I use my global variables.

        //GUILDSTUFF
        this.guildUsedCommandRecently = new Map();

        //Autotroll
        this.member_troll_list = new Map();
        
        //CAH
        this.cah_settings_embed = new Map();
        this.cahgame = new Map();
        this.cahlog = new Map();

        //Votecommands
        this.currentVote = new Map();
    }
}