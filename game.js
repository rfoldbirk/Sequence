var fs = require("fs")
var Database = require("./util/db.js");

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
        this.players.forEach(player=>{
            player.socket.emit(event, data)
        })
    }


	send_hands(give_6) {
		give_6 = give_6 || false

		for (let player of this.players) {
			if (give_6) {
				player.gameData.cards = []
				for (let i = 0; i < 6; i ++) {
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
		let next_player_index = this.turn_order.indexOf( this.whichTurn ) + 1
		if (next_player_index > this.turn_order.length-1)
			next_player_index = 0

		this.whichTurn = this.turn_order[ next_player_index ]
		current_player.gameData.canDraw = true
	}

	clear_board() {
		this.board = JSON.parse(String(fs.readFileSync("./board.json")))
	}

};

class Game_functions extends Database {
	constructor(rooms) { super(rooms) }

	check_if_player_is_permitted(con_pkg, dont_check_if_its_my_turn) {
		let { current_player } = con_pkg
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

	useCard(con_pkg, target, yx){
		//send postion of piece to add
		let { current_player } = con_pkg

		const room = this.check_if_player_is_permitted(con_pkg)
		if (!room) return
		
		// Tjek om pladsen er optaget
		let { card, token } = room.board[yx[0]][yx[1]]
		if (card == 'buffer') return

		// two eyes: dc
		
		// Spilleren skal have kortet på hånden
		let card_on_hand = false
		if (!token) {
			// Læg
			card_on_hand == this.check_if_has_11(current_player, 'dc')

			if (current_player.gameData.cards.includes(target.card))
				card_on_hand = true
		}
		else {
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

		// Fjerner kortet fra hånden
		let type = this.check_if_has_11(current_player, (token ? 'dc':'hs'))
		if (type) target.card = type + '11'

		console.log('removing card:', target.card, 'from:', current_player.username)

		let index = current_player.gameData.cards.indexOf(target.card)
		current_player.gameData.cards.splice( index, 1 )
		
		// Ændre turen
		room.next_turn(current_player)

		// Opdaterer spillerne
		current_player.send_message('hand', current_player.gameData.cards)
		room.send_info()
	}


	draw_card(con_pkg) {
		let { current_player } = con_pkg

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



module.exports = {Game_meta, Game_functions}
