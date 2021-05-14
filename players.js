let Tokens = require("./tokens.js")
let Database = require("./util/db.js")
let checkVariable = require("./util/verify.js")
let players = []


class Player {
    constructor(socket, username) {
        this.socket = socket
        this.sid = socket.id
        this.uuid = Tokens.uniqueToken(15, 'never').str // En privat token, som kun skal gemmes på klientens pc
        this.username = username
        this.room_id
        this.pending_messages = []
        //game data
        this.gameData = {
            cards: [],
            teamColor: 'spectator',
            teamLocked: false,
            canDraw: false
        }
    }

    send_message(event, data) {
        if (!event && !data) {
            // Sender alle beskeder som venter på at blive sendt afsted
            // Venter lige et halvt sekund med at sende, så klienten har en chance for at følge med
            setTimeout(() => {
                for (const message of this.pending_messages)
                    this.socket.emit(message.event, message.data)
                
                this.pending_messages = []
            }, 500);
        }

        if (this.sid)
            this.socket.emit(event, data)
        else
            this.pending_messages.push({ event, data })
    }
}


class Players extends Database {
    constructor() { super(players) }

    new(con_pkg, username) {
        const { socket } = con_pkg
        let player = new Player(socket, username)
        players.push(player)
        return player
    }

    send_all_connected_players(connection_method) {
        // Sender et array som indeholder alle spiller navne
        let data = this.fetch(['username', 'room_id'])
        connection_method.emit('list_players', data)
    }

    
    // ------------- Socket endpoints ------------- //

    reconnect(con_pkg, uuid) {
        const { socket } = con_pkg

        // Finder brugeren
        const player = this.find('uuid', uuid)
        
        if (!player) {
            socket.emit("prompt_login")
            return
        }
        else {
            player.socket = socket
            player.sid = socket.id
        }
    
        socket.emit('logged-in', player.username)

        // Sender pending_messages, hvis de eksistere
        player.send_message()
        Rooms.broadcast_info(player.room_id, 'players')

        const room = Rooms.find('id', player.room_id)
        if (room) {
            room.send_info()
        }

        return player
    }

    register(con_pkg, username) {
        const { io, socket } = con_pkg

        // Tjekker om brugernavnet opfylder kravene
		const invalid = checkVariable(username, { "type": "string", "minLength": 4, "maxLength": 15 })
		if (invalid) {
			socket.emit("change_name", invalid)
			return
		}

		// Tjekker om brugernavnet allerede eksistere
		if (this.find('username', username, true)) {
			socket.emit("change_name", "exists" )
			return
		}

		const player = this.new(con_pkg, username)

		socket.emit("set_uuid", player.uuid)
		this.send_all_connected_players(io) // Opdaterer alle klienter
        return player
    }

    check_username(con_pkg, username) {
        const { socket } = con_pkg

        // Tjekker om brugernavnet opfylder kravene
		const invalid = checkVariable(username, { "type": "string", "minLength": 4, "maxLength": 15 })
		if (invalid) {
			socket.emit("name_requirements", invalid)
			return
		}

		// Tjekker om brugernavnet allerede eksistere
		if (this.find("username", username, true)) {
			socket.emit("name_requirements", "exists" )
			return
		}

		socket.emit("name_requirements", "valid" )
    }

    disconnect(con_pkg) {
        const { io, current_player } = con_pkg

        if (!current_player) return
		current_player.sid = null
		setTimeout(() => {
			this.delete(current_player.uuid)
            this.send_all_connected_players(io)
		}, 60000*5) // Sletter en profil efter 5 min inaktivitet.
    }
}



const p = new Players
module.exports = p

let Rooms = require(__dirname + '/rooms.js')