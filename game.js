var fs = require("fs")
var Database = require("./util/db.js");

class Game_meta {
	constructor() {
		this.availableCards = this.makeCardArray()
		this.usedCards = [];
		this.board = JSON.parse(String(fs.readFileSync("./board.json")))
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

};

class Game_functions extends Database {
	useCard(con_pkg, card){
		//send postion of piece to add
		console.log(this.find("id", con_pkg.current_player.room_id).players)
		this.find("id", con_pkg.current_player.room_id).broadcast("test", "test")
	}

}



module.exports = {Game_meta, Game_functions}
