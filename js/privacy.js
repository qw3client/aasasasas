axios.get('https://api.batmod.com/privacy/html').then(callback => {
    let privacy = callback.data;
    if (privacy == null) return;

    document.getElementById("privacy").innerHTML = privacy;
}).catch(err => {
    console.error(err);
});