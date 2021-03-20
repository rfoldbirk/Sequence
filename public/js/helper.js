const { log } = console

var nm = new bootstrap.Modal(document.getElementById("nameModal"), { "keyboard": false, "backdrop": "static" })


var nm_username_input = document.getElementById("nm_username_input")
var nm_spin = document.getElementById("nm_spin")
var nm_accept = document.getElementById("nm_accept")


function nm_username_input_set_valid_state(state) {
	if (nm_username_input.classList.contains('is-valid'))
		nm_username_input.classList.remove('is-valid')

	if (nm_username_input.classList.contains('is-invalid'))
		nm_username_input.classList.remove('is-invalid')

	if ("is-validis-invalid".includes(state))
		nm_username_input.classList.add(state)
}

var toastDiv = document.querySelector(".toast")
if (toastDiv) {
	var toast = new bootstrap.Toast( toastDiv, { "delay": 6000 } )
	toast.show()
}


var randomString = (i) => [...Array(i)].map(_=>(Math.random()*36|0).toString(36)).join``