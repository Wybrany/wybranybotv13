import { Message, MessageEmbed, Permissions, MessageButton, MessageActionRow, TextChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { MusicChannel } from "../../interfaces/music.interface";
import { savefiledata } from "../../methods/backup";

export default class implements Command{
    name = "music";
    aliases = [];
    category = "music";
    description = "The channel this command is triggered on will become your music channel.";
    usage = "music";
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        await message.delete();
        if(!message.guild) return message.reply({content: 'Something went wrong. Please try again later.'});

        const guildSettings = client.guildsettings.get(message.guild.id);
        
        //If there was a previous musicChannel, delete that message
        //Because we don't want conflicting buttons;
        if(guildSettings?.musicChannel && message.guild.channels.cache.has(guildSettings?.musicChannel?.channelid ?? "")){
            const { channelid, embedid } = guildSettings.musicChannel;
            const channel = <TextChannel>message.guild.channels.cache.get(channelid);
            const prevMessage = await channel.messages.fetch(embedid).catch(e => console.log(e));
            if(prevMessage) prevMessage.delete();
        }
        const musicEmbed = new MessageEmbed()
            .setTitle("Something")
            .setDescription("Hello world")
            .setColor("BLUE")
            .setFooter("Some text")
            .setTimestamp()
        
        const playButton = new MessageButton()
            .setCustomId(`button-play-${message.guild.id}`)
            .setLabel("Play")
            .setStyle("PRIMARY");

        const pauseButton = new MessageButton()
            .setCustomId(`button-pause-${message.guild.id}`)
            .setLabel("Pause")
            .setStyle("PRIMARY");

        const skipButton = new MessageButton()
            .setCustomId(`button-skip-${message.guild.id}`)
            .setLabel("Skip")
            .setStyle("PRIMARY");

        const interaction = new MessageActionRow()
            .addComponents(playButton, pauseButton, skipButton);
        
        const newMessage = await message.channel.send({embeds: [musicEmbed], components: [interaction]});
        const musicChannel: MusicChannel = {
            guildid: message.guild.id,
            channelid: message.channel.id,
            embedid: newMessage.id,
            buttons: {
                playbutton: <string>playButton.customId, 
                pausebutton: <string>pauseButton.customId,
                skipbutton: <string>skipButton.customId
            }
        }

        if(guildSettings) client.guildsettings.set(message.guild.id, {...guildSettings, musicChannel});
        else client.guildsettings.set(message.guild.id, {guildid: message.guild.id, musicChannel});
        savefiledata(client, message.guild.id);
    }
}