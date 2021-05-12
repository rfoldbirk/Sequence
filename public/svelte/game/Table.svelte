<script>
	import { fly } from 'svelte/transition'

	let teams = {
		top: ['Rasmus'],
		right: ['Rasmus', 'Rasmus'],
		bottom: ['Rasmus', 'Rasmus', 'Rasmus'],
		left: ['Rasmus', 'Rasmus', 'Rasmus', 'Rasmus']
	}

	let which_turn
	
	let amount_of_rotation = 90

	let visible = false
	setTimeout(() => visible = true, 500)

	let cards = ['buffer', 'c7', 'c8', 'h1', 'd3', 'd13', 's12']

	socket.on('layout', layout => {
		teams = layout
	})

	socket.on('turn', turn => {
		which_turn = turn
	})

	socket.on('start:response', data => {
		console.log('-- START RESPONSE --')
		console.log(data)
	})
</script>


{#if visible}
<div transition:fly="{{ y: 200, duration: 300 }}" class="table-area">
	<div class="middle" style="align-items: end;">
		<div></div>
		<div class="top top-bottom" style="grid-template-columns: repeat({teams.top.length}, 1fr);">
			{#each teams.top as player}
				<p class='player'> { player } </p>
			{/each}
		</div>
		<div></div>
	</div>
	<div class="middle">
		<div class="left grid" style="grid-template-rows: repeat({teams.left.length}, 1fr);">
			{#each teams.left as player}
				<p style="transform: rotate(-{ amount_of_rotation }deg);" class='player'> { player } </p>
			{/each}
		</div>
		<div class="table">
			{#each cards as card}
				<div>
					<img src="cards/{card}.svg" alt="{card}">
					<div class="token"></div>
				</div>
			{/each}
		</div>
		<div class="right grid" style="grid-template-rows: repeat({teams.right.length}, 1fr);">
			{#each teams.right as player}
				<p style="transform: rotate({ amount_of_rotation }deg);" class='player'> { player } </p>
			{/each}
		</div>
	</div>
	<div class="middle" style="align-items: start;">
		<div></div>
		<div class="bottom top-bottom" style="grid-template-columns: repeat({teams.bottom.length}, 1fr);">
			{#each teams.bottom as player}
				<p class='player'> { player } </p>
			{/each}
		</div>
		<div></div>
	</div>
</div>
{/if}


<style lang="scss">
	:root {
		--table-width: 230px;
	}
	@import "./responsive_layout";

	.player {
		color: #fff;
		border-radius: 5px;
		padding: .5rem;

		#blue {
			background: #144aca;
		}

		#red {
			background: #c72f2f;
		}

		#green {
			background: #268426;;
		}
	}

	.grid {
		display: grid;
		justify-items: center;
		align-items: center;
	}
	
	.table-area {
		display: grid;
		grid-template-rows: 1fr var(--table-width) 1fr
	}
	
	.table {
		background: rgb(39, 61, 47);
		width: 100%;
		height: 100%;
		
		display: grid;
		grid-template-rows: repeat(11, 1fr);
		grid-template-columns: repeat(11, 1fr);

		div { 
			display: grid;
			img {
				justify-self: center;
				align-self: center;
				transform: rotate(90deg);
				height: calc(var(--table-width) / 11);
			}
			.token {
				background-color: green;
				position: absolute;
				justify-self: center;
				align-self: center;
				border-radius: 40px;
				width: 25px;
				height: 25px;
			}
		}

	}
	
	.middle {
		display: grid;
		grid-template-columns: 1fr calc(var(--table-width) * 1.4) 1fr;
	}
	
	.top-bottom {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
	}
	
	.left {
		justify-content: end;
		padding-right: 18px
	}
	
	.right {
		justify-content: start;
		padding-left: 18px;
	}
	
	.top-bottom {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		justify-items: center;
	}
</style>