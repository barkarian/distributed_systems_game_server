<script>
  import Square from "./Square.svelte";
  import {moveDetails,fen as fenIO} from '../../stores/store.js';
  import {onMount,onDestroy,beforeUpdate,afterUpdate} from 'svelte';

  export let iAmX=true;
  export let myturn;
  export let squares;

  let winnerMsg = null;
  let winner="none";
  let xIsNext ;
  $: status = "Next Player: " + (xIsNext ? "X" : "0");


  function handleClick(i) {
    if(!myturn || winnerMsg){
      return;
    }
    if (!squares[i]) {
      squares[i] = xIsNext ? "X" : "0";
      xIsNext = !xIsNext;
      winnerMsg = calculateWinner(squares);
      console.log({msg:"everything works fine",winnerMsg})
    }
    $fenIO=JSON.stringify(squares);
    const move={
      player: xIsNext ? "X" : "0",
      from: "",
      to: `${i}`,
    }
    if(winnerMsg){
      switch(winnerMsg) {
      case "Winner: X":
        move.player="win"
        break;
      case "Winner: 0":
        //move.player=move.player+" win"
        move.player="win"
        console.log(iAmX)
        break;
      case "It's a draw":
        //move.player=move.player+" tie"
        move.player="tie"
        console.log("tie")
        break;
      default:
        // code block
      }
    }
    console.log(move);
    $moveDetails=move; //triggers the makemove function
    
  }

  function calculateWinner(squares) {
    const winningCombo = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (let i = 0; i < winningCombo.length; i++) {
      const [a, b, c] = winningCombo[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]){
        //winner =(iAmx && squares[a]=="X")?"you":"opponent"
        //console.log(`Winner: ${squares[a]}`)
        return `Winner: ${squares[a]}`;
      }
    }

    const isDraw = squares.every(square => square !== null);
    //winner=isDraw?"tie":"none";
    return isDraw ? "It's a draw" : null;
  }

  
  $:if((iAmX && myturn==true)||(!iAmX && myturn==false)){
    xIsNext=true
  }else{
    xIsNext=false
  }

  // $:if(winnerMsg){
  //   switch(winnerMsg) {
  //   case "Winner: X":
  //     console.log(iAmX)
  //     break;
  //   case "Winner: O":
  //     console.log(iAmX)
  //     break;
  //   case "It's a draw":
  //     console.log("draw")
  //     break;
  //   default:
  //     // code block
  //   }
  // }

  afterUpdate(async() =>{
    winnerMsg=calculateWinner(squares)
  });

  onDestroy(async() =>{ 
    $fenIO='';
    $moveDetails='';
  });


</script>

<style>
  h3 {
    color: red;
  }

  .board {
    display: flex;
    flex-wrap: wrap;
    width: 300px;
  }
</style>

{#if winnerMsg}
  <h3>{winnerMsg}</h3>
{:else}
  <h3>{status}</h3>
{/if}
<!-- <h3>iAmX {iAmX}</h3>
<h3>winner {winner}</h3>
<h3>my turn{myturn}</h3>
<h3>xIsNext {xIsNext}</h3> -->

<div class="board">
  {#each squares as square, i}
    <Square value={square} handleClick={() => handleClick(i)} />
  {/each}
</div>
