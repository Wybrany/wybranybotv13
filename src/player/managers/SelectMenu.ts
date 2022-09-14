import { SelectMenuBuilder } from "discord.js";
import { DefaultActionRowOptions, Queue, SelectMenuNames, ButtonSelectState, ActionRowOptions } from "..";

const parseSongName = (string: string): string => {
    if(string.length >= 90) return string.substring(0, 90) + "...";
    else return string;
}

class SelectMenu {
    private queue: Queue;
    options: ActionRowOptions = DefaultActionRowOptions;
    selectmenu!: SelectMenuBuilder;    
    constructor(queue: Queue, options: ActionRowOptions){

        this.queue = queue;

        this.options = Object.assign(
            {} as ActionRowOptions,
            this.options,
            options
        );

        this.create();
    }

    private create(): void {
        let { currentQueuePage, selectState, disabled } = this.options;
        const queuePages = Math.ceil(this.queue.songs.length / 25);
        if(currentQueuePage! > queuePages || currentQueuePage! <= 0) currentQueuePage = 0;
        const pagePosition = `${currentQueuePage! + 1}/${queuePages ? queuePages : 1}`;
        const guildId = this.queue.guild.id;
        const songsInCurrentQueuePage = this.queue.getQueueFromIndex(((currentQueuePage! * 25) + 1), 25);
        
        const placeHolderText = 
              selectState === ButtonSelectState.SELECT ? `Select a song from Song Queue. ${pagePosition}` 
            : selectState === ButtonSelectState.REMOVE ? `Remove songs from Song Queue. ${pagePosition}` 
            : `Swap two songs in Song Queue ${pagePosition}`;

        const customId = 
              selectState === ButtonSelectState.SELECT ? `${SelectMenuNames.SELECT}-${guildId}` 
            : selectState === ButtonSelectState.REMOVE ? `${SelectMenuNames.REMOVE}-${guildId}`
            : `${SelectMenuNames.SWAP}-${guildId}`;

        const selectmenu = new SelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeHolderText)
            .setDisabled(disabled ?? false);

        if(this.queue.songs.length <= 1 || !queuePages)
            selectmenu
                .addOptions({label: "placeholder", description: "placeholder description", value: "placeholder_value"})
                .setDisabled(true);
        else
            selectmenu
                .addOptions(songsInCurrentQueuePage.map((song, i) => ({
                    label: `${(i+1) + (currentQueuePage! * 25)}.) ${parseSongName(song?.name ?? "Unknown Songname")}`,
                    description: `${song?.requestedBy?.tag ?? "Unknown Requester"} - ${song?.duration ?? "Unknown Duration"}`,
                    value: `${i}-${song?.url ?? "Unknown URL"}`
                })));
        
        if(selectState === ButtonSelectState.REMOVE && songsInCurrentQueuePage.length >= 1)
            selectmenu
                .setMinValues(1)
                .setMaxValues(songsInCurrentQueuePage.length);
        
        if(selectState === ButtonSelectState.SWAP && songsInCurrentQueuePage.length >= 2)
            selectmenu
                .setMinValues(1)
                .setMaxValues(2);

        this.selectmenu = selectmenu;
    }
}

export { SelectMenu };