const localStorageTag = "sequence_"
const socket = io("ws://localhost:3001")


socket.on("connect", () => {	
	login()
})

// --------- //
//   Socket  //
// --------- //

socket.on("username?", () => {
	// Få brugernavn via ui
})



socket.on("change_name", reason => {
	log('\n invalid name:', reason)
})


socket.on("set_uuid", uuid => {
	log("setting uuid:", uuid)
	localStorage.setItem(`${ localStorageTag }uuid`, uuid)
})

socket.on("reset", () => {
	// Hvis klienten prøver at logge ind med forkert uuid,
	// beder serveren om et reset og klienten for lov at lave 
	// en ny bruger.
	localStorage.removeItem(`${ localStorageTag }username`)
	localStorage.removeItem(`${ localStorageTag }uuid`)
	login()
})



// --------- //
//   Andet   //
// --------- //

function login() {
	log("Loggin in")
	const uuid = localStorage.getItem("sequence_uuid")

	if (uuid) {
		socket.emit("login", uuid)
	}
	else {
		// spørg om navn via ui.

		nm.toggle()
		nm_username_input.dispatchEvent(new Event('keyup'))
	}
}




// --------- //
//   Debug   //
// --------- //

users = () => socket.emit("users")
socket.on("msg", msg => {
	log("\nMSG:", msg)
})