import { CategoryChannel, Guild, GuildMember, Interaction, Message, OverwriteResolvable, Role, TextChannel } from "discord.js";
import { update_state } from "src/methods/cah/cahsettings";
import Modified_Client from "../methods/client/Client";

export type Gamestate = "SETUP" | "SELECT" | "VOTE" | "ROUNDWON" | "PAUSE" | "GAMEOVER";

export interface CurrentSettings {
    guildId: string;
    packs: AvailablePack[];
    wincondition: number;
}

export interface PlayerConstructor {
    guild: Guild;
    member: GuildMember;
    channel: TextChannel;
    message: Message;

    previous_roles: Role[];
    whiteCards: string[];
    player_cards_state: Player_Cards_State;

    selected_cards_indexes: number[];
    selected_white_cards: string[];
    ready: boolean;

    points: number;
    replacedcards: boolean;
}

export interface Selected_Cards {
    player: PlayerConstructor,
    cards: string[]
}

export interface Game {
    wincondition: number;
    packs: AvailablePack[];

    client: Modified_Client;
    guild: Guild;
    members: GuildMember[];

    deck: Deck | null;
    players: PlayerConstructor[];
    selected_cards: Selected_Cards[];

    currentcardzar: PlayerConstructor | null;
    blackcard: BlackCard | null;
    gamestate: Gamestate;
    roundWon: PlayerConstructor | null;

    roundTimeLimit: number;
    timer: NodeJS.Timeout | null;

    start: () => void;
    stop: (command?: boolean) => void;

    create_channel: (member: GuildMember, parent: CategoryChannel) => Promise<TextChannel | null>
    create_embed: (member: GuildMember, channel: TextChannel) => Promise<Message | null>;
    load_deck: () => void;
    give_cards: (amount: number) => void;
    select_cardczar: () => void;
    select_blackcard: () => void;
    
    change_player_cards_state: (player: GuildMember, state: Player_Cards_State, interaction: Interaction) => void;
    replace_cards: (state: Player_Cards_State, cards: number[], member: GuildMember, interaction?: Interaction) => void;
    select_cards: (state: Player_Cards_State, cards: number[], member: GuildMember, interaction?: Interaction) => void;

    toggle_ready: (member: GuildMember) => void;
    push_player_cards: (member: GuildMember) => void;
    choose_winner: (member: GuildMember) => void;
    check_if_all_selected: () => void;

    player_join: (member: GuildMember) => Promise<PlayerConstructor | null>;
    player_leave: (member: GuildMember) => void;

    update_embed: (state: Update_Embed, player: PlayerConstructor) => void;
}

export type Player_Cards_State = "SELECT" | "REMOVE" | "SWAP";
export type Update_Embed = "SELECT" | "VOTE" | "ROUNDWON" | "PAUSE" | "GAMEOVER";

export interface Deck {
    packnames: string[];
    deckblackcards: BlackCard[];
    deckwhitecards: string[];
}

export interface AvailablePacks {
    packs: AvailablePack[];
}

export interface AvailablePack {
    name: string;
    id: string;
    quantity: {
        black: number;
        white: number;
        total: number;
    }
}

export interface Pack {
    pack: {
        name: string;
        id: string;
    }
    black: BlackCard[];
    white: string[];
}

export interface BlackCard {
    content: string;
    pick: number;
    draw: number;
}

export interface CAH_Settings {
    client: Modified_Client;
    guild: Guild;
    channel: TextChannel;

    packs: AvailablePack[];
    embed: Message | null;

    currentPage: number;
    selectedPacks: AvailablePack[];
    winstate: number;

    create_embed: () => void;
    update_embed: (state: update_state) => void;

    load_packs: () => void;

    next_page: () => void;
    prev_page: () => void;
    
    toggle_select_pack: () => void;
    update_win_state: (state: "PLUS" | "MINUS", amount : 1 | 5) => void;

    save: () => void;
    cancel: () => void;

}

export type CAHGameButtons = 
    "buttonCAHSelect" |
    "buttonCAHRemove" |
    "buttonCAHSwap" |
    "buttonCAHReady";

export type CAHSelectMenu = 
    "WhiteCardsSelect" |
    "WhiteCardsSwap" |
    "WhiteCardsVote" 

export type CAHSButtons = 
    "buttonSaveSettings" |
    "buttonCloseSettings" |
    "buttonChoosePacksSettings" |
    "buttonChooseWinStateSettings" |
    "buttonChoosePack" |
    "buttonSavePack" |
    "buttonPrevPackPage" |
    "buttonNextPackPage" |
    "buttonSaveWinState" |
    "buttonPlusOneWin" |
    "buttonMinusOneWin" |
    "buttonPlusFiveWin" |
    "buttonMinusFiveWin";