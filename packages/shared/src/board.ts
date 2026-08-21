import { Tile, TileType, ColorGroup } from "./types";

export const BOARD: Tile[] = [
  { index: 0, name: "GO", type: TileType.Go },
  { index: 1, name: "Mediterranean Avenue", type: TileType.Property, color: ColorGroup.Brown, price: 60, rent: [2, 10, 30, 90, 160, 250] },
  { index: 2, name: "Community Chest", type: TileType.CommunityChest },
  { index: 3, name: "Baltic Avenue", type: TileType.Property, color: ColorGroup.Brown, price: 60, rent: [4, 20, 60, 180, 320, 450] },
  { index: 4, name: "Income Tax", type: TileType.Tax, price: 200 },
  { index: 5, name: "Reading Railroad", type: TileType.Railroad, price: 200 },
  { index: 6, name: "Oriental Avenue", type: TileType.Property, color: ColorGroup.LightBlue, price: 100, rent: [6, 30, 90, 270, 400, 550] },
  { index: 7, name: "Chance", type: TileType.Chance },
  { index: 8, name: "Vermont Avenue", type: TileType.Property, color: ColorGroup.LightBlue, price: 100, rent: [6, 30, 90, 270, 400, 550] },
  { index: 9, name: "Connecticut Avenue", type: TileType.Property, color: ColorGroup.LightBlue, price: 120, rent: [8, 40, 100, 300, 450, 600] },
  { index: 10, name: "Jail / Just Visiting", type: TileType.Jail },
  { index: 11, name: "St. Charles Place", type: TileType.Property, color: ColorGroup.Pink, price: 140, rent: [10, 50, 150, 450, 625, 750] },
  { index: 12, name: "Electric Company", type: TileType.Utility, price: 150 },
  { index: 13, name: "States Avenue", type: TileType.Property, color: ColorGroup.Pink, price: 140, rent: [10, 50, 150, 450, 625, 750] },
  { index: 14, name: "Virginia Avenue", type: TileType.Property, color: ColorGroup.Pink, price: 160, rent: [12, 60, 180, 500, 700, 900] },
  { index: 15, name: "Pennsylvania Railroad", type: TileType.Railroad, price: 200 },
  { index: 16, name: "St. James Place", type: TileType.Property, color: ColorGroup.Orange, price: 180, rent: [14, 70, 200, 550, 750, 950] },
  { index: 17, name: "Community Chest", type: TileType.CommunityChest },
  { index: 18, name: "Tennessee Avenue", type: TileType.Property, color: ColorGroup.Orange, price: 180, rent: [14, 70, 200, 550, 750, 950] },
  { index: 19, name: "New York Avenue", type: TileType.Property, color: ColorGroup.Orange, price: 200, rent: [16, 80, 220, 600, 800, 1000] },
  { index: 20, name: "Free Parking", type: TileType.FreeParking },
  { index: 21, name: "Kentucky Avenue", type: TileType.Property, color: ColorGroup.Red, price: 220, rent: [18, 90, 250, 700, 875, 1050] },
  { index: 22, name: "Chance", type: TileType.Chance },
  { index: 23, name: "Indiana Avenue", type: TileType.Property, color: ColorGroup.Red, price: 220, rent: [18, 90, 250, 700, 875, 1050] },
  { index: 24, name: "Illinois Avenue", type: TileType.Property, color: ColorGroup.Red, price: 240, rent: [20, 100, 300, 750, 925, 1100] },
  { index: 25, name: "B&O Railroad", type: TileType.Railroad, price: 200 },
  { index: 26, name: "Atlantic Avenue", type: TileType.Property, color: ColorGroup.Yellow, price: 260, rent: [22, 110, 330, 800, 975, 1150] },
  { index: 27, name: "Ventnor Avenue", type: TileType.Property, color: ColorGroup.Yellow, price: 260, rent: [22, 110, 330, 800, 975, 1150] },
  { index: 28, name: "Water Works", type: TileType.Utility, price: 150 },
  { index: 29, name: "Marvin Gardens", type: TileType.Property, color: ColorGroup.Yellow, price: 280, rent: [24, 120, 360, 850, 1025, 1200] },
  { index: 30, name: "Go To Jail", type: TileType.GoToJail },
  { index: 31, name: "Pacific Avenue", type: TileType.Property, color: ColorGroup.Green, price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
  { index: 32, name: "North Carolina Avenue", type: TileType.Property, color: ColorGroup.Green, price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
  { index: 33, name: "Community Chest", type: TileType.CommunityChest },
  { index: 34, name: "Pennsylvania Avenue", type: TileType.Property, color: ColorGroup.Green, price: 320, rent: [28, 150, 450, 1000, 1200, 1400] },
  { index: 35, name: "Short Line Railroad", type: TileType.Railroad, price: 200 },
  { index: 36, name: "Chance", type: TileType.Chance },
  { index: 37, name: "Park Place", type: TileType.Property, color: ColorGroup.DarkBlue, price: 350, rent: [35, 175, 500, 1100, 1300, 1500] },
  { index: 38, name: "Luxury Tax", type: TileType.Tax, price: 100 },
  { index: 39, name: "Boardwalk", type: TileType.Property, color: ColorGroup.DarkBlue, price: 400, rent: [50, 200, 600, 1400, 1700, 2000] },
];

export const GO_SALARY = 200;
export const STARTING_BALANCE = 1500;
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;
export const MAX_TURNS = 100;
export const JAIL_POSITION = 10;
export const JAIL_FEE = 50;
export const MAX_JAIL_TURNS = 3;
