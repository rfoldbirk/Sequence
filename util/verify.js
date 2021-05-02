function checkVariable(variable, { type, minLength, maxLength }) {
	if (type) {
		const var_type = typeof variable
		if (var_type != type) return "type"
	}

	if (minLength) {
		if (variable.length < minLength)
			return "minLength"
	}

	if (maxLength) {
		if (variable.length > maxLength)
			return "maxLength"
	}
}

module.exports = checkVariable