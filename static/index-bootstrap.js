if (!(window.location.hash.replace('#', ''))) {
    if (window.location.href.match(/\/([^_][^\*\$\/\?]*)(?:\?.*)?$/)) {
        window.EtherCalc = window.SocialCalc = { _room: RegExp.$1 };
        document.title = SocialCalc._room + " – EtherCalc";
    }
    else {
        window.location = './_start';
    }
}
window.addEventListener("message", function(it) {
    if (window.parent === window || it.source !== window.parent) return;
    var sameOrigin = it.origin === window.location.origin;
    var trustedLocalDev =
        /^(?:127\.0\.0\.1|localhost)$/.test(window.location.hostname) &&
        /^http:\/\/(?:127\.0\.0\.1|localhost):8080$/.test(it.origin);
    if (!sameOrigin && !trustedLocalDev) return;
    if (typeof it.data !== "string" || it.data.length > 1048576) return;
    var payload;
    try {
        payload = JSON.parse(it.data);
    } catch (e$) {
        return;
    }
    if (!payload || payload.type !== "multi" || !Array.isArray(payload.rows) ||
        payload.rows.length > 256 || typeof payload.index !== "string" ||
        payload.index.length > 2048) return;
    var rows = [];
    for (var i = 0; i < payload.rows.length; i++) {
        var row = payload.rows[i];
        if (!row || Array.isArray(row) || typeof row !== "object" ||
            typeof row.link !== "string" || row.link.length < 2 ||
            row.link.length > 2048 || row.link.charAt(0) !== "/" ||
            row.link.charAt(1) === "/" || row.link.slice(1).indexOf("/") !== -1 ||
            typeof row.title !== "string" || row.title.length > 256 ||
            !Number.isSafeInteger(row.row) || row.row < 1) return;
        var segment;
        try {
            segment = decodeURIComponent(row.link.slice(1));
        } catch (e$) {
            return;
        }
        if (segment === "." || segment === ".." ||
            /[\\\/?#"!]/.test(segment)) return;
        for (var j = 0; j < segment.length; j++) {
            var code = segment.charCodeAt(j);
            if (code <= 31 || code === 127) return;
        }
        rows.push({link: row.link, title: row.title, row: row.row});
    }
    window.__MULTI__ = {type: "multi", rows: rows, index: payload.index};
}, false);
