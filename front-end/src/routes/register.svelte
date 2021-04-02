<script>
    import {isAuthenticated,user as userState} from '../stores/store.js';
    import {goto} from "$app/navigation"
    $:user={
        name:"",
        password:"",
        email:""
    }
    $:displayError=""
    const handleClick = async (user)=>{
        //console.log(user)
        try {
            //get JWT
            //const body={email,password,name};
            const response=await fetch("http://localhost:5000/auth/register",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(user)
            })
            const parseRes=await response.json()
            //THROW ERRORS
            //Middleware sends (200 ok status or 401 if error happen after middleware ) with a JSON error string inside
            if(typeof(parseRes)==="string"){
                throw parseRes 
            }
            localStorage.setItem("token",parseRes.token)
            const user_data_string=JSON.stringify(parseRes.user_data)
            localStorage.setItem("user_data",user_data_string)
            console.log(parseRes.user_data)
            //setState
            isAuthenticated.set(true)
            userState.set(parseRes.user_data)
            //redirect
            goto("/profile")
            // console.log(userState)
            // console.log(parseRes)
        }catch(err){
            displayError=err
            //console.log(err)
        }
    }
</script>

<h1>Register Page</h1>
{#if displayError!=""}
    {displayError}
{/if}
<form on:submit|preventDefault={handleClick(user)}>
    <input type="email" name="email" placeholder="email" bind:value={user.email}/>
    <input type="password" name="password" placeholder="password" bind:value={user.password}/>
    <input type="text" name="name" placeholder="name" bind:value={user.name}/>
    <button>Submit</button>
</form>
<!-- <p>{JSON.stringify(user,0,2)}</p> -->
