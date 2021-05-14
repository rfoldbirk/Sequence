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
		this.cards
		this.whichTurn

		this.layout // et array som indeholder top, right, bottom og left med spiller navne
		this.turn_order = [] // et array som dikterer rækkefølgen


		this.availableCards = this.makeCardArray()
		this.usedCards = [];
		this.board
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

};

class Game_functions extends Database {
	constructor(rooms) {
		super(rooms)
	}

	check_if_player_is_permitted(con_pkg, dont_check_if_its_my_turn) {
		let {
			current_player
		} = con_pkg
		if (!current_player) return false

		let room = this.find('id', current_player.room_id)
		if (!room) return false

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
				return type
		return false
	}

	useCard(con_pkg, target, yx) {
		//send postion of piece to add
		let {
			current_player
		} = con_pkg

		const room = this.check_if_player_is_permitted(con_pkg)
		if (!room) return

		// Tjek om pladsen er optaget
		let {
			card,
			token
		} = room.board[yx[0]][yx[1]]
		if (card == 'buffer') return

		// two eyes: dc

		// Spilleren skal have kortet på hånden
		let card_on_hand = false
		if (!token) {
			// Læg
			card_on_hand == this.check_if_has_11(current_player, 'dc')

			if (current_player.gameData.cards.includes(target.card))
				card_on_hand = true
		} else {
			// Fjern
			card_on_hand = this.check_if_has_11(current_player, 'hs')
		}

		if (!card_on_hand) return


		let new_token = current_player.gameData.teamColor

		if (token) { // Hvis der allerede er en token, skal den fjernes 
			if (token == current_player.gameData.teamColor) return
			new_token = null
		}


		room.board[yx[0]][yx[1]].token = new_token
		this.check_for_win({
			pos: {
				x: Number(yx[1]),
				y: Number(yx[0])
			},
			color: new_token
		}, con_pkg)


		// Fjerner kortet fra hånden
		let type = this.check_if_has_11(current_player, (token ? 'dc' : 'hs'))
		if (type) target.card = type + '11'

		console.log('removing card:', target.card, 'from:', current_player.username)

		let index = current_player.gameData.cards.indexOf(target.card)
		current_player.gameData.cards.splice(index, 1)

		// Ændre turen
		room.next_turn(current_player)

		// Opdaterer spillerne
		current_player.send_message('hand', current_player.gameData.cards)
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
	beamChecker(con_pkg, token, direction, count = 0) {
		console.log(token, direction)
		const room = this.check_if_player_is_permitted(con_pkg, true)
		if (!room) return
		if (room.board[token.pos.y + direction.y] && room.board[token.pos.y + direction.y][token.pos.x + direction.x]) {
			var next_token = room.board[token.pos.y + direction.y][token.pos.x + direction.x];
			var beamCheckerFormat = {
				pos: {
					x: token.pos.x + direction.x,
					y: token.pos.y + direction.y
				},
				color: next_token.token
			}
			console.log(token, next_token)
			if (next_token.token == token.color || next_token.token == "black") {
				return this.beamChecker(con_pkg, beamCheckerFormat, direction, count + 1)
			} else {
				return count
			}
		} else {
			console.log("something is Worng")
			return count
		}
	}
	check_for_win(piece, con_pkg) {
		const room = this.check_if_player_is_permitted(con_pkg, true)
		if (!room) return
		var checks = {
			n: this.beamChecker(con_pkg, piece, directions.n),
			ne: this.beamChecker(con_pkg, piece, directions.ne),
			e: this.beamChecker(con_pkg, piece, directions.e),
			se: this.beamChecker(con_pkg, piece, directions.se),
			s: this.beamChecker(con_pkg, piece, directions.s),
			sw: this.beamChecker(con_pkg, piece, directions.sw),
			w: this.beamChecker(con_pkg, piece, directions.w),
			nw: this.beamChecker(con_pkg, piece, directions.nw)
		}
		var win_check = [
			checks.n + checks.s + 1,
			checks.ne + checks.sw + 1,
			checks.e + checks.w + 1,
			checks.se + checks.nw + 1
		];
		for (var i = 0; i < win_check.length; i++) {
			if (win_check[i] >= 10) {
				console.log(win_check[i])
			} else if (win_check[i] >= 5) {
				console.log(win_check[i])
			}
		}
		console.log(checks)
		console.log(win_check)
	}
}



module.exports = {
	Game_meta,
	Game_functions
}