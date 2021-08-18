import dotenv from "dotenv";
import { readdirSync } from "fs";
import Modified_Client from "./methods/client/Client";
import { Load_Commands } from "./methods/commandhandler/Command";
import { loadfiledata } from "./methods/backup";
import { Guild_used_command_recently } from "./methods/cooldown"; 

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
    client.user?.setActivity({type: "WATCHING", name: "dedu"});
    await loadfiledata(client);
})

client.on("messageCreate", message => {
    if(message.author.bot || !message.guild || !message.member || message.channel.type !== "GUILD_TEXT" || !message) return;
    const guildprefix = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id)?.prefix ?? prefix : prefix;
    if(!message.content.startsWith(guildprefix)) return console.log("Not here either")

    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift()?.toLowerCase() ?? null;
    if (!cmd) return;

    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) ?? "");
    if (!command) return;
    
    const channelWhiteList = command.channelWhitelist?.length ? command.channelWhitelist.includes(message.channel.name) : null;
    if(channelWhiteList !== null && channelWhiteList === false){
        const channelWhiteList: string[] = command?.channelWhitelist ?? [];
        const channels = message.guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT" && channelWhiteList.includes(channel.name));
        if(!channels.size) {
            message.reply({content: `This command is only whitelisted in following channelnames: **${channelWhiteList.join(", ")}**, please create such channels to make **${command.name}** command work.`})
            return;
        }
        
        const text = channels.map(channel => `<#${channel.id}>`).join(`, `);
        message.reply({content: `The command, **${command.name}**, can only be used in following channels: ${text}`});
        return;
    }

    //Check for nsfw property on channels later
    /*if(command.nsfw !== undefined && command.nsfw){
        const channels = message.guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT");
        if(!channels.size) return;
        const text = channels.map(channel => `<#${channel.id}>`).join(`, `);  
        message.reply({content: `The command, **${command.name}**, can only be used in NSFW channels: ${text}`});
        return;
    }*/

    if(message.author.id === OwnerId) return command.run(client, message, args);
    if(!message.member.permissions.has(command.permission)){
        message.reply({content: `You don't have permission to use this command.`});
        return;
    }
    if(command?.developerMode){
        message.reply({content: `This command is currently being developed. You can't use this command.`});
        return;
    }
    if(command?.ownerOnly){
        message.reply({content: `This command is for owner only.`});
        return;
    }

    //Handling cooldown logic

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