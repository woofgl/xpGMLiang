var app = app || {};
(function ($) {
    //FIXME keep it util brite update
    $.fn.bView = $.fn.bComponent;
    //just keep it for now
    //check the browsers type
    var ua = navigator.userAgent.toLowerCase();


    // -------- Public Methods --------- //
    /**
     * A method about use ajax to get json data
     */
    app.getJsonData = function (url, params) {
        var dfd = $.Deferred();
        params = params || {};
        jQuery.ajax({
            type:params.method ? params.method : "Post",
            url:url,
            async:true,
            data:params,
            dataType:"json"
        }).success(function (data) {
                    dfd.resolve(data);
                }).fail(function (jxhr, arg2) {
                    try {
                        if (jxhr.responseText) {
                            console.log("SampleGB WARNING: json not well formatted, falling back to JS eval");
                            var data = eval("(" + jxhr.responseText + ")");
                            dfd.resolve(data);
                        } else {
                            throw "SampleGB EXCEPTION: Cannot get content for " + url;
                        }
                    } catch (ex) {
                        console.log("SampleGB ERROR: " + ex + " Fail parsing JSON for url: " + url + "\nContent received:\n"
                                + jxhr.responseText);
                    }
                });

        return dfd.promise();
    }

    /**
     * Do a ajax post for the action and resolve with the JSON object (which is the WebActionHandler action name) and the data.
     *
     * @param data {FormData} today, assume FormData
     *
     * @return a Deferred
     */
    app.post = function (action, formData) {
        var dfd = $.Deferred();

        var xhr = new XMLHttpRequest();
        xhr.open('POST', action, true);

        xhr.onload = function (e) {
            var jsonResult = JSON.parse(xhr.response);
            dfd.resolve(jsonResult);
        };

        xhr.onerror = function (e) {
            dfd.fail("app.post failed: " + e);
        }

        xhr.send(formData);  // multipart/form-data

        return dfd.promise();
    };

    app.getEmails = function (opts) {
        var params = {
            method:"Get"
        };
        return app.getJsonData(contextPath + "/getEmails.json", $.extend(params, opts||{}));
    };
    app.deleteEmail=function(id){
        var params = {id: id};
        params.method = "Post"

        return app.getJsonData(contextPath + "/deleteEmail.do", params);
    };
    app.getFolders=function(){
        var params = {method: "Get"};
        return app.getJsonData(contextPath + "/getFolders.json", params);
    };

    app.searchEmails=function(opts){
       var params = opts||{};
        params.method = "Get";
        return app.getJsonData(contextPath + "/searchEmails.json", params);
    }





    /**
     * This will be called by the MainScreen cmd logic just after we perform a
     * command.
     *
     * This function needs to seralize the cmd and extra in the URL after the hash
     *
     * @param cmd
     * @param extra
     *         this will be the js object that has the
     */
            app.pushCmd = function (cmd, extra) {
                if (extra) {
                    var extraString = JSON.stringify(extra);
                    window.location.hash = cmd + ":" + extraString.replace(/\"/g, "|");
                } else {
                    window.location.hash = cmd;
                }
                app.currentHash = window.location.hash;
            };


    // -------- /Public Methods --------- //

    /**
     * do something when get hash from url
     */
    function executeCmd() {
        var cmdInfo = getCmdInfo();
    }

    /**
     * get a object but hash value
     * @return {object} cmdInfo object
     */
    app.getCmdInfo = function getCmdInfo() {
        var hash = location.hash;
        var cmdInfo = {};
        var cmdString = hash.substring(1);
        if (!cmdString || cmdString == "") {
            cmdInfo.cmd = "";
        } else if (cmdString.indexOf(":") != -1) {
            var cmd = cmdInfo.cmd = cmdString.substring(0, cmdString.indexOf(":"));
            var extraString = cmdString.substring(cmdString.indexOf(":") + 1).replace(/\|/g, "\"");
            cmdInfo.extra = JSON.parse(extraString);

        } else {
            cmdInfo.cmd = cmdString;
        }

        return cmdInfo;
    }

})(jQuery);

(function () {
    var fullScreenApi = {
        supportsFullScreen:false,
        isFullScreen:function () {
            return false;
        },
        requestFullScreen:function () {
        },
        cancelFullScreen:function () {
        },
        fullScreenEventName:'',
        prefix:''
    }, browserPrefixes = 'webkit moz o ms khtml'.split(' ');

    // check for native support
    if (typeof document.cancelFullScreen != 'undefined') {
        fullScreenApi.supportsFullScreen = true;
    } else {
        // check for fullscreen support by vendor prefix
        for (var i = 0, il = browserPrefixes.length; i < il; i++) {
            fullScreenApi.prefix = browserPrefixes[i];

            if (typeof document[fullScreenApi.prefix + 'CancelFullScreen'] != 'undefined') {
                fullScreenApi.supportsFullScreen = true;

                break;
            }
        }
    }

    // update methods to do something useful
    if (fullScreenApi.supportsFullScreen) {
        fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';

        fullScreenApi.isFullScreen = function () {
            switch (this.prefix) {
                case '':
                    return document.fullScreen;
                case 'webkit':
                    return document.webkitIsFullScreen;
                default:
                    return document[this.prefix + 'FullScreen'];
            }
        }


        fullScreenApi.requestFullScreen = function (el) {
            return (this.prefix === '') ? el.requestFullScreen() : el[0][this.prefix + 'RequestFullScreen']();
        }


        fullScreenApi.cancelFullScreen = function (el) {
            return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
        }

    }

    // jQuery plugin
    if (typeof jQuery != 'undefined') {
        jQuery.fn.requestFullScreen = function () {

            return this.each(function () {
                var el = jQuery(this);
                if (fullScreenApi.supportsFullScreen) {
                    fullScreenApi.requestFullScreen(el);
                }
            });
        };
        jQuery.fn.cancelFullScreen = function () {
            return this.each(function () {
                var el = jQuery(this);
                if (fullScreenApi.supportsFullScreen) {
                    fullScreenApi.cancelFullScreen(el);
                }
            });
        };
    }

    // export api
    window.fullScreenApi = fullScreenApi;

})();
//handlebars plugin
(function($) {
    var compiled = {};
    $.fn.render = function(data) {
        if(!compiled.hasOwnProperty(this.selector)){
           compiled[this.selector] =  Handlebars.compile(this.html());
        }
        return compiled[this.selector](data);
    };

    Handlebars.registerHelper('check', function (lvalue, operator, rvalue, options) {

        var operators, result;

        if (arguments.length < 3) {
            throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
        }

        if (options === undefined) {
            options = rvalue;
            rvalue = operator;
            operator = "===";
        }

        operators = {
            '==': function (l, r) { return l == r; },
            '===': function (l, r) { return l === r; },
            '!=': function (l, r) { return l != r; },
            '!==': function (l, r) { return l !== r; },
            '<': function (l, r) { return l < r; },
            '>': function (l, r) { return l > r; },
            '<=': function (l, r) { return l <= r; },
            '>=': function (l, r) { return l >= r; },
            'typeof': function (l, r) { return typeof l == r; }
        };

        if (!operators[operator]) {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        result = operators[operator](lvalue, rvalue);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }

    });

})(jQuery);

(function ($) {
    //add format to string
    String.prototype.format = function (args) {
        if (arguments.length > 0) {
            var result = this;
            if (arguments.length == 1 && typeof (args) == "object") {
                for (var key in args) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
            else {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] == undefined) {
                        return "";
                    }
                    else {
                        var reg = new RegExp("({[" + i + "]})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
            return result;
        }
        else {
            return this;
        }
    };
    //add format to date
    Date.prototype.format = function(format)
    {
        /*
         * format="yyyy-MM-dd hh:mm:ss";
         */
        var o = {
            "M+" : this.getMonth() + 1,
            "d+" : this.getDate(),
            "h+" : this.getHours(),
            "m+" : this.getMinutes(),
            "s+" : this.getSeconds(),
            "q+" : Math.floor((this.getMonth() + 3) / 3),
            "S" : this.getMilliseconds()
        }

        if (/(y+)/.test(format))
        {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4
                - RegExp.$1.length));
        }

        for (var k in o)
        {
            if (new RegExp("(" + k + ")").test(format))
            {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    };
})(jQuery);

