import { Message, Permissions } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { joinVoiceChannel } from "@discordjs/voice";

export default class implements Command{
    name = "join";
    aliases = [];
    category = "music";
    description = "Joins the current voicechannel ";
    usage = "join";
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        if(!message.guild || !message.member) return;

        if (!message.member.voice.channel) 
            return message.reply({content: "You need to be in a voice channel to summon me."});
        
        return joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        })
    }
}