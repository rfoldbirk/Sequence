<script>
	import { players } from '../stores'
	export let team
	export let rotation = 0
</script>


{#each team as player}
	{#each $players as { username, gameData }}
		{#if player == username}
			<p id="{ player == username ? gameData.teamColor:'' }" class='player' style="transform: rotate({ rotation }deg);" > { player } </p>
		{/if}
	{/each}
{/each}



<style lang="scss">
	.player {
		color: #fff;
		border-radius: 5px;
		padding: .5rem;

	}
	
	
	#blue {
		background: #144aca;
	}

	#red {
		background: #c72f2f;
	}

	#green {
		background: #268426;;
	}
</style>