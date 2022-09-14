import dotenv from "dotenv";
import { ChannelType, Message, MessageType } from "discord.js";
import Modified_Client from "../client/Client";
import { Guild_used_command_recently } from "../managers/cooldown";
import { checkForMention } from "../utils/utils";

dotenv.config();

const prefix = process.env.PREFIX as string;
const OwnerId = process.env.OWNERID as string;

export const MessageCreate = async (client: Modified_Client, message: Message) => {
    if(message.author.bot || !message.guild || !message.member || message.channel.type !== ChannelType.GuildText || !message) return;
    if(message.type === MessageType.ThreadCreated || message.type === MessageType.ThreadStarterMessage) return;
    const guildprefix = message.guild.prefix;

    if(!message.content.startsWith(guildprefix)) return checkForMention(message, client, guildprefix);
    
    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift()?.toLowerCase() ?? null;
    if (!cmd) return checkForMention(message, client, guildprefix);
    
    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) ?? "");
    if (!command) return checkForMention(message, client, guildprefix);
    
    if(message.author.id === OwnerId) return command.run(client, message, args);
    if(command?.ownerOnly) return;
    if(command?.guildWhitelist && !command.guildWhitelist.includes(message.guild.id)) return;
    if(command?.developerMode) {
        await message.error({content: `This command is currently being developed. You can't use this now.`, timed: 5000});
        return;
    }
    if(!message.member.permissions.has(command.permission)){ 
        await message.error({content: `You don't have permission to use this command.`, timed: 5000});
        return;
    }

    if(command?.channelWhitelist?.length || command?.channelWhitelist?.includes(message.channel.name.toLowerCase())){
        const channelWhiteList: string[] = command?.channelWhitelist ?? [];
        const channels = message.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText && channelWhiteList.includes(channel.name));
        if(!channels.size){
            await message.error({content: `This command is only whitelisted in following channelnames: **${channelWhiteList.join(", ")}**, please create such channels to make **${command.name}** command work.`, timed: 5000});
            return;
        }
        
        const text = channels.map(channel => `<#${channel.id}>`).join(`, `);
        await message.error({content: `The command, **${command.name}**, can only be used in following channels: ${text}`, timed: 5000});
        return;
    }
    
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
}