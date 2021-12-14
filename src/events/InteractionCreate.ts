import { Interaction } from "discord.js";
import Modified_Client from "../client/Client";
import { MusicButtons } from "../interfaces/music.interface";
import { VoteButtons } from "../interfaces/vote.interface";
import { ButtonInteraction, SelectMenuInteraction } from "discord.js";
import { CAHSButtons, CAHGameButtons, CAHSelectMenu } from "../interfaces/cah.interface";

export const InteractionCreate = async (client: Modified_Client, interaction: Interaction) => {
        //Should split up the code here later and check for different commands that utilizes different buttons.
    //Eg. with customid that I split up with command-buttonname-id, where id could either be guild or member.
    if(!interaction.guild) return;
    const guildQueue = client.player?.getQueue(interaction.guild.id);
    console.log(guildQueue?.songs.length);
    const musicEmbed = interaction.guild.musicEmbed;
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
            case 'buttonLoop':
                //Code some logic for loop.

            break;

            //Koda logic för shuffle, måste spara queuen och stora den någon annan stans ifall man vill unshuffla.
            //case 'buttonShuffle':   if(guildQueue) guildQueue.shuffle() break;

            case 'buttonSkip':      if(musicEmbed) musicEmbed.skip(client, interaction);         break;
            case 'buttonStop':      if(musicEmbed) musicEmbed.stop(client, interaction);         break;
            case 'buttonPlayPause': if(musicEmbed) musicEmbed.toggle_pause(client, interaction); break;

            //Koda om logic för embeden.
            /*case 'buttonSelect': if(guildQueue) guildQueue.queue_state("SELECT", interaction); break;
            case 'buttonRemove': if(guildQueue) guildQueue.queue_state("REMOVE", interaction); break;
            case 'buttonSwap' : if(guildQueue) guildQueue.queue_state("SWAP", interaction);    break;*/

            //Koda om dessa.
            /*case 'buttonFirstPageQueue': if(guildQueue) guildQueue.queue_page("FIRST", interaction); break;
            case 'buttonNextPageQueue':  if(guildQueue) guildQueue.queue_page("NEXT", interaction);   break;
            case 'buttonPrevPageQueue':  if(guildQueue) guildQueue.queue_page("PREV", interaction);   break;
            case 'buttonLastPageQueue':  if(guildQueue) guildQueue.queue_page("LAST", interaction);   break;*/

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
            /*case 'selectSongQueue':{
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
            break;*/

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
        await interaction.deferUpdate();
    }
}