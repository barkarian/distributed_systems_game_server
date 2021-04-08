<script>
    import {isAuthenticated,user} from '../stores/store.js';
    import {goto} from "$app/navigation"
    import AdminOptions from '$lib/AdminOptions.svelte';
    import OfficialOptions from '$lib/OfficialOptions.svelte';
    let message="gag"
    const handleClick = ()=>{
        user.set({})
        isAuthenticated.set(false)
        localStorage.removeItem("token")
        localStorage.removeItem("user_data")
        goto("/")
    }
</script>

<h1>Profile Page</h1>
<!-- <p>{message}</p> -->
<p>Hello {$user.user_name} !!!</p>
<button on:click|preventDefault={handleClick}>Log out</button>
{#if $user.user_role_admin=="1"}
    <AdminOptions/>
{/if}

{#if $user.user_role_official=="1"}
    <OfficialOptions/>
{/if}