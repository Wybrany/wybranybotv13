import dotenv from "dotenv";
import { Client, Intents } from "discord.js";

dotenv.config();
const discord_token = process.env.TOKEN as string;
if(!discord_token) {console.log(`No "TOKEN" was submitted as a discord token. Now exiting`); process.exit(0)}

const client = new Client({intents: [Intents.FLAGS.GUILDS]});

client.on("messageCreate", message => {
    
})

client.login(process.env.TOKEN);