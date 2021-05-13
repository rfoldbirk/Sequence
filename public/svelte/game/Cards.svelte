<script>

	export let full_width

	let cards = ['c4', 'c1', 'c5', 'c6', 'd7', 'd13']

	$: {
		console.log(full_width)
	}

</script>


<div class="CardChooser" style="{ (full_width) ? 'left: 0':'left: 300px' }">
	<div class="CardHolder">
		{#each cards as card}
			<img src="/cards/{card}.svg" alt={card}>
		{/each}
	</div>
</div>



<style lang="scss">
	.CardChooser {
		position: absolute;
		bottom: 0;
		right: 0;

		z-index: 1;

		display: grid;
		place-items: center;

		
		.CardHolder {
			display: inline;
			margin-bottom: 60px;
			height: 250px;

			img {
				box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.25);
				height: 100%;
				padding: 5px;
				margin-left: -50px;
				margin-right: -50px;

				transition: height .3s;

				&:hover {
					height: 105%;
					cursor: pointer;
				}
			}
		}
	}
</style>