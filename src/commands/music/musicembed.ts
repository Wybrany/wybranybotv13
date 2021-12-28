import { Message, MessageEmbed, Permissions, MessageButton, MessageActionRow, TextChannel, MessageSelectMenu } from "discord.js";
import MusicEmbed from "../../methods/music/MusicEmbed";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
import { MusicChannel } from "../../interfaces/music.interface";
import { savefiledata } from "../../methods/backup";

export default class implements Command{
    name = "musicembed";
    aliases = ["music"];
    category = "music";
    description = "The channel this command is used on will become your music channel.";
    usage = "musicembed";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});

        
        //If there was a previous musicChannel, delete that message
        //Because we don't want conflicting buttons, not that it really matter tho but anyways;
        if(message.guild?.musicChannel && message.guild.channels.cache.has(message.guild?.musicChannel?.channelid ?? "")){
            const { channelid, embedid } = message.guild.musicChannel;
            const channel = message.guild.channels.cache.get(channelid) as TextChannel;
            const prevMessage = channel.messages.cache.get(embedid) || await channel.messages.fetch(embedid).catch(e => {}) || null;
            if(prevMessage) {
                await prevMessage.delete();
                message.guild.musicEmbed = null;
            }
        }

        const musicEmbed = new MessageEmbed()
            .setTitle(`Idle - Not playing anything`)
            .setDescription(`
                Use ${message.guild.prefix}play or ${message.guild.prefix}playlist commands to start playing music. The buttons below will help you navigate through your queue and give you live feedback.
                
                See ${message.guild.prefix}help to see available commands for your server.
            `)
            .setColor("BLUE")
            .setFooter(``)
            .setTimestamp()
        
        //Songbuttons
        const playPauseButton = new MessageButton()
            .setCustomId(`buttonPlayPause-${message.guild.id}`)
            .setLabel("Pause")
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("⏯️")
        
        const skipButton = new MessageButton()
            .setCustomId(`buttonSkip-${message.guild.id}`)
            .setLabel("Skip")
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("⏭️")

        const stopButton = new MessageButton()
            .setCustomId(`buttonStop-${message.guild.id}`)
            .setLabel("Stop")
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("⏹️")
        
        const loopButton = new MessageButton()
            .setCustomId(`buttonLoop-${message.guild.id}`)
            .setLabel(`Loop`)
            .setStyle("DANGER")
            .setDisabled(true)
            .setEmoji("🔁")

        const shuffleButton = new MessageButton()
            .setCustomId(`buttonShuffle-${message.guild.id}`)
            .setLabel(`Shuffle`)
            .setStyle("DANGER")
            .setDisabled(true)
            .setEmoji("🔀")

        const firstButtons = new MessageActionRow()
            .addComponents(playPauseButton, stopButton, skipButton, loopButton, shuffleButton);

        //SelectMenu
        const selectMenu = new MessageSelectMenu()
            .setCustomId(`selectSongQueue-${message.guild.id}`)
            .setPlaceholder("Song Queue")
            .addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"})
            .setDisabled(true)
        
        //SelectButtons
        const selectButton = new MessageButton()
            .setCustomId(`buttonSelect-${message.guild.id}`)
            .setLabel("Select Song")
            .setStyle("SUCCESS")
            .setDisabled(true)
            .setEmoji("✅");

        const removeButton = new MessageButton()
            .setCustomId(`buttonRemove-${message.guild.id}`)
            .setLabel("Remove Songs")
            .setStyle("DANGER")
            .setDisabled(true)
            .setEmoji("❌");

        const swapButton = new MessageButton()
            .setCustomId(`buttonSwap-${message.guild.id}`)
            .setLabel("Swap Songs")
            .setStyle("DANGER")
            .setDisabled(true)
            .setEmoji("🔃");

        const selectButtons = new MessageActionRow()
            .addComponents(selectButton, removeButton, swapButton)

        const songQueue = new MessageActionRow()
            .addComponents(selectMenu)

        const newMessage = await message.channel.send({embeds: [musicEmbed], components: [firstButtons, songQueue, selectButtons]});

        const newMusicChannel: MusicChannel = {
            guildid: message.guild.id,
            channelid: message.channel.id,
            embedid: newMessage.id
        }

        message.guild.musicChannel = newMusicChannel;
        message.guild.musicEmbed = new MusicEmbed(message.guild, newMusicChannel);
        savefiledata(client, message.guild.id);
    }
}