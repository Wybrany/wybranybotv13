import { Message, Permissions } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
//@ts-ignore
import htms from "human-to-milliseconds";

export default class implements Command{
    name = "seek";
    aliases = [];
    category = "music";
    description = "Seeks to a timestamp on a song that\'s current playing";
    usage = "seek <timestamp>, eg 1m20s or 20s";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    developerMode = false;
    params = true;
    
    run = async (client: Modified_Client, message: Message, args: string[]) => {

        await message.delete();
        if(!message.guild || !client.user) return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});
        if(!message.member?.voice.channel) return message.error({content: "You need to be in a voicechannel to use this command.", timed: 5000});

        const [ input ] = args;

        const seekMessage = await message.info({content: `Attemping to seek to **${input}**. Please wait, this might take a while.`})
        try{
            const time_ms = htms(input);
            if(!input || !time_ms || !Number.isInteger(time_ms)) return seekMessage.editEmbed({content: `You did not give me a proper timestamp. See following examples: **1m20s** or **20s**`, timed: 5000, colorOverride: "RED", title: "Error"});

            const queue = client.player?.getQueue(message.guild.id);
            if(!queue) return seekMessage.editEmbed({content: `There are currently no songs playing.`, timed: 5000, colorOverride: "RED", title: "Error"});

            const seek = await queue.seek(time_ms).catch(_ => {
                seekMessage.editEmbed({content: `Something went wrong with seeking. Please try again later.`, timed: 5000, colorOverride: "RED", title: "Error"});
            }) as boolean;

            if(seek){
                //seekMessage.editEmbed({content: `Successfully seeked to **${input}**. Enjoy!`, timed: 5000, colorOverride: "GREEN", title: "Sucess"});
            }

        }catch(e){
            return seekMessage.editEmbed({content: `Something went wrong. Please check your inputs. Please try again later.`, colorOverride: "RED", title: "Error", timed: 5000});
        }
    }
}