var Database = require("./util/db.js");

class Game_meta {
	constructor() {
		this.availableCards = this.makeCardArray()
		this.usedCards = [];
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
            console.log(player.username)
        })
    }
};

class Game_functions extends Database {
	useCard(con_pkg, card){
		console.log(card)
	}
}



module.exports = {Game_meta, Game_functions}