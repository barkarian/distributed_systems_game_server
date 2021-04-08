<script>
    //let selected = "";
    let game_type=""
    let message=""
    const crateNewGame = async (game_type)=>{
        try {
            const response=await fetch("http://localhost:5001/player/new-game",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify({game_type})
            })
            const parseRes=await response.json()
            message=parseRes
        }catch(err){
            console.log(err)
        }
    }
    $: if(game_type!="") {
        crateNewGame(game_type)
    }
</script>

<h1>Create a new game</h1>
<label>
	<input type=radio bind:group={game_type} value={"chess"}>
	Chess Game
</label>

<label>
	<input type=radio bind:group={game_type} value={"tic-tac-toe"}>
	Tic Tac Toe Game
</label>
<p>{message}</p>