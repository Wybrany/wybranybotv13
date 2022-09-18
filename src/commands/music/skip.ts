import { Message, PermissionFlagsBits } from "discord.js";
import { RepeatMode } from "../../player/index";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";

export default class implements Command{
    name = "skip";
    aliases = ["s", "next"];
    category = "music";
    description = "Skips the current track to the next track or to a submitted position";
    usage = "skip [songnumber]";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = false;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
        
        const guildQueue = client.player?.getQueue(message.guild.id);
        if(!guildQueue) return message.error({content: `There are no songs currently playing.`, timed: 5000});
        
        const [ song1 ] = args;
        
        let song1Index = 1;
        if(song1){
            song1Index = parseInt(song1, 10);
            if(!Number.isInteger(song1Index) || song1Index > guildQueue.songs.length) 
                return message.error({content: `You did not submit a valid songnumber.`, timed: 7500});
        }

        if(guildQueue.repeatMode === RepeatMode.SONG) guildQueue.skip();

        const nextSong = guildQueue.nextSong(song1Index);
        const nowPlayingText = nextSong ? `\n\nNow playing: **${nextSong}**` : ``;
        const song = song1Index === 1 ? guildQueue.skip() : guildQueue.skipTo(song1Index);

        message.success({content: `Skipped **${song?.name ?? "Unknown track"}**.${nowPlayingText}`, timed: 5000});
    }
}