let Tokens = require("./tokens.js")
let {Game_meta, Game_functions} = require("./game.js")
let checkVariable = require("./util/verify.js")
let rooms = []

class Room extends Game_meta {
	constructor(player) {
		super()

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

		// Game Data ligger i game.js - Game_meta()
	}

	remove_player(username) {
		for (let i in this.players) {
			if (this.players[i].username == username) {
				this.players[i].socket.emit('leave_lobby')
				this.players[i].room_id = undefined
				this.players.splice(i, 1)
				break
			}
		}
	}
}


class Rooms extends Game_functions {
	constructor() { super(rooms) }

	new(con_pkg) {
		const { io, current_player } = con_pkg
		if (!current_player) return
		let room = new Room(current_player)
		rooms.push(room)
		
		current_player.room_id = room.id
		Players.send_all_connected_players(io)

		// Underretter alle i lobby'en hvilke spillere er forbundet
		this.broadcast_info(room.id, 'players')

		return room
	}


	broadcast_info(room_id, type) {
		let room = this.find('id', room_id)
		if (!room) return

		switch (type) {
			case 'players':
				room.broadcast('lobby_players', Players.fetch(['username', 'gameData'], 'room_id', room.id))
				break
			case 'layout':
				room.broadcast('layout', room.layout)
			case 'turn':
				room.broadcast('turn', room.whichTurn)
				break
		}
	}

	
	// ------------- Socket endpoints ------------- //


	// Når spilleren bare vil lave et nyt rum.
	// ! Bruges ikke pt. ! //
	new_room(con_pkg) {
		const { socket, current_player } = con_pkg
		if (!current_player) return
		
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
		if (!current_player) return
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
		if (!target_player) return
		room.invited.push(target_player)

		target_player.send_message('invite_from', current_player.username)
		this.broadcast_info(room.id, 'players')
	}

	lock_user(room, target) {
		for (let player of room.players) {
			if (player.username == target) {
				player.gameData.teamLocked = !player.gameData.teamLocked
				player.socket.emit('locked', player.gameData.teamLocked)
			}
		}

		this.broadcast_info(room.id, 'players')
	}


	start(room) {
		
		// Laver teams
		let teams = {}
		
		// Inddeler holdene
		for (let player of room.players) {
			let color = player.gameData.teamColor
			if (color == 'spectator') continue
			if (!teams[color]) teams[color] = []
			
			teams[color].push(player.username)
		}
		
		const amount_of_teams = Object.keys( teams ).length


		// Tjekker om der kun er et hold
		if (amount_of_teams <= 1)
			return 'not enough teams'

		// Tjekker om holdene har lige mange spillere
		let standard_amount_of_players = false
		for (let team of Object.keys( teams )) {
			if (!standard_amount_of_players)
				standard_amount_of_players = teams[team].length
			else
				if (teams[team].length != standard_amount_of_players)
					return 'not equal teams'
		}


		// Inddeler spillerne så de står korrekt på bordet
		let layout = {
			top: [],
			right: [],
			bottom: [],
			left: []
		}
		
		
		let sorted_layout = []
		for (let i = 0; i < 12; i++) sorted_layout.push(null)
		
		
		// En funktion som gør det en smule nemmere at skaffe den næste nøgle
		const new_value = (arr, val, special) => {
			let extra = 1
			
			if (special) {
				if (Object.keys( teams ).length == 2) {
					extra = 2
				}
				else {
					
				}
			}
			
			
			let new_index = Object.keys(arr).indexOf(val) + extra
			if (new_index > Object.keys(arr).length-1) 
			new_index -= Object.keys(arr).length
			return Object.keys(arr)[new_index]
		}
		
		
		// Inddeler spillerne efter hvilken rækkefølge de skal være i.
		let index = 0
		for (let team of Object.keys(teams)) {
			let count = 0
			for (let player of teams[team]) {
				sorted_layout[count + index] = player
				
				count += 3
			}
			index ++
		}
		
		let key = Object.keys(layout)[0]
		let players_left = standard_amount_of_players

		// Smider spillerne ud på pladen
		for (let player of sorted_layout) {
			if (!player) continue
			
			if (players_left <= 0) {
				key = new_value(layout, key, (amount_of_teams == 2) ? true:false)
				players_left += standard_amount_of_players
			}
			layout[key].push(player)

			
			players_left -= 1
		}

		for (let player of sorted_layout) {
			if (!player) continue
			room.turn_order.push(player)
		}
		
		room.amount_of_teams = amount_of_teams
		room.in_progress = true
		room.ended = false
		room.pass_in_row = 0
		room.layout = layout
		room.whichTurn = room.turn_order[0]
		room.clear_board()
		
		// console.table(layout)
		room.send_hands(true)
		room.send_info()
	}

