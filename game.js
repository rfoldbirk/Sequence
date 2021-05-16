// ----------------------------------------------------------------------------------------------------------------------------------- //
const _unlimited_turned_off = true // Kun til test! Slå denne variable fra, for at spilleren har ubegrænsede træk og kan bruge alle kort.
// ----------------------------------------------------------------------------------------------------------------------------------- //



var fs = require("fs")
var Database = require("./util/db.js");
const directions = {
	n: {
		x: 0,
		y: -1
	},
	ne: {
		x: 1,
		y: -1
	},
	e: {
		x: 1,
		y: 0
	},
	se: {
		x: 1,
		y: 1
	},
	s: {
		x: 0,
		y: 1
	},
	sw: {
		x: -1,
		y: 1
	},
	w: {
		x: -1,
		y: 0
	},
	nw: {
		x: -1,
		y: -1
	},
}



class Game_meta {
	constructor() {
		this.in_progress = false
		this.ended = false
		this.cards
		this.whichTurn

		this.layout // et array som indeholder top, right, bottom og left med spiller navne
		this.turn_order = [] // et array som dikterer rækkefølgen
		this.amount_of_teams = 0

		this.pass_in_row = 0 // Holder øje med hvor mange der har passet efter hinanden
		this.pass_limit = 3 // Hvis pass_in_row overstiger denne værdi, stopper spillet, og holdet med flest point vinder

		this.availableCards = this.makeCardArray()
		this.usedCards = [];
		this.board
		this.points = { 'blue': 0, 'red': 0, 'green': 0 }
		this.clear_board() // Loader boardet
	}
	makeCardArray() {
		var cardArray = ["c", "d", "h", "s"];
		var cards = [];
		for (var i = 0; i < cardArray.length; i++) {
			cards = cards.concat(this.sorter(cardArray[i]))
			cards = cards.concat(this.sorter(cardArray[i]))
		}
		return cards
	}
	sorter(x) {
		var cards = [];
		for (var i = 1; i < 14; i++) {
			cards.push(x + i)
		}
		return cards
	}
	pickRandomCard() {
		var random = Math.floor(Math.random() * this.availableCards.length)
		var card = this.availableCards[random];
		this.availableCards.splice(random, 1);
		return card
	}
	broadcast(event, data) {
		this.players.forEach(player => {
			player.socket.emit(event, data)
		})
	}


	send_hands(give_6) {
		give_6 = give_6 || false

		for (let player of this.players) {
			if (give_6) {
				player.gameData.cards = []
				for (let i = 0; i < 6; i++) {
					player.gameData.cards.push(this.pickRandomCard())
				}
			}

			player.send_message('hand', player.gameData.cards)
		}
	}

	send_info() {
		this.broadcast('layout', this.layout)
		this.broadcast('turn', this.whichTurn)
		this.broadcast('board', this.board)

		this.broadcast('points', this.points)

		for (const player of this.players)
			player.send_message('hand', player.gameData.cards)
	}


	next_turn(current_player) {
		let next_player_index = this.turn_order.indexOf(this.whichTurn) + 1
		if (next_player_index > this.turn_order.length - 1)
			next_player_index = 0

		this.whichTurn = this.turn_order[next_player_index]
		current_player.gameData.canDraw = true
	}

	clear_board() {
		this.board = JSON.parse(String(fs.readFileSync("./board.json")))
	}

	assign_direction(yx, dir0, dir1, remove=false) {
		// Det er en lidt grim funktion, så vi gemmer den lidt væk

		const dir = this.board[yx[0]][yx[1]]._direction

		if (!remove) {
			if (dir === undefined) {
				this.board[yx[0]][yx[1]]._direction = `-${ dir0 }-${ dir1 }-`
			} else {
				if (!dir.includes(`-${ dir0 }-${ dir1 }-`))
				this.board[yx[0]][yx[1]]._direction += `-${ dir0 }-${ dir1 }-`
			}
		}
		else {
			if (dir) {
				let split = dir.split(`-${ dir0 }-${ dir1 }-`)
				let index = split.indexOf(`-${ dir0 }-${ dir1 }-`)
				split.splice(index, 1)

				this.board[yx[0]][yx[1]]._direction = split.join('')
			}
		}
	}

