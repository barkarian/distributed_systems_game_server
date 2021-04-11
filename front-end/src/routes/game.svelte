<script>
import {onMount} from "svelte";
import {curGame} from '../stores/store.js';
import {user} from '../stores/store.js';
let myturn=true;
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
            // console.log($user.user_email)
            if(parseRes.cur_player==$user.user_email){
                myturn=true
            }else{
                myturn=false
            }
            console.log(parseRes)
        }catch(err){
                displayError=err
        }
    }

const makeMove = async ()=>{
        try {
            //parse response
            const response=await fetch("http://localhost:5002/game/make-move",{
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
            myturn=false
            console.log(parseRes)
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
                myturn=true
            }
            //console.log(parseRes)
        }catch(err){
                displayError=err
        }
    }
    
let interval_ID
onMount(async()=>getMatch())
$:if(myturn==false){
    interval_ID=setInterval(() => getMyTurn(), 1000)
}else if(myturn==true){
    clearInterval(interval_ID);
}
</script>


<h1>match_id is:{$curGame}</h1>
<h1>My turn:{myturn}</h1>
{#if myturn==true}
<button on:click|preventDefault={makeMove}>make move</button>
{/if}