var nm_username_input_id = ''


document.addEventListener('keyup', (e) => {
	if (e.key == "Enter") {
		nm_accept.click()
	}
})


nm_accept.addEventListener('click', (e) => {
	localStorage.setItem(`${ localStorageTag }username`, nm_username_input.value)
	const username = localStorage.getItem(`${ localStorageTag }username`)
	socket.emit("register", username)
	nm.toggle()
})



nm_username_input.addEventListener('keyup', (e) => {
	// vent 1 sekund før den begynder at tjekke om brugernavnet er gyldigt

	nm_username_input_id = randomString(9)
	var tmp_copy = nm_username_input_id

	nm_accept.classList.add('disabled')
	nm_spin.hidden = true
	nm_username_input_set_valid_state()

	setTimeout(() => {
		if (tmp_copy == nm_username_input_id && nm_username_input.value != '') {
			// tjek server

			nm_spin.hidden = !nm_spin.hidden
			socket.emit('check_username', nm_username_input.value)
		}
	}, 650)
})



socket.on("name_requirements", data => {
	nm_spin.hidden = true
	if (data == 'valid') {
		nm_username_input_set_valid_state('is-valid')
		nm_accept.classList.remove('disabled')
	}
	else {
		nm_username_input_set_valid_state('is-invalid')
	}
})