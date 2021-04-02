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
            //parse response
            const response=await fetch("http://localhost:5000/auth/login",{
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
            //localStorage is a key value set that takes only strings as parameters
            localStorage.setItem("token",parseRes.token)
            const user_data_string=JSON.stringify(parseRes.user_data)
            localStorage.setItem("user_data",user_data_string)
            //setState
            isAuthenticated.set(true)
            userState.set(parseRes.user_data)
            // console.log("hello")
            // console.log(localStorage)
            // console.log("hello")
            goto("/profile")
        }catch(err){
                displayError=err
        }
    }
</script>

<h1>Login Page</h1>
{#if displayError!=""}
    {displayError}
{/if}
<form on:submit|preventDefault={handleClick(user)}>
    <input type="email" name="email" placeholder="email" bind:value={user.email}/>
    <input type="password" name="password" placeholder="password" bind:value={user.password}/>
    <button >Submit</button>
</form>

