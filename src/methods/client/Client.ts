import { Client, Collection, Intents, Message } from "discord.js";

interface Command {
    name: string;
    aliases: string[];
    category: string;
    description: string;
    permission?: string;
    usage: string;
    ownerOnly?: boolean;
    developerMode?: boolean
    nsfw?: boolean;
    channelWhitelist?: string[];

    run: (client: Client, message: Message , args?: string[]) => void;
}

export default class extends Client {

    public commands: Collection<string, Command>;
    public aliases: Collection<string, string>

    constructor(){
        super({intents: [Intents.FLAGS.GUILDS]});
        this.commands = new Collection();
        this.aliases = new Collection();
    }
    //Here I use my global variables.
}