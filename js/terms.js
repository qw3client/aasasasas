axios.get('https://api.batmod.com/terms/html').then(callback => {
    let terms = callback.data;
    if (terms == null) return;

    document.getElementById("terms").innerHTML = terms;
}).catch(err => {
    console.error(err);
});