// Alt her er meget eksperimentelt!

function setLayout(layout) {
    layout = layout || {
        top: ['Beth', 'Tina'],
        right: ['Jeppe'],
        bottom: ['Rasmus', 'Nicklas', 'Sebastian'],
        left: ['Jakob', 'Emil']
    }

    layout.bottom = layout.bottom.reverse()
    layout.left = layout.left.reverse()
 
    var sides = ['top', 'right', 'bottom', 'left']
    
    for (var side of sides) {
        var elem = document.querySelector('.' + side)
        var names = layout[side]

        amount = ''
        for (var i in names)
            amount = amount + ' 1fr'

        // Ændre css'en
        if (elem.classList.contains('top') || elem.classList.contains('bottom'))
            elem.style = 'grid-template-columns:' + amount
        else
            elem.style = 'grid-template-rows:' + amount
        
        // Fjerner børnene
        var children = elem.querySelectorAll('*')
        for (var child of children) {
            child.remove()
        }

        for (var name of names) {
            var p = document.createElement('p')
            p.innerText = name

            elem.appendChild(p)
        }
    }
}


function calcPlayers(teams) {
    let amount = 0
    for (let team of Object.keys(teams))
        for (let player of teams[team]) amount ++

    return amount
}


// Team Template
let t = {
    2: {
        first: ['Rasmus'], 
        second: ['Tina']
    },
    3: {
        first: ['Rasmus'], 
        second: ['Tina'],
        third: ['Gert']
    },
    4: {
        first: ['Rasmus', 'Emil'],
        second: ['Tina', 'Beth']
    },
    62: { // 6 spillere, 2 hold
        first: ['Rasmus', 'Emil', 'Jeppe'],
        second: ['Tina', 'Beth', 'Else']
    },
    63: {
        first: ['Rasmus', 'Emil'],
        second: ['Tina', 'Beth'],
        third: ['Gert', 'Simon']
    },
    8: {
        first: ['Rasmus', 'Emil', 'Jeppe', 'Søren'],
        second: ['Tina', 'Beth', 'Else', 'Kirsten']
    },
    9: {
        first: ['Rasmus', 'Emil', 'Jeppe'],
        second: ['Tina', 'Beth', 'Else'],
        third: ['Gert', 'Simon', 'Jan']
    }
}


function mt(teams) {
    let layout = { top: [], right: [], bottom: [], left: [] }
    let layoutKeys = Object.keys(layout)
    let layoutIndex = 0

    let teamKeys = Object.keys(teams)
    let teamIndex = 0

    let players = calcPlayers(teams)

    // Først skal vi finde ud af hvor mange der skal være på hver side...
    let playersOnEachSide = players / teamKeys.length
    if (players == 8)
        playersOnEachSide = 2
    else if (players == 6 && teamKeys.length == 2)
        playersOnEachSide = 1
    else if (players == 9) {
        playersOnEachSide = 2
    }

    let i = 0

    while (true) {
        const layoutKey = layoutKeys[layoutIndex]
        const teamKey = teamKeys[teamIndex]

        let teamArray = teams[teamKey]
        if (teamArray.length <= 0) break

        let player = teamArray.shift()
        layout[ layoutKey ].push(player)

        teamIndex ++
        if (teamIndex >= teamKeys.length) teamIndex = 0

        i ++
        if (i >= playersOnEachSide) {
            i = 0

            if (teamKeys.length == 2) {
                if (players == 8)
                    layoutIndex ++
                else
                    layoutIndex += 2
            }
            else {
                layoutIndex ++
            }
        }

        if (layoutIndex >= layoutKeys.length) {
            layoutIndex = layoutKeys.length - layoutIndex
        }
    }

    setLayout(layout)
}


// Default
mt(t[4])

const keys = Object.keys(t)
let _i = 0
function next() {
    if (_i==0) console.clear()
    if (_i>=keys.length-1) return
    _i++
    const key = keys[_i]

    log('Now displaying:', key)
    mt( t[key] )
}

// setTimeout(next, 2000)