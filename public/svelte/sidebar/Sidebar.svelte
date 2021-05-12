<script>
	import { onMount } from 'svelte'
	import { fly } from 'svelte/transition'
	import Contextmenu from './Contextmenu.svelte'
	import Lobby from './Lobby.svelte'

	let players = []

	onMount(() => {
		socket.emit('players?')
	})

	
	socket.on('list_players', _players => {
		players = _players
	})
</script>

<!-- Højrekliksmenu, den passer på sig selv -->
<Contextmenu/>

<div transition:fly="{{ x: -300, duration: 300 }}" class="sidebar">
	<h3> { players.length } Online </h3>

	<!-- Viser alle spillerne -->
	<div class="players">
		{#each players as { username, room_id }}
			{#if username == localStorage.getItem('username')}
				<p id='player_{username}' class="me"> <b>{ username }</b> <i>dig</i> </p>
			{:else}
				{#if room_id}
					<p id='player_{username}'> { username } <i>lobby</i></p>
				{:else}
					<p id='player_{username}'> { username }</p>
				{/if}
			{/if}
		{/each}
	</div>

	<Lobby/>
</div>


<style lang="scss">
	.sidebar {
		position: absolute;

		width: 300px;
		height: 100vh;

		background: #373735;

		h3 {
			color: white;
			font-size: 1.75rem;
			margin: 3rem;
		}

		// Layout
		display: grid;
		grid-template-rows: 7rem 1fr;
	}

	.players {
	
		overflow-y: auto;
		margin-left: 3rem;

		p {
			color: white;
			padding: .5rem;
			margin: .2rem;
			margin-right: 3rem;

			transition: background .2s;

			border-radius: 5px;

			&:hover {
				cursor: pointer;
				background: #1c1c1c;
			}

			i {
				font-style: normal;
				background: #4d4d4d;
				float: right;
				padding: 0 4px;
				border-radius: 5px;
			}
		}
	}

	.me * {
		color: #09e15d;
	}
	
	
</style>