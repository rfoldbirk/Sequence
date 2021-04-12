var Tokens = require("./tokens.js")

class Player {
    constructor(sid, username) {
        this.sid = sid
        this.uuid = Tokens.uniqueToken(15, 'never').str // En privat token, som kun skal gemmes på klientens pc
        this.puid = Tokens.uniqueToken(15, 'never').str // En offentlig token, som kan bruges til at identificere en spiller
        this.username = username
        this.room_id
    }
}



const players = []
class Players {
    new(sid, uuid, username) {
        var player = new Player(sid, uuid, username)
        players.push(player)
        return player
    }

    delete(uuid) {
        for (const i in players) {
            if (players[i].uuid == uuid) {
                if (!players[i].sid) {
                    players.splice(i, 1)
                }
            }
        }
    }

    find(key, val, case_insensitive) {
        for (const P of players) {
            if (P.hasOwnProperty(key)) {
                if (case_insensitive) {
                    if (P[key].toLowerCase() == val.toLowerCase()) 
                        return P
                }
                else {
                    if (P[key] == val) 
                        return P
                }
            }
        }
    }
}

const p = new Players
module.exports = p