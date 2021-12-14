import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { joinVoiceChannel, DiscordGatewayAdapterCreator } from "@discordjs/voice";

export default class implements Command{
    name = "join";
    aliases = [];
    category = "music";
    description = "Joins the current voicechannel ";
    usage = "join";
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !message.member || !client.user) return deleteMessage(`Something went wrong. Please try again later.`, message);

        if (!message.member.voice.channel) 
            return deleteMessage("You need to be in a voice channel to summon me.", message);

        const permissions = message.member.voice.channel.permissionsFor(client.user);
        if(!permissions?.has("CONNECT") || !permissions.has("SPEAK"))
            return deleteMessage(`I need permissions to join and speak in your voicechannel.`, message, 5000);
        
        return joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        })
    }
}