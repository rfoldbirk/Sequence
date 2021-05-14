<script>
	import { fly } from 'svelte/transition'
	import { selected_card, show_hand } from '../stores';
	
	export let full_width
	
	let has_hovered = false
	let show_howto = false

	setTimeout(() => {
		if (!has_hovered)
			$show_hand = false
	}, 2000);

	let cards = []


	const use_special = card => {
		show_howto = true
	}

	const hide = () => {
		$selected_card = ''
		$show_hand = !$show_hand
	}

	socket.on('hand', hand => {
		cards = hand
	})

	socket.on('disconnect', () => {
		cards = []
		$selected_card = ''
		$show_hand = false
	})

	socket.on('turn', who => {
		if (who == localStorage.getItem('username'))
			$show_hand = true
	})

</script>


<div class="CardChooser" style="left: { full_width ? '0':'300px' }; height: { $show_hand ? '270px':'45px' } ">
	
	{#if show_howto}
	<div transition:fly={{ y: 200, duration: 300 }} class="overlay">
		<div class="howto">
			<p> Find kortet på pladen og tryk på det for at lægge en polet </p>
			<button on:click={ () => { show_howto = !show_howto; console.log(show_howto) } }> Forstået </button>
		</div>
	</div>
	{/if}
	
	{#if cards.length > 0}
		<button class="show_cards" on:click={hide}> { $show_hand ? 'Skjul':'Vis' } kort </button>
	{/if}

	<div on:mouseleave={ () => $selected_card = '' } class="CardHolder">
		{#each cards as card}
			<img transition:fly={{ x: 300, duration: 500 }} on:mouseenter={ () => { has_hovered = true; $selected_card = card; } } on:click={ ()=>use_special(card) } src="/cards/{card}.svg" alt={card}>
		{/each}
	</div>
</div>


<svelte:body bind:clientWidth="" />


<style lang="scss">
	.CardChooser {
		position: absolute;
		bottom: 0;
		right: 0;

		z-index: 1;

		display: grid;
		place-items: center;

		transition: height .3s;
		
		.overlay {
			position: fixed;
			display: grid;
			place-items: center;
			width: 300px;
			height: 100%;
			top: 0;
			
			.howto {
				width: 300px;
				height: 150px;

				background: #1c1c1c;
				box-shadow: 0px 0px 10px 5px rgba(0, 0, 0, 0.25);

				border-radius: 10px;
				display: grid;
				place-items: center;


				p {
					text-align: center;
					padding: 0 1rem;
					color: #fff;
					font-size: 1rem;
				}

				button {
					border: 1px solid black;
					padding: .5rem 1.5rem;
					border-radius: 5px;
					background: #c4c4c4;
					font-size: 1rem;
					color: black;

					transition: background .3s;

					&:hover {
						cursor: pointer;
						background: #6b6b6b;
					}
				}
			}
		}

		.show_cards {
			margin-bottom: 50px;
			border: 1px solid black;
			padding: 8px 15px;
			border-radius: 5px;
			background: #1b1c1c;
			color: #fff;
			font-size: 1rem;

			transition: background .3s;

			&:hover {
				cursor: pointer;
				background: #292b2b;
			}
		}

		.CardHolder {
			display: inline;
			margin-bottom: 60px;
			height: 200px;

			#spin {
				animation: spin infinite 20s linear;
			}

			img {
				position: relative;
				
				transform: rotate(90deg);


				
				// box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.25);
				height: 70%;
				margin-left: -75px;
				margin-right: -75px;

				transition: height .3s, margin .6s, box-shadow .3s;

				&:hover {
					margin: 0 30px;
					box-shadow: 0px 0 20px #c1b824;
					background: #ceac25;
					border-radius: 9px;
					// z-index: 2;
					cursor: pointer;
				}
			}
		}

		@keyframes spin {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}
	}
</style>