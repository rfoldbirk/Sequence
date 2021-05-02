let players = []

// Opdatere sidebaren med de
socket.on('list_players', player_names => {
    players = player_names
    players.sort(function (a, b) {
        if (a.username.toUpperCase() < b.username.toUpperCase()) {
            return -1
        }
        if (a.username.toUpperCase() > b.username.toUpperCase()) {
            return 1
        }
        return 0
    })

    log(players)

    remove_all_players()

    for (const { username, room_id } of player_names)
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
    document.querySelector('#online-count').innerText = `${players.length} Online`
}

// Spørger serveren hver femte sekund om den har styr på spillerne.
// setInterval(() => {
//     socket.emit('players?', players)
// }, 5000);



// Højre kliks menu
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