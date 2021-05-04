let Tokens = require("./tokens.js")
let {Game_meta, Game_functions} = require("./game.js")
let Players = require("./players.js")
let checkVariable = require("./util/verify.js")
let rooms = []

class Room extends Game_meta {
    constructor(player) {
        super(rooms)

        // Meta
        this.id = Tokens.uniqueToken(15, 'never').str
        this.name = 'Unavngivet rum'
        this.players = [player]
        this.invited = []
        this.creator = player.username

        // Rummets regler
        this.permissions = {
            spectators: true, // Om det er tilladt at være tilskuer til spillet
            request_spectate: false, // Om folk skal anmode om at være tilskuer
            request_join: true, // true: Andre spillere skal anmode om at deltage. false: Andre kan frit deltage
            allow_join_request: true,
            guests_can_invite: false // Om gæster selv må invitere
        }

        // Game Data
        this.in_progress = false
        this.cards
        this.whichTurn
    }
}


class Rooms extends Game_functions {
    constructor() { super(rooms) }

    new(con_pkg) {
        const { io, current_player } = con_pkg
        let room = new Room(current_player)
        rooms.push(room)
        
        current_player.room_id = room.id
        Players.send_all_connected_players(io)

        return room
    }

    
    // ------------- Socket endpoints ------------- //


    // Når spilleren bare vil lave et nyt rum.
    // ! Bruges ikke pt. ! //
    new_room(con_pkg) {
        const { socket, current_player } = con_pkg
        
        // Tjek om brugeren allerede er i et rum
		if (current_player.room_id) {
			socket.emit('response:new_room', 'allerede en del af et andet rum')
			return
		}

		let room = this.new(con_pkg)
		current_player.room_id = room.id
		socket.emit('response:new_room', 'yay!')
    }

    // Når spilleren gerne vil invitere en anden spiller
    invite(con_pkg, username) {
        const { current_player } = con_pkg
        let room

        // Laver et nyt rum, hvis den som sender inviten ikke allerede har lavet et.
		if (!current_player.room_id)
			room = this.new(con_pkg)
        else
            room = this.find('id', current_player.room_id)

        if (!room) return // Noget gik galt, hvis det her sker... men det burde det ikke

        // Hvis spilleren allerede er 
        let is_invited = false
        for (let player of room.invited)
            if (player.username == username)
                is_invited = true

        if (is_invited) return

        const target_player = Players.find('username', username)
        room.invited.push(target_player)

        target_player.send_message('invite_from', current_player.username)
    }

    change_name(con_pkg, name) {
        const { socket, current_player } = con_pkg

        const invalid = checkVariable(name, { "type": "string", "minLength": 1, "maxLength": 30 })
		const room = this.find(current_player.room_id)
		if (invalid || !room) {
			socket.emit('response:room_change_name', false)
			return
		}


		if (room.creator == current_player.uuid) {
			room.name = name
		}

		socket.emit('response:room_change_name', true) // Så klienten ved at alt gik godt

		// Sender en update til alle spiller i et rum. (undtagen ejeren)
		for (let player of room.players) {
			if (player.uuid == room.creator.uuid) continue
			io.to(player.sid, 'update:room', room)
		}
    }

    join_lobby(con_pkg, owner) {
        const { io, current_player } = con_pkg
        const room = this.find('creator', owner)

        if (!room) return

        // Hvis spilleren er på invitations listen
        let is_invited = false
        let index = 0
        for (let i in room.invited) {
            if (room.invited[i].username == current_player.username) {
                is_invited = true
                index = i
            }

            index ++
        }

        if (is_invited) {
            // Fjern fra invite listen og 
            room.invited.splice(index, 1)

            room.players.push(current_player)
            current_player.room_id = room.id
            
            Players.send_all_connected_players(io)
            return
        }

        // Ellers skal der anmodes... Der tjekkes dog først om man må.
        if (room.permissions.allow_join_request) {
            if (room.permissions.request_join) {
                const player_owner = Players.find('username', owner)

                if (!player_owner) return

                // Sender ejeren en besked om at spilleren har lyst til at joine
                player_owner.send_message('request_join', current_player.username)
            }
            else {
                room.players.push(current_player.username)
                current_player.room_id = room.id
            }
        }
    }
}

const r = new Rooms
module.exports = r