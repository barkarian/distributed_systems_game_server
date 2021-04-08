<script>
    import {isAuthenticated,user} from '../stores/store.js';
    //isAuthenticated.set(false);
</script>

<nav class="topnav">
    {#if ! $isAuthenticated }
        <a href="/register">Register</a>
        <a href="/login">Logging in</a>
    {:else}
        <a href="/my-matches">My Matches</a>
        <a href="/search-matches">Search Matches</a>
        <a href="/new-game">New game</a>
        <a href="/profile"><bold>👽{$user.user_email}</bold></a>
    {/if}
    <p>User is logged: {$isAuthenticated}</p>
</nav>

<style>
    .topnav {
    overflow: hidden;
    background-color: #333;
    }

    .topnav a {
    float: left;
    color: #f2f2f2;
    text-align: center;
    padding: 14px 16px;
    text-decoration: none;
    font-size: 17px;
    }

    .topnav a:hover {
    background-color: #ddd;
    color: black;
    }

    .topnav a.active {
    background-color: #4CAF50;
    color: white;
    }
</style>