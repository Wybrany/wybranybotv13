import dotenv from "dotenv";
import { readdirSync } from "fs";
import Modified_Client from "./methods/client/Client";
import { Load_Commands } from "./methods/commandhandler/Command";
import { loadfiledata } from "./methods/backup";
import { Guild_used_command_recently } from "./methods/cooldown";
import { checkForMention } from "./methods/checkForMention";
import { generateDependencyReport } from "@discordjs/voice";
import { MusicButtons } from "./interfaces/music.interface";
import { VoteButtons } from "./interfaces/vote.interface";
import { MusicConstructor } from "./methods/music/music";
import { ButtonInteraction, SelectMenuInteraction, VoiceChannel } from "discord.js";
import { setMaxListeners } from "process";
import { CAHSButtons, CAHGameButtons, CAHSelectMenu } from "./interfaces/cah.interface";
import { promisify } from "util";

const wait = promisify(setTimeout);
setMaxListeners(100);
dotenv.config();

const discord_token = process.env.TOKEN as string;
const base_path = process.env.BASE_PATH as string;
const prefix = process.env.PREFIX as string;
const OwnerId = process.env.OWNERID as string;

if(!discord_token || !base_path) {console.log(`No "TOKEN" was submitted as a discord token or missing "BASE_PATH". Now exiting`); process.exit(0)}

const client = new Modified_Client();
client.categories = readdirSync(`./${base_path}/commands`);
Load_Commands(client, base_path);

client.on("ready", async () => {
    console.log(`Successfully Logged in as ${client.user?.username}! (${client.user?.id})\nCurrently serving: ${client.guilds.cache.size} servers.`);
    client.user?.setActivity({type: "WATCHING", name: "dedu"});
    loadfiledata(client);
});

client.on("voiceStateUpdate", (oldState, newState) => {
    if(newState.id !== client.user?.id) return;
    const newchannel = newState.channel as VoiceChannel | null;
    if(!newchannel || !newState.channel?.id){
        if(client.music.has(newState.guild.id)) {
            client.music.delete(newState.guild.id);
            return;
        }
    }
})

client.on('interactionCreate', async interaction => {
    //Should split up the code here later and check for different commands that utilizes different buttons.
    //Eg. with customid that I split up with command-buttonname-id, where id could either be guild or member.
    if(!interaction.guild) return;
    const music = client.music.has(interaction.guild.id) ? client.music.get(interaction.guild.id) as MusicConstructor : null;
    const cahsettings = client.cah_settings_embed.has(interaction.guild.id) ? client.cah_settings_embed.get(interaction.guild.id) : null;
	const cahgame = client.cahgame.has(interaction.guild.id) ? client.cahgame.get(interaction.guild.id) : null;
    const member = interaction.guild.members.cache.get(interaction.member?.user.id as string) ?? null;
    if (interaction.isButton()) {
        const { user, customId } = interaction as ButtonInteraction;
        const [ type, id ] = customId.split("-");
        console.log(type);
        switch(type as MusicButtons | VoteButtons | CAHSButtons | CAHGameButtons){
            //VOTEMUTE
            case 'buttonYes':
            case 'buttonNo':
                if(client.currentVote.has(user.id) || !client.currentVote.size) return;
                if(!client.currentVote.has(id)) return;
                if(!member) return;
                const currentVote = client.currentVote.get(id);
                const answer = type === "buttonNo" ? "NO" : "YES";
                const getVote = currentVote?.getVote(member);
                if(!getVote) currentVote?.addVote(client, member, answer);
                else if(getVote.vote !== answer) currentVote?.updateVote(member, answer);
                
            break;
    
            //MUSIC
            case 'buttonLoop':      if(music) music.toggle_loop(interaction);    break;
            case 'buttonShuffle':   if(music) music.toggle_shuffle(interaction); break;
            case 'buttonSkip':      if(music) music.skip(interaction);           break;
            case 'buttonStop':      if(music) music.stop(interaction, true);     break;
            case 'buttonPlayPause': if(music) music.toggle_pause(interaction);   break;

            case 'buttonSelect': if(music) music.queue_state("SELECT", interaction); break;
            case 'buttonRemove': if(music) music.queue_state("REMOVE", interaction); break;
            case 'buttonSwap' : if(music) music.queue_state("SWAP", interaction);    break;

            case 'buttonFirstPageQueue': if(music) music.queue_page("FIRST", interaction); break;
            case 'buttonNextPageQueue':  if(music) music.queue_page("NEXT", interaction);   break;
            case 'buttonPrevPageQueue':  if(music) music.queue_page("PREV", interaction);   break;
            case 'buttonLastPageQueue':  if(music) music.queue_page("LAST", interaction);   break;

            //CAH SETTINGS EMBED
            case 'buttonSaveSettings':           if(cahsettings) cahsettings.save(); break;
            case 'buttonCloseSettings':          if(cahsettings) cahsettings.cancel(); break;
            case 'buttonChoosePacksSettings':    if(cahsettings) cahsettings.update_embed("PACKS"); break;
            case 'buttonChooseWinStateSettings': if(cahsettings) cahsettings.update_embed("WINSTATE"); break;

            case 'buttonChoosePack':             if(cahsettings) cahsettings.toggle_select_pack(); break;
            case 'buttonSavePack':               if(cahsettings) cahsettings.update_embed("MENU"); break;
            case 'buttonPrevPackPage':           if(cahsettings) cahsettings.prev_page(); break;
            case 'buttonNextPackPage':           if(cahsettings) cahsettings.next_page(); break;

            case 'buttonSaveWinState':           if(cahsettings) cahsettings.update_embed("MENU"); break;
            case 'buttonPlusOneWin':             if(cahsettings) cahsettings.update_win_state("PLUS", 1); break;
            case 'buttonMinusOneWin':            if(cahsettings) cahsettings.update_win_state("MINUS", 1); break;
            case 'buttonPlusFiveWin':            if(cahsettings) cahsettings.update_win_state("PLUS", 5); break;
            case 'buttonMinusFiveWin':           if(cahsettings) cahsettings.update_win_state("MINUS", 5); break;

            //CAH GAME BUTTONS
            case 'buttonCAHSelect': if(cahgame && member) cahgame.change_player_cards_state(member, "SELECT", interaction); break;
            case 'buttonCAHRemove': if(cahgame && member) cahgame.change_player_cards_state(member, "REMOVE", interaction); break;
            case 'buttonCAHSwap':   if(cahgame && member) cahgame.change_player_cards_state(member, "SWAP", interaction); break;
            case 'buttonCAHReady':  if(cahgame && member) cahgame.toggle_ready(member); break;
        }
        await interaction.deferUpdate();
    }
    else if(interaction.isSelectMenu()){
        const { user, customId } = interaction as SelectMenuInteraction;
        const [ type, id ] = customId.split("-");
        console.log(type);
        
        switch(type as "selectSongQueue" | "removeSongQueue" |"swapSongQueue" | CAHSelectMenu){
            case 'selectSongQueue':{
                const firstSong = interaction.values.shift() as string;
                const [ index, songLink ] = firstSong.split("-");
                const songIndex = parseFloat(index);
                music?.shift(songIndex)
            }
            break;

            case 'removeSongQueue':{
                const selectedSongs = interaction.values as string[];
                const getIndexes = selectedSongs
                    .map(v => parseFloat(v.split("-")[0]))
                    .sort((a,b) => b - a);
                for(const song of getIndexes){
                    music?.remove_queue(song, false);
                }
                music?.update_embed("NOWPLAYING");
            }
            break;
            
            case 'swapSongQueue':{
                const selectedSongs = interaction.values as string[];
                const [ song1, song2 ] = selectedSongs.map(v => parseFloat(v.split("-")[0]));
                music?.swap_songs(song1, song2);
            }
            break;

            //CAH GAME

            case 'WhiteCardsSelect':
                const selectedCards = interaction.values as string[];
                const indexes = selectedCards.map(c => parseFloat(c.split("-")[0]))
                if(!member || !cahgame) return;
                if(cahgame.players.find(p => p.member.id === member.id)?.player_cards_state === "SELECT")
                    cahgame.select_cards("SELECT", indexes, member, interaction);
                else {
                    cahgame.select_cards("REMOVE", indexes, member, interaction);
                }
            break;

            case 'WhiteCardsVote':
                const [ winner ] = interaction.values as string[];
                const player = interaction.guild.members.cache.get(winner);
                if(player && cahgame) cahgame.choose_winner(player); 
            break;

            case 'WhiteCardsSwap':
                const selectedWhiteCards = interaction.values as string[];
                const [ card1, card2 ] = selectedWhiteCards.map(c => parseFloat(c.split("-")[0]));
                if(cahgame && member) cahgame.select_cards("SWAP", [card1, card2], member, interaction);
            break;
        }
        //Handle queue/skip/remove menus for music
        await interaction.deferUpdate();
    }
});

