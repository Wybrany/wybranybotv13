import { CAH_Settings, Pack, AvailablePacks, AvailablePack } from "../../interfaces/cah.interface";
import Modified_Client from "../client/Client";
import { Guild, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { existsSync, readFileSync } from "fs"; 
import { join } from "path";
import { savefiledata } from "../backup";

export class CAH_SETTINGS implements CAH_Settings{
    public client: Modified_Client;
    public guild: Guild;
    public channel: TextChannel;
    public packs: AvailablePack[];
    public embed: Message | null;

    public currentPage: number;
    public selectedPacks: AvailablePack[];
    public winstate: number;

    constructor(client: Modified_Client, guild: Guild, channel: TextChannel){
        this.client = client; 
        this.guild = guild;
        this.channel = channel;

        this.packs = [];
        this.embed = null;

        this.currentPage = 0;
        this.selectedPacks = client.cahsettings.get(this.guild.id)?.packs ?? [];
        this.winstate = client.cahsettings.get(this.guild.id)?.wincondition ?? 10;
    }

    async create_embed(){
        if(!this.packs.length) await this.load_packs();
        const createEmbed = generate_embed("CREATE", this.guild, this.packs, this.selectedPacks, this.winstate, this.currentPage);
        const buttons = generate_buttons("CREATE", this.guild, this.packs, this.selectedPacks, this.winstate, this.currentPage);
        const embed = await this.channel.send({embeds: [createEmbed], components: [buttons]});
        this.embed = embed;
    }
    async update_embed(state: update_state){
        if(!this.embed) return;
        const newEmbed = generate_embed(state, this.guild, this.packs, this.selectedPacks, this.winstate, this.currentPage);
        const newButtons = generate_buttons(state, this.guild, this.packs, this.selectedPacks, this.winstate, this.currentPage);
        if(state === "SAVED" || state === "CANCELED") return await this.embed.edit({embeds: [newEmbed], components: []});
        await this.embed.edit({embeds: [newEmbed], components: [newButtons]});
    }

    async load_packs(){
        const packs_dir = join(process.cwd(), "media/cards_against_humanity/official/packs.json");
        if(!existsSync(packs_dir)) throw `${packs_dir} does not exist!`;
        const availablePack = JSON.parse(readFileSync(packs_dir, "utf-8")) as AvailablePacks;
        this.packs.push(...availablePack.packs);
    }

    next_page(){
        if((this.currentPage + 1) > (this.packs.length - 1) || this.currentPage === (this.packs.length - 1)) return;
        this.currentPage += 1;
        this.update_embed("PACKS");
    }
    prev_page(){
        if(this.currentPage === 0 || (this.currentPage - 1) < 0) return; 
        this.currentPage -= 1;
        this.update_embed("PACKS");
    }
    
    toggle_select_pack(){ 
        const current_pack = this.packs[this.currentPage];
        const selected = this.selectedPacks.map(p => p.id).includes(current_pack.id);
        if(!selected) this.selectedPacks.push(current_pack);
        else this.selectedPacks = this.selectedPacks.filter(p => p.id !== current_pack.id);
        this.update_embed('PACKS');
    }

    update_win_state(state: "PLUS" | "MINUS", amount : 1 | 5){
        switch(state){
            case'PLUS':
                this.winstate += amount;
            break;

            case 'MINUS':
                if((this.winstate - amount) <= 0) return this.winstate = 0;
                this.winstate -= amount;
            break;
        }
        this.update_embed('WINSTATE');
    }

    async save(){
        this.client.cahsettings.set(this.guild.id, {
            guildId: this.guild.id,
            packs: this.selectedPacks,
            wincondition: this.winstate
        })
        await savefiledata(this.client, this.guild.id);
        await this.update_embed("SAVED");
        this.client.cah_settings_embed.delete(this.guild.id);
    }
    async cancel(){ 
        await this.update_embed("CANCELED");
        this.client.cah_settings_embed.delete(this.guild.id);
    }
}

export type update_state = "CREATE" | "PACKS" | "WINSTATE" | "SAVED" | "CANCELED";

const generate_buttons = (state: update_state, guild: Guild, packs: AvailablePack[], selectedPacks: AvailablePack[], winstate: number, currentpage: number): MessageActionRow => {
    const actionRow = new MessageActionRow();

    switch(state){
        case 'CREATE':
            const SaveSettingsButton = new MessageButton()
                .setCustomId(`buttonSaveSettings-${guild.id}`)
                .setLabel(`Save Settings`)
                .setStyle("SUCCESS")
            const CloseSettingsbutton = new MessageButton()
                .setCustomId(`buttonCloseSettings-${guild.id}`)
                .setLabel(`Close Settings`)
                .setStyle("DANGER")
            const SelectPacksButton = new MessageButton()
                .setCustomId(`buttonChoosePacksSettings-${guild.id}`)
                .setLabel(`Choose Packs`)
                .setStyle(`PRIMARY`)
            const ChooseWinStateButton = new MessageButton()
                .setCustomId(`buttonChooseWinStateSettings-${guild.id}`)
                .setLabel(`Choose Winstate`)
                .setStyle(`PRIMARY`)

            actionRow.addComponents(SelectPacksButton, ChooseWinStateButton, SaveSettingsButton, CloseSettingsbutton)
        break;

        case 'PACKS':
            const currentPack = packs[currentpage];
            const selected = selectedPacks.map(p => p.id).includes(currentPack.id);

            const ChoosePackButton = new MessageButton()
                .setCustomId(`buttonChoosePack-${guild.id}`)
            selected ? ChoosePackButton.setStyle(`SUCCESS`).setLabel(`Selected`) : ChoosePackButton.setStyle(`DANGER`).setLabel(`Select`);

            const SavePacksButton = new MessageButton()
                .setCustomId(`buttonSavePack-${guild.id}`)
                .setLabel(`Save Packs`)
                .setStyle(`SUCCESS`)
            const PrevPackPageButton = new MessageButton()
                .setCustomId(`buttonPrevPackPage-${guild.id}`)
                .setLabel(`Prev Page`)
                .setStyle(`PRIMARY`)
            const NextPackPageButton = new MessageButton()
                .setCustomId(`buttonNextPackPage-${guild.id}`)
                .setLabel(`Next Page`)
                .setStyle(`PRIMARY`)

            if(currentpage === (packs.length - 1)) actionRow.addComponents(ChoosePackButton, SavePacksButton, PrevPackPageButton);
            else if (currentpage === 0) actionRow.addComponents(ChoosePackButton, SavePacksButton, NextPackPageButton);
            else actionRow.addComponents(ChoosePackButton, SavePacksButton, PrevPackPageButton, NextPackPageButton);
        break;

        case 'WINSTATE':
            const SaveWinstateButton = new MessageButton()
                .setCustomId(`buttonSaveWinState-${guild.id}`)
                .setLabel(`Save Winstate`)
                .setStyle(`SUCCESS`)
            const PlusOneWinStateButton = new MessageButton()
                .setCustomId(`buttonPlusOneWin-${guild.id}`)
                .setLabel(`+1`)
                .setStyle(`SUCCESS`)
            const MinusOneWinStateButton = new MessageButton()
                .setCustomId(`buttonMinusOneWin-${guild.id}`)
                .setLabel(`-1`)
                .setStyle(`DANGER`)
            const PlusFiveWinStateButton = new MessageButton()
                .setCustomId(`buttonPlusFiveWin-${guild.id}`)
                .setLabel(`+5`)
                .setStyle(`SUCCESS`)
            const MinusFiveWinStateButton = new MessageButton()
                .setCustomId(`buttonMinusFiveWin-${guild.id}`)
                .setLabel(`-5`)
                .setStyle(`DANGER`)

            actionRow.addComponents(SaveWinstateButton, MinusFiveWinStateButton, MinusOneWinStateButton, PlusOneWinStateButton, PlusFiveWinStateButton)
        break;

        case 'SAVED':
        break;
    }

    return actionRow;
}

const generate_embed = (state: update_state, guild: Guild, packs: AvailablePack[], selectedPacks: AvailablePack[], winstate: number, currentPage: number): MessageEmbed => {
    const embed = new MessageEmbed();

    switch(state){
        case 'CREATE':
            embed
                .setTitle(`CAH settings for ${guild.name}`)
                .setDescription(`
                    Here are the current settings for this server.

                    Points to win: ${winstate}
                    Selected packs: ${selectedPacks.length ? selectedPacks.map(p => `**${p.name}**`).join(", ") : `No packs selected`}.
                    ${selectedPacks.length ? `Total white cards: ${selectedPacks.map(p => p.quantity.white).reduce((acc, red) => acc + red)}` : ``}
                    ${selectedPacks.length ? `Total black cards: ${selectedPacks.map(p => p.quantity.black).reduce((acc, red) => acc + red)}` : ``}
                `)
                .setColor("BLUE")
                .setFooter("")
                .setTimestamp();
        break;

        case 'PACKS':
            const currentPack = packs[currentPage];
            const selected = selectedPacks.map(p => p.id).includes(currentPack.id);
            embed
                .setTitle(`Available packs for ${guild.name}`)
                .setDescription(`
                    Packtitle: ${currentPack.name}
                    Number of white cards: ${currentPack.quantity.white}
                    Number of black cards: ${currentPack.quantity.black}

                    page: ${currentPage + 1}/${packs.length}
                `)
                .setFooter("")
                .setTimestamp()
            selected ? embed.setColor(`GREEN`) : embed.setColor(`RED`);
        break;

        case 'WINSTATE':
            embed
                .setTitle(`Current Wincondition for ${guild.name}`)
                .setDescription(`
                    To win, you need: ${winstate} points.
                `)
                .setColor("BLUE")
                .setFooter("")
                .setTimestamp();
        break;

        case 'SAVED':
            embed
            .setTitle(`Saved new data.`)
            .setDescription(`
                Successfully saved new data! You can either start playing the game or change some more settings.
            `)
            .setColor("GREEN")
            .setFooter("")
            .setTimestamp();
        break;

        case 'CANCELED':
            embed
            .setTitle(`Canceled settings.`)
            .setDescription(`
                You have canceled your current settings. Will not save anything.
            `)
            .setColor("RED")
            .setFooter("")
            .setTimestamp();
        break;
    }

    return embed;
}