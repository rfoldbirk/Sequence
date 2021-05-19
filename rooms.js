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

		// Rummets regler, bliver faktisk ikke brugt
		this.permissions = {
			spectators: true, // Om det er tilladt at være tilskuer til spillet
			request_spectate: false, // Om folk skal anmode om at være tilskuer
			request_join: true, // true: Andre spillere skal anmode om at deltage. false: Andre kan frit deltage
			allow_join_request: true,
			guests_can_invite: false // Om gæster selv må invitere
		}

		// Game Data ligger i game.js - Game_meta()
	}

	// Fjerner en spiller fra rummet og sørger for at klienten får at vide at den skal gå ud.
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

	// Laver et nyt rum.
	new(con_pkg) {
		const { io, current_player } = con_pkg
		if (!current_player) return
		let room = new Room(current_player)
		rooms.push(room)
		
		current_player.room_id = room.id
		Players.send_all_connected_players(io) // Opdaterer alle klienter, så de ved at der er blevet oprettet et rum.

		// Underretter alle i lobby'en hvilke spillere er forbundet
		this.broadcast_info(room.id, 'players')

		return room
	}

	// Funktionen fungerer egentlig bare som en nem måde at hive fat i rummets broadcast funktion.
	// Den blev lavet da der er brug for at broadcaste spillerne rigtig mange gange.
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

		if (!room) return // Noget gik galt, hvis det her sker er der nogen der prøver at ødelægge serveren.

		// Hvis spilleren allerede er inviteret
		let is_invited = false
		for (let player of room.invited)
			if (player.username == username)
				is_invited = true

		const target_player = Players.find('username', username)
		target_player.send_message('invite_from', current_player.username) // Sender en socket.io meddelse til spilleren om at den er blevet inviteret.
		if (is_invited) return // Hvis spilleren allerede er blevet inviteret.

		if (!target_player) return
		room.invited.push(target_player)
		
		this.broadcast_info(room.id, 'players') // Opdaterer klienterne
	}

	// Låser en bruger i et rum, så han ikke længere kan skifte hold.
	// Denne funktion går igennem owner_action, som sørger for at kun ejeren kan kalde denne funktion.
	lock_user(room, target) {
		for (let player of room.players) {
			if (player.username == target) {
				player.gameData.teamLocked = !player.gameData.teamLocked
				player.socket.emit('locked', player.gameData.teamLocked)
			}
		}

		this.broadcast_info(room.id, 'players') // Opdaterer spillerene.
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
			}
			
			// En irriterende process, som skaffer den næste værdi i arrayet.
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
		
		// Nulstiller og sætter nogle variabler i rummet. 
		// Den eneste grund til dette, er fordi man har muligheden for at genstarte et spil, og uden nulstillede variabler
		// Ville spillet ikke være ordentlig genstartet.
		room.amount_of_teams = amount_of_teams
		room.in_progress = true
		room.ended = false
		room.pass_in_row = 0
		room.layout = layout
		room.whichTurn = room.turn_order[0]
		room.clear_board()
		
		// Kalder nogle funktioner som opdaterer alle spillerne i rummet
		room.send_hands(true)
		room.send_info()
	}

	// En handling som kun ejeren kan tage går igennem her.
	owner_action(con_pkg, action, target) {
		// Først bliver der lavet en masse tjeks!
		const { current_player } = con_pkg
		if (!current_player) return 										// Tjekker om spilleren eksistere.
		let room = this.find('id', current_player.room_id)
		if (!room) return													// Tjekker om rummet eksistere
		if (room.creator != current_player.username) return 				// Tjekker om spilleren ejer rummet
		if (room.creator == target) return 									// Ejeren må ikke vælge sig selv
		if (!Players.find('username', target) && target !== false) return 	// Hvis handlingen er rettet mod en spiller tjekker den også om spilleren findes.

		// Derefter uddelegeres handlingerne
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

	// Skifter spillerens hold
	change_team(con_pkg, name) {
		const { current_player } = con_pkg
		if (!current_player) return

		let room = this.find('id', current_player.room_id)
		if (!room) return

		// Efter at havde tjekket om spilleren eksistere og om rummet eksistere når vi hertil.

		if (room.in_progress) return // Vi tjekker dog også om spillet er i gang.

		for (let player of room.players) {
			if (player.username != name) continue // Sørger for at filtrere alle spillere som ikke har målets brugernavn fra.
			if (player.gameData.teamLocked && current_player.username != room.creator) return // Hvis holdet er låst stopper festen her! ...med mindre at det er ejeren af rummet.

			if (name == current_player.username || current_player.username == room.creator) { // Tjekker at det enten er spilleren selv, eller ejeren som skifter hold på vegne af spilleren
				// Finder det næste hold i rækkefølgen.
				let colors = ['spectator', 'blue', 'red', 'green']
				let newIndex = colors.indexOf( player.gameData.teamColor ) + 1
				if (newIndex > colors.length-1) newIndex = 0
	
				player.gameData.teamColor = colors[newIndex] // Opdaterer holdfarven
				this.broadcast_info(room.id, 'players') // og opdaterer spillerne.
			}
		}
	}

	// En lille funktion som meddeler tilbage hvem ejeren af rummet er.
	get_owner(con_pkg) {
		const { socket, current_player } = con_pkg
		if (!current_player) return

		let room = this.find('id', current_player.room_id)
		if (!room) return

		socket.emit('room_owner', room.creator)
	}

	// En funktion som bliver kaldt når klienten vil vide, hvilke spillere er i lobbyen.
	get_players(con_pkg) {
		const { socket, current_player } = con_pkg
		if (!current_player) return

		let room = this.find('id', current_player.room_id)
		if (!room) return

		// Vi bruger databasens indbyggede fetch funktion til at filtrere alle spillere som ikke er i samme rum fra.
		socket.emit('lobby_players', Players.fetch(['username', 'gameData'], 'room_id', room.id))
	}

	// Funktionen som bliver kaldt når spiller gerne vil forlade rummet.
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

		// Opdaterer alle klienterne.
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