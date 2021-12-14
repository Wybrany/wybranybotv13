import { GuildChannel, Message, Permissions, VoiceChannel } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../interfaces/client.interface";
import { deleteMessage } from "../../methods/deletemessage";
import { shuffle } from "../../methods/shuffle"

export default class implements Command{
    name = "moveall";
    aliases = [];
    category = "fun";
    description = "Moves all members in a voicechannel to either a random one or selected one";
    usage = "moveall <random | voicechannelid | voicechannelname | @mention>";
    permission = Permissions.FLAGS.ADMINISTRATOR;
    params = true;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        if(!message.guild) return;

        await message.delete();
        const [ input ] = args;

        let selectedChannelID: string | null = null;
        const allAvailableChannels = [...message.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').values()] as VoiceChannel[];
        const randomChannel = shuffle(allAvailableChannels.length, 1) as number;
        switch(input){
            case 'random':
                selectedChannelID = allAvailableChannels[randomChannel]?.id ?? null;
                console.log("Random!");
            break;
            
            case undefined:
            case null:
                console.log("Nothing!")
                const channels_with_members = [];
                for(const channel of allAvailableChannels){
                    const members = [...channel.members.values()];
                    if(members.length) channels_with_members.push({channelID: channel.id, members: members.length});
                }
                const sort_channel_with_members = channels_with_members.sort((a, b) => b.members - a.members);
                if(sort_channel_with_members.length === 1) selectedChannelID = allAvailableChannels[randomChannel]?.id ?? null;
                else selectedChannelID = sort_channel_with_members[0]?.channelID ?? null;
            break;
            
            default: 
                console.log("None of the above. Guessing mention.");
                const mention = message.mentions.users.first() || message.guild.members.cache.get(input) || null;
                if(!mention) {
                    const findChannelWithInput = allAvailableChannels.find(c => c.name.toLowerCase().includes(input.toLowerCase()));
                    if(findChannelWithInput) selectedChannelID = findChannelWithInput.id;
                    else selectedChannelID = allAvailableChannels[randomChannel]?.id ?? null;
                }
                else{
                    const member = message.guild.members.cache.get(mention.id);
                    if(member?.voice.channel) selectedChannelID = member.voice.channel.id;
                    else selectedChannelID = allAvailableChannels[randomChannel]?.id ?? null;
                }
            break;
        }
        const all_members = allAvailableChannels.filter(c => c.members.size && c.id !== selectedChannelID).map(c => [...c.members.values()]);
        if(!selectedChannelID || !all_members.length) return deleteMessage(`I could not find a channel to move people to.`, message, 15000);
        for(const member of all_members.flat()){
            await member.voice.setChannel(selectedChannelID)
                .catch(e => console.error(`Moveall: ${e}`));
        }
    }
}