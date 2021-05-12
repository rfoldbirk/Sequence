<script>
	import { fade, fly } from 'svelte/transition'
	import { onMount } from 'svelte'
	let promptLogin = false
	let valid_input = null
	let input_field	// Reference til input elementet. Den skal nok selv finde det :)

	let username = ''

	onMount(() => {
		let maybe_name = localStorage.getItem('username')
		if (maybe_name && maybe_name.length > 2)

		var interval_id = setInterval(() => {
			if (input_field) {
				input_field.value = maybe_name
				socket.emit('check_username', maybe_name)
				clearInterval(interval_id)
				return
			}
		}, 100);
	})

	$: {
		if (promptLogin && input_field)
			input_field.focus()
	}
	

	function key_up({key}) {
		if (!input_field) return
		if (key == 'Enter') {
			click()
			return
		}

		let current_input = input_field.value
		valid_input = null

		setTimeout(() => {
			if (current_input != input_field.value) return

			socket.emit('check_username', current_input)
		}, 350);
	}

	
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
	socket.on('logged-in', _username => localStorage.setItem('username', _username))

	socket.on('name_requirements', data => {
		if (!input_field) return
		if (input_field.value.length == 0) {
			valid_input = null
			return
		}
		valid_input = (data == 'valid' ? true:false)

		// Skal fjernes --------
		// if (valid_input) click()
		// ---------------------
	})


	socket.on('set_uuid', uuid => {
		localStorage.setItem('uuid', uuid)
		localStorage.setItem('username', username)
		promptLogin = false

		// Skal fjernes --------
		// if (username == 'Rasmus')
		// 	socket.emit('invite', 'Privat')
		// else
		// 	socket.emit('join_lobby', 'Rasmus')
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
		z-index: 1;
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