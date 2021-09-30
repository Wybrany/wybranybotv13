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
    developerMode=false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        await message.delete();
        if(!message.guild) return message.reply({content: 'Something went wrong. Please try again later.'});

        const guildSettings = client.guildsettings.get(message.guild.id);
        
        //If there was a previous musicChannel, delete that message
        //Because we don't want conflicting buttons, not that it really matter tho but anyways;
        if(guildSettings?.musicChannel && message.guild.channels.cache.has(guildSettings?.musicChannel?.channelid ?? "")){
            const { channelid, embedid } = guildSettings.musicChannel;
            const channel = message.guild.channels.cache.get(channelid) as TextChannel;
            const prevMessage = await channel.messages.fetch(embedid).catch(e => console.log(e));
            if(prevMessage) prevMessage.delete();
        }
        
        const musicEmbed = new MessageEmbed()
            .setTitle(`Idle - Not playing anything`)
            .setDescription(`
                Use ${guildSettings?.prefix ?? process.env.PREFIX}help music to display all available commands.
                
                To play something, use the play command as usual! The buttons will help you navigate through songs easier.
                
                You can pause/resume, skip and stop the bot. You can also toggle Loop and shuffle with the buttons! 
                
                The Song Queue will show songs queued up to 25 songs. Use the buttons below the Song Queue to toggle Select, Remove or Swap. 
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
        
        //QueuePageButtons
        /*const skipToFirst = new MessageButton()
            .setCustomId(`firstPageQueue-${message.guild.id}`)
            .setLabel(`First Page`)
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("⏮️")
            
        const nextPageButton = new MessageButton()
            .setCustomId(`nextPageQueue-${message.guild.id}`)
            .setLabel(`Next Page`)
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("▶️")

        const prevPageButton = new MessageButton()
            .setCustomId(`prevPageQueue-${message.guild.id}`)
            .setLabel(`Previous Page`)
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("◀️")

        const skipToLast = new MessageButton()
            .setCustomId(`lastPageQueue-${message.guild.id}`)
            .setLabel(`Last Page`)
            .setStyle("PRIMARY")
            .setDisabled(true)
            .setEmoji("⏭️")*/

        /*const queuePageButtons = new MessageActionRow()
            .addComponents(skipToFirst, prevPageButton, nextPageButton, skipToLast)*/

        const selectButtons = new MessageActionRow()
            .addComponents(selectButton, removeButton, swapButton)

        const songQueue = new MessageActionRow()
            .addComponents(selectMenu)

        const newMessage = await message.channel.send({embeds: [musicEmbed], components: [firstButtons, songQueue, selectButtons]});
        const musicChannel: MusicChannel = {
            guildid: message.guild.id,
            channelid: message.channel.id,
            embedid: newMessage.id,
            buttons: {
                playpausebutton: playPauseButton.customId as string, 
                skipbutton: skipButton.customId as string, 
                stopbutton: stopButton.customId as string, 
                loopbutton: loopButton.customId as string, 
                shufflebutton: shuffleButton.customId as string
            },
            songqueue: {
                songqueue: selectMenu.customId as string
            },
            selectButtons: {
                selectButton: selectButton.customId as string,
                removeButton: removeButton.customId as string,
                swapButton: swapButton.customId as string
            },
            /*queuePageButtons: {
                skiptofirstpagebutton: skipToFirst.customId as string,
                nextpagequeuebutton: nextPageButton.customId as string,
                prevpagequeuebutton: prevPageButton.customId as string,
                skiptolastpagebutton: skipToLast.customId as string
            }*/
        }

        if(guildSettings) client.guildsettings.set(message.guild.id, {...guildSettings, musicChannel});
        else client.guildsettings.set(message.guild.id, {guildid: message.guild.id, musicChannel});
        savefiledata(client, message.guild.id);
    }
}