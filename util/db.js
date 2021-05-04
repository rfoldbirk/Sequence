// Tilbyder en extension class til players og rooms, 
// da alligevel bruger mange af de samme hjælpefunktioner og logik

class Database {
	constructor(db_arr) {
		this.db = db_arr
	}

	delete(uuid) {
		for (const i in this.db) {
			if (this.db[i].uuid == uuid) {
				if (!this.db[i].sid) {
					this.db.splice(i, 1)
				}
			}
		}
	}

	find(key, val, case_insensitive) {
		for (const P of this.db) {
			if (P.hasOwnProperty(key)) {
				if (case_insensitive) {
					if (P[key].toLowerCase() == val.toLowerCase()) 
						return P
				}
				else {
					if (P[key] == val) 
						return P
				}
			}
		}
	}


	// returnere et objekt med udelukkende de ønskede værdier
	fetch(keys, key, val) {
		let list = []

		for (const P of this.db) {
			if (key && val)
				if (P[key] != val) continue

			let obj = {}
			for (const key of keys) {
				if (P.hasOwnProperty(key))
					obj[key] = P[key]
				else
					obj[key] = undefined

			}
			// Hvis der kun er et element i objektet, returnere
			// vi ikke et objekt, da det bliver for irriterende :)
			if (Object.keys(obj).length == 1)
				list.push(obj[Object.keys(obj)[0]])
			else
				list.push(obj)
		}

		return list
	}
}

module.exports = Database