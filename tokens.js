/*
    Et token system, som kan generere unikke tokens med en bestemt maks alder.

    Funktioner:

    uniqueToken: Returnere en unik token
      length:           int             Hvor lang token skal være.
      life_in_seconds:  int|string      Giver lidt sig selv. Bestemmer hvor lang tid token skal kunne overleve. Man kan også sætte denne parameter til 'never', så den overlever for evigt.
      
    checkToken: Tjekker om en token stadig er gyldig. Kalder desuden cleanup()
      token:            token           Selve token objektet

    remove: Finder og fjerner en given token
      token.str         string          En streng af tekst, som
    
    cleanup: Leder efter tokens, som er udløbet og fjerner dem.
*/
let _tokens = []

class Tokens {
    random_string = (length) => [...Array(length)].map(_=>(Math.random()*36|0).toString(36)).join``

    uniqueToken = (length, life_in_seconds, _depth) => {
        let token = {
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

    remove = (token_str) => {
        let index = 0
        for (let token of _tokens) {
            if (token.str == token_str) {
                _tokens.splice(index, 1)
            }

            index ++
        }
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