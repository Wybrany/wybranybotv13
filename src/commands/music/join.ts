import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { joinVoiceChannel, DiscordGatewayAdapterCreator } from "@discordjs/voice";

export default class implements Command{
    name = "join";
    aliases = [];
    category = "music";
    description = "Joins the current voicechannel ";
    usage = "join";
    permission = PermissionFlagsBits.SendMessages;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        try{
            await message.delete();
            if(!message.guild || !message.member || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
    
            if (!message.member.voice.channel) 
                return message.error({content: "You need to be in a voice channel to summon me.", timed: 5000});
    
            const permissions = message.member.voice.channel.permissionsFor(client.user);
            if(!permissions?.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak))
                return message.error({content: `I need permissions to join and speak in your voicechannel.`, timed: 5000});
            
            return joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
            })
        }catch(_){}
    }
}