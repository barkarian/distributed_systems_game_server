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
    let orientation;
    //chess
    let chess;
    //variables;
    let board_container;
    let chessboard;
    let game_state="in Progress";

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
                event.chessboard.setPosition(chess.fen())
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
        if(myturn){
            chessboard.enableMoveInput(inputHandler);
        }else{
            chessboard.disableMoveInput(inputHandler);
        }
    })
    
    onMount(async()=>{
        // chess = new Chess();
        // chess.reset();
        initializeChessboard();
    })

    $:if(playingFirst===false){
        chessboard.setOrientation(COLOR.black);
    }
</script>

<h1>State of game is :{game_state}</h1>
<h1>{playingFirst}</h1>
<div bind:this={board_container}/>