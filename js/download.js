axios.get('https://api.batmod.com/changelog/').then(callback => {
    let changelog = callback.data;
    if (changelog == null) return;

    document.getElementById("changelog").innerHTML = changelog.replace(/§7§l/g, "").replace(/\n/g, "<br>").replace(/§f§l/g, "<b>").replace(/-/g, "</b>-").slice(0, changelog.length - (changelog.length - changelog.indexOf("§f§l...")));
}).catch(err => {
    console.error(err);
});

axios.get('https://api.batmod.com/dl-count/').then(data => {
    if (data.data == null) return;
    let downloadData = data.data;

    document.getElementById("dl-count").innerHTML = commaSeparateNumber(downloadData.count);
})

function commaSeparateNumber(val) {
    while (/(\d+)(\d{3})/.test(val.toString())) {
        val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
    }
    return val;
}