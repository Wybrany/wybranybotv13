import { Client, Collection, Intents, Message } from "discord.js";
import { Command } from "src/interfaces/client.interface";

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>;
    public categories: string[] | null;

    constructor(){
        super({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

        //Here I use my global variables.

        this.commands = new Collection();
        this.aliases = new Collection();
        this.categories = null;
    }
}