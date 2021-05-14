<script>
	import { onMount } from 'svelte'
	import { fly } from 'svelte/transition'
	import { isOwner, players, in_progress } from '../stores'
	
	const me = () => { return localStorage.getItem('username') }


	socket.on('connect', () => $players = [] )

	onMount(() => {
		socket.emit('room_players?')
	})


	$: {
		if ($players.length > 0) {
			socket.emit('get_owner')
		}
	}

	
	const change_team = name => socket.emit('change_team', name)
	const leave = () => socket.emit('leave_room')
	const start_game = () => socket.emit('start')
	
	
	socket.on('room_owner', owner => {
		$isOwner = owner == me()
	})

	socket.on('leave_lobby', () => {
		$players = []
	})

	// socket.on('turn', () => $in_progress = true)


	socket.on('lobby_players', player_data => {
		let new_players = []
		for (let player of player_data) {
			if (player.username == me())
				new_players.unshift(player)
			else
				new_players.push(player)
		}

		$players = new_players
	})

</script>




{#if $players.length > 0}
	<div transition:fly="{{ y: 200, duration: 300 }}"  class="lobby {$players.length > 0 ? 'show':''}">
		<div class="controls" style={!$isOwner ? 'grid-template-columns: 1fr':''}>
			{#if $isOwner}
				<button on:click={ start_game } class="settings"> { $in_progress ? 'Genstart':'Start spil!' } </button>
			{/if}
			<div></div>
			<button on:click={ leave } class="remove"> { $isOwner ? 'Fjern':'Forlad' } rum </button>
		</div>

		<div class="info">
			<p>{ $players.length } / 12 spillere </p>
		</div>

		<div class="players">
			{#each $players as { username, gameData }}
				<p meta={gameData.teamLocked} id={ gameData.teamColor } on:click={ change_team(username) }> { username } </p>
			{/each}
		</div>
	</div>
{/if}




<style lang="scss">
	
	.lobby {
		background: #1c1c1c;
		box-shadow: -24px -4px 24px rgba(0, 0, 0, 0.25);

    	transition: height 0.5s;

		border-top-left-radius: 15px;
		border-top-right-radius: 15px;
	}

	.controls {
		display: grid;
		grid-template-columns: 1.6fr 13px 1fr;

		padding: 15px;

		button {
			color: white;
			height: 40px;
			font-size: 15px;
			font-weight: 700;
			border: none;
			border-radius: 11px;
			transition: background-color .2s, filter .2s;

			&:hover {
				cursor: pointer;
			}
		}

		.start {
			background: #268426;
			&:hover {
				background: #32a832;
			}
		}

		.settings {
			background: #353535;
			&:hover {
				background: #4d4d4d;
			}
		}

		.remove {
			background: #c72f2f;
			&:hover {
				background: #df4646;
			}
		}
	}

	.info {
		border-top: 1px solid #666565;
		width: 267px;
		margin: 0 auto;
		text-align: center;
		color: white;
		font-size: 1.1rem;
	}

	.players {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
		padding: 0 15px;
		height: 179px;
		overflow-y: auto;

		
		p {
			color: white;
			background: #373736;
			margin: .2rem;
			text-align: center;
			border-radius: 7px;
			padding: 5px;
			height: 30px;

			&:hover {
				cursor: pointer;
			}

			-moz-user-select: none; 
			-webkit-user-select: none; 
			-ms-user-select: none; 
			user-select: none;
			-o-user-select: none;
		}
	}

	#blue {
		background: #144aca;
	}

	#green {
		background: #268426;
	}

	#red {
		background: #c72f2f;
	}

	.show {
		height: 400px;
	}
	
	
</style>