<script>
import {onMount} from "svelte";
import {isAuthenticated,user as userState} from '../stores/store.js';
let runningGames=[]
const searchForRunningGames = async ()=>{
        try {
            //const user_data=
            const response=await fetch("http://localhost:5001/player/running-matches",{
                method:"GET",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
            })
            const parseRes=await response.json()
            //console.log(parseRes.allIndividualMatches)
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            localStorage.setItem("token",parseRes.token);
            runningGames=parseRes.allIndividualMatches
            console.log(runningGames)
            
        }catch(err){
            console.log(err)
        }
    }
onMount(async()=>searchForRunningGames())
</script>

<h1>Your Running Matches are</h1>
<ul>
    {#each runningGames as game (game.match_id)}
        <li current={game.match_id}>id:{game.match_id} player1:{game.player1_email} VS player2:{game.player2_email} 
        phases:{game.phases},phase:{game.phase},phase_id:{game.phases},endgame:{game.endgame}</li>
    {/each}
</ul>