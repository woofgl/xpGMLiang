;
(function () {

    /**
     * Component: Login
     *
     * Responsibilities:
     *   - Display all the Login Content of the Login screen. (today below the TobBar)
     *
     * Constructor Data:
     *  - none
     *
     * Component API:
     *  format: [method_name]([args]) : [concise description]
     *  - none
     *
     * Component Events:
     *  format: [ComponentName_[DO]_event_name]([argument | argumentsMap]): [concise description]
     * - none
     *
     */
    (function ($) {

        brite.registerView("Login", {loadTmpl:true, parent:"#bodyPage", emptyParent:true},{
            create:function (data, config) {
                var html = $("#tmpl-Login").render(data);
                var $e = $(html);
                return $e;
            },

            postDisplay:function (data, config) {
                var view = this;
                var $e = view.$el;

                app.util.alignCenter($e);

                $e.find("input[name='username']").focus();
            },

            events:{
                "keyup": function (e) {
                	if(e.which == 13){
	                    submitForm.call(this);
                	}
                },
                "click; .login-button": function () {
                    submitForm.call(this);
                },
                "click; .btnGithubLogin": function () {
                	location.href = contextPath + "/ghLogin"
                },
                "click; .btnGoogleLogin": function () {
                	location.href = contextPath + "/googleLogin"
                }
            }
        });

        // --------- Component Private Methods --------- //
        function submitForm(){
			var view = this;
			var $e = view.$el;
			var username = $e.find("input[name='username']");
			var password = $e.find("input[name='password']");
			$e.find("*").removeClass("error");
			$e.find(".help-inline").empty();
			if (username.val() == "") {
				username.focus();
				username.closest("div").addClass("error").find("span").html("Please enter valid user name");
			} else if (password.val() == "") {
				password.focus();
				password.closest("div").addClass("error").find("span").html("Please enter valid password");
			}  else {
				login(username.val(), password.val()).done(function(user) {
					console.log(user);
					if ( typeof user == "object") {
						window.location = contextPath;
					}
				});
			}

        }
        /**
         * login to game app
         */
        function login(username, password) {

            var reqData = {
                username:username,
                password:password

            }
            return $.ajax({
                type:"POST",
                url:"login.do",
                data:reqData,
                dataType:"json"
            }).pipe(function (val) {
                        return val;
                    });
        }

        // --------- /Component Private Methods --------- //

    })(jQuery);


})();
