<script>
    import {user} from '../stores/store.js';
</script>
{#if user.user_role_admin=="1"}
    <!-- fetch an restAPI/get for getting All users to choose from-->
    <!-- PICK ONE OF THEM-->
    <!-- fetch another restAPI/post for choose one or some of them to make them officials or admins -->
{/if}