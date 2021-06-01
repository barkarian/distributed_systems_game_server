<script>
    import GameCard from "../lib/GameCard.svelte"
    let selected = 0;
    let matches=[]
    const searchForGames = async (selected)=>{
        try {
            var route
            selected==1? route="http://localhost:5001/player/get-tournaments-matches":route="http://localhost:5001/player/get-my-matches"
            const response=await fetch(route,{
                method:"GET",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
            })
            const parseRes=await response.json()
            //console.log(parseRes.allIndividualMatches)
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            matches=parseRes
            console.log(matches)
        }catch(err){
            console.log(err)
        }
    }
    $: if(selected!=0) {
        searchForGames(selected)
    }
</script>

<h1>Search Matches</h1>
<label>
	<input type=radio bind:group={selected} value={1}>
	Games of Tournaments I participated in
</label>

<label>
	<input type=radio bind:group={selected} value={2}>
	My own games results
</label>
<ul>
    {#each matches as match (match.game_id)}
    <li>
        {#if match.tournament_name}
            <b>{match.tournament_name}/</b>
        {/if}
        <b>{match.game_type}-></b> 
        {#if match.tournament_name}
            <b>phase:{match.phase} phases:{match.phases}/</b>
        {/if}
        <p>{match.player1_email} vs {match.player2_email} ={match.winner_email==null?"TIE":match.winner_email}</p> </li>  
    {/each}
</ul>
