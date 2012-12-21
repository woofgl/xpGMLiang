;
(function () {

    /**
     * DataTable: Sort-able, Page-able Generic Table component
     * @param {Object} data {
     *         dataType {String} Object Type
     *         rowAttrs   {String} row attris
     *         idKey         {string} key of rowid, default is id
     *         onDone  {function} when data load
     *         columnDef    {Object[]} {
     *             text     {String} The Text to be displayed in column header
     *             propName {String} the property name ( if render is not supplied)
     *             render   {Function} takes object of type dataType and returns cell contents
     *             attrs    {String} attribute string to be added to the cell markup
     *             orderBy  {String} if supplied will be used for sorting (default is propName)
     *         }
     *         gridData     {Deferred} This only needs be supplied if the dataType is not supplied (implies !withDataListening)
     *                                 WARNING:  If this is supplied, table can only be drawn once and not refreshed
     *         dataProvider {Object} This can be used when the data provider is not brite.dao -> This Object must implement list interface (ie brite.dm.list )
     *         opts {Object} { // Optional parameters <default value>
     *            withCmdDelete     {Boolean} <true> : cmdDelete cell will be added
     *            cmdDelete     {string} <event> : cmdDelete cell will be added
     *            withCmdEdit     {Boolean} <true> : cmdEdit cell will be added
     *            cmdEdit     {string} <event> : cmdEdit cell will be added
     *            withDataListening {Boolean} <true> : dataListener will be applied and cleaned (requires dataType)
     *            withSorting       {Boolean} <true> : enables sorting
     *            withPaging        {Boolean} <true> : enables paging
     *            htmlIfEmpty          {String or Function} <empty>: this HTML will be used in a single row in case the data is empty
     *            dataOpts {Object} {
     *                pageIndex {Integer} <0>
     *                pageSize  {Integer} <25> Should be one of [10, 25, 50, 100] default is 25
     *                keyword   {String}  <""> keyword to be searched
     *            }
     *        }
     *   }
     */
    (function ($) {
        var daoEvents = {};
        brite.registerView("DataTable", {loadTmpl:true, emptyParent:true}, {
            create:function (data, config) {
                var view = this;

                view.dataType = data.dataType;
                view.rowAttrs = data.rowAttrs;
                if(data.idKey) {
                    view.idKey = data.idKey;
                }else{
                    view.idKey = "id";
                }
                if(data.onDone && $.isFunction(data.onDone)){
                    view.onDone = data.onDone;
                }

                view.columnDef = data.columnDef;
                view.opts = $.extend(true, getDefaultOptions(), data.opts || {});
                view.isTreeMode = data.isTreeMode;
                view.treeDef = data.treeDef;
                view.dataProvider = data.dataProvider;
                view.sortData = {index:-1, order:"asc"};
                if (view.opts.withDataListening) {
                    daoEvents["dataChange; " + view.dataType] = function () {
                        refreshDataTable.call(view);
                    };
                }

                if (view.isTreeMode) {
                    //view.opts.withPaging = false;
                    view.treeStates = {};
                }

                var gridData = data.gridData;
                if (gridData  ) {
                    if ($.isFunction(gridData.promise)) {
                        // gridData is a deferred
                        view.gridData = gridData;
                    }else{
                        var dfd = $.Deferred();
                        dfd.resolve(gridData);
                        view.gridData = dfd.promise();
                    }
                    view.opts.withDataListening = false;
                } else if (view.dataType) {
                    // only dataType is supplied, withDataListening is assumed
                    view.opts.withDataListening = true;
                } else {
                    // this is an error, we need either gridData or dataType
                }


                var html = $("#tmpl-DataTable").render();
                var $e = $(html);
                return $e;
            },
            init:function (data, config) {
                var view = this;
                return refreshDataTable.call(view);
            },

            postDisplay:function (data, config) {
            },

            close:function () {
                var view = this;
                var $e = this.$el;
                $e.bRemove();
            },

            events:{
                "btap; .prev":function (e) {
                    var view = this;
                    if (view.opts.withPaging) {
                        var opts = view.opts.dataOpts;
                        if (opts.pageIndex > 0) {
                            opts.pageIndex--;
                            refreshDataTable.call(view);
                        }
                    }
                },
                "btap; .next":function (e) {
                    var view = this;
                    if (view.opts.withPaging) {
                        var opts = view.opts.dataOpts;
                        if ((opts.pageIndex + 1 < view.numOfPages)||view.hasNext) {
                            opts.pageIndex++;
                            refreshDataTable.call(view);
                        }
                    }

                },

                "change; .pageSize select":function (e) {
                    var view = this;
                    var val = $(e.currentTarget).val();
                    view.opts.dataOpts.pageIndex = 0;
                    view.opts.dataOpts.pageSize = val;
                    console.log("Changing up the page size to " + val);
                    refreshDataTable.call(view);
                },

                "btap; [data-action='toggle-children']":function (e) {
                    var view = this;
                    var $e = view.$element;
                    if (view.isTreeMode) {
                        var $row = $(e.currentTarget).parent().parent();
                        var key = getKey($row.attr("data-obj_type"), $row.attr("data-obj_id"));
                        console.log("Toggling " + key);
                        view.treeStates[key] = toggleState(view.treeStates[key]);
                        refreshDataTable.call(view);
                    }
                },
                "btap; [data-action='sort']": function(event){
                    var view = this;
                    if (view.opts.withSorting) {

                        var $colHeader = $(event.currentTarget);
                        var index = $colHeader.attr("sort-index");
                        var order = view.sortData.index === index ? toggleOrder(view.sortData.order) : "asc";

                        console.log("in sort action index=" + index + "; order = " + order);

                        if (!view.columnDef[index].orderBy && !view.columnDef[index].propName) {
                            return;
                        }

                        view.sortData.index = index;
                        view.sortData.order = order;

                        view.opts.dataOpts.orderBy = view.columnDef[index].orderBy || view.columnDef[index].propName;
                        view.opts.dataOpts.orderType = order;
                        refreshDataTable.call(view);
                    }
                },
                "btap; [data-cmd]": function(event){
                    var view = this;
                    var $e= view.$element;
                    $target = $(event.currentTarget);
                    var eventName = $target.attr("data-cmd");

                    var objId = $target.closest("tr").attr("data-obj_id");
                    $e.trigger(eventName, {objType:view.dataType, objId: objId, event:event});

                },
                "cmdDelete": function(event, extra){
                    var view = this;
                    if (extra) {
                        var objId = extra.objId;
                        $("body").trigger("cmdEdit", {objType: view.dataType, objId: objId});
                    }
                },
                "cmdDelete": function(event, extra){
                    var view = this;
                    if (extra) {
                        var dataProvider = view.dataProvider ? view.dataProvider : brite.dao(view.dataType);
                        dataProvider.remove(extra.objId);
                    }
                }
            },
            docEvents:{},
            daoEvents:daoEvents
        });

        function refreshDataTable(state, eraseTreeStates) {
            var view = this;
            var $e = view.$element;
            var opts = view.opts.dataOpts || {};
            opts.withResultCount = true;

            view.defaultState = state || "closed";
            if (eraseTreeStates) {
                view.treeStates = {};
            }

            var dataProvider =  view.dataProvider ? view.dataProvider : (view.dataType?brite.dao(view.dataType):null);

            var dfd = view.opts.withDataListening ?
                    dataProvider.list(opts) :
                    view.gridData;

            return dfd.done(function (data) {
                console.log(data);
                if(view.onDone){
                    view.onDone(data);
                }
                if (data.hasOwnProperty("numOfPages")) {
                    view.numOfPages = data.numOfPages;
                } else {
                    var resultCount = data.result_count || data.result.length;
                    view.numOfPages = Math.ceil(resultCount / opts.pageSize);
                }
                if(data.hasOwnProperty("hasNext")){
                    view.hasNext = data["hasNext"];
                }else{
                    view.hasNext = opts.pageIndex+1 < view.numOfPages;
                }
                !view.numOfPages && (view.numOfPages = 0);
                view.gridData = data.result;
                var dataTableHtml = renderDataTable.call(view);
                var $html = $(dataTableHtml);
                $e.bEmpty().append($html);

            });
        }


        /**
         * Render the table's markup:
         */
        function renderDataTable() {
            var view = this;
            var htmlContent;
            var $tableContent = $($("#tmpl-DataTable-Content").html());

            var htmlHeader = renderTableHead.call(view);
            $tableContent.find("thead").append(htmlHeader);

            if (view.numOfPages == 0) {
                htmlContent = renderEmptyTableBody.call(view);
                $tableContent.find("tbody").append(htmlContent);
            } else {
                htmlContent = renderTableBody.call(view) ;
                $tableContent.find("tbody").append(htmlContent);
                if (view.opts.withPaging) {
                    $tableContent.append(renderPagingFooter.call(view));
                }
            }
            return $tableContent;
        }

        /*  Private  */

        // used as a spacer (for tree table mode)
        var TAB = "<span class='spacer' />";


        function renderTableHead() {
            var view = this;
            var html = "<tr>";
            for (var i in view.columnDef) {
                html += "<th ";
                if (view.opts.withSorting && (view.columnDef[i].orderBy || view.columnDef[i].propName)) {
                    html += "data-action='sort' sort-index='" + i + "'";
                }
                if (view.columnDef[i].attrs) {
                    if($.isFunction(view.columnDef[i].attrs)){
                        view.columnDef[i].attrs(true);
                    }else{
                        html += view.columnDef[i].attrs;
                    }

                }
                html += ">" + view.columnDef[i].text;
                if (view.opts.withSorting) {
                    if (view.sortData && i == view.sortData.index) {
                        html += "<span class='ico "
                        html += view.sortData.order === "asc" ? "ico-arrow-u" : "ico-arrow-d";
                        html += " thead-ico'/>"
                    }
                }
                html += "</th>";
            }

            (view.opts.withCmdEdit||view.opts.cmdEdit) && (html += "<th style='width:20px'></th>");
            (view.opts.withCmdDelete||view.opts.cmdDelete) && (html += "<th style='width:20px'></th>");

            html += "</tr>";
            return html;
        }

        function renderTableBody() {
            var view = this;
            if (view.isTreeMode) {
                return renderTableBodyRecursive.call(view, view.treeDef, view.gridData, 0);
            }

            return renderTableBodyIterative.call(view);
        }

        function renderTableBodyIterative() {
            var view = this;
            var html = "";
            var currentRowIndex = 0;
            for (var i in view.gridData) {
                var obj = view.gridData[i];
                view.currentRowIndex = view.opts.dataOpts.pageSize * (view.opts.dataOpts.pageIndex||0) +  currentRowIndex;
                html += renderTableRow.call(view, view.dataType, view.columnDef, obj);
                currentRowIndex++;
            }

            return html;

        }

        function renderTableBodyRecursive(treeDef, gridData, nestLevel) {
            var view = this;
            var html = "";
            var currentRowIndex = 0;
            for (var i in gridData) {
                view.currentRowIndex = currentRowIndex;
                var obj = gridData[i];
                var hasChildren = $.isFunction(treeDef.getChildren) && treeDef.childDef;
                html += renderTableRow.call(view, treeDef.dataType, treeDef.columnDef, obj, hasChildren, nestLevel);
                if (hasChildren) {
                    var childGridData = treeDef.getChildren(obj);
                    var key = getKey(treeDef.dataType, obj.id);
                    if ($.isArray(childGridData) && view.treeStates[key] == "open") {
                        html += renderTableBodyRecursive.call(view, treeDef.childDef, childGridData, nestLevel + 1);
                    }
                }
                currentRowIndex++;
            }
            return html;
        }

        function renderTableRow(dataType, columnDef, obj, hasChildren, nestLevel) {
            var view = this;
            var html = "<tr ";
            if(view.rowAttrs) {
                if($.isFunction(view.rowAttrs)){
                    html += view.rowAttrs(obj, view.currentRowIndex);
                }else {
                    html += view.rowAttrs;
                }

            }

            if (dataType) {
                html += "data-obj_type='" + dataType + "'";
            }
            if(obj[view.idKey]) {
                html += " data-obj_id='" + obj[view.idKey] + "'";
            }
            html += ">";

            for (var j in columnDef) {
                var colDef = columnDef[j];
                html += "<td ";

                if (colDef.attrs) {
                    if($.isFunction(colDef.attrs)){
                        html += colDef.attrs(obj, view.currentRowIndex);
                    }else{
                        html += colDef.attrs;
                    }

                }
                html += ">";

                if (j == 0) {
                    for (var x = 1; x <= nestLevel; x++) {
                        html += TAB;
                    }
                    if (hasChildren) {
                        var key = getKey(dataType, obj.id);

                        if (!view.treeStates[key]) {
                            view.treeStates[key] = view.defaultState;
                        }

                        html += "<span class='ico ico-" + getIconForState(view.treeStates[key]) +
                                " tree-ico' data-action='toggle-children' />";
                    }
                }

                if (colDef.propName ) {
                    html += getProp(obj, colDef.propName);
                } else if ($.isFunction(colDef.render)) {
                    html += colDef.render(obj, view.currentRowIndex);
                }
                html += "</td>";
            }
            if(view.opts.cmdEdit){
                html += "<td data-cmd='" + view.opts.cmdEdit + "'><div class='icon-edit'/></td>"
            }else if(view.opts.withCmdEdit) {
                html += "<td data-cmd='cmdEdit'><div class='icon-edit'/></td>"
            }
            if(view.opts.cmdDelete){
                html += "<td data-cmd='" + view.opts.cmdDelete + "'><div class='icon-remove'/></td>"
            }else if(view.opts.withCmdDelete) {
                html += "<td data-cmd='cmdDelete'><div class='icon-remove'/></td>"
            }
            html += "</tr>";
            return html;
        }

        function renderPagingFooter() {
            var view = this;
            var opts = view.opts.dataOpts || {};
            return $("#tmpl-DataTable-Foot").render({pageIndex:opts.pageIndex+1,numOfPages:view.numOfPages,
                pageSize: opts.pageSize, hasNext:view.hasNext});
        }

        function renderEmptyTableBody() {
            var view = this;
            var html = "";
            if (view.opts.htmlIfEmpty) {
                var colSpan = view.columnDef.length;
                view.opts.withCmdDelete && (colSpan++);
                html += "<tr><td class='info' colspan='" + colSpan + "'>";
                var htmlIfEmpty = $.isFunction(view.opts.htmlIfEmpty) ? view.opts.htmlIfEmpty() : view.opts.htmlIfEmpty;
                html += $("<div>" + htmlIfEmpty + "</div>").html();
                html += "</td></tr>";

            }
            return html;
        }

        function getPageSizeSelect(curSize) {
            var sizes = [5, 10, 25, 50, 100];
            var html = "<select>"
            for (var i in sizes) {
                html += "<option value='" + sizes[i] + "'";
                sizes[i] == curSize && (html += "selected");
                html += ">" + sizes[i] + "</option>";
            }
            return html + "</select>";
        }

        function toggleOrder(order) {
            return order === "asc" ? "desc" : "asc";
        }

        function toggleState(state) {
            return state === "open" ? "closed" : "open";
        }

        function getIconForState(state) {
            switch (state) {
                case "open"  :
                    return "minus";
                case "closed":
                    return "plus";
            }
        }

        function getKey(objType, objId) {
            return objType + ":::" + objId;
        }

        function getOuterHtml($element) {
            return $('<div>').append($element).html();
        }

        function getDefaultOptions() {
            return {
                withCmdDelete:true,
                withDataListening:true,
                withSorting:true,
                withPaging:true,
                dataOpts:{
                    pageIndex:0,
                    pageSize:10
                }
            };
        }
        function getProp(obj, propName) {
            if(obj.hasOwnProperty(propName)){
                return obj[propName];
            }

            var nestProp = propName.split(".");
            var transObj = obj;
            for(var i in nestProp) {
                if(transObj[nestProp[i]]){
                    transObj = transObj[nestProp[i]];
                }else{
                    break;
                }
            }
            return transObj;
        }
    })(jQuery);

})();
