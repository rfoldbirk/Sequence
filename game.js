class Game {
	constructor(){
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
	pickRandomCard(){
		var random = Math.floor(Math.random() * this.availableCards.length)
		var card = this.availableCards[random];
		this.availableCards.splice(random, 1);
		return card
	}
	useCard(){
		
	}
};

var myGame = new Game

console.log(myGame.pickRandomCard())

module.exports = Game