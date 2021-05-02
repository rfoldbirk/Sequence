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