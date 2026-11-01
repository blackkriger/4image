import type { Board } from './api';

export interface BoardGroup {
  title: string;
  nsfw: boolean;
  boards: Board[];
}

const GROUPS: { title: string; nsfw?: boolean; codes: string[] }[] = [
  { title: 'Video Games', codes: ['v', 'vg', 'vm', 'vmg', 'vp', 'vr', 'vrpg', 'vst'] },
  { title: 'Japanese Culture', codes: ['a', 'c', 'w', 'm', 'cgl', 'cm', 'f', 'n', 'jp', 'vt'] },
  { title: 'Interests', codes: ['co', 'g', 'tv', 'k', 'o', 'an', 'tg', 'sp', 'xs', 'pw', 'sci', 'his', 'int', 'out', 'toy'] },
  { title: 'Creative', codes: ['i', 'po', 'p', 'ck', 'ic', 'wg', 'lit', 'mu', 'fa', '3', 'gd', 'diy', 'wsg', 'qst'] },
  { title: 'Other', codes: ['biz', 'trv', 'fit', 'x', 'adv', 'lgbt', 'mlp', 'news', 'wsr', 'vip'] },
  { title: 'Misc.', nsfw: true, codes: ['b', 'r9k', 'pol', 'bant', 'soc', 's4s'] },
  { title: 'Adult', nsfw: true, codes: ['s', 'hc', 'hm', 'h', 'e', 'u', 'd', 'y', 't', 'hr', 'gif', 'aco', 'r'] },
];

export function groupBoards(boards: Board[]): BoardGroup[] {
  const byCode = new Map(boards.map((b) => [b.board, b]));
  const groups = GROUPS.map((g) => ({
    title: g.title,
    nsfw: !!g.nsfw,
    boards: g.codes.flatMap((c) => byCode.get(c) ?? []),
  }));
  const placed = new Set(GROUPS.flatMap((g) => g.codes));
  for (const b of boards) {
    if (placed.has(b.board)) continue;
    groups.find((g) => g.title === (b.ws_board ? 'Other' : 'Adult'))?.boards.push(b);
  }
  return groups.filter((g) => g.boards.length);
}
