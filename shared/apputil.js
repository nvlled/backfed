

var apputil = {
    //https://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript
    htmlEscape: function(str) {
        var pat = /[\u00A0-\u9999<>\&]/gim;
        return str.replace(pat, function(i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    },
    breakLines: function(str) {
        // Note: I'm not sure if escape()
        // is sufficient for escaping all unwanted chars
        return this.htmlEscape(str).replace(/\n/g, "<br>");
    },
}

if (!this.window && module) {
    module.exports = apputil;
}
