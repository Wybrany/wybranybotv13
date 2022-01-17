import dotenv from "dotenv";
import { readdirSync } from "fs";
import Modified_Client from "./client/Client";
import { Load_Commands } from "./managers/Command";
import { dirname, join } from "path";

import { Ready } from "./events/Ready";
import { InteractionCreate } from "./events/InteractionCreate";
import { GuildmemberAdd } from "./events/GuildmemberAdd";
import { GuildmemberUpdate } from "./events/GuildmemberUpdate";
import { VoicestateUpdate } from "./events/VoicestateUpdate";
import { MessageDelete } from "./events/MessageDelete";
import { MessageCreate } from "./events/MessageCreate";
import { PlayerEvents } from "./events/Player";
import { Player } from "discord-music-player";

import "./client/Message";
import "./client/Guild";
import "./client/GuildMember";

dotenv.config();

const discord_token = process.env.TOKEN as string;

if(!discord_token) {
    console.error(`No "TOKEN" was submitted as a discord token. Now exiting`); 
    process.exit(0);
}

const client = new Modified_Client();
client.categories = readdirSync(join(dirname(require.main!.filename), "commands"));
Load_Commands(client);

client.player = new Player(client, {
    leaveOnEmpty: false,
});
PlayerEvents(client);

client
    .on("ready", async () => Ready(client))
    .on("voiceStateUpdate", async (oldState, newState) => await VoicestateUpdate(client, oldState, newState))
    .on('interactionCreate', async interaction => await InteractionCreate(client, interaction))
    .on('guildMemberAdd', async member => await GuildmemberAdd(client, member))
    .on('guildMemberUpdate', async (guildMemberOld, guildMemberNew) => await GuildmemberUpdate(client, guildMemberOld, guildMemberNew))
    .on('messageDelete', async message => MessageDelete(client, message))
    .on("messageCreate", async message => MessageCreate(client, message))

    .login(discord_token);