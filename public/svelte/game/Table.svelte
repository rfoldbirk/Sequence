<script>
	//importere fly animation fra svelte transition
	import { fly } from 'svelte/transition'
	//importere selected_card, show_hand, players & me fra stores, så de også kan bruges i dette dokument
	import { selected_card, show_hand, players, me } from '../stores'
	//importere filen ListPlayers
	import ListPlayers from './ListPlayers.svelte';
	//objet til opstillingen af teams
	let teams = {
		top: [],
		right: [],
		bottom: [],
		left: []
	}

	//variable til at holde styr på hvis tur det er
	let which_turn
	
	//variable til at vælge hvor meget et team skal roteres
	let amount_of_rotation = 90

	//boolean til at styre hvornår table skal vises
	let visible = true
	// setTimeout(() => visible = true, 500)

	//array til at holde Board information - bliver ændret til et objekt når hjemmesiden kører
	let cards_unmodified = []

	//array til at holde kortene
	let cards = []

	//fuction som bliver kaldt når der bliver kliket på et kort og modtager card_id, på det kort man trykkede på
	const click_on_card = card_id => {
		//variable til at holde en streng af card_id/10
		let coordinat = String(card_id/10)
		
		/*Laver et array ud fra coordinat strengen, hvis coordinat indeholder et punktum som fx 21/10 = 2.1
		så bliver strengen splittet op i 2 så arrayet bliver til [2, 1], hvis strengen derimod ikke indeholder et punktum
		så bliver arrayet til [coordinat, 0]*/
		let yx = (coordinat.includes('.')) ? coordinat.split('.'):[coordinat, 0]
		
		//henter kortet fra objektet cards_unmodified udfra xy arrayet
		let card = cards_unmodified[yx[0]][yx[1]]

		//sender en besked til serveren om at den skal bruge kortet på denne position
		socket.emit('use_card', yx)
		// $show_hand = false
		$selected_card = ''
	}
	//lytter efter beskeden "layout"
	socket.on('layout', layout => {
		//hvis den ikke modtager et layout stopper funktionen
		if (!layout) return

		//sætter teams til det modtaget layout
		teams = layout
	})

	//funktion der bliver kaldt når en/et spiller/hold vinder spillet
	function winner() {
		//finder lyden i DOM-elementet og afspiller den
		document.querySelectorAll("audio")[2].play()

		//opretter et image-element
		var wingif = document.createElement("img");
		
		//sætter kilden til billedet til at være vores winner gif
		wingif.src = "/images/confetti.gif"
		
		//sætter en alt information
		wingif.alt = "confetti"
		
		//sætter css position til absolute
		wingif.style.position = "absolute";
		
		//sætter css height til 100%
		wingif.style.height = "100%";

		//sætter css width til 100%
		wingif.style.width = "100%";

		//sætter css top til 0, så den sidder i toppen
		wingif.style.top = "0";

		//tilføjer vinder-animationen til hjemmesiden
		document.body.append(wingif)

		//en timeout funktion der fjerner vinder-animation efter 10 sekunder
		setTimeout(function() {
			wingif.remove();
		}, 10000);
	}

	//lytter efter beskeden "winner"
	socket.on('winner', color => {
		//if-statement som tjekker om color indeholder en "|", hvis den gør dette er spillet uafgjort
		if(color.includes("|")){
			//spiller lyden til når spillet af tabt
			document.querySelectorAll("audio")[1].play()
		}
		//for-loop af players
		$players.forEach(player => {
			//if-statement som tjekker om man har vundet eller ej
			if(player.username == $me && player.gameData.teamColor == color){
				//hvis player.username er det samme som me, så er det den rigtige "player" vi har fat i
				//og hvis spillerens farve er den samme som winner farven, så bliver "winner" funktionen kaldt
				winner()
			}else{
				//ellers bliver taber-lyden afspillet
				document.querySelectorAll("audio")[1].play()
			}
		})
	})
	//lytter efter beskeden "turn"
	socket.on('turn', turn => {
		//når den modtager beskeden sætter den which_turn til turn
		which_turn = turn
	})

	//lytter efter beskeden "board"
	socket.on('board', board => {
		//finder lyden til når man placere en brik, fra DOM-elementet
		//og sætter currentTime til 0
		document.querySelector("audio").currentTime = 0;
		
		//og afspiller lyden
		document.querySelector("audio").play();

		//nulstiller cards arrayet til defualt
		cards = []
		
		//for-loop der kører igennem board-objektet
		for (var i = 0; i < Object.keys(board).length; i++) {
			//tilføjer alle kortene til cards arrayet
			board[i].forEach(card => cards.push(card))
		}

		//sætter cards_unmodified til board
		cards_unmodified = board

		//sætter cards til cards
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
<!-- tilføjer lydene til hjemmesiden -->
<audio id="moveSound" class="audio" controls>
	<source src="/sounds/move.mp3" type="audio/mpeg"/>
	Your browser does not support the audio tag.
</audio>
<audio id="lostSound" class="audio" controls>
	<source src="/sounds/lost.mp3" type="audio/mpeg"/>
	Your browser does not support the audio tag.
</audio>
<audio id="winnerSound" class="audio" controls>
	<source src="/sounds/winner.wav" type="audio/mpeg"/>
	Your browser does not support the audio tag.
</audio>

<!-- dette svelte-html indeholder selve spillepladen og spillerne omkring -->
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

.audio {
	display: none;
	position: absolute;
	height: 0px;
	width: 0px;
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