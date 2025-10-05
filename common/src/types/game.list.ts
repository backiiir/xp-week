export interface GameList {
  appVersion: string;
  jsonVersion: string;
  games: GameListData[];
}

export interface GameListData {
  name: string;
  source: string;
  previewImage: string;
}
