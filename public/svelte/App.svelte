<script>
	// Her importerer vi alle de komponenter vi skal bruge.
	import Login from './Login.svelte'
	import Notifications from './Notifications.svelte'
	import Sidebar from './sidebar/Sidebar.svelte'

	import Cards from './game/Cards.svelte'
	import Table from './game/Table.svelte'

	// Variablen som bestemmer om sidebaren skal vises.
	let sidebar_visible = true

	// En lille funktion som slår sidebaren til og fra.
	function toggle_sidebar() {
		sidebar_visible = !sidebar_visible
	}
	
</script>

<!-- Her samles alle komponenterne sammen til en! -->

<!-- Overlays - Elementer som ligger øverst -->
<Login/>
<Notifications/>
<Cards full_width={ !sidebar_visible }/>

<!-- Viser kun sidebaren hvis den skal vises. -->
{#if sidebar_visible}
	<Sidebar/>
{/if}



<!-- Afhængigt af om sidebaren skal være synlig ændres mængden af plads, som table kan bruge -->
<div style="{ sidebar_visible ? 'grid-template-columns: 300px 25px 1fr;':'grid-template-columns: 0px 25px 1fr;' }">
	<div></div>
	<div on:click={toggle_sidebar} class="hide"></div>
	<Table/>
</div>


<style lang="scss">

	.hide {
		display: grid;
		// background: white;
		justify-content: center;
		align-content: center;
		width: 25px;

		&:hover {
			cursor: pointer;
		}
	}
	
	div {
		display: grid;
		width: 100vw;
		height: 100vh;
	}
	
</style>