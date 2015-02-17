/*!
 * LegoTable v1.0.0
 * Copyright 2015 Samer Abu Rabie (@SamerX) 
 * Licensed under MIT
 */

(function ($) {
    var methods = {
        Init: function (options) {
            // Repeat over each element in selector
            return this.each(function () {
                var $this = $(this);

                // Attempt to grab saved settings, if they don't exist we'll get "undefined".
                var settings = $this.data('LegoTable');

                // If we could't grab settings, create them from defaults and passed options
                if (typeof (settings) == 'undefined') {

                    var defaults = {
                        Url: null,//The url of which the data relies in, http POST request will be sent and JSON object shall be recieved
                        Criteria: null,//An object holds the criteria data to be sent for filteration of data to the specified Url
                        PageSize: 10,//Page size in the pager with default to 10
                        PageIndex: 0,//Page index with default to 0
                        PagerPageSize: 5,//Number of pages to display in the pager with default to 5
                        PagerPageIndex: 0,//Index of the current set of pages to display in the pager with default to 0
                        SortBy: null,//Field name or column name to sort on
                        SortDirection: 'asc',//Sorting direction: 'asc' or 'desc'
                        PreviousText: "...",//Text to display for NEXT button on the pager
                        NextText: "...",//Text to display for PREVIOUS button on the pager
                        NoDataMessage: "No Records",//Message to display if no data returned
                        PagerJquerySelector: null,//The jQuery selector to the pager container, usually its a div
                        PagerClass: "",//Css class to be applied for the pager control
                        CurrentPageClass: "",//Css class to be applied on the current selected page in the pager
                        OnSorting: null,//Fires when a sorting happens, it provides: (SortBy, SortDirection, th column html element) data to the callback
                        OnPageChanging: null,//Fires when a page changes, it provides: (PageIndex) data to the callback
                        OnPreCellDataBinding: null,//Fires before each cell binding, it provides: (rowIndex, row, columnIndex, fieldName) data to the callback
                        OnPostCellDataBinding: null,//Fires after each cell binding, it provides: (rowIndex, row, columnIndex, fieldName, cell td) data to the callback
                        OnPreRowDataBinding: null,//Fires before each row binding, it provides: (rowIndex, row) data to the callback
                        OnPostRowDataBinding: null,//Fires after each row binding, it provides: (rowIndex, row, row tr) data to the callback
                        OnComplete: null,//Fires when the execution complete and the table is ready, it provides: (TotalRecords, PageSize, PageIndex) data to the callback
                        OnError: null,//Fires if an error occurs with the ajax call, it provides: (xhr, status, error) data to the callback
                    };

                    settings = $.extend({}, defaults, options);

                    // Save our newly created settings
                    $this.data('LegoTable', settings);
                } else {
                    // We got settings, merge our passed options in with them (optional)
                    settings = $.extend({}, settings, options);

                    // If you wish to save options passed each time, add:
                    //$this.data('LegoTable', settings);
                }

                //Build table header
                BuildHeader($this, settings);
            });
        },
        //Creates the table with and attempts to to do a POST request with content type application/json using the criteria object specified in options
        Run: function (pageSize) {
            return this.each(function () {
                //Get the instance
                var $this = $(this);

                //Get the settings
                var settings = $this.data('LegoTable');

                //Reset page index to 0 when search filter is updated
                settings.PageIndex = 0;
                settings.PagerPageIndex = 0;
                settings.PageSize = pageSize || settings.PageSize;

                //Build the table and its pager
                Execute($this, settings);
            });
        },
        //Creates the table with and attempts to to do a POST request with content type application/json using the specified criteria object
        RunWithCriteria: function (criteria, pageSize) {
            return this.each(function () {
                //Get the instance
                var $this = $(this);

                //Get the settings
                var settings = $this.data('LegoTable');

                //Reset page index to 0 when search filter is updated
                settings.PageIndex = 0;
                settings.PagerPageIndex = 0;
                settings.PageSize = pageSize || settings.PageSize;
                settings.Criteria = criteria;

                //Build the table and its pager
                Execute($this, settings);
            });
        },
        //Creates the table using the data specified, no paging functionality is supported here all specified records will be drawn in the table
        RunWithData: function (data) {
            return this.each(function () {
                //Get the instance
                var $this = $(this);

                //Get the settings
                var settings = $this.data('LegoTable');

                //Paging is not supported with this method, but we are consistent for it
                settings.PageIndex = 0;
                settings.PagerPageIndex = 0;
                settings.PageSize = 10000000;

                //Build the table and its pager
                ExecuteWithData($this, settings, data);
            });
        },
        //Refreshes the table, its useless in case of RunWithData, but supported just in case
        Refresh: function (data) {
            return this.each(function () {
                //Get the instance
                var $this = $(this);

                //Get the settings
                var settings = $this.data('LegoTable');

                //Build the table and its pager
                if (!data) {
                    Execute($this, settings);
                }
                else {
                    ExecuteWithData($this, settings, data);
                }
            });
        },
        //Clears the table
        Clear: function () {
            return this.each(function () {
                //Get the instance
                var $this = $(this);

                //Get the settings
                var settings = $this.data('LegoTable');

                //Clear table content (tbody and pager)
                Clear($this, settings);
            });
        },
        //Cleans up the table and removes the data-LegoTable options from it
        Destroy: function () {
            // Repeat over each element in selector
            return this.each(function () {
                //Get the instance
                var $this = $(this);

                //Get the settings
                var settings = $this.data('LegoTable');

                //Clear table content (tbody and pager)
                Clear($this, settings);

                //Remove settings data when deallocating our plugin
                $this.removeData('LegoTable');
            });
        },
    };

    $.fn.LegoTable = function () {
        var method = arguments[0];

        if (methods[method]) {
            method = methods[method];
            arguments = Array.prototype.slice.call(arguments, 1);
        } else if (typeof (method) == 'object' || !method) {
            method = methods.Init;
        } else {
            $.error('Method \'' + method + '\' not supported for jQuery Plugin LegoTable. \nSupported methods are: Run(Criteria JSON Object, Page Size [optional]), RunWithData(array of records to display in the table), Refresh(no parameters), Clear(no parameters), Destroy(no parameters)  ');
            return this;
        }
        return method.apply(this, arguments);
    }

    //Private Functions
    function BuildHeader($this, settings) {
        //Get columns
        var columns = $this.find('thead tr th');

        columns.each(function (columnIndex, column) {
            if ($(column).data("hide") == true) {
                $(column).hide();
            }

            //Sortable columns are the ones with 'sort' setting has a value
            if ($(column).data("sort") == 'asc' || $(column).data("sort") == 'desc') {

                //No need for this here, as we might dont want to sort anything so will make it null

                //Set the default sorting to the first column
                //if (settings.SortBy == null) {
                //    settings.SortBy = $(column).data("field");
                //    settings.SortDirection = $(column).data("sort");
                //}

                //Enable sorting for the specified sortable columns
                $(column).click(function () {
                    //Toggle the sort direction
                    $(column).data("sort", $(column).data("sort") == 'asc' ? "desc" : "asc");
                    settings.SortBy = $(column).data("field");
                    settings.SortDirection = $(column).data("sort");

                    if (settings.OnSorting != null) {
                        settings.OnSorting(settings.SortBy, settings.SortDirection, $(this));
                    }
                    //Execute to get the data and build all pieces
                    Execute($this, settings);
                });
            }
        });
    }

    function ExecuteWithData($this, settings, data) {
        //Clear content of the table
        Clear($this, settings);

        var columns = $this.find('thead tr th');
        var rows = $(data);

        //Build Table
        BuildTable($this, settings, rows, columns);

        //Build Pagination
        //BuildPagination($this, settings, $(data).length, columns.length);

        //Call on complete
        if (settings.OnComplete != null) {
            settings.OnComplete($(data).length, data.PageSize, data.PageIndex);
        }

        //Save new settings after each call to the server
        $this.data('LegoTable', settings);

        return $this;
    }

    function Execute($this, settings) {

        //Clear content of the table
        Clear($this, settings);

        var serverParams = {
            PageIndex: settings.PageIndex,
            PageSize: settings.PageSize,
            Criteria: settings.Criteria,
            SortBy: settings.SortBy,
            SortDirection: settings.SortDirection
        };

        //Get the data
        $.ajax({
            url: settings.Url, type: "POST", contentType: "application/json", data: JSON.stringify(serverParams),
            success: function (result) {
                var columns = $this.find('thead tr th');
                var rows = $(result.Data);

                //Build Table
                BuildTable($this, settings, rows, columns);

                //Build Pagination
                BuildPagination($this, settings, result.TotalRecords, columns.length);

                //Call on complete
                if (settings.OnComplete != null) {
                    settings.OnComplete(result.TotalRecords, result.PageSize, result.PageIndex);
                }

                //Save new settings after each call to the server
                $this.data('LegoTable', settings);

                return $this;
            },
            error: function (xhr, status, error) {
                if (settings.OnError != null) {
                    settings.OnError(xhr, status, error);
                }
            }
        });
    }

    function BuildTable($this, settings, rows, columns) {
        var tbody = $("<tbody></tbody>");
        rows.each(function (rowIndex, row) {
            var tr = $("<tr></tr>");
            if (settings.OnPreRowDataBinding == null) {
                tr = BuildRow($this, settings, rowIndex, row, columns);
            }
            else {
                var _htmlRow = settings.OnPreRowDataBinding(rowIndex, row);

                if (_htmlRow == null || _htmlRow == '') {
                    tr = BuildRow($this, settings, rowIndex, row, columns);
                }
                else {
                    tr.append(_htmlRow);
                }
                if (settings.OnPostRowDataBinding != null) {
                    settings.OnPostRowDataBinding(rowIndex, row, tr);
                }
            }
            tbody.append(tr);
        });

        //If no records to display show no records message
        if (rows.length == 0) {
            tbody.append(settings.NoDataMessage);
        }
        $this.append(tbody);
    }

    function BuildRow($this, settings, rowIndex, row, columns) {
        var tr = $("<tr></tr>");
        columns.each(function (columnIndex, column) {
            var fieldName = $(column).data('field');
            var fieldValue = row[fieldName];
            var td = $('<td></td>');

            //Hide the column if it has data-hide (or hidden attribute must be supported)
            if ($(column).data('hide') == true) {
                $(td).hide();
            }

            if (settings.OnPreCellDataBinding == null) {
                tr.append(td.append(fieldValue));
            }
            else {
                var _htmlCell = settings.OnPreCellDataBinding(rowIndex, row, columnIndex, fieldName);

                if (_htmlCell == null || _htmlCell == '') {
                    tr.append(td.append(fieldValue));
                }
                else {
                    tr.append(td.append(_htmlCell));
                }

                if (settings.OnPostCellDataBinding != null) {
                    settings.OnPostCellDataBinding(rowIndex, row, columnIndex, fieldName, td);
                }
            }
        });
        return tr;
    }

    function BuildPagination($this, settings, totalRecords, numberOfColumns) {
        //Skip pagination if pager doesn't exist
        if ($(settings.PagerJquerySelector).length == 0) {
            return;
        }

        //Build table pagination
        var numberOfPages = totalRecords / settings.PageSize;
        var numberOfPagerPages = numberOfPages / settings.PagerPageSize;

        var pagingContainer = $("<ul class='" + settings.PagerClass + "'></ul>");

        //Create Previous Paging if exists
        if (numberOfPagerPages > 1 && settings.PagerPageIndex > 0) {
            var pageElement = $("<li></li>");
            var aref = $("<a></a>");

            aref.html(settings.PreviousText);
            aref.data("value", settings.PagerPageIndex * settings.PagerPageSize);
            aref.click(function () {
                //Update current pager page
                settings.PagerPageIndex = settings.PagerPageIndex - 1;

                //Update current page to new page just clicked
                settings.PageIndex = settings.PagerPageIndex * settings.PagerPageSize;

                //Raise page changing event
                if (settings.OnPageChanging != null) {
                    settings.OnPageChanging(settings.PageIndex);
                }

                //Execute to get the data and build all pieces
                Execute($this, settings);
            });

            pageElement.append(aref);
            pagingContainer.append(pageElement);
        }

        //Get number of pages will be displayed in the current pager page
        var numberOfPagesPerCurrentPage = (settings.PagerPageSize <= numberOfPages - settings.PagerPageIndex * settings.PagerPageSize) ?
            settings.PagerPageSize : numberOfPages - settings.PagerPageIndex * settings.PagerPageSize;

        for (var i = settings.PagerPageIndex * settings.PagerPageSize; i < (settings.PagerPageIndex * settings.PagerPageSize) + numberOfPagesPerCurrentPage ; i++) {
            var pageElement = $("<li></li>");
            var aref = $("<a></a>");

            aref.html((i + 1));
            aref.data("value", i);

            //Disallowing click on the active current page and set the provided class for it
            if (settings.PageIndex == i) {
                pageElement.addClass(settings.CurrentPageClass);
            }
            else {
                aref.click(function () {
                    //Update current page to new page just clicked
                    settings.PageIndex = $(this).data("value");

                    //Raise page changing event
                    if (settings.OnPageChanging != null) {
                        settings.OnPageChanging(settings.PageIndex);
                    }

                    //Execute to get the data and build all pieces
                    Execute($this, settings);
                });
            }
            pageElement.append(aref);
            pagingContainer.append(pageElement);
        }

        //Create Next Paging if exists
        if (numberOfPagerPages > 1 && numberOfPagerPages > settings.PagerPageIndex + 1) {
            var pageElement = $("<li></li>");
            var aref = $("<a></a>");

            aref.html(settings.NextText);
            aref.data("value", settings.PagerPageIndex * settings.PagerPageSize);
            aref.click(function () {
                //Update current pager page
                settings.PagerPageIndex = settings.PagerPageIndex + 1;

                //Update current page to new page just clicked
                settings.PageIndex = settings.PagerPageIndex * settings.PagerPageSize;

                //Raise page changing event
                if (settings.OnPageChanging != null) {
                    settings.OnPageChanging(settings.PageIndex);
                }

                //Execute to get the data and build all pieces
                Execute($this, settings);
            });
            pageElement.append(aref);
            pagingContainer.append(pageElement);
        }

        $(settings.PagerJquerySelector).append(pagingContainer);
    }

    function Clear($this, settings) {
        //Clear table body content
        $this.find('tbody').remove();
        //Clear pager content
        $(settings.PagerJquerySelector).empty();
    }

})(jQuery);
