//@ts-nocheck
import { Message, MessageEmbed, Collection, GuildMember, Permissions, GuildChannel, ThreadChannel, TextChannel, Guild, Role, GuildChannelManager, GuildChannelCreateOptions, PermissionOverwrites, GuildChannelResolvable, CategoryChannelResolvable, CategoryChannel, OverwriteResolvable } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { AvailablePack, AvailablePacks, BlackCard, ChannelConstructor, Deck, Game, Pack, Packname, PlayerConstructor } from "src/interfaces/cah.interface";
import { existsSync, readFileSync } from "fs";
import { shuffle } from "../../methods/shuffle";

export default class implements Command{
    name = "cah";
    aliases = [];
    category = "minigames";
    description = "Starts a CAH round with current members in voicechannel";
    usage = "cah";
    channelWhitelist = ["cah-lobby"];
    permission = Permissions.FLAGS.ADMINISTRATOR;

    run = async (client: Modified_Client, message: Message, args: string[]) => {

        if(!message.guild) return message.reply({content: 'Something went wrong. Please try again later.'});
        if(!message.member?.voice.channel) return message.reply({content: `You need to be in a voicechannel to use this command.`});
        if(client.cahgame.has(message.guild.id)) return message.reply({content: 'A game is already running.'});

        

        return;
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
    }
}

function setSelector(ranNum: number): string[] | null{
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
}