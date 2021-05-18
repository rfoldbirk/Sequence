// Scriptet her holder øje med en specifik mappe, og hver gang en fil bliver gemt,
// sender den en socket meddelse, via socket.io, som fortæller klienten af en fil er blevet opdateret.
// Klienten sørger derefter for at hente den nyligt opdaterede fil.

// Enlig løser dette script kun et problem som eksistere under udviklingen.
// I produktion skal dette slås fra.


const { watch } = require('fs')

let _io

function __livereload_init__(io, paths) {
    _io = io
    watch_for_changes(paths)
}

function watch_for_changes(folders) {
	for (const folder of folders) {
		watch(
			`${process.cwd()}/${folder}`,
			{ encoding: 'utf8' },
			(_event_type, filename) => {
				if (_io) _io.emit('__livereload', filename)
			}
		)
	}
}


module.exports = {
    __livereload_init__,
    watch_for_changes
}