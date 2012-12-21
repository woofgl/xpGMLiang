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
            "btap; .showContacts":function (event, extra) {
                console.log(extra);
                $(event.currentTarget).closest("ul").find("li").removeClass("active");
                $(event.currentTarget).closest("li").addClass("active");
                var contacts = app.getContacts(extra);
                brite.display("DataTable", ".MainView-content", {
                    gridData:contacts,
                    rowAttrs: function(obj){ return " etag='{0}'".format(obj.etag)},
                    columnDef:[
                        {
                            text:"#",
                            render: function(obj, idx){return idx + 1},
                            attrs:"style='width: 10%'"
                        },
                        {
                            text:"Emails",
                            render:function(obj){return obj.email},
                            attrs:"style='width: 400px'"

                        },
                        {
                            text:"Full Name",
                            render:function(obj){return obj.fullName},
                            attrs:"style='width: 25%'"
                        },
                        {
                            text:"Group",
                            render:function(obj){return getGroupId(obj.groupId)}
                        }
                    ],
                    opts:{
                        htmlIfEmpty: "Not contacts found",
                        withPaging: false,
                        cmdEdit: "EDIT_CONTACT",
                        cmdDelete: "DELETE_CONTACT"
                    }
                });
            },
            "btap; .showGroups":function (event) {
                var view = this;
                $(event.currentTarget).closest("ul").find("li").removeClass("active");
                $(event.currentTarget).closest("li").addClass("active");
                var groups = app.getGroups();
                brite.display("DataTable", ".MainView-content", {
                    gridData: groups,
                    rowAttrs: function(obj){ return "data-type='Group' data-etag='{0}' data-title='{1}'".format(obj.etag, obj.title.text)},
                    columnDef:[
                        {
                            text:"#",
                            render: function(obj, idx){return idx + 1},
                            attrs:"style='width: 10%'"
                        },
                        {
                            text:"Title",
                            attrs: " data-cmd='SHOW_CONTACTS' style='cursor:pointer;width:40%' ",
                            render:function(obj){return obj.title.text}

                        },
                        {
                            text:"Etag",
                            render:function(obj){return obj.etag}

                        }
                    ],
                    opts:{
                        htmlIfEmpty: "Not Groups found",
                        withPaging: false,
                        cmdEdit: "EDIT_GROUP",
                        cmdDelete: "DELETE_GROUP"
                    }
                });
            },
            "btap; .createGroup": function() {
                brite.display("CreateGroup");
            },
            "btap; .createContact": function() {
                brite.display("CreateContact");
            }
        },

        docEvents:{
            "SHOW_GROUPS": function() {
                var view = this;
                var $e = view.$el;
                $e.find(".showGroups").trigger("btap");
            },
            "SHOW_CONTACTS": function(event, extra){
                var groupId = (extra||{}).objId;
                if(groupId) {
                    groupId = groupId;
                }
                var view = this;
                view.$el.find(".showContacts").trigger("btap",{groupId:groupId});
            },
            "EDIT_GROUP":function(event, extraData){
                if (extraData && extraData.objId) {
                    var groupId = getGroupId(extraData.objId);
                    var $row = $(extraData.event.currentTarget).closest("tr");
                    var title = $row.attr("data-title");
                    var etag = $row.attr("data-etag");
                    console.log(etag);
                    brite.display("CreateGroup", null, {groupId:groupId, title:title, etag:etag})
                }
            },
            "DELETE_GROUP": function(event, extraData){
                if (extraData && extraData.objId) {
                    var groupId = getGroupId(extraData.objId);
                    var etag = $(extraData.event.currentTarget).closest("tr").attr("data-etag");
                    app.deleteGroup(groupId, etag).done(function (extradata) {
                        if (extradata && extradata.result) {
                            setTimeout((function () {
                                $("body").trigger("SHOW_GROUPS");
                            }), 3000);

                        }
                    });
                }
            },
            "DELETE_CONTACT": function(event, extraData) {
                if (extraData && extraData.objId) {
                    var contactId = getContactId(extraData.objId);
                    var etag = $(extraData.event.currentTarget).closest("tr").attr("etag");
                    app.deleteContact(contactId, etag).done(function (extradata) {
                        if (extradata && extradata.result) {
                            setTimeout((function () {
                                $("body").trigger("SHOW_CONTACTS");
                            }), 3000);

                        }
                    });
                }

            },
            "EDIT_CONTACT": function(event, extraData){
                if (extraData && extraData.objId) {
                    var contactId = getContactId(extraData.objId);

                    var etag = $(extraData.event.currentTarget).closest("tr").attr("etag");

                    app.getContact({contactId:contactId, etag:etag}).done(function (data) {
                        if(data && data.result){
                            if(data.result.id) {
                                data.result.id = getContactId(data.result.id);
                            }
                            brite.display("CreateContact", null, data.result);
                        }
                    });
                }
            }
        },

        daoEvents:{
        }
    });

    function getGroupId(url) {
        var myregexp = /http:\/\/www.google.com\/m8\/feeds\/groups\/(.+)\/base\/(.+)/;
        var match = myregexp.exec(url);
        if (match != null) {
            result = match[2];
        } else {
            result = "";
        }
        return result;
    }
    function getContactId(url) {
        var myregexp = /http:\/\/www.google.com\/m8\/feeds\/contacts\/(.+)\/base\/(.+)/;
        var match = myregexp.exec(url);
        if (match != null) {
            result = match[2];
        } else {
            result = "";
        }
        return result;
    }
})(jQuery);