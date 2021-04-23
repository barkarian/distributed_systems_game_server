<script>
import {onMount,onDestroy} from "svelte";
import {curGame} from '../stores/store.js';
import {user} from '../stores/store.js';
import {moveDetails,fen} from '../stores/store.js';
import Chessboard from "../utils/chess/chessboard.svelte"
let myturn=true;
let opponent;
let playingFirst;//Boolean
//REQUESTS
const getMatch = async ()=>{
        try {
            const response=await fetch("http://localhost:5002/game/get-match-data",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify({match_id:$curGame})
            })
            const parseRes=await response.json()
            //THROW ERRORS
            //Middleware sends (200 ok status or 401 if error happen after middleware ) with a JSON error string inside
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            //get match details
            playingFirst=$user.user_email==parseRes.player1_email;
            $user.user_email==parseRes.player1_email?opponent=parseRes.player2_email:opponent=parseRes.player1_email;
            //set new current potition
            $fen=parseRes.fen;
            //set new turn
            if(parseRes.cur_player==$user.user_email){
                myturn=true
            }else{
                myturn=false
            }
        }catch(err){
                displayError=err
        }
    }

const makeMove = async ()=>{
        try {
            //PARSE RESPONSE
            const response=await fetch("http://localhost:5002/game/make-move",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify({match_id:$curGame,move:$moveDetails,fen:$fen})
            })
            const parseRes=await response.json()
            //THROW ERRORS
            //Middleware sends (200 ok status or 401 if error happen after middleware ) with a JSON error string inside
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            //set new myturn
            myturn=false
            //set new current potition
            $fen=parseRes.fen;
        }catch(err){
            displayError=err
        }
    }

const getMyTurn = async ()=>{
        try {
            //parse response
            const response=await fetch("http://localhost:5002/game/my-turn",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify({match_id:$curGame})
            })
            const parseRes=await response.json()
            //THROW ERRORS
            //Middleware sends (200 ok status or 401 if error happen after middleware ) with a JSON error string inside
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            if(parseRes.success){
                //set turn
                myturn=true
                //set fen
                $fen=parseRes.match.fen;
            }
        }catch(err){
                displayError=err
        }
    }
//LIFECYCLES   
onMount(async()=>{
    await getMatch();
})

onDestroy(async() =>{ 
    $curGame="";
    clearInterval(interval_ID);
    });

//REACTIVITY
let interval_ID;
$:if(myturn==false){
    interval_ID=setInterval(() => getMyTurn(), 1000)
}else if(myturn==true){
    clearInterval(interval_ID);
}

$:if($moveDetails!=''){
    //console.log("inside move details")
    makeMove();
}
</script>


<h1>match_id is:{$curGame}</h1>
{#if myturn==true}
<h1>You're turn</h1>
{:else}
<h1>{opponent}'s turn</h1>
{/if}
<Chessboard playingFirst={playingFirst} fen={$fen} myturn={myturn}></Chessboard>