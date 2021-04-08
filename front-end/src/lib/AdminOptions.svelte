<script>
    import {onMount} from "svelte";
    let action=0
    let message=""
    import {user} from '../stores/store.js';
    //console.log($user)
    let users=[]
    let changes={}
    const updateUsers = async (roleAndId)=>{
        try {
            //const user_data=
            const response=await fetch("http://localhost:5000/auth/admin/set-role",{
                method:"POST",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
                body:JSON.stringify(roleAndId)
            })
            const parseRes=await response.json()
            console.log(parseRes)
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            //console.log(parseRes)
            changes=parseRes
            //console.log(users)
        }catch(err){
            console.log(err)
        }
    }


    const getAllUsers = async ()=>{
        try {
            //const user_data=
            const response=await fetch("http://localhost:5000/auth/admin/get-all-users",{
                method:"GET",
                headers:{"Content-Type":"application/json",
                        "token":localStorage.getItem("token")},
            })
            const parseRes=await response.json()
            //console.log(parseRes.allIndividualMatches)
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            //console.log(parseRes)
            users=parseRes.sort()
            //console.log(users)
        }catch(err){
            console.log(err)
        }
    }

    const updatePage= async (action)=>{
        await updateUsers(action)
            message=action.correlated_role
            //console.log("hello")
            //console.log(action)
            getAllUsers()

    }

    $:if(action!=0){
        updatePage(action)
    }
onMount(async()=>getAllUsers())
</script>

<h2>Admin Table</h2>

{#if changes.success}
    <p>Message:{changes.message}</p>
{/if}
<ul>
    {#each users as us (us.user_id)}
    <div>
        <li>
        <div>
        {us.user_email}
            {#if us.user_role_official=='1' ||us.user_role_admin=='1'}
                -User is :{#if us.user_role_official=='1'}Official{/if} {#if us.user_role_admin=='1'}Admin{/if}
            {/if}
        </div>
        
        {#if us.user_role_admin!='1'}
            <input type=radio bind:group={action} value={{correlated_role:"user_role_admin",user_id: us.user_id}}>
            Admin
        {/if}
        {#if us.user_role_official!='1'}
            <input type=radio bind:group={action} value={{correlated_role:"user_role_official",user_id: us.user_id}}>
            Official
        {/if}
        </li>    
    </div>
    
    {/each}
</ul>