	check_for_win(yx, color, action) {
		if ('buffer|null'.includes(String(color))) return

		let sequences = 0

		for (const i in Object.keys(directions)) {
			if (i > 3) return sequences

			const dir0 = Object.keys(directions)[i]
			const dir1 = Object.keys(directions)[Number(i)+4]

			const res0 = this.beam(yx, dir0, color, action)
			const res1 = this.beam(yx, dir1, color, action)

			const _count = res0._count + res1._count + 1
			const _beam_count = (res0._beam_count > res1._beam_count) ? res0._beam_count : res1._beam_count

			
			if ( _count >= _beam_count*5 && _beam_count < Math.floor(_count/5)) {
				
				this.board[yx[0]][yx[1]]._beam_count = Math.floor( _count/5 )
				this.assign_direction(yx, dir0, dir1)

				if (action == 'add') {
					console.log('\nadding points:', Math.floor(_count/5))
					
					this.points[color] += Math.floor(_count/5)
					this.broadcast('beam', Math.floor(_count/5)*5)
					
					console.log('points is now:', this.points)

					// Tjekker om der er en vinder
					if (this.amount_of_teams == 2) {
						if (this.points[color] == 2) {
							this.broadcast('winner', color)
							this.ended = true
						}
					}
					else if (this.amount_of_teams == 3) {
						if (this.points[color] == 1) {
							this.broadcast('winner', color)
							this.ended = true
						}
					}
				}
			}


			if (_count >= 5 && action == 'check') {
				sequences += 1
			}

			if (_count < 5 && action == 'delete') {
				if (this.board[yx[0]][yx[1]]._direction == '' || !this.board[yx[0]][yx[1]]._direction) {
					return sequences
				}

				this.board[yx[0]][yx[1]]._beam_count = 0
				this.assign_direction(yx, dir0, dir1, true)

				if (this.points[color] < 0) this.points[color] = 0
			}
		}

		return sequences
	}

	beam(yx, direction, color, action='add', _count=0, _beam_count=0, _first=true) {
		const location = this.board[yx[0]][yx[1]]
		const direction_val = directions[direction]
		
		if (location.token == color || location.card == 'buffer' || 'remove'.includes(action)) {

			const new_yx = [ String(Number(yx[0]) + direction_val.y), String(Number(yx[1]) + direction_val.x) ]
			
			if (!_first) {
				_count ++
	
				if (Number(location._beam_count) > _beam_count && String(location._direction).includes(`-${direction}-`)) {
					_beam_count = location._beam_count
					
					if (action == 'remove') {
						this.check_for_win(yx, color, 'delete')
						return { _count: 0, _beam_count: 0 }
					}
				}
			}


			if (new_yx[0].includes('-') || new_yx[1].includes('-'))
				return { _count, _beam_count }
			else if (Number(new_yx[0]) > 9 || Number(new_yx[1]) > 9)
				return { _count, _beam_count }
			return this.beam(new_yx, direction, color, action, _count, _beam_count, false)
		}
		else {
			return { _count, _beam_count }
		}
	} 
}


class Game_functions extends Database {
	constructor(rooms) {
		super(rooms)
	}

	pass(con_pkg) {
		const room = this.check_if_player_is_permitted(con_pkg)
		if (!room) return

		room.next_turn(con_pkg.current_player)

		room.pass_in_row += 1

		console.log('passes in a row:', room.pass_in_row)

		if (room.pass_in_row > room.pass_limit) {

			console.log('\nfinding winner!')

			// Find vinder
			let winnerTeam = ''
			let winnerScore = 0

			for (const teamColor of Object.keys(room.points)) {
				if (room.points[teamColor] > winnerScore) {
					winnerScore = room.points[teamColor]
					winnerTeam = teamColor
				}
				else if (room.points[teamColor] == winnerScore) {
					winnerTeam += '|teamColor' // Bare så man kan adskille dem
				}
			}

			if (winnerTeam == '') winnerTeam = 'nobody'

			room.ended = true
			room.broadcast('winner', winnerTeam)
		}
	}

