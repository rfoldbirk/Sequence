// ----------------------------------------------------------------------------------------------------------------------------------- //
const _unlimited_turned_off = true // Kun til test! Slå denne variable fra, for at spilleren har ubegrænsede træk og kan bruge alle kort.
// ----------------------------------------------------------------------------------------------------------------------------------- //


//importere modulet fs til at kunne læse file board.json
var fs = require("fs")

//henter db filen så den kan bruge i dette program
var Database = require("./util/db.js");

//objekt af forskellige retninger/offsets til vores beam funktion
//retningerne er det samme som retninger på et kompas: n = north, ne = north-east osv.
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
		//boolean til at holde styr på om spillet er i gang
		this.in_progress = false

		//boolean til at holde styr på når spiller er slut, spillet slutter fx når et hold vinder
		this.ended = false

		//variable til at holde kort
		this.cards

		//variable som holde styr på hvilken spillers tur det er
		this.whichTurn

		// et array som indeholder top, right, bottom og left med spiller navne
		this.layout

		// et array som dikterer rækkefølgen
		this.turn_order = []

		// variable som holder styr på hvor mange hold der er i spillet: bliver sat i rooms.js
		this.amount_of_teams = 0

		// Holder øje med hvor mange der har passet efter hinanden
		this.pass_in_row = 0

		// Hvis pass_in_row overstiger denne værdi, stopper spillet, og holdet med flest point vinder
		this.pass_limit = 3 

		//array som holder de kort er ikke er blevet brugt i spillet endnu
		//kalder funktion makeCardArray for at skabe et nyt kort-sæt når spillet starter
		this.availableCards = this.makeCardArray()

		// ikke i brug på dette tidspunkt
		this.usedCards = [];

		//variable til at holde spillepladen, bliver til et objekt når pladen er hentet
		this.board

		//objekt til at holde styr på hvor mange points de forskellige hold har
		this.points = {
			'blue': 0,
			'red': 0,
			'green': 0
		}

		// Loader boardet
		this.clear_board()
	}

	//funktion som laver et nyt kort-sæt
	makeCardArray() {
		//array som holder de forskellige kulører - clubs, diamonds, hearts & spades
		var cardArray = ["c", "d", "h", "s"];

		//array til at holde alle kortene
		var cards = [];

		//løkke som kører igennem cardArray
		for (var i = 0; i < cardArray.length; i++) {
			//kalder funktionen sorter 2 gange for at lave 2 af hvert kort og tilføjer de motaget arrays til cards arrayet
			cards = cards.concat(this.sorter(cardArray[i]))
			cards = cards.concat(this.sorter(cardArray[i]))
		}
		//returnere cards når funktion har genereret dem
		return cards
	}
	//laver 13 af kort til hver kulør per gang den bliver kørt
	sorter(x) {
		//array til at holde de kort der bliver lavet
		var cards = [];
		//loop som kører 13 gange
		for (var i = 1; i < 14; i++) {
			//tilføjer kortet til cards. x = den kulør funktion blev kaldt med og i er index i løkken
			cards.push(x + i)
		}
		//returnere de 13 kort der bliver lavet
		return cards
	}
	//funktion til at tage et tilfældigt kort fra availableCards
	pickRandomCard() {
		//lavet et random tal fra 0 til hvor mange kort der er tilbage i availableCards
		var random = Math.floor(Math.random() * this.availableCards.length)
		
		//definere det tilfældige kort ud fra random
		var card = this.availableCards[random];

		//slettet det kort som blev valgt
		this.availableCards.splice(random, 1);
		
		//returnere det tilfældige kort
		return card
	}
	//funktion til at sende en socket.io besked til alle spillerne i et rum
	broadcast(event, data) {
		//forEach loop som kører gennem alle spillerne i rummet og sender dem beskeden
		this.players.forEach(player => {
			player.socket.emit(event, data)
		})
	}

	//funktion til at sende 6 kort til alle spillere i starten af spillet
	send_hands(give_6) {
		give_6 = give_6 || false

		//loop som kører igennem alle spilleren i this.players
		for (let player of this.players) {
			//hvis give_6 = true
			if (give_6) {
				//sætter et tomt array på hver spiller under gameData.cards til a holde de 6 kort
				player.gameData.cards = []
				
				//loop som bliver kørt 6 gange
				for (let i = 0; i < 6; i++) {
					//tilføjer et nyt tilfældigt kort til player.gameData.cards
					player.gameData.cards.push(this.pickRandomCard())
				}
			}
			//sender de 6 kort til spilleren over socket.io
			player.send_message('hand', player.gameData.cards)
		}
	}

	//funktion til at sende alt information omkring spillet hvis en spiller genindlæser hjemmesiden
	send_info() {
		//sender layout
		this.broadcast('layout', this.layout)
		
		//sender hvis tur det er
		this.broadcast('turn', this.whichTurn)
		
		//sender spillepladen
		this.broadcast('board', this.board)

		//sender hvor mange points de forskellige hold har
		this.broadcast('points', this.points)

		//sender hvilket kort alle spillere har
		for (const player of this.players)
			player.send_message('hand', player.gameData.cards)
	}

	//funktion som finder den næste persons tur
	next_turn(current_player) {
		//finder den næste spiller ud fra den nuværende spiller plus 1
		let next_player_index = this.turn_order.indexOf(this.whichTurn) + 1

		//hvis next_player_index resultere i et tal der er større end antal spillere bliver next_player_index sat til 0
		if (next_player_index > this.turn_order.length - 1)
			next_player_index = 0

		//whichTurn bliver sat til den valgte spiller
		this.whichTurn = this.turn_order[next_player_index]
		
		//spilleren som havde tur før funktion blev kaldt (current_player) kan nu trække et kort
		current_player.gameData.canDraw = true
	}

	//funktion som henter spillepladen fra filen board.json med modulet fs
	clear_board() {
		this.board = JSON.parse(String(fs.readFileSync("./board.json")))
	}

	assign_direction(yx, dir0, dir1, remove = false) {
		// Det er en lidt grim funktion, så vi gemmer den lidt væk

		const dir = this.board[yx[0]][yx[1]]._direction

		if (!remove) {
			if (dir === undefined) {
				this.board[yx[0]][yx[1]]._direction = `-${ dir0 }-${ dir1 }-`
			} else {
				if (!dir.includes(`-${ dir0 }-${ dir1 }-`))
					this.board[yx[0]][yx[1]]._direction += `-${ dir0 }-${ dir1 }-`
			}
		} else {
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

			// Finder de to retninger
			const dir0 = Object.keys(directions)[i]
			const dir1 = Object.keys(directions)[Number(i) + 4]

			// Sender to beams ud i hver retning
			const res0 = this.beam(yx, dir0, color, action)
			const res1 = this.beam(yx, dir1, color, action)

			// Pluser de to værdier sammen.
			const _count = res0._count + res1._count + 1
			const _beam_count = (res0._beam_count > res1._beam_count) ? res0._beam_count : res1._beam_count

			// Hvis spilleren får enten 5 eller 10 på stribe samtidigt med at den sequence er ny og unik.
			if (_count >= _beam_count * 5 && _beam_count < Math.floor(_count / 5)) {

				// Sætter den korrekte metadata på token
				this.board[yx[0]][yx[1]]._beam_count = Math.floor(_count / 5)
				this.assign_direction(yx, dir0, dir1)

				if (action == 'add') {
					// Tilføjer nogle point og sender en notifikation til spillerne
					this.points[color] += Math.floor(_count / 5)
					this.broadcast('beam', Math.floor(_count / 5) * 5)


					// Tjekker om der er en vinder
					if (!this.ended) {
						if (this.amount_of_teams == 2) {
							if (this.points[color] == 2) {
								this.broadcast('winner', color)
								this.ended = true
							}
						} else if (this.amount_of_teams == 3) {
							if (this.points[color] == 1) {
								this.broadcast('winner', color)
								this.ended = true
							}
						}
					}
				}
			}

			// Bruges til at returnere mængden af sequences.
			if (_count >= 5 && action == 'check') {
				sequences += 1
			}

			// Hvis den skal fjernes 
			if (_count < 5 && action == 'delete') {
				// Hvis der ikke findes noget metadata, returneres antallet af sequences
				if (this.board[yx[0]][yx[1]]._direction == '' || !this.board[yx[0]][yx[1]]._direction) {
					return sequences
				}

				// Fjerner metadataen
				this.board[yx[0]][yx[1]]._beam_count = 0
				this.assign_direction(yx, dir0, dir1, true)

				if (this.points[color] < 0) this.points[color] = 0
			}
		}

		return sequences
	}

	beam(yx, direction, color, action = 'add', _count = 0, _beam_count = 0, _first = true) {
		const location = this.board[yx[0]][yx[1]] // Finder kortet på brættet
		const direction_val = directions[direction] // Finder retningens x, y værdier

		// Hvis kortet enten har samme farve, er en buffer, eller hvis hvis token skal fjernes.
		if (location.token == color || location.card == 'buffer' || 'remove'.includes(action)) {

			// Beregner den nye placering
			const new_yx = [String(Number(yx[0]) + direction_val.y), String(Number(yx[1]) + direction_val.x)]

			// Da man ikke skal tælle den første pollete med, springer vi det over.
			if (!_first) {
				_count++ // Pluser antallet af tokens i træk

				// Hvis token allerede er en del af en sequence, er dens _beam_count højere end 0.
				// Hvis _beam_count er højere end det nuværende antal, og hvis den sequence som token er del af har samme retning
				// Så overskrives vores _beam_count, så programmet ved om det er en ny eller gammel sequence.
				if (Number(location._beam_count) > _beam_count && String(location._direction).includes(`-${direction}-`)) {
					_beam_count = location._beam_count

					// Hvis beam tjekkeren skal fjerne, kalder den check_for_win med intentionen om at fjerne lokationens meta data,
					// hvis lokationen ikke længere er del af en sequence
					if (action == 'remove') {
						this.check_for_win(yx, color, 'delete')
						return {
							_count: 0,
							_beam_count: 0
						}
					}
				}
			}

			// Returnerer hvis kanten af brættet er nået (i minus)
			if (new_yx[0].includes('-') || new_yx[1].includes('-'))
				return {
					_count,
					_beam_count
				}
			// Returnerer hvis kanten af brættet er nået.
			else if (Number(new_yx[0]) > 9 || Number(new_yx[1]) > 9)
				return {
					_count,
					_beam_count
				}

			// Fortsætter i samme retning
			return this.beam(new_yx, direction, color, action, _count, _beam_count, false)
		} else {
			return {
				_count,
				_beam_count
			}
		}
	}
}