client.on("messageCreate", async message => {
    if(message.author.bot || !message.guild || !message.member || message.channel.type !== "GUILD_TEXT" || !message) return;
    const guildprefix = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id)?.prefix ?? prefix : prefix;
    if(!message.content.startsWith(guildprefix)) return checkForMention(message, client, guildprefix);
    if(message.type === "THREAD_CREATED" || message.type === "THREAD_STARTER_MESSAGE") return;
    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift()?.toLowerCase() ?? null;
    if (!cmd) return checkForMention(message, client, guildprefix);
    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) ?? "");
    if (!command) return checkForMention(message, client, guildprefix);
    
    const channelWhiteList = command.channelWhitelist?.length ? command.channelWhitelist.includes(message.channel.name) : null;
    if(channelWhiteList !== null && channelWhiteList === false){
        const channelWhiteList: string[] = command?.channelWhitelist ?? [];
        const channels = message.guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT" && channelWhiteList.includes(channel.name));
        if(!channels.size) {
            message.reply({content: `This command is only whitelisted in following channelnames: **${channelWhiteList.join(", ")}**, please create such channels to make **${command.name}** command work.`})
            return;
        }
        
        const text = channels.map(channel => `<#${channel.id}>`).join(`, `);
        message.reply({content: `The command, **${command.name}**, can only be used in following channels: ${text}`});
        return;
    }

    if(message.author.id === OwnerId) return command.run(client, message, args);
    if(!message.member.permissions.has(command.permission)){
        message.reply({content: `You don't have permission to use this command.`});
        return;
    }
    if(command?.developerMode){
        message.reply({content: `This command is currently being developed. You can't use this command.`});
        return;
    }
    if(command?.ownerOnly){
        message.reply({content: `This command is for owner only.`});
        return;
    }

    //Handling cooldowns
    if(!client.guildUsedCommandRecently.has(message.guild.id)) 
    client.guildUsedCommandRecently.set(message.guild.id, new Guild_used_command_recently(message.guild.id));

    const usedCommandRecently = client.guildUsedCommandRecently.get(message.guild.id);
    if(!usedCommandRecently) return console.warn(`Usedcommandrencelty does not exist for this guild ${message.guild.id} for some reason`);
    if(usedCommandRecently.is_on_cooldown()) return usedCommandRecently.send_warning_message(message);
    else usedCommandRecently.change_warning_message(false);

    if(!usedCommandRecently.timer_started) usedCommandRecently.start_timer();
    else usedCommandRecently.sub_commandremaining();

    command.run(client, message, args);
})

client.login(discord_token);