	check_if_player_is_permitted(con_pkg, dont_check_if_its_my_turn) {
		let { current_player } = con_pkg
		if (!current_player) return false

		let room = this.find('id', current_player.room_id)
		if (!room) return false
		if (room.ended) return false

		// Det skal være spillerens tur
		if (!dont_check_if_its_my_turn)
			if (room.whichTurn != current_player.username)
				return false

		return room
	}

	check_if_has_11(current_player, types) {
		// Tjekker om spilleren har en knægt på hånden
		for (let type of types)
			if (current_player.gameData.cards.includes(`${type}11`))
				return type+'11'
		return false
	}

	useCard(con_pkg, yx) {
		let { current_player } = con_pkg
		
		// Tjekker om spilleren er i rummet, og om det er spillerens tur. Plus den returnerer rummet
		const room = this.check_if_player_is_permitted(con_pkg)
		if (!room) return
		if (room.ended) return

		// Der kan ske 2 ting.

		// 1. Spilleren trykker på et kort, som er tomt, og vil derfor lægge et kort...
			// 1. Spilleren har kortet på hånden
			// 2. Spilleren har ikke kortet på hånden, men til gengæld har han en to øjet knægt på hånden.
		// 2. Spilleren trykker på et kort, som IKKE er tomt, og prøver derfor at fjerne det.
			// Tjek om spilleren har en en øjet knægt på hånden
			// Tjek om spilleren prøver at fjerne sin egen token.

		const location = room.board[yx[0]][yx[1]] // Indeholder: card, token
		const action = location.token ? 'remove':'add'

		if (location.card == 'buffer') return

		// -------------------------- Find det kort, som skal bruges afhængigt af hvad der skal gøres -------------------------- //
		let card // Det kort som skal bruges
		
		if (action == 'add') {
			card = this.check_if_has_11(current_player, 'dc') // Tjekker om spilleren har en to-øjet knægt
			
			// Hvis spilleren har det kort han prøver at lægge en token på, prioteres dette kort og bruges i stedet
			for (const _card of current_player.gameData.cards) {
				if (_card == location.card) {
					card = _card
				}
			}
		}
		else {
			// remove
			card = this.check_if_has_11(current_player, 'sh') // Tjekker om spilleren har en en-øjet knægt
			if (_unlimited_turned_off) {
				if (location.token == current_player.gameData.teamColor) return // Hvis den token, som spilleren prøver at fjerne er hans egen, for spilleren ikke lov.
			}
			const amount = room.check_for_win(yx, location.token, 'check')
			if (amount > 0) return // Burde gerne gøre sådan at man ikke kan fjerne en brik, som er en del af en sequence
			
		}

		if (_unlimited_turned_off)
			if (!card) return // Hvis spilleren ikke har et kort på hånden som matcher, kommer han ikke længere!
		
		
		// ----------------------------------------------------- Brug kort ----------------------------------------------------- //
		this.pass_in_row = 0 // Nulstiller

		location.token = action == 'add' ? current_player.gameData.teamColor : null
		location._beam_count = 0

		room.check_for_win(yx, current_player.gameData.teamColor, action)
		if (action == 'remove') { // Easy fiks, gider ikke at gøre mere nu
			location._direction = ''
			location._beam_count = 0
		}
	

		// ----------------------------------------------------- Fjern kort ---------------------------------------------------- //
		if (_unlimited_turned_off) {
			const index = current_player.gameData.cards.indexOf(card)
			current_player.gameData.cards.splice(index, 1)
		}
		
		
		// ------------------------------------------------- Opdater spillerene ------------------------------------------------ //
		if (_unlimited_turned_off)
			room.next_turn(current_player)
		room.send_info()
	}

	draw_card(con_pkg) {
		let {
			current_player
		} = con_pkg

		if (!current_player.gameData.canDraw) return

		const room = this.check_if_player_is_permitted(con_pkg, true)
		if (!room) return

		let myIndex = room.turn_order.indexOf(current_player.username)
		let nextIndex = room.turn_order.indexOf(room.whichTurn)

		if (nextIndex == 0) nextIndex += room.turn_order.length

		if (nextIndex - myIndex == 1) {
			const card = room.pickRandomCard()
			current_player.gameData.cards.push(card)
			current_player.gameData.canDraw = false

			room.send_info()
		}
	}
}



module.exports = {
	Game_meta,
	Game_functions
}