<script>
    import {isAuthenticated,user} from '../stores/store.js';
    import {goto} from "$app/navigation"
    import AdminOptions from '$lib/AdminOptions.svelte';
    const handleClick = ()=>{
        user.set({})
        isAuthenticated.set(false)
        localStorage.removeItem("token")
        localStorage.removeItem("user_data")
        goto("/")
    }
</script>

<p>Hello {$user.user_name} !!!</p>
<button on:click|preventDefault={handleClick}>Log out</button>
<AdminOptions/>