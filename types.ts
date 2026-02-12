
export type Category = 'O-40' | 'O-50' | 'O-60';

export interface Score {
  home: number | null;
  away: number | null;
}

export type MatchData = Record<string, Score>;

export interface TeamStats {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  rank?: number;
}

export interface CategoryData {
  teams: string[];
  matches: MatchData;
}

export type AllData = Record<Category, CategoryData>;

export interface LeagueState {
  activeCategory: Category;
  data: AllData;
}
