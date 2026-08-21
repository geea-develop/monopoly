// ─── Enums ──────────────────────────────────────────────────────────────────
export var TileType;
(function (TileType) {
    TileType["Go"] = "go";
    TileType["Property"] = "property";
    TileType["Railroad"] = "railroad";
    TileType["Utility"] = "utility";
    TileType["Tax"] = "tax";
    TileType["Chance"] = "chance";
    TileType["CommunityChest"] = "community_chest";
    TileType["Jail"] = "jail";
    TileType["FreeParking"] = "free_parking";
    TileType["GoToJail"] = "go_to_jail";
})(TileType || (TileType = {}));
export var ColorGroup;
(function (ColorGroup) {
    ColorGroup["Brown"] = "brown";
    ColorGroup["LightBlue"] = "lightblue";
    ColorGroup["Pink"] = "pink";
    ColorGroup["Orange"] = "orange";
    ColorGroup["Red"] = "red";
    ColorGroup["Yellow"] = "yellow";
    ColorGroup["Green"] = "green";
    ColorGroup["DarkBlue"] = "darkblue";
})(ColorGroup || (ColorGroup = {}));
export var GamePhase;
(function (GamePhase) {
    GamePhase["Lobby"] = "lobby";
    GamePhase["Playing"] = "playing";
    GamePhase["Finished"] = "finished";
})(GamePhase || (GamePhase = {}));
export var PlayerStatus;
(function (PlayerStatus) {
    PlayerStatus["Active"] = "active";
    PlayerStatus["Bankrupt"] = "bankrupt";
})(PlayerStatus || (PlayerStatus = {}));
// ─── Chance / Community Chest Cards ─────────────────────────────────────────
export var CardAction;
(function (CardAction) {
    CardAction["CollectMoney"] = "collect_money";
    CardAction["PayMoney"] = "pay_money";
    CardAction["MoveTo"] = "move_to";
    CardAction["MoveSteps"] = "move_steps";
    CardAction["GoToJail"] = "go_to_jail";
    CardAction["GetOutOfJail"] = "get_out_of_jail";
    CardAction["CollectFromAll"] = "collect_from_all";
    CardAction["PayToAll"] = "pay_to_all";
})(CardAction || (CardAction = {}));
//# sourceMappingURL=types.js.map