	// En handling som kun ejeren kan tage går igennem her.
	owner_action(con_pkg, action, target) {
		const { current_player } = con_pkg
		if (!current_player) return
		let room = this.find('id', current_player.room_id)
		if (!room) return
		if (room.creator != current_player.username) return // Det skal være ejeren af rummet
		if (room.creator == target) return // Ejeren må ikke vælge sig selv
		if (!Players.find('username', target) && target !== false) return // Hvis spilleren ikke findes


		switch (action) {
			case 'lock':
				this.lock_user(room, target)
				break
			case 'kick':
				Players.find('username', target).send_message('got_kicked')
				room.remove_player(target)
				this.broadcast_info(room.id, 'players')
				break
			case 'start':
				current_player.socket.emit('start:response', this.start(room))
				break
		}
	}

	change_team(con_pkg, name) {
		const { current_player } = con_pkg
		if (!current_player) return

		let room = this.find('id', current_player.room_id)
		if (!room) return

		if (room.in_progress) return

		for (let player of room.players) {
			if (player.username != name) continue
			if (player.gameData.teamLocked && current_player.username != room.creator) return

			if (name == current_player.username || current_player.username == room.creator) {
				let colors = ['spectator', 'blue', 'red', 'green']
				let newIndex = colors.indexOf( player.gameData.teamColor ) + 1
				if (newIndex > colors.length-1) newIndex = 0
	
				player.gameData.teamColor = colors[newIndex]
				this.broadcast_info(room.id, 'players')
			}
		}
	}

	get_owner(con_pkg) {
		const { socket, current_player } = con_pkg
		if (!current_player) return

		let room = this.find('id', current_player.room_id)
		if (!room) return

		socket.emit('room_owner', room.creator)
	}

	get_players(con_pkg) {
		const { socket, current_player } = con_pkg
		if (!current_player) return

		let room = this.find('id', current_player.room_id)
		if (!room) return

		socket.emit('lobby_players', Players.fetch(['username', 'gameData'], 'room_id', room.id))
	}

	change_name(con_pkg, name) {
		const { socket, current_player } = con_pkg
		if (!current_player) return

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

	leave(con_pkg) {
		const { io, current_player } = con_pkg
		if (!current_player) return

		// Hvis spilleren ikke er i et rum, ignorerer vi det bare
		if (!current_player.room_id) return

		// Finder rummet
		const room = this.find('id', current_player.room_id)

		// Hvis spilleren ejer rummet
		if (room.creator == current_player.username) {
			room.broadcast('leave_lobby')
			for (let player of room.players)
				player.room_id = null

			this.delete(room.id, 'id')
		}
		else {
			// Fjerner spilleren
			room.remove_player(current_player.username)
		}

		this.broadcast_info(room.id, 'players')
		let player_data = Players.fetch(['username', 'room_id'])
        io.emit('list_players', player_data)
	}

	join(con_pkg, owner) {
		const { io, current_player } = con_pkg
		if (!current_player) return
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
		}

		if (is_invited) {
			// Fjern fra invite listen og 
			room.invited.splice(index, 1)

			room.players.push(current_player)
			current_player.room_id = room.id
			
			Players.send_all_connected_players(io)
		}

		// Ellers skal der anmodes... Der tjekkes dog først om man må.
		if (room.permissions.allow_join_request && !is_invited) {
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

		// Overskriver meta dataen
		current_player.gameData = {
            cards: [],
            teamColor: 'spectator',
            teamLocked: false
        }

		this.broadcast_info(room.id, 'players')
	}
}

const r = new Rooms
module.exports = r

let Players = require("./players.js")