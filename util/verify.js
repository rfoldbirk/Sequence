// En funktion som bruges til at tjekke typen af en variable og minimum/maksimum længde af variablen.
// Hvis den ikke returnere noget, er alt godt og programmet kan fortsætte uforstyrret.

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