import { Guild, ButtonBuilder } from "discord.js";
import { ButtonOptions, DefaultButtonOptions, DefaultButtonLabels, DefaultButtonEmojis, ButtonNames } from "..";

class Button {
    private guild: Guild;
    options: ButtonOptions = DefaultButtonOptions;
    button!: ButtonBuilder;    
    constructor(guild: Guild, options: ButtonOptions = DefaultButtonOptions){
        this.guild = guild;

        this.options = Object.assign(
            {} as ButtonOptions,
            this.options,
            options,
            options?.label ?? {label: DefaultButtonLabels[options.customId]},
            options?.emoji ?? {emoji: DefaultButtonEmojis[options.customId]}
        );
            
        this.create();
    }

    private create(): void {
        const { customId, disabled, style, label, emoji } = this.options;
        const button = new ButtonBuilder()
            .setCustomId(`${customId}-${this.guild.id}`)
            .setStyle(style)
            .setLabel(label!)
            .setEmoji(emoji!)
            .setDisabled(disabled);

        this.button = button;
    }
}

export { Button };