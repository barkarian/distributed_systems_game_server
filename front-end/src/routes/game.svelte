<script>
import {onMount} from "svelte";
import {curGame} from '../stores/store.js';
onMount(async()=>console.log("On mount staff"))
</script>


<h1>match_id is:{$curGame}</h1>