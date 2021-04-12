var Tokens = require("./tokens.js")

class Room {
    constructor(creator_uuid) {
        // Meta
        this.id = Tokens.uniqueToken(15, 'never').str
        this.name = 'Unavngivet rum'
        this.players = []
        this.creator = creator_uuid

        // Game Data
        this.cards
        this.whichTurn
    }
}


const rooms = []
class Rooms {

    new(creator_uuid) {
        var room = new Room(creator_uuid)
        rooms.push(room)
        return room
    }

    info(rid) {
        // 
    }

    find(room_id) {
        for (const room of rooms) {
            if (room.id == room_id)
                return room
        }

        return false
    }
}

const r = new Rooms
module.exports = r