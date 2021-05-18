<script>
	import { fly } from 'svelte/transition'
	import { me } from './stores';

	let messages = []
	let notif_count = 0

	/* Denne komponent sørger for at vise og lave nye notifikationer.

	Systemet er ikke super smart...
	Det består af tre dele

	1. Klienten får en besked fra serveren, som den skal lave om til en notifikation
	2. new_message() bliver kaldt med den relevante data. Da beskederne skal oversættes til læseligt dansk bliver funktionen lidt lang og mærkelig
	3. Meddelsen bliver smidt ind i arrayet messages, hvor den har det godt indtil den bliver slettet.


	*/
	function new_message(event, target) {
		let msg = {}

		/*
		msg indeholder vigtist af alt: action.event og action.data, 
		som fortæller klienten hvad der skal sendes tilbage til serveren, 
		hvis accept knappen trykkes.
		*/
		
		if (event == 'request_invitation') {
			msg.title = `${target}, vil gerne joine din lobby`
			msg.action = {
				event: 'invite',
				data: target
			}
		}
		else if (event == 'game_invite') {
			msg.title = `${target}, har inviteret dig til en lobby`
			msg.action = {
				event: 'join_lobby',
				data: target
			}
		}
		else if (event == 'locked') {
			msg.title = (target) ? 'Ejeren har låst dit hold':'Ejeren har låst op for valg af hold'
		}
		else if (event == 'kicked') {
			msg.title = 'Ejeren kickede dig :('
		}
		else if (event == 'turn') {
			msg.title = 'Det er din tur'
		}
		else if (event == 'beam') {
			msg.title = target + ' på stribe!'
		}

		msg._id = ++notif_count // Id'et bruges til at finde beskeden i arrayet, når den skal slettes.
		messages = [...messages, msg]

		// Fjerner notifikationen efter 10 sekunder.
		setTimeout(() => {
			remove_notif(msg._id)
		}, 10000)
	}

	// Funktionen som bliver kaldt når der trykkes på accept knappen.
	function accept(event, data, id) {
		socket.emit(event, data)
		remove_notif(id)
	}

	// Funktionen søger arrayet igennem, og fjerner det element som matcher.
	function remove_notif(id) {
		for (let i in messages) {
			if (messages[i]._id == id) {
				messages.splice(i, 1)
			}
		}
		messages = messages
	}

	// Her fra er der en masse events fra serveren, som bliver delvist oversat til notifikationer.
	socket.on('invite_from', user => {
		new_message('game_invite', user)
	})
	
	socket.on('request_join', user => {
		new_message('request_invitation', user)
	})

	socket.on('turn', turn => {
		// Fjerner først alle notifikationer som har titlen: "Det er din tur"
		for (let i in messages) {
			if (messages[i].title == 'Det er din tur') {
				remove_notif(messages[i]._id)
			}
		}

		// Hvis det er spillerens tur, oprettes der en ny notifikation.
		if (turn == $me) {
			new_message('turn')
		}

	})

	// En event når der er 5 eller 10 på stribe.
	socket.on('beam', length => new_message('beam', length))
	
	// Når en spiller i en lobby bliver låst.
	socket.on('locked', state => {
		new_message('locked', state)
	})

	// Hvis en spiller bliver smidt ud.
	socket.on('got_kicked', () => {
		new_message('kicked')
	})



</script>

<div class="notifications">
	<div>
		{#each messages as msg}
		<div transition:fly="{{ x: 200, duration: 300 }}" class="msg">
			<p class="title"> { msg.title } </p>
			
			<div class="buttons" style={ msg.action ? 'grid-template-columns: 2fr 1fr;':'grid-template-columns: 1fr;' }>
				{#if msg.action}
					<button on:click={ accept(msg.action.event, msg.action.data, msg._id) }> Acceptér </button>
				{/if}
				<button on:click={ remove_notif(msg._id) }> { msg.action ? 'Afvis':'Ok' } </button>
				</div>
			</div>
		{/each}
	</div>

</div>


<style lang="scss">
	.notifications {
		position: absolute;
		
		width: 300px;
		right: 0;
		bottom: 15px;
		z-index: 4;
	}

	.msg {
		z-index: 4;
		color: white;
		background: #262625;
		padding: 1rem;
		margin: 1rem;
		border-radius: 5px;
		align-self: end;

		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);

		.title {
			margin: 5px 5px;
		}

		.buttons {
			display: grid;

			button {
				font-size: .8rem;
				color: #fff;
				border: 1px solid #404240;
				border-radius: 5px;
				background: #1a1a1a;
				margin: 5px;
				padding: .3rem;

				transition: background .3s;

				&:hover {
					cursor: pointer;
					background: #2e2e2e;
				}
			}
		}
	}
</style>