socket.on('invite_from', username => {
    alert('Fik en invitation fra: ' + username)
})

socket.on('request_join', username => {
    alert('request join: ' + username)
})