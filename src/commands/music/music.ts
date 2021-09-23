import { Message, MessageEmbed, Permissions, MessageButton, MessageActionRow, TextChannel, MessageSelectMenu } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { MusicChannel } from "../../interfaces/music.interface";
import { savefiledata } from "../../methods/backup";

export default class implements Command{
    name = "music";
    aliases = [];
    category = "music";
    description = "The channel this command is used on will become your music channel.";
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
            .setTitle(`Idle - Not playing anything`)
            .setDescription(`
                Use ${guildSettings?.prefix ?? process.env.PREFIX}help music to display all available commands.
                
                To play something, use the play command as usual! The buttons below will help you navigate through songs easier.
                
                You can pause/resume, skip and stop the bot. You can also toggle Loop and shuffle with the buttons! 
                
                The Song Queue will show up songs queued up to 25 songs. If you select any of the songs in the queue, you will play that song! Do note that the current song will be skipped.
            
                If the buttons are not to your liking, you can always use the usual commands.
            `)
            .setColor("BLUE")
            .setFooter(``)
            .setTimestamp()
        
        const playPauseButton = new MessageButton()
            .setCustomId(`buttonPlayPause-${message.guild.id}`)
            .setLabel("Pause")
            .setStyle("PRIMARY")
            .setEmoji("⏯️")

        const skipButton = new MessageButton()
            .setCustomId(`buttonSkip-${message.guild.id}`)
            .setLabel("Skip")
            .setStyle("PRIMARY")
            .setEmoji("⏭️")

        const stopButton = new MessageButton()
            .setCustomId(`buttonStop-${message.guild.id}`)
            .setLabel("Stop")
            .setStyle("PRIMARY")
            .setEmoji("⏹️")
        
        const loopButton = new MessageButton()
            .setCustomId(`buttonLoop-${message.guild.id}`)
            .setLabel(`Loop`)
            .setStyle("DANGER")
            .setEmoji("🔄")

        const shuffleButton = new MessageButton()
            .setCustomId(`buttonShuffle-${message.guild.id}`)
            .setLabel(`Shuffle`)
            .setStyle("DANGER")
            .setEmoji("🔀")

        const firstButtons = new MessageActionRow()
            .addComponents(playPauseButton, stopButton, skipButton, loopButton, shuffleButton);

        const selectButton = new MessageSelectMenu()
            .setCustomId(`selectSongQueue-${message.guild.id}`)
            .setPlaceholder("Song Queue")
            .addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"})
            .setDisabled()

        const songQueue = new MessageActionRow()
            .addComponents(selectButton)
        
        const newMessage = await message.channel.send({embeds: [musicEmbed], components: [firstButtons, songQueue]});
        const musicChannel: MusicChannel = {
            guildid: message.guild.id,
            channelid: message.channel.id,
            embedid: newMessage.id,
            buttons: {
                playpausebutton: <string>playPauseButton.customId, 
                skipbutton: <string>skipButton.customId,
                stopbutton: <string>stopButton.customId,
                loopbutton: <string>loopButton.customId,
                shufflebutton: <string>shuffleButton.customId
            },
            songqueue: {
                songqueue: <string>selectButton.customId
            }
        }

        if(guildSettings) client.guildsettings.set(message.guild.id, {...guildSettings, musicChannel});
        else client.guildsettings.set(message.guild.id, {guildid: message.guild.id, musicChannel});
        savefiledata(client, message.guild.id);
    }
}