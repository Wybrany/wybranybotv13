

import { CategoryChannel, ChannelType, Message, PermissionFlagsBits, TextChannel, VoiceChannel } from "discord.js";
import Modified_Client from "../../client/Client";
import { Command } from "../../types/client.interface";
import { CAH_SETTINGS } from "../../managers/Cahsettings";
import { CAHGame } from "../../managers/Cah"

type arg_state = "settings" | "start" | "stop" | "join" | "leave";

//Check for bugs later

export default class implements Command{
    name = "cah";
    aliases = [];
    category = "minigames";
    description = "Starts a CAH round with current members in voicechannel";
    usage = "cah <SETTINGS | START | STOP>";
    channelWhitelist = ["cah-lobby"];
    permission = PermissionFlagsBits.SendMessages;
    guildWhitelist = ["456094195187449868", "715123274719297566"];
    developerMode = true;
    params = true;


    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        if(!message.guild || message.channel.type !== ChannelType.GuildText || !client.user || !message.member) 
            return message.error({content: `Something went wrong. Please try again later.`, timed: 5000});

        const voiceChannel = message.member.voice.channel as VoiceChannel | null;
        if(!voiceChannel) 
            return message.error({content: `You need to be in a voicechannel to use this command.`, timed: 5000});

        if(client.cah_settings_embed.has(message.guild.id))
            return message.error({content: `Please save or cancel your current settings.`, timed: 5000});

        const [ state, mention ] = args;
        if(!state) return message.error({content: `I don't know what to do. Do you want me to change settings, start or stop?`, timed: 5000});

        switch(state.toLowerCase() as arg_state){
            case 'settings':
                console.log("settings");
                const cah_settings = new CAH_SETTINGS(client, message.guild, message.channel as TextChannel);
                client.cah_settings_embed.set(message.guild.id, cah_settings);
                client.cah_settings_embed.get(message.guild.id)?.create_embed();
            break;

            case 'start':{
                if(client.cahgame.has(message.guild.id)) return message.error({content: `A game is already running.`, timed: 5000});

                const settings = message.guild.cahsettings;
                if(!settings) return message.error({content: `You need to configure your settings. Use the command **cah settings** to do so.`, timed: 5000});

                const parentCategory = message.guild.channels.cache.find(c => c.name === "CAH-game") as CategoryChannel | null;
                if(!parentCategory) return message.error({content: `You need to create a category named **CAH-game** to play.`, timed: 5000});

                if(!message.guild.members.cache.get(client.user.id)?.permissions.has(PermissionFlagsBits.ManageRoles))
                return message.error({content: `I don't have permissions to manage roles. My role also needs to be higher than the players for optimal gameplay.`, timed: 5000});

                const players = [...voiceChannel.members.values()];
                const cahGame = new CAHGame(client, message.guild, players, settings);
                client.cahgame.set(message.guild.id, cahGame);

                const started = client.cahgame.get(message.guild.id)?.start() ?? false;
                if(!started) {
                    client.cahgame.get(message.guild.id)?.stop({message: false});
                    client.cahgame.delete(message.guild.id);
                    return message.error({content: `Something went wrong with creating the game. Please try again later.`, timed: 5000});
                }
            }
            break;
            
            case'stop':
                if(!client.cahgame.has(message.guild.id)) 
                    return message.error({content: `There is no game running atm.`, timed: 5000});
                client.cahgame.get(message.guild.id)?.stop({reason: "FORCED"});
            break;
            
            case 'join': {
                if(!client.cahgame.has(message.guild.id)) return message.error({content: `There is no game running atm.`, timed: 5000});
                const user = message.mentions.members?.first() ?? message.guild.members.cache.get(mention) ?? null;
                if(!user) return message.error({content: `You need to mention someone to join the game.`, timed: 5000});

                if(client.cahgame.get(message.guild.id)?.gamestate !== "SELECT") 
                    return message.error({content: "Players can only join during select state.", timed: 7500});

                const joined = await client.cahgame.get(message.guild.id)?.player_join(user);
                if(!joined) return message.error({content: `Something went wrong making the player join. Please try again later.`, timed: 5000});
                else {
                    client.cahgame.get(message.guild.id)?.players.push(joined);
                    const players = client.cahgame.get(message.guild.id)?.players ?? [];
                    for(const player of players){
                        await client.cahgame.get(message.guild.id)?.update_embed("SELECT", player);
                    }
                    return message.success({content: `Successfully added **${user.user.username}** to the game.`, timed: 5000});
                }
            }
            
            case 'leave':{
                if(!client.cahgame.has(message.guild.id)) return message.error({content: `There is no game running atm.`, timed: 5000});

                const user = message.mentions.members?.first() ?? message.guild.members.cache.get(mention) ?? null;
                if(!user) return message.error({content: `You need to mention someone to join the game.`, timed: 5000});
                if(client.cahgame.get(message.guild.id)?.gamestate !== "SELECT")
                    return message.error({content: `A player can only leave during the selection state.`, timed: 5000});
                const leave = client.cahgame.get(message.guild.id)?.player_leave(user);
                if(!leave)
                    return message.error({content: `Something went wrong making the player leave. Please try again later.`, timed: 5000});
                else return message.success({content: `Successfully removed **${user.user.username}** from the game.`, timed: 5000});
            }

            default:
                return message.error({content: `I don't know what to do. Do you want me to change settings, start or stop?`, timed: 5000});
        }
    }
}