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
    await loadfiledata(client);
    //console.log(generateDependencyReport());
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
	if (interaction.isButton()) {
        const { user, customId } = interaction as ButtonInteraction;
        const [ type, id ] = customId.split("-");
        console.log(type);
        switch(type as MusicButtons | VoteButtons){
            case 'buttonYes':
            case 'buttonNo':
                if(client.currentVote.has(user.id) || !client.currentVote.size) return;
                if(!client.currentVote.has(id)) return;
                const currentVote = client.currentVote.get(id);
            
                const member = interaction.guild.members.cache.get(user.id);
                if(!member) return;
                const answer = type === "buttonNo" ? "NO" : "YES";
                const getVote = currentVote?.getVote(member);
                if(!getVote) currentVote?.addVote(client, member, answer);
                else if(getVote.vote !== answer) currentVote?.updateVote(member, answer);
                
            break;
    
            case 'buttonLoop':      if(music) music.toggle_loop(interaction);    break;
            case 'buttonShuffle':   if(music) music.toggle_shuffle(interaction); break;
            case 'buttonSkip':      if(music) music.skip(interaction);           break;
            case 'buttonStop':      if(music) music.stop(interaction, true);     break;
            case 'buttonPlayPause': if(music) music.toggle_pause(interaction);   break;

            case 'buttonSelect': if(music) music.queue_state("SELECT", interaction); break;
            case 'buttonRemove': if(music) music.queue_state("REMOVE", interaction); break;
            case 'buttonSwap' : if(music) music.queue_state("SWAP", interaction);    break;

            case 'buttonFirstPageQueue': if(music) music.queue_page("FIRST", interaction); break;
            case 'buttonNextPageQueue': if(music) music.queue_page("NEXT", interaction);   break;
            case 'buttonPrevPageQueue': if(music) music.queue_page("PREV", interaction);   break;
            case 'buttonLastPageQueue': if(music) music.queue_page("LAST", interaction);   break;
        }
        await interaction.deferUpdate();
    }
    else if(interaction.isSelectMenu()){
        const { user, customId } = interaction as SelectMenuInteraction;
        const [ type, id ] = customId.split("-");
        console.log(type);
        switch(type as "selectSongQueue" | "removeSongQueue" |"swapSongQueue"){
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
        }
        //Handle queue/skip/remove menus for music
        await interaction.deferUpdate();
    }
});

client.on("messageCreate", async message => {
    if(message.author.bot || !message.guild || !message.member || message.channel.type !== "GUILD_TEXT" || !message) return;
    const guildprefix = client.guildsettings.has(message.guild.id) ? client.guildsettings.get(message.guild.id)?.prefix ?? prefix : prefix;
    if(!message.content.startsWith(guildprefix)) checkForMention(message, client, guildprefix);
    if(message.type === "THREAD_CREATED" || message.type === "THREAD_STARTER_MESSAGE") return;
    const args = message.content.slice(prefix.length).trim().split(' ');
    const cmd = args.shift()?.toLowerCase() ?? null;
    if (!cmd) return;

    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) ?? "");
    if (!command) return;
    
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