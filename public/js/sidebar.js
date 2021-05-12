/*
Scriptet tager sig af al interaktion med sidemenuen.med

For eksempel sørger den for at liste alle spillerne i menuen, og spørge 
serveren engang i mellem om dens information er korrekt.

Derudover sørger den også for at højrekliksmenuen opfører sig ordentligt!

Sidst men ikke mindst sørger den for at lobby området opdaterer sig korrekt.
*/


// ------------------------------------ Player list ----------------------------------- //    


let player_list = []

// Opdatere sidebaren med de
socket.on('list_players', player_data => {
	player_list = player_data
	player_list.sort(function (a, b) {
		if (a.username.toUpperCase() < b.username.toUpperCase()) {
			return -1
		}
		if (a.username.toUpperCase() > b.username.toUpperCase()) {
			return 1
		}
		return 0
	})

	remove_all_players()

	for (const { username, room_id } of player_data)
		create_player(username, room_id)

	update_amount_of_players()
})


function create_player(name, room) {
	if (document.getElementById(`player_${name}`)) return
	let p = document.createElement('p')
	p.id = `player_${name}`
	
	if (localStorage.getItem(localStorageTag + 'username') == name) {
		// Så er det en selv
		p.innerHTML = `<b>${name}</b> <i>dig</i>`
		p.classList.add('player-me')

		// Viser lobby'en, hvis spilleren er i et rum
		if (room)
			lobby.menu.classList.add('lobby-show')
		else
			lobby.menu.classList.remove('lobby-show')
	} else {
		if (room) {
			p.innerHTML = `${name} <i>lobby</i>`
		} else {
			p.innerText = name
		}
	}
	
	document.querySelector('.players').appendChild(p)
}


function remove_all_players() {
	document.querySelectorAll('.players > p').forEach(elem => elem.remove())
}


function update_amount_of_players() {
	// Opdater antal af spillere
	document.querySelector('#online-count').innerText = `${player_list.length} Online`
}

// Spørger serveren hver femte sekund om den har styr på spillerne.
// setInterval(() => {
//     socket.emit('players?', players)
// }, 5000);



// --------------------------------- Højre kliks menu --------------------------------- //


let last_selected_player

document.addEventListener('contextmenu', e => {
	e.preventDefault()
	let menu = document.getElementById('menu')

	if (e.target.id.includes('player_') || e.target.parentElement.id.includes('player_')) {
		menu.setAttribute('style', `left: ${e.clientX}px; top: ${e.clientY}px;`)
		menu.hidden = false

		let elem = (e.target.id.includes('player_')) ? e.target:e.target.parentElement

		if (last_selected_player) {
			if (last_selected_player.id != elem.id) {
				last_selected_player.classList.remove('player-hover')
			}
		}

		elem.classList.add('player-hover')
		last_selected_player = elem

		let name = elem.id.split('player_')[1]

		const localStorage_username = localStorage.getItem(`${localStorageTag}username`)


		const invite_btn = menu.querySelector('#invite_btn')
		const join_btn = menu.querySelector('#join_btn')
		const change_btn = menu.querySelector('#change_btn')


		// Afhængig af hvilken spiller, som trykker skal der vises forskellige ting
		invite_btn.hidden = (name == localStorage_username)
		join_btn.hidden = (name == localStorage_username)
		change_btn.hidden = (name != localStorage_username)

		if (name != localStorage_username) {
			join_btn.hidden = (!elem.innerHTML.includes('<i>lobby</i>'))
		}
		

		// Inviter
		invite_btn.onclick = () => {
			socket.emit('invite', name)
			hide_contextmenu()
		}

		// Deltag i lobby
		join_btn.onclick= () => {
			socket.emit('join_lobby', name)
			hide_contextmenu()
		}

		// Skift navn
		change_btn.onclick = () => {
		}
	}
	else {
		if (e.target.id == 'menu' || e.target.parentElement.id == 'menu')
			return

		if (last_selected_player)
			last_selected_player.classList.remove('player-hover')
		menu.hidden = true
	}
})

document.addEventListener('click', e => {
	let menu = document.getElementById('menu')
	
	if (e.target.id == 'menu' || e.target.parentElement.id == 'menu')
		return
	
	hide_contextmenu()
})


function hide_contextmenu() {
	menu.hidden = true
	if (last_selected_player)
		last_selected_player.classList.remove('player-hover')
}



// --------------------------------- Lobby interaktion -------------------------------- //


let lobby = {
	menu: document.getElementById('lobby'),
	player_section: document.getElementById('lobby-players'),
	amount_of_players: document.getElementById('lobby_amount_players'),
	settings_btn: document.getElementById('lobby-controls-settings'),
	leave_btn: document.getElementById('lobby-controls-leave'),
}


lobby.leave_btn.addEventListener('click', () => {
	socket.emit('leave_room')
	lobby.menu.classList.remove('lobby-show')
})


socket.on('lobby_players', players => {
	const { player_section } = lobby

	// Fjern alle spillere
	const children = player_section.querySelectorAll('*')
	children.forEach(child => child.remove())

	lobby.amount_of_players.innerText = `${ players.length } / 12 spillere`

	for (let { username, gameData } of players) {
		let p = document.createElement('p')
		p.innerHTML = username
		p.classList.add('team-spectator')

		let teams = [ 'spectator', 'blue', 'red', 'green' ]

		p.onclick = () => {
			socket.emit('lobby_change_player_team', username)
			// Forudsigelse
			let current_team = p.classList[0].split('team-')[1]
			let index = teams.indexOf(current_team) + 1

			if (index > teams.length-1)
				index = 0

			p.classList.remove(`team-${ current_team }`)
			p.classList.add(`team-${ teams[index] }`)
		}

		player_section.appendChild(p)
	}
})

socket.on('leave_lobby', () => {
	// Fjerner menuen
	lobby.menu.classList.remove('lobby-show')
})