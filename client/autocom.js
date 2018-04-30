console.log("autocom loaded");

var util = {
    filterNonEmpty: function(array) {
        return array.map(function(x) {
            return x.trim();
        }).filter(function(x) {
            return !!x;
        });
    },

    interpolate: function(str, data) {
        data = data || {};
        return str.replace(/{(\w+)}/g, function(...args) {
            var k = args[1];
            var v = data[k];
            if (v == null)
                return args[0];
            return v;
        });
    },

    selectKeys: function(obj, keys) {
        return keys.map(function(k) {
            return obj[k];
        });
    },
}

var autocom = {

    init: function() {
        var scripts = document.scripts;
        var currentScript = scripts[scripts.length-1];
        var container = currentScript.parentNode;

        var input = currentScript.getAttribute("data-input");
        var url = currentScript.getAttribute("data-url");
        var format = currentScript.getAttribute("data-format");
        var fetchOnce = !!currentScript.getAttribute("data-fetch-once");

        var fieldsAttr = currentScript.getAttribute("data-fields") || "";
        var fields = util.filterNonEmpty(fieldsAttr.split(","));

        var paramsAttr = currentScript.getAttribute("input-params") || "";
        var inputParams = util.filterNonEmpty(paramsAttr.split(","));

        autocom.enable({
            container: container,
            input: input,
            url: url,
            fetchOnce: fetchOnce,
            fields: fields,
            format: format,
            inputParams: inputParams,
        });
    },

    createNode: function(html) {
        var container = document.createElement("div");
        container.innerHTML = html;
        return container.children[0];
    },

    enable: function(args) {
        var input     = args.input;
        var url       = args.url;
        var fetchOnce = args.fetchOnce;
        var container = args.container;
        var formatString = args.format;
        var fields       = args.fields || [];
        var inputParams  = args.inputParams || [];
        var onSelect     = args.onSelect;
        var output       = args.output || {};

        if (!container) {
            var scripts = document.scripts;
            var currentScript = scripts[scripts.length-1];
            var container = currentScript.parentNode || document.body;
        }

        if (!input) {
            console.warn(
                "no input selector specified, e.g. "+
                "<script data-input='input#example' ...>"
            );
            return;
        } else if (typeof input == "string") {
            input = container.querySelector(input);
            if (!input) {
                console.warn("DOM element `" + inputSel + "` is not found");
                return;
            }
        }

        if (!url) {
            console.warn(
                "no data url specified, e.g. "+
                "<script data-url='/api/json/data' ...>"
            );
            return;
        }

        if (fields.length == 0) {
            console.warn(
                "specify at least one field to search, e.g."+
                "<script data-fields='fullname' ...>"
            );
            return;
        }

        var filter = function(query, data) {
            query = query.toLowerCase().trim();
            return data.filter(matches);

            function matches(item) {
                return fields.some(function(f) {
                    var value = (item[f] || "").toLowerCase();
                    return value.match(query);
                });
            }
        }

        var format = function(item) {
            if (formatString) {
                return util.interpolate(formatString, item);
            } else {
                return util.selectKeys(item, fields).join(" ");
            }
        }

        var readInputParams = function(inputParams) {
            var result = {};
            inputParams.forEach(function(input) {
                if (typeof input == "string")
                    input = container.querySelector(input);
                var name = input.name || input.id;
                if (!name) {
                    console.warn("input-param has no name:");
                    return;
                }
                var value = input.value || input.textContent || "";
                result[name] = value.trim();
            });
            return result;
        }


        var queryParams = new URLSearchParams(readInputParams(inputParams));
        var requestData = null;
        var request = function() {
            return fetch(url+"?"+queryParams.toString());
        }

        autocomplete(input, { openOnFocus: true, hint: true }, [
            {
                source: function(query, cb) {
                    if (fetchOnce && requestData) {
                        cb(filter(query, requestData));
                        return;
                    }
                    request().then(function(resp) {
                        if (resp.status != 200) {
                            console.log("unable to fetch", url, "status:"+resp.status);
                            return;
                        }
                        resp.json().then(function(data) {
                            requestData = data;
                            console.log("data", data);
                            cb(filter(query, data));
                        });
                    });
                },
                displayKey: function(sug) {
                    return format(sug);
                },
                templates: {
                    suggestion: function(sug) {
                        return format(sug);
                    }
                }
            }
        ]).on('autocomplete:selected', function(event, suggestion, dataset) {
            //input.value = format(suggestion);
            console.log('dataset: ' + dataset + ', ' + suggestion.name);
            Object.keys(output).forEach(function(k) {
                var sel = output[k];
                var node = container.querySelector(sel);
                if (!node) {
                    console.warn(
                        "cannot output " + k + " to  " + sel +
                        ": missing DOM elem"
                    );
                    return;
                }
                if (node.tagName == "INPUT")
                    node.value = suggestion[k];
                else
                    node.textContent = suggestion[k];
            });
            if (typeof onSelect == "function") {
                onSelect(suggestion, {
                    container: container,
                    input: input,
                });
            }
        });

        input.addEventListener("focus", function() {
            input.setSelectionRange(0, input.value.length);
        });

    },
}

//autocom.init();
