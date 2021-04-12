var _tokens = []

class Tokens {
    random_string = (length) => [...Array(length)].map(_=>(Math.random()*36|0).toString(36)).join``

    uniqueToken = (length, life_in_seconds, _depth) => {
        var token = {
            str: this.random_string(length),
            expiration_date: Date.now() + Number(life_in_seconds)*1000,
            never_expire: (life_in_seconds == 'never')
        }

        for (let tok of _tokens) {
            if (tok.str == token.str) {
                _depth = (!_depth) ? 1:_depth++

                if (_depth > 5) return false
                token = this.uniqueToken(length, life_in_seconds, _depth)
            }
        }

        return token
    }

    checkToken = (token) => {
        this.cleanup()

        for (let tok of _tokens) {
            if (token.str == tok.str && token.expiration_date > Date.now())
                return true
        }

        return false
    }

    cleanup = () => {
        let index = 0
        for (let token of _tokens) {
            if (token.expiration_date <= Date.now() && !token.never_expire) {
                _tokens.splice(index, 1)
            }

            index ++
        }
    }
}


const t = new Tokens
module.exports = t