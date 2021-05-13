<script>
    import {onMount} from "svelte";
    import {user} from '../stores/store.js';
    let users=[] //display and choose users
    let my_tournaments=[]
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
            getMyTournaments();
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
            users=parseRes
            //console.log(users)
        }catch(err){
            console.log(err)
        }
    }

    const getMyTournaments = async ()=>{
        try {
            //const user_data=
            const response=await fetch("http://localhost:5001/official/my-tournaments",{
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
            my_tournaments=parseRes
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
onMount(async()=>{
    await getAllPlayers()
    await getMyTournaments()
    console.log(my_tournaments)
})
</script>

<h2>Official Table</h2>
<h3>Tournaments Created By You:</h3>
<ul>
    {#each my_tournaments as tourn (tourn.tournament_id)}
        <li>
        <p>name:{tourn.tournament_name} game_type:{tourn.game_type} total_players:{tourn.total_players}</p>  id:{tourn.tournament_id} 
        {#if tourn.finished=="0"}
            <p>In progress🔥</p>
        {:else}
            <p>Finished🛑</p>
        {/if}
        </li>    
    {/each}
</ul>

<h3>New Tournament Menu</h3>
{#if message!=""}
    <p>Tournament has been created.Tournament_id is:{message}</p>
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