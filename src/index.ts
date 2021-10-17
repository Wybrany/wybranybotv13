import dotenv from "dotenv";
import { readdirSync } from "fs";
import Modified_Client from "./methods/client/Client";
import { Load_Commands } from "./methods/commandhandler/Command";
import { loadfiledata } from "./methods/backup";
import { Guild_used_command_recently } from "./methods/cooldown";
import { checkForMention } from "./methods/checkForMention";
import { setMaxListeners } from "process";
import { deleteMessage } from "./methods/deletemessage";
import { InteractionCreate } from "./methods/events/InteractionCreate";
import { GuildmemberAdd } from "./methods/events/GuildmemberAdd";
import { GuildmemberUpdate } from "./methods/events/GuildmemberUpdate";
import { VoicestateUpdate } from "./methods/events/VoicestateUpdate";
import { MessageDelete } from "./methods/events/MessageDelete";

setMaxListeners(100);
dotenv.config();

const discord_token = process.env.TOKEN as string;
const base_path = process.env.BASE_PATH as string;
const prefix = process.env.PREFIX as string;
const OwnerId = process.env.OWNERID as string;

if(!discord_token || !base_path) {console.log(`No "TOKEN" was submitted as a discord token or missing "BASE_PATH". Now exiting`); process.exit(0)}

const client = new Modified_Client();
client.categories = readdirSync(`./${base_path}/commands`);
Load_Commands(client, base_path);

client.on("ready", async () => {
    console.log(`Successfully Logged in as ${client.user?.username}! (${client.user?.id})\nCurrently serving: ${client.guilds.cache.size} servers.`);
    client.user?.setActivity({name: "@me for prefix.", type: "CUSTOM"});
    loadfiledata(client);
});

client.on("voiceStateUpdate", async (oldState, newState) => await VoicestateUpdate(client, oldState, newState));
client.on('interactionCreate', async interaction => await InteractionCreate(client, interaction));
client.on('guildMemberAdd', async member => await GuildmemberAdd(client, member));
client.on('guildMemberUpdate', async (guildMemberOld, guildMemberNew) => await GuildmemberUpdate(client, guildMemberOld, guildMemberNew));
client.on('messageDelete', async message => MessageDelete(client, message));

client.on("messageCreate", async message => {
    if(message.author.bot || !message.guild || !message.member || message.channel.type !== "GUILD_TEXT" || !message) return;
    if(message.type === "THREAD_CREATED" || message.type === "THREAD_STARTER_MESSAGE") return;

    const guildprefix = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id)?.prefix ?? prefix : prefix;
    if(!message.content.startsWith(guildprefix)) return checkForMention(message, client, guildprefix);

    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift()?.toLowerCase() ?? null;
    if (!cmd) return checkForMention(message, client, guildprefix);
    
    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) ?? "");
    if (!command) return checkForMention(message, client, guildprefix);
    
    if(command?.channelWhitelist?.length || command?.channelWhitelist?.includes(message.channel.name)){
        const channelWhiteList: string[] = command?.channelWhitelist ?? [];
        const channels = message.guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT" && channelWhiteList.includes(channel.name));
        if(!channels.size)
            return await deleteMessage(`This command is only whitelisted in following channelnames: **${channelWhiteList.join(", ")}**, please create such channels to make **${command.name}** command work.`, message, 10000)
        
        const text = channels.map(channel => `<#${channel.id}>`).join(`, `);
        return await deleteMessage(`The command, **${command.name}**, can only be used in following channels: ${text}`, message, 10000);
    }

    if(message.author.id === OwnerId) return command.run(client, message, args);
    if(!message.member.permissions.has(command.permission)) return await deleteMessage(`You don't have permission to use this command.`, message, 5000);
    if(command?.developerMode) return await deleteMessage(`This command is currently being developed. You can't use this now.`, message, 5000);
    if(command?.ownerOnly) return;
    if(command?.guildWhitelist?.includes(message.guild.id || message.guild.name)) return;

    //Handling cooldowns
    if(!client.guildUsedCommandRecently.has(message.guild.id)) 
        client.guildUsedCommandRecently.set(message.guild.id, new Guild_used_command_recently(message.guild.id));

    const usedCommandRecently = client.guildUsedCommandRecently.get(message.guild.id);
    if(!usedCommandRecently) return console.warn(`Usedcommandrencelty does not exist for this guild ${message.guild.id} for some reason`);
    if(usedCommandRecently.is_on_cooldown()) return usedCommandRecently.send_warning_message(message);
    else usedCommandRecently.change_warning_message(false);

    if(!usedCommandRecently.timer_started) usedCommandRecently.start_timer();
    else usedCommandRecently.sub_commandremaining();

    command.run(client, message, args);
})

client.login(discord_token);