<script>
	//importere fly animation fra svelte transition
	import { fly } from 'svelte/transition'

	//importere selected_card & show_hand, så de også kan bruges i dette dokument
	import { selected_card, show_hand } from '../stores';
	
	//henter full_width fra app.swelte, det er en boolean, hvis den er true er sidebar fremme
	export let full_width
	
	//boolean til at tjekke om man har haft holdt musen over ens egne kort
	let has_hovered = false

	//boolean til at vælge om hintet til at vise hvordan man ligger en polette skal vises eller ej
	let show_howto = false

	//hvis man ikke holder musen over ens egne kort inden for 2 sekunder, bliver de gemt væk
	setTimeout(() => {
		if (!has_hovered)
			$show_hand = false
	}, 2000);

	//array til at holde de kort man modtager fra serveren
	let cards = []

	//funktion som bliver kaldt hvis man klikker på en af ens egne kort
	const use_special = card => {
		//show_howto bliver sat til true, og det bliver vist et hint til hvordan man ligger en polette på pladen
		show_howto = true
	}

	//funktion som gemmer ens egne kort væk når den bliver kaldt
	const hide = () => {
		$selected_card = ''
		$show_hand = !$show_hand
	}

	//lytter efter beskeden "hand"
	socket.on('hand', hand => {
		//når clienten modtager "hand" fra serveren bliver cards sat til de kort der blev modtaget i hand
		cards = hand
	})

	//lytter efter beskeden disconnect
	socket.on('disconnect', () => {
		//sætter cards array til at være tom igen
		cards = []

		//selected_cards bliver sat til en tom streng
		$selected_card = ''

		//show_hand bliver sat til false for at gemme html'en til cards væk
		$show_hand = false
	})

	//lytter efter beskeden "turn"
	socket.on('turn', who => {
		//hvis who er det samme username som klienten's, blicer show_hand sat til true, så klienter kan se sine kort
		if (who == localStorage.getItem('username'))
			$show_hand = true
	})

</script>

<!-- dette svelte-html indeholder selve klientens kort, en knap til at trække et nyt kort og til at springe en tur over -->
<img on:click={ () =>  socket.emit('draw_card') } class="extraCard" src="/cards/cardBack.svg">
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
			<img transition:fly={{x:-1400, y: -1000, duration:  800 }} on:mouseenter={ () => { has_hovered = true; $selected_card = card; } } on:click={ ()=>use_special(card) } src="/cards/{card}.svg" alt={card}>
		{/each}
	</div>
	{#if cards.length > 0}
		<button on:click={ () => socket.emit('pass') } class="skipTurn">Spring din tur over</button>
	{/if}
</div>


<svelte:body bind:clientWidth="" />


<style lang="scss">
	.skipTurn {
		border: 1px solid black;
	    padding: 8px 15px;
	    border-radius: 5px;
	    background: #c72f2f;
	    color: #fff;
	    font-size: 1rem;
	    position: absolute;
	    left: 0;
	    bottom: 28%;
	}
	.extraCard {
	    position: absolute;
	    height: 9%;
	    transform: rotate(90deg);
	    right: 0;
	    top: 4%;
	}
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