class Game_functions extends Database {
	constructor(rooms) {
		super(rooms)
	}

	//funktion til at springe sin tur over
	pass(con_pkg) {
		//henter spillerens rum ud fra spillerens connection package
		const room = this.check_if_player_is_permitted(con_pkg)
		if (!room) return

		//next_turn bliver kaldt da den nuværende spiller har sprunget sin tur over og det er nu næste person der har tur
		room.next_turn(con_pkg.current_player)

		//pass_in_row bliver sat op med 1
		room.pass_in_row += 1

		// console.log('passes in a row:', room.pass_in_row)

		//hvis pass_in_row er over den limit vi har sat på 3 så
		if (room.pass_in_row > room.pass_limit) {

			console.log('\nfinding winner!')

			// Find vinder
			let winnerTeam = ''
			let winnerScore = 0

			//loop der kører igennem hvor mange de forskellige hold har
			for (const teamColor of Object.keys(room.points)) {
				// hvis et hold har højere antal points end winnerScore
				if (room.points[teamColor] > winnerScore) {
					//bliver winnnerScore ændret til det antal points holdet har
					winnerScore = room.points[teamColor]
					//og WinnerTeam bliver sat til holdets farve
					winnerTeam = teamColor
				} else if (room.points[teamColor] == winnerScore) {
					winnerTeam += `|${teamColor}` // Bare så man kan adskille dem
				}
			}
			//hvis der ikke bliver fundet en vinder. bliver winnerTeam sat til 'nobody'
			if (winnerTeam == '') winnerTeam = 'nobody'

			//room.end booleanen bliver sat til true
			room.ended = true

			//sender en besked til alle spillerne om hvem der har vundet
			room.broadcast('winner', winnerTeam)
		}
	}

