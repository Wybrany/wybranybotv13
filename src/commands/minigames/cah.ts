//@ts-nocheck
import { CategoryChannel, Message, Permissions, VoiceChannel } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { AvailablePack, AvailablePacks, Deck, Pack } from "src/interfaces/cah.interface";
import { existsSync, readFileSync } from "fs";
import { shuffle } from "../../methods/shuffle";
import { deleteMessage } from "../../methods/deletemessage";
import { CAH_SETTINGS } from "../../methods/cah/cahsettings";
import { CAHGame } from "../../methods/cah/cah";

type arg_state = "settings" | "start" | "stop" | "join" | "leave";

export default class implements Command{
    name = "cah";
    aliases = [];
    category = "minigames";
    description = "Starts a CAH round with current members in voicechannel";
    usage = "cah <SETTINGS | START | STOP>";
    channelWhitelist = ["cah-lobby"];
    permission = Permissions.FLAGS.SEND_MESSAGES;

    run = async (client: Modified_Client, message: Message, args: string[]) => {
        console.log("HERE")
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
                const joined = client.cahgame.get(message.guild.id)?.player_join(user);
                if(!joined) 
                    return deleteMessage(`Something went wrong making the player join. Please try again later.`, message, 5000);
                else return deleteMessage(`Successfully added **${user.user.username}** to the game.`)
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
                else return deleteMessage(`Successfully removed **${user.user.username}** from the game.`)
            }

            default:
                return deleteMessage(`I don't know what to do. Do you want me to change settings, start or stop?`, message, 5000)
        }
    }
}




        /*if(!message.guild) return;
        const [] = args;
        
        const cahparent = message.guild.channels.cache.find(c => c.name.toLowerCase() === "cah" && c.type === "GUILD_CATEGORY");
        const gamelobbychannel = message.guild.channels.cache.find(c => c.name.toLowerCase() === 'gamelobby' && c.type === "GUILD_VOICE");

        if(!cahparent || cahparent.type !== "GUILD_CATEGORY") return message.reply({content: `Please create a parent category called "cah"`});
        if(!gamelobbychannel || gamelobbychannel?.type !== "GUILD_VOICE") return message.reply({content: `Please create a voicechannel named "gamelobby".`});
        const everyone = <Role>message.guild.roles.cache.find(e => e.name === '@everyone'); //Never undefined.
        
        const members = [...gamelobbychannel.members.values()];
        if(members.length <= 1) return message.reply(`Please join Gamelobby to play! You need a minimum of 2 players to play.`);
        //Kolla till guildsettings senare.
        //const settings = client.cahsettings.get(message.guild.id);
        //const cardSets = settings.packs.length ? settings.packs : setSelector(10);
        const cardSets = setSelector(10);
        if(!cardSets || cardSets.length) return message.reply(`Something went wrong... Please try again later.`);
        
        //Borde göra en check så man kollar att man har t.ex över 1000 whitecards och 200 blackcards så korten aldrig tar slut
        const deck = loadDeck(cardSets);
        let blackCard: BlackCard;
        let czar = true;
        let czarid = "";
        const randomBlackCard = <number>shuffle(deck.deckblackcards.length, 1);
        const memberChannels = [];
        for(const value of members){
            const member = message.guild.members.cache.get(value.user.id);
            if(!member) continue;
            const permissionsOverwrites: OverwriteResolvable[] = [
                {
                    id: everyone.id,
                    deny: ['VIEW_CHANNEL']
                },
                {
                    id: member.id,
                    allow: ['VIEW_CHANNEL']
                }
            ]
            const options: GuildChannelCreateOptions = {
                type: "GUILD_TEXT",
                parent: cahparent.parent?.id,
                permissionOverwrites: permissionsOverwrites,
                reason: `Created by bot for CAH-game`
            }
            const newTextChannel = await message.guild.channels.create(`Player-${member.user.username}`, options);

            const newChannelConstructor: ChannelConstructor = {
                channelId: newTextChannel.id,
                guildId: message.guild.id,
                memberId: member.id,
                permissionOverwrites: permissionsOverwrites
            }

            const randomWhiteCards = <number[]>shuffle(deck.deckwhitecards.length, 10);
            const playerHand = deck.deckwhitecards.filter((c, i) => randomWhiteCards.includes(i));
            deck.deckwhitecards = deck.deckwhitecards.filter((c, i) => !randomWhiteCards.includes(i));
            
            if(czar){
                czar = false;
                czarid = member.id;
                blackCard = deck.deckblackcards.splice(randomBlackCard, 1)[0];
            }
            const waitMessage = await newTextChannel.send(`<@${value.user.id}>, PLEASE WAIT WHILE GAME IS SETTING UP`);
            //Move playerConstructor to class
            //const newPlayerConstructor = new playerConstructor(member.id, newChannelConstructor, 0, playerHand, undefined, undefined, waitMessage);
            //client.players.set(member.id, newPlayerConstructor);
        }*/

        /* Move all these to class.
        const game: Game = {
            currentcardzar: czarid,
            blackcard: blackCard,
            deck: deck,
            gamestarted: false,
            gamestate: "SETUP"
        }

        client.cahgame.set(message.guild.id, game);

        for(const [key, value] of members){
            const member = message.guild.members.cache.get(value.user.id);
            await createEmbed(client, member);
        }

        for(const [key, value] of members){
            client.players.get(value.user.id).waitmessage.delete();
            client.players.get(value.user.id).waitmessage = undefined;
            const channel = message.guild.channels.cache.get(client.players.get(value.user.id).textchannel.channelID);
            channel.send(`<@${value.user.id}>, Your game is now ready!`).then(m => m.delete({timeout: 5000}));
        }
        client.cahgame.get(message.guild.id).gamestarted = true;
        client.cahgame.get(message.guild.id).gamestate = "SELECT";
        console.log(deck.deckwhitecards.length);
        */

/*function setSelector(ranNum: number): string[] | null{
    const packNames: AvailablePacks = existsSync("./cards_against_humanity/official/packs.json") ? JSON.parse(readFileSync("./cards_against_humanity/official/packs.json", "utf-8")) : {};
    if(!Object.entries(packNames).length) return null;
    const { packs } = packNames;
    const shuffledNumbers = <number[]>shuffle(packs.length, ranNum);
    return packs
        .filter((p, i: number) => shuffledNumbers.includes(i))
        .map((p: AvailablePack) => p.id);
}

function loadDeck(setnames: string[] = []): Deck{
    const packnames = [];
    const blackcards =[];//{content: "This is a test card", pick: 3, draw: 1}];
    const whitecards = [];

    for(const setname of setnames){
        const packContent: Pack = existsSync(`./cards_against_humanity/official/packs/${setname}.json`) ? JSON.parse(readFileSync(`./cards_against_humanity/official/packs/${setname}.json`, "utf-8")) : {};
        if(!Object.entries(packContent).length) { console.log(`No Packcontent on ${setname}`); continue; }
        const { pack, black, white } = packContent;
        blackcards.push(black);
        whitecards.push(white);
        packnames.push(pack.name);
    }
    return { packnames, deckblackcards: blackcards.flat(), deckwhitecards: whitecards.flat() };
}*/