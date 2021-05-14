<script>
	import { fly } from 'svelte/transition'
	import { selected_card, show_hand } from '../stores'
	import ListPlayers from './ListPlayers.svelte';

	let teams = {
		top: [],
		right: [],
		bottom: [],
		left: []
	}

	let which_turn
	
	let amount_of_rotation = 90

	let visible = true
	// setTimeout(() => visible = true, 500)

	let cards_unmodified = []
	let cards = []


	const click_on_card = card_id => {
		let coordinat = String(card_id/10)
		let yx = (coordinat.includes('.')) ? coordinat.split('.'):[coordinat, 0]
		let card = cards_unmodified[yx[0]][yx[1]]

		socket.emit('use_card', card, yx)
		// $show_hand = false
		$selected_card = ''
	}

	socket.on('layout', layout => {
		teams = layout
	})

	socket.on('turn', turn => {
		which_turn = turn
	})

	socket.on('board', board => {
		cards = []
		
		for (var i = 0; i < Object.keys(board).length; i++) {
			board[i].forEach(card => cards.push(card))
		}

		cards_unmodified = board
		
		cards = cards
	})

	socket.on('start:response', data => {
		console.log('-- START RESPONSE --')
		console.log(data)
	})

	let innerWidth
	let innerHeight
	let cardHolder



	

</script>


{#if visible}
<div transition:fly="{{ y: 200, duration: 300 }}" class="table-area">
	<div class="middle" style="align-items: end;">
		<div></div>
		<div class="top top-bottom" style="grid-template-columns: repeat({teams.top.length}, 1fr);">
			<ListPlayers team={ teams.top }/>
		</div>
		<div></div>
	</div>
	<div class="middle">
		<div class="left grid" style="grid-template-rows: repeat({teams.left.length}, 1fr);">
			<ListPlayers team={ teams.left } rotation={ -amount_of_rotation }/>
		</div>
		<div class="table">
			<div class="cardHolder">
				{#each cards as { card, token }, index}
				<div on:click={ () => click_on_card(index) } id="{ $selected_card == card ? 'selectable':'hoverable'}" style="background-image: url('/cards/{card}.svg')">
					{#if token && token != 'black'}
						<img class="token" src="/images/token{token[0].toUpperCase() + token.slice(1) }.svg" alt="{card}">
					{/if}
				</div>
				{/each}
			</div>

		</div>
		<div class="right grid" style="grid-template-rows: repeat({teams.right.length}, 1fr);">
			<ListPlayers team={ teams.right } rotation={ amount_of_rotation }/>
		</div>
	</div>
	<div class="middle" style="align-items: start;">
		<div></div>
		<div class="bottom top-bottom" style="grid-template-columns: repeat({teams.bottom.length}, 1fr);">
			<ListPlayers team={ teams.bottom }/>
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
		background-image: url('/images/plade.svg');
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

			#hoverable {
				&:hover {
					cursor: pointer;
					margin: -10px -14px;
					z-index: 1;
				}
			}

			#selectable {
				box-shadow: 0px 0 39px 23px #000;//#c1b824;
				// border: 8px solid #000;
				border-radius: 5px;
				margin: -10px -14px;
				z-index: 1;

				&:hover {
					cursor: pointer;
				}
			}

			div {
				margin: 2px;
				display: flex;
				align-items: center;
				justify-content: center;
				background-repeat: no-repeat;
				background-position: center;
				background-size: contain;

				transition: box-shadow .3s, margin .3s;

				.token {
					width: 70%;
					height: 70%;
					box-shadow: 1px;
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