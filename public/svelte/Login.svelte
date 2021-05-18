<script>
	import { fade, fly } from 'svelte/transition'
	import { me } from './stores'
	let promptLogin = false
	let valid_input = null
	let input_field	// Reference til input elementet. Den skal nok selv finde det :)

	let username = ''

	// Funktionen kalder sig så snart promptLogin opdateres.
	// Den udfylder derfor input feltet med det brugernavn som er blevet gemt i localStorage.
	// Derefter spørger den serveren om brugernavnet stadig er gyldigt.
	$: {
		if (promptLogin && input_field) {
			input_field.focus()
			input_field.value = localStorage.getItem('username')
			socket.emit('check_username', input_field.value)
		}
	}
	

	// Hver gang en tast bliver trykket, bliver denne funktion kaldt.
	function key_up({key}) {
		if (!input_field) return // Hvis input_field ikke er bundet endnu returnerer den.
		if (key == 'Enter') {
			click() // Hvis Enter knappen bliver trykket, forsøger den i stedet at klikke på knappen.
			return
		}

		let current_input = input_field.value // Den husker det midlertidige input
		valid_input = null

		// Idéen er at klienten først spørger serveren efter 350ms. Den spørger dog kun hvis brugeren ikke har skrevet noget i 350ms. 

		setTimeout(() => {
			if (current_input != input_field.value) return // Hvis de to inputs ikke længere matcher, returnerer den.

			socket.emit('check_username', current_input)
		}, 350);
	}

	// Funktionen som bliver affyret, når man trykker på login knappen.
	function click() {
		if (!input_field) return
		if (!valid_input) return
		username = input_field.value
		socket.emit('register', username)
	}
	
	
	// Socket endpoints
	socket.on('connect', () => {
		socket.emit('reconnect', localStorage.getItem('uuid'))
	})
	socket.on('prompt_login', () => promptLogin = true)
	socket.on('logged-in', _username => {
		localStorage.setItem('username', _username)
		$me = _username
	})

	// Serveren sender dette tilbage, og fortæller hvorvidt brugernavnet er gyldigt.
	socket.on('name_requirements', data => {
		if (!input_field) return
		if (input_field.value.length == 0) {
			valid_input = null
			return
		}
		valid_input = (data == 'valid' ? true:false)
	})

	// Serveren fortæller at klienten skal gemme en slags kodeord.
	socket.on('set_uuid', uuid => {
		localStorage.setItem('uuid', uuid)
		localStorage.setItem('username', username)
		promptLogin = false

		$me = username
	})
</script>


{#if promptLogin}
<div out:fade class="layout">
	<div transition:fly="{{ y: -75, duration: 300 }}" class="login">
		<div class="title">
			<h5> Hvad vil du kaldes? </h5>
			<p> Dit brugernavn skal være unikt. </p>
		</div>
		
		<div>
			<label class="input { valid_input ? 'valid': valid_input == null ? '':'invalid' }" for="">
				<input bind:this={input_field} on:keyup={ key_up } required type="username"/>
				<span>Brugernavn</span>
			</label>
		</div>
		
		<div class="{ valid_input ? 'valid':'invalid' }">
			<button class='login_btn' on:click={ click } > Vælg brugernavn </button>
		</div>
	</div>
</div>
{/if}

<style lang="scss">
	.layout {
		z-index: 5;
		display: grid;
		position: absolute;
		width: 100%;
		height: 100%;
		
		justify-content: center;
		align-content: center;
		
		background: rgba(0, 0, 0, 0.3);
	}
	
	.title {
		* {
			margin: 0;
		}
		h5 {
			font-size: 1.25rem;
			margin-bottom: .4rem;
		}
	}
	
	.input {
		position: relative;
		input {
			width: 100%;
			padding: 30px 15px 10px 16px;
			outline: 0;
			border: 1px solid #ced4da;
			border-radius: 5px;
			
			
			&:required {
				box-shadow: none;
			}
			&:invalid {
				box-shadow: none;
			}
			&:valid,
			&:focus {
				box-shadow: 0 0 0 .25rem rgba(13,110,253,.25);
				& + span {
					top: calc(-50%);
					font-size: 0.9rem;
					color: #7b7d80;
				}
			}
		}
		
		span {
			position: absolute;
			left: 12px;
			
			top: 0;
			transform: translateY(-50%);
			
			background: #fff;
			padding: 0px 5px;
			
			transition: top .1s, font-size .1s, color .3s;
		}
	}

	.login_btn {
		font-size: 1rem;
		color: white;
		line-height: 1.5;
		border: none;
		border-radius: 5px;
		outline: none;
		padding: .575rem .85rem;

		float: right;

		&:hover {
			cursor: pointer;
		}
	}
	
	
	.invalid {
		input {
			outline: none;
			border-radius: 5px;
			border-color: #dc3545;
			box-shadow: 0 0 0 0 rgba(220,53,69,.25);
			&:focus {
				box-shadow: 0 0 0 .25rem rgba(220,53,69,.25);
			}
		}
		button {
			background: #61a0fd;
			&:hover {
				cursor: default;
			}
		}
	}


	.valid {
		input {
			outline: none;
			border-radius: 5px;
			border-color: #198754;
			box-shadow: 0 0 0 0 rgba(25,135,84,.25);
			&:focus {
				box-shadow: 0 0 0 .25rem rgba(25,135,84,.25);
			}
		}

		button {
			background: #0b5ed7;
			// border: 1px solid #0d6efd;
		}
	}
	
	
	.login {
		width: 500px;
		height: 250px;
		background: #fff;
		border-radius: 5px;
		
		div {
			padding: 1rem;
		}
	}
	
</style>