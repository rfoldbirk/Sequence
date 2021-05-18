<script>
	// Denne Svelte komponent sørger for at lave en context menu.
	// Altså den menu, som kommer frem når man højreklikker.
	// Der bliver altså lyttet efter den event, og så overskriver vi den med vores egen.

	// Vi importerer først og fremmest isOwner fra stores, så vi kan referere til
	// den potentielle ejer af en lobby.
	import { isOwner } from '../stores'
	let hide = true // Angiver om menuen skal vises eller skjules

	// Dens placering bliver gemt her
	let x = 0
	let y = 0

	// Referencer til de forskellige knapper
	let invite_btn
	let join_btn
	let lock_btn
	let kick_btn


	// Context menuen kan umildbart kun aktiveres ved at trykke på en spiller.
	// Når dette sker, gemmer vi hvem der blev trykket på i denne variable.
	let current_name = ''
	let whitelist = [ 'player_', 'spectator', 'blue', 'green', 'red' ]


	// Funktionen laver en masse tjeks for at finde ud af om stedet hvor der blev trykket
	// er godt nok.
	function check_if_target_is_valid(target) {
		let new_target = false

		// Den tjekker om elements id er i whitelist arrayet.
		for (let allowed of whitelist)
			new_target = (target.id.includes(allowed) ? target: target.parentElement.id.includes(allowed) ? target.parentElement:new_target)
		
		target = new_target
		if (!target) { // Hvis den ikke fandt noget element
			hide = true
			return false
		}

		// Gemmer spiller navnet som blev trykket på.
		current_name = (target.id.includes('player_')) ? target.id.split('player_')[1] : target.innerText
		let me = (current_name == localStorage.getItem('username') ? true:false)
		
		if (me) { // Man må ikke kunne trykke på sig selv!
			hide = true
			return false
		}

		return target
	}

	function right_click({ target, clientX, clientY }) {
		target = check_if_target_is_valid(target)
		if (!target) return

		// Skjuler knapperne hvis de ikke skal være der
		join_btn.hidden = (!target.innerText.includes('lobby'))
		invite_btn.hidden = (!target.id.includes('player_'))
		lock_btn.hidden = (target.id.includes('player_') || !$isOwner)
		kick_btn.hidden = (target.id.includes('player_') || !$isOwner)

		// Hvis der ikke er nogen af knapperne som er synlige, så skal menuen ikke vises
		if (join_btn.hidden + invite_btn.hidden + lock_btn.hidden + kick_btn.hidden == 4) return

		// Ændre på lås knappen hvis nødvendigt.
		lock_btn.innerText = (target.getAttribute('meta') == 'true') ? 'Lås op':'Lås'
		
		// Ændre på menuen placering
		hide = false
		x = clientX
		y = clientY
	}


	// Forskellige funktioner, som egentlig bare sender en request via socket.io
	// Navnene forklarer sig selv.
	function invite_click() {
		socket.emit('invite', current_name)
	}
	
	function join_click() {
		socket.emit('join_lobby', current_name)
	}

	function lock_click() {
		socket.emit('lock_user', current_name)
	}

	function kick_click() {
		socket.emit('kick', current_name)
	}

	function closeMenu() {
		hide = true
	}
</script>

<!-- Selve contextmenuen i html -->
<div on:click={closeMenu} hidden={ hide } style="left: { x }px; top: { y }px">
	<p bind:this={invite_btn} on:click={invite_click} id="invite_btn"> Inviter til spil </p>
	<p bind:this={join_btn} on:click={join_click} id="join_btn"> Deltag i lobby </p>
	<p bind:this={lock_btn} on:click={lock_click} id="lock_btn"> Lås valg </p>
	<p bind:this={kick_btn} on:click={kick_click} class="danger" id="kick_btn"> Kick spiller </p>
</div>

<!-- Her lytter vi efter klik events på hele dokuments krop -->
<svelte:body on:click={closeMenu} on:contextmenu|preventDefault={right_click} />


<style lang="scss">
	div {
		z-index: 5;
		position: absolute;
		background: black;
		padding: .5rem;
		border-radius: 5px;
		filter: drop-shadow(2px 2px .3rem #000);

		p {
			color: white;
			padding: .5rem .8rem;
			margin: 0px;
			// margin-bottom: 0px;
			transition: background .2s;
			border-radius: 5px;

			&:hover {
				background: #283446;
				cursor: pointer;
			}
		}
	}
	
	
	.danger {
		color: #f55;
	}
</style>