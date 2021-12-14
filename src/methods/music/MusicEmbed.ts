import { Guild, Interaction, TextChannel, MessageButton, MessageActionRow, MessageSelectMenu, MessageEmbed, MessageOptions } from "discord.js";
import { embedStates, MusicChannel, MusicEmbedInterface, QueuePageState, SelectStates } from "../../interfaces/music.interface";
import Modified_Client from "../../client/Client";
import { Song } from "discord-music-player";

export default class MusicEmbed implements MusicEmbedInterface{

    public guild: Guild;
    public musicChannel: MusicChannel;

    public currentQueuePage: number;
    public unshuffledQueue: Song[];

    public select: boolean;
    public remove: boolean;
    public swap: boolean;

    public shuffle: boolean;
    public loop: boolean;

    constructor(guild: Guild, musicChannel: MusicChannel){
        this.guild = guild;
        this.musicChannel = musicChannel;

        this.unshuffledQueue = [];
        this.currentQueuePage = 0;

        this.select = true;
        this.remove = false;
        this.swap = false;

        this.shuffle = false;
        this.loop = false;
    }

    async stop(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);
        if(!songQueue) return;
        songQueue.stop();
        await this.updateEmbed(client, "STOPPED");
    }

    async skip(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);
        if(!songQueue) return;
        songQueue.skip();
        if(!songQueue.songs.length) await this.updateEmbed(client, "STOPPED");
        else await this.updateEmbed(client, "CHANGING");
    }

    async toggle_pause(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);
        if(!songQueue) return;
        if(songQueue.paused) songQueue.setPaused(false);
        else songQueue.setPaused(true);
        await this.updateEmbed(client, "NOWPLAYING");
    }

    async swap_songs(client: Modified_Client, interaction: Interaction, songs: number[]){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);
        if(!songQueue) return;
        const [song1, song2] = songs;
        const queue = songQueue.songs;
        [queue[song1], queue[song2]] = [queue[song2], queue[song1]];
        songQueue.clearQueue();
        songQueue.setData(queue);
        await this.updateEmbed(client, "NOWPLAYING");
    }

    async remove_songs(client: Modified_Client, interaction: Interaction, songs: number[]){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);
        if(!songQueue) return;
        for(const song of songs){
            songQueue.remove(song);
        }
        await this.updateEmbed(client, "NOWPLAYING");
    }

    async toggle_shuffle(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);

        if(this.shuffle) this.shuffle = false;
        else this.shuffle = true;
        //Code some logic here later
        await this.updateEmbed(client, "NOWPLAYING");
    }

    async toggle_loop(client: Modified_Client, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const songQueue = client.player?.getQueue(interaction.guild?.id);

        if(this.loop) this.loop = false;
        else this.loop = true;
        //Code some logic here later
        await this.updateEmbed(client, "NOWPLAYING");
    }

    async queue_page(client: Modified_Client, state: QueuePageState, interaction: Interaction){
        if(!interaction || !interaction.guild) return;
        const guildQueue = client.player?.getQueue(interaction.guild?.id);
        if(!guildQueue || !guildQueue.songs.length) return;

        const queuePages = Math.ceil(guildQueue.songs.length / 25);
        const songsInQueuePage = guildQueue.songs.splice((this.currentQueuePage * 25), 25);

        switch(state){
            case 'FIRST':
                if(this.currentQueuePage === 0) return; 
                this.currentQueuePage = 0;
            break;

            case 'NEXT':
                if((this.currentQueuePage + 1) > (queuePages - 1) || this.currentQueuePage === (queuePages - 1)) return;
                this.currentQueuePage += 1;
            break;

            case 'PREV':
                if(this.currentQueuePage === 0 || (this.currentQueuePage - 1) < 0) return;
                this.currentQueuePage -= 1;
            break;

            case 'LAST':
                if(this.currentQueuePage === (queuePages - 1)) return; 
                this.currentQueuePage = queuePages - 1;
            break;
        }
        if(interaction) await this.updateEmbed(client, "NOWPLAYING");
    }

    async queue_state(client: Modified_Client, state: SelectStates, interaction: Interaction){
        if(!interaction || !interaction.guild) return;

        const queue = client.player?.getQueue(interaction.guild.id);
        if(!queue) return;

        switch(state){
            case 'SELECT':
                this.select = true;
                this.remove = false;
                this.swap = false;
            break;

            case 'REMOVE':
                if(!queue.songs.length) return;
                this.select = false;
                this.remove = true;
                this.swap = false;
            break;

            case 'SWAP':
                if(queue.songs.length <= 1 ) return;
                this.select = false;
                this.remove = false;
                this.swap = true;

            break;
            default: return;
        }

        if(queue.isPlaying) await this.updateEmbed(client, "NOWPLAYING");
    }

    async updateEmbed(client: Modified_Client, state: embedStates): Promise<void>{
        if(!this.musicChannel) return;
        if(!this.musicChannel.embedid || !this.musicChannel.channelid) return;
        try{
            const options = this.generateMusicEmbeds(client, state);
            if(!options) return;
            const channel = this.guild.channels.cache.get(this.musicChannel.channelid) as TextChannel | undefined;
            const message = channel?.messages.cache.get(this.musicChannel.embedid) ?? await channel?.messages.fetch(this.musicChannel.embedid);
            if(message) await message.edit(options);
        }catch(e){
            console.error(e);
        }
    }

    generateMusicEmbeds(client: Modified_Client, state: embedStates): MessageOptions | null {

        const messageEmbed = new MessageEmbed();
        const guildQueue = client.player?.getQueue(this.guild.id);
        switch(state){
            case 'NOWPLAYING':{
                if(!guildQueue) return null;
                //const progressBar = guildQueue.createProgressBar({size: 40, block: "▬", arrow: "🔘", time: true});
                const songsRemaining = guildQueue.songs.length === 1 && guildQueue.nowPlaying?.isFirst ? 0 : guildQueue.songs.length;

                messageEmbed
                    .setTitle(`🎵 Now playing 🎵`)
                    .setDescription(`\`\`\`ini\n▶️ ${guildQueue.nowPlaying?.name ?? "Unkown Title"} | ${guildQueue.nowPlaying?.duration ?? "Unknown Duration"}\n\n${"No progress"}\n\n${songsRemaining === 1 ? `${songsRemaining} song remaining.` : `${songsRemaining} songs remaining.`}\`\`\``)
                    .setColor("DARK_GREEN")
                    .setFooter(`Requested by: ${guildQueue.nowPlaying?.requestedBy?.username ?? "Unknown user"}`)
                    .setTimestamp();

                guildQueue.paused ? messageEmbed.setColor("DARK_RED") : messageEmbed.setColor("DARK_GREEN");
                const musicButtons = this.generateMusicButtons(guildQueue.paused, this.loop, this.shuffle, songsRemaining ? guildQueue.songs : [], this.guild, false);

                const selectMenu = 
                      this.select ? this.generateCurrentQueueList(songsRemaining ? guildQueue.songs : [], this.currentQueuePage, this.guild, "SELECT") 
                    : this.remove ? this.generateCurrentQueueList(songsRemaining ? guildQueue.songs : [], this.currentQueuePage, this.guild, "REMOVE")
                    : this.generateCurrentQueueList(songsRemaining ? guildQueue.songs : [], this.currentQueuePage, this.guild, "SWAP");

                const queuePageButtons = this.generateQueueButtons(songsRemaining ? guildQueue.songs : [], this.currentQueuePage, this.guild);

                const selectButtons = songsRemaining
                    ? this.generateSelectButtons(this.select, this.remove, this.swap, this.guild, songsRemaining ? guildQueue.songs : [], this.currentQueuePage, false)
                    : this.generateSelectButtons(this.select, this.remove, this.swap, this.guild, songsRemaining ? guildQueue.songs : [], this.currentQueuePage, true);

                return { 
                    embeds: [messageEmbed], 
                    components: queuePageButtons ? [musicButtons, selectMenu, queuePageButtons, selectButtons] : [musicButtons, selectMenu, selectButtons]
                };
            }

            case 'STOPPED':{
                messageEmbed
                    .setTitle(`Idle - Not playing anything`)
                    .setDescription(`
                    Use ${this.guild.prefix}play or ${this.guild.prefix}playlist commands to start playing music. The buttons below will help you navigate through your queue and give you live feedback.
                    
                    See ${this.guild.prefix}help to see available commands for your server.
                    `)
                    .setColor("BLUE")
                    .setFooter(``)
                    .setTimestamp()
                const newButtonRows = this.generateMusicButtons(false, false, false, [], this.guild, true);
                const newQueue = this.generateCurrentQueueList([], 0, this.guild, "SELECT");
                const stoppedSelectButtons = this.generateSelectButtons(true, false, false, this.guild, [], this.currentQueuePage, true);
                
                return {embeds: [messageEmbed], components: [newButtonRows, newQueue, stoppedSelectButtons]};
            }

            case 'CHANGING':{
                messageEmbed
                    .setTitle(`Changing song...`)
                    .setColor("BLUE")
                    .setDescription("")
                    .setFooter("")
                    .setTimestamp()
                return {embeds: [messageEmbed]};
            }

            case 'SEEKING':{
                if(!guildQueue) return null;
                messageEmbed
                    .setTitle(`Seeking to **${guildQueue.nowPlaying?.seekTime}**. Please wait, this might take a while.`)
                    .setColor("YELLOW")
                    .setDescription("")
                    .setFooter("")
                    .setTimestamp()
                return {embeds: [messageEmbed]}
            }
        }
    }

    generateQueueButtons(queue: Song[], currentpage: number, guild: Guild): MessageActionRow | null{
        if(!queue || !queue.length) return null;
        const queuePages = Math.ceil(queue.length / 25);
        
        if(queue.length <= 25 || queuePages === 1) return null;

        const skipToFirst = new MessageButton()
            .setCustomId(`buttonFirstPageQueue-${guild.id}`)
            .setLabel(`First Page`)
            .setStyle("PRIMARY")
            .setEmoji("⏮️")
            
        const nextPageButton = new MessageButton()
            .setCustomId(`buttonNextPageQueue-${guild.id}`)
            .setLabel(`Next Page`)
            .setStyle("PRIMARY")
            .setEmoji("▶️")
    
        const prevPageButton = new MessageButton()
            .setCustomId(`buttonPrevPageQueue-${guild.id}`)
            .setLabel(`Previous Page`)
            .setStyle("PRIMARY")
            .setEmoji("◀️")
        
        const skipToLast = new MessageButton()
            .setCustomId(`buttonLastPageQueue-${guild.id}`)
            .setLabel(`Last Page`)
            .setStyle("PRIMARY")
            .setEmoji("⏭️");
        
        //Only return buttons when necessary
        if(queuePages === 2){
            if(currentpage === 0) return new MessageActionRow().addComponents(nextPageButton);
            else return new MessageActionRow().addComponents(prevPageButton);
        }
        else if(queuePages >= 3) {
            if(currentpage === 0) return new MessageActionRow().addComponents(nextPageButton, skipToLast);
            else if(currentpage === (queuePages - 1)) return new MessageActionRow().addComponents(skipToFirst, prevPageButton);
            else if((currentpage + 1) === (queuePages - 1)) return new MessageActionRow().addComponents(skipToFirst, prevPageButton, nextPageButton);
            else if((currentpage - 1) === 0) return new MessageActionRow().addComponents(prevPageButton, nextPageButton, skipToLast);
            else return new MessageActionRow().addComponents(skipToFirst, prevPageButton, nextPageButton, skipToLast);
        }
        return null;
    }

    generateSelectButtons(buttonSelect: boolean, buttonRemove: boolean, buttonSwap: boolean, guild: Guild, queue: Song[], currentPage: number, disabled: boolean): MessageActionRow {
        const queuePages = Math.ceil(queue.length / 25);
        const songsInQueuePage = queue.splice((currentPage * 25), 25);

        const selectButton = new MessageButton()
            .setCustomId(`buttonSelect-${guild.id}`)
            .setLabel("Select Song")
            .setEmoji("✅");
        buttonSelect ? selectButton.setStyle("SUCCESS") : selectButton.setStyle("DANGER");
        if(!queue.length) selectButton.setDisabled(true)
        else disabled ? selectButton.setDisabled(true) : selectButton.setDisabled(false);
    
        const removeButton = new MessageButton()
            .setCustomId(`buttonRemove-${guild.id}`)
            .setLabel("Remove Songs")
            .setEmoji("❌");
        buttonRemove ? removeButton.setStyle("SUCCESS") : removeButton.setStyle("DANGER");
        if(!queue.length) removeButton.setDisabled(true)
        else disabled ? removeButton.setDisabled(true) : removeButton.setDisabled(false);
    
        const swapButton = new MessageButton()
            .setCustomId(`buttonSwap-${guild.id}`)
            .setLabel("Swap Songs")
            .setEmoji("🔃");
        buttonSwap ? swapButton.setStyle("SUCCESS") : swapButton.setStyle("DANGER");
        if(queuePages <= 1 || songsInQueuePage.length <= 1) swapButton.setDisabled(true)
        else disabled ? swapButton.setDisabled(true) : swapButton.setDisabled(false);
        
        return new MessageActionRow()
            .addComponents(selectButton, removeButton, swapButton)
    }

    generateCurrentQueueList(queue: Song[], currentpage: number, guild: Guild, type: SelectStates): MessageActionRow{
        const queuePages = Math.ceil(queue.length / 25);
        const placeHolderText = type === "SELECT" ? `Select a song from Song Queue. Page: ${currentpage + 1}/${queuePages}` : type === "REMOVE" ? `Remove multiple songs from Song Queue. Page: ${currentpage + 1}/${queuePages}` : `Swap places with two songs. Page: ${currentpage + 1}/${queuePages}`;
        const customId = type === "SELECT" ? `selectSongQueue-${guild.id}` : type === "REMOVE" ? `removeSongQueue-${guild.id}` : `swapSongQueue-${guild.id}`;
    
        const songsInQueuePage = queue.splice((currentpage * 25), 25);

        const selectMenu = new MessageSelectMenu()
            .setCustomId(`selectSongQueue-${guild.id}`)
            .setPlaceholder("Song Queue")
            .setDisabled(true)
    
        if(queue.length <= 1 || !queuePages) 
            return new MessageActionRow()
                .addComponents(selectMenu.addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"}))
        
        selectMenu
            .setCustomId(customId)
            .setPlaceholder(placeHolderText)
            .setDisabled(false)
            .addOptions(songsInQueuePage.map((q, i) => ({
                label: `${(i+1) + (currentpage * 25)}.) ${q.name}`, 
                description: `${"Unknown queuer"} - ${q.duration}`, 
                value: `${i}-${q.url}`}))
            )
        type === "REMOVE" && songsInQueuePage.length ? selectMenu.setMinValues(1).setMaxValues(songsInQueuePage.length) : type === "SWAP" && songsInQueuePage.length >= 2 ? selectMenu.setMinValues(1).setMaxValues(2) : ``;
        
        return new MessageActionRow().addComponents(selectMenu);
    }

    generateMusicButtons(paused: boolean, loop: boolean, shuffle: boolean, queue: Song[], guild: Guild, disabled: boolean): MessageActionRow {    
        const playPauseButton = new MessageButton()
            .setCustomId(`buttonPlayPause-${guild.id}`)
            .setLabel("Pause")
            .setStyle("PRIMARY")
            .setDisabled(false)
            .setEmoji("⏯️")
        if(paused) playPauseButton.setLabel("Resume").setStyle("DANGER")
        if(disabled) playPauseButton.setDisabled(true);

        const skipButton = new MessageButton()
            .setCustomId(`buttonSkip-${guild.id}`)
            .setLabel("Skip")
            .setStyle("PRIMARY")
            .setDisabled(false)
            .setEmoji("⏭️")
        if(disabled) skipButton.setDisabled(true);

        const stopButton = new MessageButton()
            .setCustomId(`buttonStop-${guild.id}`)
            .setLabel("Stop")
            .setStyle("PRIMARY")
            .setDisabled(false)
            .setEmoji("⏹️")
        if(disabled) stopButton.setDisabled(true);

        const loopButton = new MessageButton()
            .setCustomId(`buttonLoop-${guild.id}`)
            .setLabel(`Loop`)
            .setStyle("DANGER")
            .setDisabled(false)
            .setEmoji("🔁")
        if(loop) loopButton.setStyle("SUCCESS");
        if(disabled) loopButton.setDisabled(true);

        const shuffleButton = new MessageButton()
            .setCustomId(`buttonShuffle-${guild.id}`)
            .setLabel(`Shuffle`)
            .setStyle("DANGER")
            .setDisabled(false)
            .setEmoji("🔀")
        if(shuffle) shuffleButton.setStyle("SUCCESS");
        if(disabled) shuffleButton.setDisabled(true);

        return new MessageActionRow().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);
    }

    generate_progress_bar = (song: Song): string => {
        //@ts-ignore
        /*if(!song) return new Array(40).fill("🔘", 0, 1).fill("▬").join("");
        const { milliseconds, player } = song;
        const { } = player;
    
        let progress_based_on_40 = Math.trunc((playbackDuration/1000)/(parseFloat(lengthSeconds)) * 39);
        if(progress_based_on_40 >= 39) progress_based_on_40 = 39;
        //▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
        const progressBar = new Array(40).fill("▬");
        progressBar[progress_based_on_40] = "🔘"
        return progressBar.join("");*/
        return "";
    }
}