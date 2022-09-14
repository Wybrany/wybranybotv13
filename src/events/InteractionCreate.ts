import { Interaction, Message } from "discord.js";
import Modified_Client from "../client/Client";
import { QueuePageState } from "../types/music.interface";
import { VoteButtons } from "../types/vote.interface";
import { ButtonInteraction, SelectMenuInteraction } from "discord.js";
import { CAHSButtons, CAHGameButtons, CAHSelectMenu } from "../types/cah.interface";
import { ButtonNames, ButtonSelectState, RepeatMode, SelectMenuNames } from "../player/index";

export const InteractionCreate = async (client: Modified_Client, interaction: Interaction) => {
    if(!interaction.guild || !interaction.member) return;
    const guildQueue = client.player?.getQueue(interaction.guild.id);
    const musicEmbed = interaction.guild.musicEmbed;
    const cahsettings = client.cah_settings_embed.has(interaction.guild.id) ? client.cah_settings_embed.get(interaction.guild.id) : null;
	const cahgame = client.cahgame.has(interaction.guild.id) ? client.cahgame.get(interaction.guild.id) : null;
    const member = interaction.guild.members.cache.get(interaction.member.user.id) ?? null;
    if (interaction.isButton()) {
        const { user, customId } = interaction as ButtonInteraction;
        const [ type, id ] = customId.split("-");
        switch(type as | CAHSButtons | CAHGameButtons | ButtonNames){

            //MUSIC
            case ButtonNames.LOOP:      if(guildQueue && musicEmbed) musicEmbed.toggle_loop(client, interaction);    break;
            case ButtonNames.SHUFFLE:   if(guildQueue && musicEmbed) musicEmbed.toggle_shuffle(client, interaction); break;
            case ButtonNames.SKIP:      if(guildQueue && musicEmbed) musicEmbed.skip(client, interaction);           break;
            case ButtonNames.STOP:      if(guildQueue && musicEmbed) musicEmbed.stop(client, interaction);           break;
            case ButtonNames.PLAYPAUSE: if(guildQueue && musicEmbed) musicEmbed.toggle_pause(client, interaction);   break;

            //Koda om logic för embeden.
            case ButtonNames.SELECT: if(guildQueue && musicEmbed) musicEmbed.queue_state(client, ButtonSelectState.SELECT, interaction); break;
            case ButtonNames.REMOVE: if(guildQueue && musicEmbed) musicEmbed.queue_state(client, ButtonSelectState.REMOVE, interaction); break;
            case ButtonNames.SWAP :  if(guildQueue && musicEmbed) musicEmbed.queue_state(client, ButtonSelectState.SWAP, interaction);   break;

            //Koda om dessa.
            case ButtonNames.FIRSTQUEUEPAGE: if(guildQueue && musicEmbed) musicEmbed.queue_page(client, QueuePageState.FIRST, interaction);  break;
            case ButtonNames.NEXTQUEUEPAGE:  if(guildQueue && musicEmbed) musicEmbed.queue_page(client, QueuePageState.NEXT, interaction);   break;
            case ButtonNames.PREVQUEUEPAGE:  if(guildQueue && musicEmbed) musicEmbed.queue_page(client, QueuePageState.PREV, interaction);   break;
            case ButtonNames.LASTQUEUEPAGE:  if(guildQueue && musicEmbed) musicEmbed.queue_page(client, QueuePageState.LAST, interaction);   break;

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
        
        switch(type as CAHSelectMenu | SelectMenuNames){
            case SelectMenuNames.SELECT:{
                const firstSong = interaction.values.shift();
                const [ index, songLink ] = firstSong!.split("-");
                if(guildQueue && musicEmbed) {
                    const songIndex = (parseFloat(index) + (musicEmbed.currentQueuePage * 25) + 1);
                    musicEmbed.skip(client, interaction, songIndex);
                }
            }
            break;
            
            case SelectMenuNames.REMOVE:{
                const selectedSongs = interaction.values as string[];
                if(guildQueue && musicEmbed){
                    const sortedIndexes = selectedSongs
                        .map(v => (parseFloat(v.split("-")[0]) + (musicEmbed.currentQueuePage * 25) + 1))
                        .sort((a,b) => b - a);
                    musicEmbed.remove_songs(client, interaction, sortedIndexes);
                }
            }
            break;
            
            case SelectMenuNames.SWAP: {
                const selectedSongs = interaction.values as string[];
                if(guildQueue && musicEmbed){
                    const [ song1, song2 ] = selectedSongs.map(v => (parseFloat(v.split("-")[0]) + (musicEmbed.currentQueuePage * 25) + 1));
                    musicEmbed.swap_songs(client, interaction, [ song1, song2 ]);
                }
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
        await interaction.deferUpdate();
    }
}