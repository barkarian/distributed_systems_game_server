<script>
    import {moveDetails,fen as fenIO} from '../../stores/store.js';
    import {onMount,onDestroy,beforeUpdate,afterUpdate} from 'svelte';
    import Board from "./Board.svelte"
    //props
    export let playingFirst;
    export let fen;
    export let myturn = true;

    let fenParsed;
    const getBoardState =()=>{
        fenParsed=JSON.parse(fen)        
    }

    beforeUpdate(async() =>{ 
        getBoardState();
        //console.log(fenParsed)
    });
</script>

<p>{myturn}</p>
<p>{fen}</p>
<Board iAmX ={playingFirst} myturn={myturn} squares={fenParsed}></Board>
