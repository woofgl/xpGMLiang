(function ($) {

    brite.registerView("MainView", {loadTmpl:true}, {
        create:function (data, config) {
            return $("#tmpl-MainView").render();
        },

        postDisplay:function (data, config) {
             var view = this;
             var $e = view.$el;
             console.log($e.find("li.active"));
             $e.find("li.active a").trigger("btap");
        },

        events:{
            "btap; .showEmails":function (event, extra) {
                $(event.currentTarget).closest("ul").find("li").removeClass("active");
                $(event.currentTarget).closest("li").addClass("active");
                var emails = app.getEmails(extra);
                brite.display("DataTable", ".MainView-content", {
                    gridData:emails,
                    columnDef:[
                        {
                            text:"#",
                            render: function(obj, idx){return idx + 1},
                            attrs:"style='width: 10%'"
                        },
                        {
                            text:"Date",
                            render:function(obj){
                                var recDate = new Date(obj.date);
                                return recDate.format("yyyy-MM-dd hh:mm:ss")
                            },
                            attrs:"style='width: 20%'"

                        },
                        {
                            text:"From",
                            render:function(obj){return obj.from},
                            attrs:"style='width: 25%'"
                        },
                        {
                            text:"Subject",
                            render:function(obj){return obj.subject}
                        }
                    ],
                    opts:{
                        htmlIfEmpty: "Not emails found",
                        withPaging: false,
                        withCmdDelete:false
                    }
                });
            }
        },

        docEvents:{

        },

        daoEvents:{
        }
    });

})(jQuery);