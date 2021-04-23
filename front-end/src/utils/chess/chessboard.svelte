<script>
    //if i use code splitting
    //this code needs cm-chessboard and the chess
    //also add /assets/images
    import {onMount,onDestroy,beforeUpdate,afterUpdate} from 'svelte';
    import {Chessboard,COLOR,INPUT_EVENT_TYPE} from "/node_modules/cm-chessboard/src/cm-chessboard/Chessboard.js"
	import {Chess} from "chess.js";
    import {moveDetails,fen as fenIO} from '../../stores/store.js';
    //props
    export let playingFirst;
    export let fen;
    export let myturn = true;
    //chess
    let chess;
    let inCheck;
    let inCheckmate;
    //variables;
    let board_container;
    let chessboard;
    let game_state;

    const initializeChessboard=()=>{
        const child = document.createElement('div');
		child.id = 'board1';
        child.style="width: 400px"
		board_container.appendChild(child);
        chessboard= new Chessboard(document.getElementById("board1"), {
                    position: "start",
                    sprite: {url: "/assets/images/chessboard-sprite-staunty.svg"},
                    orientation: COLOR.white,
        })
    }

    
    function inputHandler(event) {
        //console.log("event", event)
        if (event.type === INPUT_EVENT_TYPE.moveDone) {
            const move = {from: event.squareFrom, to: event.squareTo}
            const result = chess.move(move)
            if (result && myturn) {
                //event.chessboard.disableMoveInput() //disable UI
                //event.chessboard.setPosition(chess.fen())
                $moveDetails=move;//this triggers and send the move of the parent
                $fenIO=chess.fen();
            }else if(!myturn){
                event.chessboard.disableMoveInput()
            }else {
                console.warn("invalid move", move)
            }
            return result
        } else {
            return true
        }
    }


    //LIFECYCLES
    onDestroy(async() =>{ 
        await chessboard.destroy();
        $fenIO='';
        $moveDetails='';

    });

    afterUpdate(async()=>{
        //console.log(fen)
        chess = new Chess(fen);
        chessboard.setPosition(chess.fen())
        inCheck=chess.in_check();
        inCheckmate=chess.in_checkmate();
        if(playingFirst===false){
        chessboard.setOrientation(COLOR.black);
        }
        if(myturn){
            if(chess.in_checkmate()==true){
                game_state="Game is finished :you lost 🥺"
            }else if(chess.in_stalemate()==true){
                game_state="Game is finished :It's a tie 👔"
            }else{
                game_state="Game in Progress 🔥";
            }
            chessboard.enableMoveInput(inputHandler);
        }else{
            if(chess.in_checkmate()==true){
                game_state="Game is finished :you Win 😎"
            }else if(chess.in_stalemate()==true){
                console.log(chess.in_stalemate())
                game_state="Game is finished :It's a tie 👔"
            }else{
                game_state="Game in Progress 🔥";
            }
            chessboard.disableMoveInput(inputHandler);
        }
    })
    
    onMount(async()=>{
        // chess = new Chess();
        // chess.reset();
        initializeChessboard();
    })
  
</script>

<p>In check:{inCheck}</p>
<p>In checkmate:{inCheckmate}</p>
<p>{game_state}</p>
<div bind:this={board_container}/>