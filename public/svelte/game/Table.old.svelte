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

	let cards = ['buffer', 'c7', 'c8', 'h1', 'd3', 'd13', 's12', 'd3', 'd13', 'buffer']

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

	let innerWidth
	let innerHeight
	let cardHolder

	$: {
		let a = innerHeight + innerWidth

		if (cardHolder) {
			let height = window.getComputedStyle(cardHolder).height.split('px')[0]
			console.log(Number(height))

			let children = cardHolder.querySelectorAll('div')

			for (let child of children) {
				let svg = child.querySelector('img')
				svg.style.height = height/10 + 'px'
			}

			// var r = document.querySelector(':root');
			// r.style.setProperty('--card-height', `${height/10}px`)
		}
	}

	

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
			<div bind:this={cardHolder} class="cardHolder">
				
				{#each cards as card}
					<div>
						<img src="cards/{card}.svg" alt="{card}">
						<!-- <div class="token"></div> -->
					</div>
				{/each}
			</div>

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

<svelte:window bind:innerWidth={innerWidth} bind:innerHeight={innerHeight} />


<style lang="scss">
	:root {
		--table-width: 230px;
		--card-height: 20px;
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
		// background: rgb(39, 61, 47);
		background-image: url('/plade.svg');
		background-repeat: no-repeat;
		width: 100%;
		height: 100%;

		padding: calc(var(--table-width)/1.4 / 10) calc(var(--table-width) / 10);
		


		.cardHolder {
			display: grid;
			grid-template-rows: repeat(10, 1fr);
			grid-template-columns: repeat(10, 1fr);

			width: 100%;
			height: 100%;

			background: red;
			div { 
				display: grid;
				img {
					justify-self: center;
					align-self: center;
					transform: rotate(90deg);
					height: 20px;//calc(var(--card-height));
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