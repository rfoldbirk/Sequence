const { log, table, clear } = console
const port = 3000

// Biblioteker
var express = require("express")
var app = express()
var http = require("http").createServer(app)
var io = require("socket.io")(http)

// Egne biblioteker
var Rooms = []
var Players = []

var Room = require("./rooms.js")
var Player = require("./players.js")


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
		for (const player of Players) {
			if (player.uuid == uuid) {
				player.sid = sid
				P = player
			}
		}

		if (!P) {
			socket.emit("reset")
			return
		}

		log('Name:', P.username)
	})


	socket.on("register", username => {

		// Tjekker om brugernavnet opfylder kravene
		const invalid = checkVariable(username, { "type": "string", "minLength": 4, "maxLength": 15 })
		if (invalid) {
			socket.emit("change_name", invalid)
			return
		}

		// Tjekker om brugernavnet allerede eksistere
		if (findPlayer("username", username, true)) {
			socket.emit("change_name", "exists" )
			return
		}

		log(username, "registered")
		P = new Player(sid, randomString(15), username)
		Players.push(P)

		socket.emit("set_uuid", P.uuid)
	})


	socket.on("users", () => {
		table(Players);
	})


	socket.on("check_username", username => {
		// Tjekker om brugernavnet opfylder kravene
		const invalid = checkVariable(username, { "type": "string", "minLength": 4, "maxLength": 15 })
		if (invalid) {
			socket.emit("name_requirements", invalid)
			return
		}

		// Tjekker om brugernavnet allerede eksistere
		if (findPlayer("username", username, true)) {
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
			deletePlayer(P.uuid)
		}, 60000*5) // Sletter en profil efter 5 min inaktivitet.
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