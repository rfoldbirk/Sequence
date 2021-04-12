const { log, table, clear } = console
const port = 3000

// Biblioteker
var express = require("express")
var app = express()
var http = require("http").createServer(app)
var io = require("socket.io")(http)

// Egne biblioteker
var Rooms = require("./rooms.js")
var Players = require("./players.js")
var Tokens = require("./tokens.js")


// ---------------------- //
//   Nyttige funktioner   //
// ---------------------- //
var randomString = (i) => [...Array(i)].map(_=>(Math.random()*36|0).toString(36)).join``



// ---------------------- //
//      Socket halløj     //
// ---------------------- //



io.on("connection", (socket) => {
	const sid = socket.id
	var P // En kopi af spilleren

	socket.on("login", uuid => {
		// Finder brugeren
		P = Players.find('uuid', uuid)

		if (!P) {
			socket.emit("prompt_login")
			return
		}
		else {
			P.sid = sid
		}

		log('Name:', P.username)
		socket.emit('logged-in', P.username)
	})


	socket.on("register", username => {

		// Tjekker om brugernavnet opfylder kravene
		const invalid = checkVariable(username, { "type": "string", "minLength": 4, "maxLength": 15 })
		if (invalid) {
			socket.emit("change_name", invalid)
			return
		}

		// Tjekker om brugernavnet allerede eksistere
		if (Players.find('username', username, true)) {
			socket.emit("change_name", "exists" )
			return
		}

		log(username, "registered")
		P = Players.new(sid, username)

		socket.emit("set_uuid", P.uuid)
	})


	socket.on('get_player_name', uuid => {
		var player = Players.find('uuid', uuid)
		socket.emit('response:get_player_name', player.name)
	})

	socket.on("users", () => {
		table(Players)
	})


	socket.on("check_username", username => {
		// Tjekker om brugernavnet opfylder kravene
		const invalid = checkVariable(username, { "type": "string", "minLength": 4, "maxLength": 15 })
		if (invalid) {
			socket.emit("name_requirements", invalid)
			return
		}

		// Tjekker om brugernavnet allerede eksistere
		if (Players.find("username", username, true)) {
			socket.emit("name_requirements", "exists" )
			return
		}

		socket.emit("name_requirements", "valid" )
	})


	socket.on("disconnect", () => {
		log("Client disconnected")
		if (!P) return
		P.sid = null
		setTimeout(() => {
			Players.delete(P.uuid)
		}, 60000*5) // Sletter en profil efter 5 min inaktivitet.
	})


	// Rum ting og sager

	socket.on("new_room", () => {
		// Tjek at brugeren ikke allerede er i et rum
		if (P.room_id) {
			socket.emit('response:new_room', 'allerede en del af et andet rum')
			return
		}

		var room = Rooms.new(P.uuid)
		P.room_id = room.id
		socket.emit('response:new_room', 'yay!')
	})


	socket.on("room_info", () => {
		// Tjek at brugeren ikke allerede er i et rum
		var room = Rooms.find(P.room_id)
		socket.emit('response:room_info', room)
	})


	socket.on("room_change_name", name => {
		const invalid = checkVariable(name, { "type": "string", "minLength": 1, "maxLength": 30 })
		var room = Rooms.find(P.room_id)
		if (invalid || !room) {
			socket.emit('response:room_change_name', false)
			return
		}


		if (room.creator == P.uuid) {
			room.name = name
		}

		socket.emit('response:room_change_name', true) // Så klienten ved at alt gik godt

		// Sender en update til alle spiller i et rum. (undtagen ejeren)
		for (var player of room.players) {
			if (player.uuid == room.creator.uuid) continue
			io.to(player.sid, 'update:room', room)
		}
	})

	socket.on('room_info', room_id => {
		var room = Rooms.find(room_id)
	})
})


app.use(express.static("public"))


app.get("/test", (req, res) => {
	res.send("test")
})


http.listen(port, () => {
	log(`Sequence http://localhost:${ port }`)
})



// ---------------------- //
//    Player funktioner   //
// ---------------------- //

function deletePlayer(uuid) {
	for (const i in Players) {
		if (Players[i].uuid == uuid) {
			if (!Players[i].sid) {
				Players.splice(i, 1)
			}
		}
	}
}


function findPlayer(key, val, case_insensitive) {
	for (const P of Players) {
		if (P.hasOwnProperty(key)) {
			if (case_insensitive) {
				if (P[key].toLowerCase() == val.toLowerCase()) 
					return P
			}
			else {
				if (P[key] == val) 
					return P
			}
		}
	}
}


function checkVariable(variable, { type, minLength, maxLength }) {
	if (type) {
		const var_type = typeof variable
		if (var_type != type) return "type"
	}

	if (minLength) {
		if (variable.length < minLength)
			return "minLength"
	}

	if (maxLength) {
		if (variable.length > maxLength)
			return "maxLength"
	}
}



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
// console.log(test.availableCards)