<script>
    import { goto } from "$app/navigation";

    let data = new URLSearchParams(window.location.hash.substring(1));
    console.log(Object.fromEntries([...data.entries()]));

    localStorage.setItem("token", data.get("access_token"));
    localStorage.setItem("expiration", new Date(Date.now() + Number(data.get("expires_in"))).toISOString());

    goto("/");
</script>

{data}