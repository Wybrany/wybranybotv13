import { Message, Permissions, TextChannel } from "discord.js";
import MusicEmbed from "../../managers/MusicEmbed";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { MusicChannel } from "../../types/music.interface";
import { savefiledata } from "../../managers/backup";
import { ButtonSelectState, EmbedState } from "discord-music-player";

export default class implements Command{
    name = "musicembed";
    aliases = ["music"];
    category = "music";
    description = "The channel this command is used on will become your music channel.";
    usage = "musicembed";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        
        //If there was a previous musicChannel, delete that message
        //Because we don't want conflicting buttons, not that it really matter tho but anyways;
        if(message.guild?.musicChannel && message.guild.channels.cache.has(message.guild?.musicChannel?.channelid)){
            try {
                const { channelid, embedid } = message.guild.musicChannel;
                const channel = message.guild.channels.cache.get(channelid) as TextChannel;
                const prevMessage = channel.messages.cache.get(embedid) ?? await channel.messages.fetch(embedid) ?? null;
                if(prevMessage) await prevMessage.delete();
            }
            catch(_){}
        }

        let guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) guildQueue = client.player?.createQueue(message.guild.id);
        const { embed } = guildQueue!.createMessageEmbed({embedState: guildQueue!.isPlaying ? EmbedState.NOWPLAYING : EmbedState.STOPPED});
        const { buttons } = guildQueue!.createMessageButtons({currentQueuePage: 0, selectState: ButtonSelectState.SELECT, disabled: guildQueue!.isPlaying ? false : true});

        const newMessage = await message.channel.send({embeds: [embed], components: [...buttons]});

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