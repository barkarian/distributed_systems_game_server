<script>
    export let match={}
    import {user} from '../stores/store.js';
    let {game_id,in_tournament,player1_email,player2_email,winner_email}=match;
    //isAuthenticated.set(false);
</script>

<div class="border">
    <h1> {player1_email}</h1>
    <h2>VS</h2>
    <h1>{player2_email}</h1>
</div>

<style>
    .border {border-style: solid;}
</style>

