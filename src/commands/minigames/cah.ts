import { Message, MessageEmbed, Collection, GuildMember, Permissions, GuildChannel, ThreadChannel, TextChannel, Guild, Role, GuildChannelManager, GuildChannelCreateOptions, PermissionOverwrites, GuildChannelResolvable, CategoryChannelResolvable, CategoryChannel, OverwriteResolvable } from "discord.js";
import Modified_Client from "../../methods/client/Client";
import { Command } from "../../interfaces/client.interface";
import { ChannelConstructor, Pack, Packname, PlayerConstructor } from "src/interfaces/cah.interface";
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

        if(!message.guild) return;
        const [] = args;

        const cahparent = message.guild.channels.cache.find(c => c.name.toLowerCase() === "cah" && c.type === "GUILD_CATEGORY");
        const gamelobbychannel = message.guild.channels.cache.find(c => c.name.toLowerCase() === 'gamelobby' && c.type === "GUILD_VOICE");

        if(!cahparent || cahparent.type !== "GUILD_CATEGORY") return message.reply({content: `Please create a parent category called "cah"`});
        if(!gamelobbychannel || gamelobbychannel?.type !== "GUILD_VOICE") return message.reply({content: `Please create a voicechannel named "gamelobby".`});
        const everyone = <Role>message.guild.roles.cache.find(e => e.name === '@everyone'); //Never undefined.
        
        const members = [...gamelobbychannel.members.values()];
        if(members.length <= 1) return message.reply(`Please join Gamelobby to play! You need a minimum of 2 players to play.`);
        //const settings = client.cahsettings.get(message.guild.id);
        //const cardSets = settings.packs.length ? settings.packs : setSelector(10);
        //Borde göra en check så man kollar att man har t.ex över 1000 whitecards och 200 blackcards så korten aldrig tar slut
        //const deck = loadDeck(cardSets);
        let blackCard = "";
        let czar = true;
        let czarid = "";
        //const randomBlackCard = shuffle(deck.deckblackcards.length, 1);
        //const memberChannels = [];
        /*for(const value of members){
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

            const randomWhiteCards = shuffle(deck.deckwhitecards.length, 10);
            const playerHand = deck.deckwhitecards.filter((c, i) => randomWhiteCards.includes(i));
            deck.deckwhitecards = deck.deckwhitecards.filter((c, i) => !randomWhiteCards.includes(i));
            
            if(czar){
                czar = false;
                czarid = member.id;
                blackCard = deck.deckblackcards.filter((c, i) => randomBlackCard.includes(i));
                deck.deckblackcards = deck.deckblackcards.filter((c, i) => !randomBlackCard.includes(i));
            }
            const waitMessage = await newTextChannel.send(`<@${value.user.id}>, PLEASE WAIT WHILE GAME IS SETTING UP`);
            const newPlayerConstructor = new playerConstructor(member.id, newChannelConstructor, 0, playerHand, undefined, undefined, waitMessage);
            client.players.set(member.id, newPlayerConstructor);
        }

        const game = {
            currentcardzar: czarid,
            blackcard: blackCard[0],
            deck: deck,
            gamestarted: false,
            gamestate: undefined,
            playerselect: []
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
        console.log(deck.deckwhitecards.length);*/
    }
}

function setSelector(ranNum: number){
    const packNames: Packname = existsSync("./cards_against_humanity/official/packs.json") ? JSON.parse(readFileSync("./cards_against_humanity/official/packs.json", "utf-8")) : {};
    if(!Object.entries(packNames).length) return console.log(`No packNames`);
    const { packs } = packNames;
    const shuffledNumbers = shuffle(packs.length, ranNum);
    return packs.filter((p, i) => shuffledNumbers.includes(i)).map(p => p.id);
}

function loadDeck(setnames = []){
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