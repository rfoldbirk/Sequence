<script>
	import Login from './Login.svelte'
	import Notifications from './Notifications.svelte'
	import Sidebar from './sidebar/Sidebar.svelte'

	import Cards from './game/Cards.svelte'
	import Table from './game/Table.svelte'

	let sidebar_visible = true

	function toggle_sidebar() {
		sidebar_visible = !sidebar_visible
	}
	
</script>

<!-- Overlays -->
<Login/>
<Notifications/>
<Cards full_width={ !sidebar_visible }/>

{#if sidebar_visible}
	<Sidebar/>
{/if}

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