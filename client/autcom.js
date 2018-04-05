var autocom = {
    init: function() {
        var scripts = document.scripts;
        var currentScript = scripts[scripts.length-1];
        var container = currentScript.parentNode;

        var inputSel = currentScript.getAttribute("data-input");
        var url = currentScript.getAttribute("data-url");

        if (!inputSel) {
            console.warn(
                "no input selector specified, e.g. "+
                "<script data-input='input#example' ...>"
            );
        }
        if (!url) {
            console.warn(
                "no data url specified, e.g. "+
                "<script data-url='/api/json/data' ...>"
            );
        }
        if (!(inputSel || url)) {
            return;
        }

        var input = container.querySelector(inputSel);
        if (!input) {
            console.warn("DOM element `" + inputSel + "` is not found");
            return;
        }
        autocom.enable(input, url);
    },

    _createNode: function(html) {
        var container = document.createElement("div");
        container.innerHTML = html;
        return container.children[0];
    },
    _isNode: (o){
        if (typeof Node != "function")
            return false;
        return o instanceof Node;
    },

    enable: function(input, url) {
        if (typeof input == "string")
            input = document.querySelector(input);
    },
}

autocom.init();
