import { Client, Collection, Snowflake, GatewayIntentBits, Partials } from "discord.js";
import { Command } from "../types/client.interface";
import { Cooldown } from "../types/cooldown.interface";
import { Game, CAH_Settings } from "../types/cah.interface";
import { Vote } from "../types/vote.interface";
import { Autoclass_Interface } from "../types/auto.interface";
import { Player } from "discord-music-player"

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>;
    public categories: string[] | null;
    public player: Player | null;

    public guildUsedCommandRecently: Collection<Snowflake, Cooldown>

    public member_troll_list: Collection<Snowflake, Autoclass_Interface>

    public cah_settings_embed: Collection<Snowflake, CAH_Settings>
    public cahgame: Collection<Snowflake, Game>;
    public cahlog: Collection<Snowflake, string>;

    public currentVote: Collection<Snowflake, Vote>

    constructor(){
        super({
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.GuildMessages, 
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Channel,
                Partials.Message,
                Partials.GuildMember
            ]
        });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.categories = null;
        this.player = null;

        //Here I use my global variables.

        //GUILDSTUFF
        this.guildUsedCommandRecently = new Collection();

        //Autotroll
        this.member_troll_list = new Collection();
        
        //CAH
        this.cah_settings_embed = new Collection();
        this.cahgame = new Collection();
        this.cahlog = new Collection();

        //Votecommands
        this.currentVote = new Collection();
    }
}