<script>
	import Nav from '$lib/Nav.svelte';
	import {isAuthenticated,user as userState} from '../stores/store.js';
	import {onMount} from "svelte";
	import {goto} from "$app/navigation"
	onMount(async()=>{
		if(localStorage.getItem("token")){
			const res =await fetch("http://localhost:5000/auth/is-verify",{
                method:"GET",
                headers:{
					"Content-Type":"application/json",
					"token":localStorage.getItem("token")}
            })

			const parseRes=await res.json()
			//console.log(parseRes)
			if(parseRes===true){
				//get from localStorage
				const user=JSON.parse(localStorage.getItem("user_data"))
				//console.log(user)
				userState.set(user)
				isAuthenticated.set(true)
				//console.log(localStorage.getItem("user_data"))
				goto("/profile")
			}else{
				//if user token is not Authorize 
				//Under normal use because of expiretion
				//Thats why redirect to login
				isAuthenticated.set(false)
            	userState.set({})
				localStorage.removeItem("token")
				localStorage.removeItem("user_data")
            	goto("/login")
			}
			//console.log(parseRes)
		}
	})
</script>

<Nav/>
<main>
	<slot></slot>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
</style>
