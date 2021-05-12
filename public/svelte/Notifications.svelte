<script>
	import { fly } from 'svelte/transition'

	let messages = []
	let notif_count = 0

	function new_message(event, target) {
		let msg = {}
		
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

		msg._id = ++notif_count
		messages = [...messages, msg]

		// Skal fjernes ----------------------------------
		// accept(msg.action.event, msg.action.data, msg._id)
		// -----------------------------------------------

		setTimeout(() => {
			remove_notif(msg._id)
		}, 10000)
	}


	function accept(event, data, id) {
		socket.emit(event, data)
		remove_notif(id)
	}

	function remove_notif(id) {
		for (let i in messages) {
			if (messages[i]._id == id) {
				messages.splice(i, 1)
			}
		}
		messages = messages
	}


	socket.on('invite_from', user => {
		new_message('game_invite', user)
	})
	
	socket.on('request_join', user => {
		new_message('request_invitation', user)
	})
	
	socket.on('locked', state => {
		new_message('locked', state)
	})

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
	}

	.msg {
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