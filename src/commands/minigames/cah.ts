//@ts-nocheck
import { CategoryChannel, Message, Permissions, VoiceChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { AvailablePack, AvailablePacks, Deck, Pack } from "src/interfaces/cah.interface";
import { existsSync, readFileSync } from "fs";
import { shuffle } from "../../methods/shuffle";
import { deleteMessage } from "../../methods/deletemessage";
import { CAH_SETTINGS } from "../../methods/cah/Cahsettings";
import { CAHGame } from "../../methods/cah/Cah"

type arg_state = "settings" | "start" | "stop" | "join" | "leave";

export default class implements Command{
    name = "cah";
    aliases = [];
    category = "minigames";
    description = "Starts a CAH round with current members in voicechannel";
    usage = "cah <SETTINGS | START | STOP>";
    channelWhitelist = ["cah-lobby"];
    permission = Permissions.FLAGS.SEND_MESSAGES;
    guildWhitelist = ["456094195187449868"];

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        
        if(!message.guild || !client.user) return deleteMessage(`Something went wrong. Please try again later.`, message);

        const voiceChannel = message.member.voice.channel as VoiceChannel | null;
        if(!voiceChannel) 
            return deleteMessage(`You need to be in a voicechannel to use this command.`, message, 5000);

        if(client.cah_settings_embed.has(message.guild.id))
            return deleteMessage(`Please save or cancel your current settings.`, message);

        const [ state, mention ] = args;
        if(!state) return deleteMessage(`I don't know what to do. Do you want me to change settings, start or stop?`, message, 5000)

        switch(state.toLowerCase() as arg_state){
            case 'settings':
                console.log("settings");
                const cah_settings = new CAH_SETTINGS(client, message.guild, message.channel);
                client.cah_settings_embed.set(message.guild.id, cah_settings);
                client.cah_settings_embed.get(message.guild.id)?.create_embed();
            break;

            case 'start':
                if(client.cahgame.has(message.guild.id)) return deleteMessage(`A game is already running.`, message, 5000);

                const settings = client.cahsettings.has(message.guild.id) ? client.cahsettings.get(message.guild.id) : null;
                if(!settings) return deleteMessage(`You need to configure your settings. Use the command **cah settings** to do so.`, message, 7500);

                const parentCategory = message.guild.channels.cache.find(c => c.name === "CAH-game") as CategoryChannel | null;
                if(!parentCategory) return deleteMessage(`You need to create a category named **CAH-game** to play.`, message, 5000);

                if(!message.guild.members.cache.get(client.user.id)?.permissions.has("MANAGE_ROLES"))
                return deleteMessage(`I don't have permissions to manage roles. My role also needs to be higher than the players for optimal gameplay.`, message, 10000);

                const players = [...voiceChannel.members.values()];
                const cahGame = new CAHGame(client, message.guild, players, settings);
                client.cahgame.set(message.guild.id, cahGame);

                const started = client.cahgame.get(message.guild.id).start();
                if(!started) {
                    client.cahgame.get(message.guild.id).stop();
                    client.cahgame.delete(message.guild.id);
                    return deleteMessage(`Something went wrong with creating the game. Please try again later.`, message, 5000);
                }

            break;
            
            case'stop':
                if(!client.cahgame.has(message.guild.id)) return deleteMessage(`There is no game running atm.`, message, 5000);
                //Return all roles and delete channels
                for(const player of client.cahgame.get(message.guild.id)?.players){
                    const member = message.guild.members.cache.get(player.member.id);
                    if(member && player.previous_roles.length) await member.roles.add(player.previous_roles);
                    await player.channel.delete();
                }
                client.cahgame.delete(message.guild.id);
                //Maybe return a scoreboard for the stopped game.
                return deleteMessage(`Successfully stopped the current game.`, message, 10000);
            
            case 'join': {
                if(!client.cahgame.has(message.guild.id)) return deleteMessage(`There is no game running atm.`, message, 5000);
                const user = message.mentions.members.first() || message.guild.members.cache.get(mention) || null;
                if(!user) return deleteMessage(`You need to mention someone to join the game.`, message, 5000);
                const joined = await client.cahgame.get(message.guild.id)?.player_join(user);
                if(!joined) 
                    return deleteMessage(`Something went wrong making the player join. Please try again later.`, message, 5000);
                else {
                    client.cahgame.get(message.guild.id)?.players.push(joined);
                    for(const player of client.cahgame.get(message.guild.id)?.players){
                        await client.cahgame.get(message.guild.id)?.update_embed(client.cahgame.get(message.guild.id).gamestate, player);
                    }
                    return deleteMessage(`Successfully added **${user.user.username}** to the game.`);
                }
            }
            
            case 'leave':{
                if(!client.cahgame.has(message.guild.id)) return deleteMessage(`There is no game running atm.`, message, 5000);
                const user = message.mentions.members.first() || message.guild.members.cache.get(mention) || null;
                if(!user) return deleteMessage(`You need to mention someone to join the game.`, message, 5000);
                if(client.cahgame.get(message.guild.id)?.gamestate !== "SELECT")
                    return deleteMessage(`A player can only leave during the selection state.`, message, 5000);
                const leave = client.cahgame.get(message.guild.id)?.player_leave(user);
                if(!leave)
                    return deleteMessage(`Something went wrong making the player leave. Please try again later.`, message, 5000);
                else return deleteMessage(`Successfully removed **${user.user.username}** from the game.`, message, 5000)
            }

            default:
                return deleteMessage(`I don't know what to do. Do you want me to change settings, start or stop?`, message, 5000)
        }
    }
}