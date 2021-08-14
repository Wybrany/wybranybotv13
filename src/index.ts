import("dotenv").then(() => config());

import { Client, Intents, Permissions } from "discord.js";
import { config } from "dotenv";
import { chmod, readdirSync, readFileSync } from "fs";
import Modified_Client from "./methods/client/Client";
import { Commands } from "./methods/commandhandler/Command";

const discord_token = process.env.TOKEN as string;
const base_path = process.env.BASE_PATH as string;
const prefix = process.env.PREFIX as string;
const OwnerId = process.env.OWNERID as string;

if(!discord_token || !base_path) {console.log(`No "TOKEN" was submitted as a discord token or missing "BASE_PATH". Now exiting`); process.exit(0)}

const client = new Modified_Client();
client.categories = readdirSync(`./${base_path}/commands`);
Commands(client, base_path);

client.on("ready", () => {
    console.log(`Successfully Logged in as ${client.user?.username}! (${client.user?.id})\nCurrently serving: ${client.guilds.cache.size} servers.`);
    client.user?.setActivity({type: "WATCHING", name: "dedu"});
})

client.on("messageCreate", message => {
    if(message.author.bot || !message.guild || !message.member || message.channel.type !== "GUILD_TEXT") return;
    if(!message.content.startsWith(prefix)) return console.log("Not here either")

    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift()?.toLowerCase() ?? null;
    if (!cmd) return;

    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) ?? "");
    if (!command) return;

    console.log(command)

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
    if(!message.member.permissions.has(command?.permission || Permissions.FLAGS.SEND_MESSAGES)) {
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

    //Maybe add command cooldown class here later.

    command.run(client, message, args);
})

client.login(process.env.TOKEN);