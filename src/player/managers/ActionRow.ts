import { Guild, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } from "discord.js";
import { Queue, DefaultActionRowOptions, ButtonNames, ButtonSelectState, ActionRowOptions, SelectMenu, RepeatMode } from "..";
import { Button } from "./Button";

class ActionRow {
    private queue: Queue;
    options: ActionRowOptions = DefaultActionRowOptions;
    notPlaying: boolean = false;
    buttons!: ActionRowBuilder<any>[];

    constructor(queue: Queue, options: ActionRowOptions = DefaultActionRowOptions){

        this.queue = queue;

        this.options = Object.assign(
            {} as ActionRowOptions,
            this.options,
            options
        );

        if(queue.destroyed || !queue.connection || !queue.isPlaying){
            this.options.disabled = true;
            this.notPlaying = true;
        }
        this.create();
    }

    private create(): void{
        const guild = this.queue.guild;
        const queuePages = Math.ceil(this.queue.songs.length / 25);
        const disabled = (!this.queue.songs.length || this.options.disabled) ? true : false;
        const playerButtons = this.createPlayerButtons(guild, disabled);
        const selectMenuQueue = this.createSelectMenuQueue();
        const queueButtons = this.createQueueButtons(guild, disabled);
        const queueSelectButtons = this.createQueueSelectButtons(guild, disabled);
        if(queuePages <= 1 || !queueButtons) this.buttons = [playerButtons, selectMenuQueue, queueSelectButtons];
        else this.buttons = [playerButtons, selectMenuQueue, queueButtons, queueSelectButtons];
    }
    
    private createPlayerButtons(guild: Guild, disabled: boolean = false): ActionRowBuilder<ButtonBuilder> {
        const playPauseButton = new Button(guild, {customId: ButtonNames.PLAYPAUSE, style: ButtonStyle.Primary, disabled}).button;
        if(!this.notPlaying ? this.queue.paused : false) playPauseButton.setStyle(ButtonStyle.Danger);
        const skipButton = new Button(guild, {customId: ButtonNames.SKIP, style: ButtonStyle.Primary, disabled}).button;
        const stopButton = new Button(guild, {customId: ButtonNames.STOP, style: ButtonStyle.Primary, disabled}).button;
        const loopButton = new Button(guild, {customId: ButtonNames.LOOP, style: ButtonStyle.Danger, disabled}).button;
        if(!this.notPlaying ? (this.queue.repeatMode !== RepeatMode.DISABLED) : false) {
            loopButton.setStyle(ButtonStyle.Success);
            if(this.queue.repeatMode === RepeatMode.SONG) loopButton.setEmoji("🔂").setLabel("Loop Song");
            else loopButton.setEmoji("🔁").setLabel("Loop Queue");
        }
        const shuffleButton = new Button(guild, {customId: ButtonNames.SHUFFLE, style: ButtonStyle.Danger, disabled}).button;
        if(!this.notPlaying ? this.queue.shuffled : false) shuffleButton.setStyle(ButtonStyle.Success);
        return new ActionRowBuilder<ButtonBuilder>().addComponents(playPauseButton, skipButton, stopButton, loopButton, shuffleButton);
    }

    private createSelectMenuQueue(): ActionRowBuilder<SelectMenuBuilder> {
        return new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenu(this.queue, this.options).selectmenu
            );
    }

    private createQueueButtons(guild: Guild, disabled: boolean = false): ActionRowBuilder<ButtonBuilder> | null {
        let { currentQueuePage } = this.options;
        const queuePages = Math.ceil(this.queue.songs.length / 25);
        if(currentQueuePage! > queuePages || currentQueuePage! <= 0) currentQueuePage = 0;

        if(this.queue.songs.length < 25 || queuePages === 1) return null;

        const firstQueuePageButton = new Button(guild, {customId: ButtonNames.FIRSTQUEUEPAGE, style: ButtonStyle.Primary, disabled}).button;
        const prevQueuePageButton = new Button(guild, {customId: ButtonNames.PREVQUEUEPAGE, style: ButtonStyle.Primary, disabled}).button;
        const nextQueuePageButton = new Button(guild, {customId: ButtonNames.NEXTQUEUEPAGE, style: ButtonStyle.Primary, disabled}).button;
        const lastQueuePageButton = new Button(guild, {customId: ButtonNames.LASTQUEUEPAGE, style: ButtonStyle.Primary, disabled}).button;

        //Only return specific buttons when necessary. Don't want to clutter.
        if(queuePages === 2){
            if(currentQueuePage === 0) return new ActionRowBuilder<ButtonBuilder>().addComponents(nextQueuePageButton);
            else return new ActionRowBuilder<ButtonBuilder>().addComponents(prevQueuePageButton);
        }
        else if (queuePages >= 3){
            if(currentQueuePage === 0) return new ActionRowBuilder<ButtonBuilder>().addComponents(nextQueuePageButton, lastQueuePageButton);
            else if(currentQueuePage === (queuePages - 1)) return new ActionRowBuilder<ButtonBuilder>().addComponents(firstQueuePageButton, prevQueuePageButton);
            else if((currentQueuePage! + 1) === (queuePages - 1)) return new ActionRowBuilder<ButtonBuilder>().addComponents(firstQueuePageButton, prevQueuePageButton, nextQueuePageButton);
            else if ((currentQueuePage! - 1) === 0) return new ActionRowBuilder<ButtonBuilder>().addComponents(prevQueuePageButton, nextQueuePageButton, lastQueuePageButton);
            else return new ActionRowBuilder<ButtonBuilder>().addComponents(firstQueuePageButton, prevQueuePageButton, nextQueuePageButton, lastQueuePageButton);
        }
        else
            return null;
    }

    private createQueueSelectButtons(guild: Guild, disabled: boolean = false): ActionRowBuilder<ButtonBuilder> {
        let { currentQueuePage, selectState } = this.options;
        const queuePages = Math.ceil(this.queue.songs.length / 25);
        if(currentQueuePage! > queuePages || currentQueuePage! <= 0) currentQueuePage = 0;
        const songsInCurrentQueuePage = this.queue.getQueueFromIndex((currentQueuePage! * 25), 25);
        
        const selectButton = new Button(guild, {customId: ButtonNames.SELECT, style: ButtonStyle.Success, disabled}).button;
        selectState === ButtonSelectState.SELECT ? selectButton.setStyle(ButtonStyle.Success) : selectButton.setStyle(ButtonStyle.Danger);
        if(songsInCurrentQueuePage.length <= 1 || !this.queue.songs.length) selectButton.setDisabled(true);

        const removeButton = new Button(guild, {customId: ButtonNames.REMOVE, style: ButtonStyle.Danger, disabled}).button;
        selectState === ButtonSelectState.REMOVE ? removeButton.setStyle(ButtonStyle.Success) : removeButton.setStyle(ButtonStyle.Danger);
        if(songsInCurrentQueuePage.length <= 1 || !this.queue.songs.length) removeButton.setDisabled(true);

        const swapButton = new Button(guild, {customId: ButtonNames.SWAP, style: ButtonStyle.Danger, disabled}).button;
        selectState === ButtonSelectState.SWAP ? swapButton.setStyle(ButtonStyle.Success) : swapButton.setStyle(ButtonStyle.Danger);
        if(songsInCurrentQueuePage.length <= 1 || !this.queue.songs.length) swapButton.setDisabled(true);

        return new ActionRowBuilder<ButtonBuilder>().addComponents(selectButton, removeButton, swapButton);
    }

}

export { ActionRow };