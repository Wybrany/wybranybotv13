import { Message, PermissionFlagsBits } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
//@ts-ignore
import htms from "human-to-milliseconds";

export default class implements Command{
    name = "seek";
    aliases = [];
    category = "music";
    description = "Seeks to a timestamp on a song that\'s current playing";
    usage = "seek <timestamp>, eg 1m20s or 20s";
    permission = PermissionFlagsBits.SendMessages;
    developerMode = false;
    params = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {
        try{
            await message.delete();
            if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
            if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});
    
            const [ input ] = args;
    
            let seekMessage = null as Message | null;
            try{
                if(!message.guild.musicEmbed) seekMessage = await message.info({content: `Attemping to seek to **${input}**. Please wait, this might take a while.`});
                const time_ms = htms(input);
                if(!input || !time_ms || !Number.isInteger(time_ms)) return seekMessage?.editEmbed({content: `You did not give me a proper timestamp. See following examples: **1m20s** or **20s**`, timed: 5000, colorOverride: "Red", title: "Error"});
    
                const queue = client.player?.getQueue(message.guild.id);
                if(!queue) return seekMessage?.editEmbed({content: `There are currently no songs playing.`, timed: 5000, colorOverride: "Red", title: "Error"});
    
                await queue.seek(time_ms).catch(_ => {
                    seekMessage?.editEmbed({content: `Something went wrong with seeking. Please try again later.`, timed: 5000, colorOverride: "Red", title: "Error"});
                }) as boolean;
    
                if(seekMessage){
                    client.player?.on("seeking", (queue, seekState) => {
                        const { finishedSeeking } = seekState;
                        if(finishedSeeking) seekMessage?.editEmbed({content: `Successfully seeked to **${input}**. Enjoy!`, timed: 5000, colorOverride: "Green", title: "Sucess"});
                        return;
                    });
                }
    
            }catch(e){
                return seekMessage?.editEmbed({content: `Something went wrong. Please check your inputs. Please try again later.`, colorOverride: "Red", title: "Error", timed: 5000});
            }
        }catch(_){}
    }
}