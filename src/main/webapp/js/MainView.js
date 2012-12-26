(function ($) {

    brite.registerView("MainView", {loadTmpl: true}, {
        create: function (data, config) {
            var dfd = $.Deferred();
            app.getFolders().done(function(data){
                var html = $("#tmpl-MainView").render(data);
                console.log(html);
                dfd.resolve(html);
            });
            return dfd.promise();
        },

        postDisplay:function (data, config) {
            this.$el.find("li:first a").trigger("btap");
        },

        events:{
            "btap; .showEmails":function (event, extra) {
                $(event.currentTarget).closest("ul").find("li").removeClass("active");
                $(event.currentTarget).closest("li").addClass("active");
                var folderName = $(event.currentTarget).closest("li").attr("data-name");
                var params = extra||{};
                params.folderName = folderName;
                var emails = app.getEmails(params);
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
                        cmdDelete:"DELETE_EMAIL"
                    }
                });
            }
        },

        docEvents:{
           "DELETE_EMAIL": function(event, extra){
               var view = this;
               if(extra.objId){
                   app.deleteEmail(extra.objId).done(function(result){
                       console.log(result);
                       setTimeout(function(){
                           view.$el.find("li.active a").trigger("btap");
                       }, 3000)

                   });
               }
           },
            "REFLESH": function() {
                console.log("reflesh");
                var view = this;
                var $e = view.$el;
                console.log($e.find("li.active"));
                $e.find("li:active a").trigger("btap");
            }
        },

        daoEvents:{
        }
    });

})(jQuery);