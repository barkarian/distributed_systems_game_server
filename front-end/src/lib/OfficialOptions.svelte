<script>
    import {onMount} from "svelte";
    import {user} from '../stores/store.js';
    let users=[] //display and choose users
    let message=""
    //User Inputs
    let tourn_users=[] //choses users
    let tournament_name=""
    let tournament_type=""

    const createTournament = async ()=>{
        try {
            const response=await fetch("http://localhost:5001/official/create-tournament",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify({tourn_users,tournament_name,
                                    tournament_type})
            })
            const parseRes=await response.json()
            message=parseRes
        }catch(err){
            console.log(err)
        }
    }
    const getAllPlayers = async ()=>{
        try {
            //const user_data=
            const response=await fetch("http://localhost:5001/official/get-all-players",{
                method:"GET",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
            })
            const parseRes=await response.json()
            //console.log(parseRes.allIndividualMatches)
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            //console.log(parseRes)
            users=parseRes.sort()
            //console.log(users)
        }catch(err){
            console.log(err)
        }
    }
    const handleClick = ()=>{
        //format tourn_users to be ready for request
        for(let i=0;i<tourn_users.length;i++){
            tourn_users[i].type="user"
        }
        //console.log("hgrasgdas")
        //console.log({tournament_name,tournament_type})
        createTournament()
    }
onMount(async()=>getAllPlayers())
</script>

<h2>Official Table</h2>
{#if message!=""}
    <p>Message:{message}</p>
{/if}
<ul>
    {#each users as us (us.user_id)}
        <li>
        {us.user_email}
        <input type=checkbox bind:group={tourn_users} value={us}>
        </li>    
    {/each}
</ul>
<input bind:value={tournament_name} placeholder="enter tournament name here">
<label>
    <input type=radio bind:group={tournament_type} value={"chess"}>Chess
<input type=radio bind:group={tournament_type} value={"tic-tac-toe"}>Tic Tac Toe
</label>
<button on:click|preventDefault={handleClick}>Create tournament with those  players</button>