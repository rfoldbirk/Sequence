const { log, table, clear } = console; //clear()
const port = 3000

// Biblioteker
let express = require("express")
let app = express()
let http = require("http").createServer(app)
let io = require("socket.io")(http)

// Egne biblioteker
let Rooms = require("./rooms.js")
let Players = require("./players.js")

const { __livereload_init__, watch_for_changes } = require('./util/livereload.js')
__livereload_init__(io, ["public/css", "public/js", "public/"])




// -------------------------- Socket.io redirects -------------------------- //


io.on("connection", (socket) => {
	
	// Vi tilbyder en lille pakke, som begge mock-databaser bruger til at holde styr på den nuværende forbindelse
	let con_pkg = { io, socket, current_player: undefined }
	
	// Fortæller klienten hvilke spillere er forbundet.
	Players.send_all_connected_players(socket)
	
	// ------ Spiller relaterede handlinger ------ //
	socket.on("reconnect", uuid => con_pkg.current_player = Players.reconnect(con_pkg, uuid))
	socket.on("register", username => con_pkg.current_player = Players.register(con_pkg, username))
	socket.on("check_username", username => Players.check_username(con_pkg, username))
	socket.on("disconnect", () => Players.disconnect(con_pkg))
	// Klienten spørger en gang i mellem serveren om den har de rigtige spillere...
	// Klienten får kun svar hvis listen er ukorrekt
	socket.on('players?', client_players => {
		client_players.sort(sort_by_username(a, b))
		server_players = Players.fetch(['username', 'room_id']).sort(sort_by_username(a, b))
		
		// Hvis de to arrays har forskellige længder, er de ikke ens
		if (client_players.length != server_players.length) {
			Players.send_all_connected_players(socket)
			return
		}
		
		// Sammenligner de to arrays, og sender tilbage hvis noget ikke passer
		for (let i in client_players) {
			if (client_players[i] != server_players[i]) {
				Players.send_all_connected_players(socket)
				return
			}
		}
	})
	
	
	// -------- Rum relaterede handlinger -------- //
	socket.on("new_room", () => Rooms.new_room(con_pkg))
	socket.on("invite", username => Rooms.invite(con_pkg, username))
	socket.on("room_change_name", name => Rooms.change_name(con_pkg, name))
	socket.on("join_lobby", owner => Rooms.join_lobby(con_pkg, owner))
	// -------- Game relaterede handlinger -------- //
	socket.on("use_card", card => Rooms.useCard(con_pkg, card))
	// ------------------ Debug ------------------ //
	socket.on('users', () => Players.test(con_pkg))
})


app.use(express.static("public"))


app.get("/test", (req, res) => {
	res.send("test")
})


http.listen(port, () => {
	log(`Sequence http://localhost:${ port }`)
})



// --------------------------- Hjælpe funktioner --------------------------- //


function sort_by_username(a, b) {
	if (a.username.toUpperCase() < b.username.toUpperCase()) {
		return -1
	}
	if (a.username.toUpperCase() > b.username.toUpperCase()) {
		return 1
	}
	return 0
}



// ------------------------------ Skal fjernes ------------------------------ //


var cardSet = function() {
	this.availableCards = cards()
	this.usedCards = []
}


cardSet.prototype.pickRandomCard = function() {
	log(this.availableCards)
}


function cards() {
	var availableCards = []
	var cardArray = ["c", "d", "h", "s"]
	for (var i = 0; i < cardArray.length; i++) {
		availableCards = availableCards.concat(makeCardArray(cardArray[i]))
		availableCards = availableCards.concat(makeCardArray(cardArray[i]))
	}
	return availableCards
}

function makeCardArray(x) {
	var cards = []
	for (var i = 1; i < 14; i++) {
		cards.push(x + i)
	}
	return cards
}




var test = new cardSet()