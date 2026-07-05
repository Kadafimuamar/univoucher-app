export interface Voucher {
  id: string;
  game: string;
  publisher: string;
  denomination: string; // what the code is worth, in the game's own currency
  priceUct: number;
  accent: string; // hex used for this card's stub color
  blurb: string;
}

export const VOUCHERS: Voucher[] = [
  {
    id: 'starforge-1000-gems',
    game: 'Starforge Online',
    publisher: 'Nine Suns Studio',
    denomination: '1,000 Gems',
    priceUct: 8,
    accent: '#7C5CFF',
    blurb: 'Fleet upgrades, cosmetic hulls, and season-pass unlocks.',
  },
  {
    id: 'ember-legends-battlepass',
    game: 'Ember Legends',
    publisher: 'Redwatch Games',
    denomination: 'Season 7 Battle Pass',
    priceUct: 12,
    accent: '#29F19C',
    blurb: 'Unlocks all season 7 tiers plus the founder emote set.',
  },
  {
    id: 'driftcity-20-credits',
    game: 'Drift City GT',
    publisher: 'Apex Circuit',
    denomination: '2,000 Credits',
    priceUct: 5,
    accent: '#FFB454',
    blurb: 'Garage slots, paint jobs, and the midnight livery pack.',
  },
  {
    id: 'runeforged-vip-30d',
    game: 'Runeforged',
    publisher: 'Ninth Anvil',
    denomination: 'VIP — 30 Days',
    priceUct: 15,
    accent: '#FF5C8A',
    blurb: 'Double drop rates, an extra guild slot, and a mount skin.',
  },
  {
    id: 'starforge-5000-gems',
    game: 'Starforge Online',
    publisher: 'Nine Suns Studio',
    denomination: '5,000 Gems',
    priceUct: 35,
    accent: '#7C5CFF',
    blurb: 'The bundle regulars buy — enough for a full ship refit.',
  },
  {
    id: 'pixelquest-starter-pack',
    game: 'Pixelquest',
    publisher: 'Loose Thread Games',
    denomination: 'Starter Pack',
    priceUct: 4,
    accent: '#4FD3FF',
    blurb: 'Extra inventory tabs, a companion pet, and 500 coins.',
  },
];

export function findVoucher(id: string): Voucher | undefined {
  return VOUCHERS.find((v) => v.id === id);
}