	check_if_player_is_permitted(con_pkg, dont_check_if_its_my_turn) {
		let {
			current_player
		} = con_pkg
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
				return type + '11'
		return false
	}

	useCard(con_pkg, yx) {
		let {
			current_player
		} = con_pkg

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
		const action = location.token ? 'remove' : 'add'

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
		} else {
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

	// funktion til at trække et kort
	draw_card(con_pkg) {
		let { current_player } = con_pkg

		if (!current_player) return

		// hvis der ikke er en spiller stopper funktion
		if (!current_player.gameData.canDraw) return

		//henter spillerens rum ud fra con_pkg
		const room = this.check_if_player_is_permitted(con_pkg, true)
		if (!room) return

		//finder spillerens index i room.turn_order
		let myIndex = room.turn_order.indexOf(current_player.username)
		//finder indext på personen som har tur
		let nextIndex = room.turn_order.indexOf(room.whichTurn)

		//hvis nextIndex er 0, så bliver nextIndex sat til længden af turn_order
		if (nextIndex == 0) nextIndex += room.turn_order.length

		//hvis nextIndex - myIndex er 1, så har spilleren lov til at trække et kort
		if (nextIndex - myIndex == 1) {
			//et random kort bliver fundet
			const card = room.pickRandomCard()
			//tilføjere det nye kort til spillerens hånd
			current_player.gameData.cards.push(card)
			//canDraw bliver sat til false og spiller kan nu ikke trække et kort længere
			current_player.gameData.canDraw = false

			//spillerens hånd bliver sendt til alle spillerne
			for (const player of room.players)
				player.send_message('hand', player.gameData.cards)
		}
	}
}


//exportere Game_meta & Game_functions
module.exports = {
	Game_meta,
	Game_functions
}