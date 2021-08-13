import dotenv from "dotenv";
import { Client, Intents } from "discord.js";
import Modified_Client from "./methods/client/Client";
import {} from "./methods/commandhandler/Command";

dotenv.config();
const discord_token = process.env.TOKEN as string;
const base_path = process.env.BASE_PATH as string;
const prefix = process.env.PREIX as string;
if(!discord_token || !base_path) {console.log(`No "TOKEN" was submitted as a discord token or missing "BASE_PATH". Now exiting`); process.exit(0)}

const client = new Modified_Client();

client.on("messageCreate", message => {
    if(message.author.bot || !message.guild || !message.member) return;
    if(!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args?.shift()?.toLowerCase() ?? null;
    if (!cmd) return;

    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
    if (!command) return;
})

client.login(process.env.TOKEN);