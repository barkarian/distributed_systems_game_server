<script>
    import GameCard from "../lib/GameCard.svelte"
    let selected = 0;
    let playersScores=[]
    const searchForGames = async (game_type)=>{
        try {
            const response=await fetch("http://localhost:5001/player/get-players-scores",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify({game_type})
            })
            const parseRes=await response.json()
            //console.log(parseRes.allIndividualplayersScores)
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            playersScores=parseRes
            console.log(playersScores)
        }catch(err){
            console.log(err)
        }
    }
    $: if(selected!=0) {
        switch(selected) {
            case 1:
                searchForGames("chess")
                break;
            case 2:
                searchForGames("tic-tac-toe")
                break;
            default:
                // code block
        }
        searchForGames(selected)
    }
</script>

<h1>Score boards</h1>
<label>
	<input type=radio bind:group={selected} value={1}>
	chess
</label>

<label>
	<input type=radio bind:group={selected} value={2}>
	tic-tac-toe 
</label>
<ul>
    {#each playersScores as player (player.user_id)}
    <li><b>{player.user_email}</b>  = 
        {#if selected=="1"}
            {player.chess_score}
        {:else}
            {player.ttt_score}
        {/if}
    </li>  
    {/each}
</ul>
