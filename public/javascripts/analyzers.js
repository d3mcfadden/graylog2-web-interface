$(document).ready(function() {

    $(".open-analyze-field").on("click", function(e) {
        e.preventDefault();

        $(".analyze-field", $(this).parent()).toggle();
        $(this).toggleClass("open-analyze-field-active");
    });

    $(".analyze-field .generate-statistics").on("click", function(e) {
        e.preventDefault();

        var container = $(this).parent();
        $(this).attr("disabled", "disabled");

        showStatistics($(this).attr("data-field"), container);
    })

    $(".analyze-field .show-quickvalues").on("click", function(e) {
        if ($(this).attr("disabled") == "disabled") {
            return;
        }

        e.preventDefault();

        // Hide and disable all others.
        $(".quickvalues").hide();
        $(".show-quickvalues").removeAttr("disabled");
        $(".quickvalues").attr("data-active", "false");

        // Mark this one as active.
        $(".quickvalues", $(this).parent()).attr("data-active", "true");

        $(this).attr("disabled", "disabled");

        showQuickValues($(this).attr("data-field"), $(this).parent(), true, calculateDirection($(this)), true);
    });

    $(".quickvalues .quickvalues-refresh").on("click", function(e) {
        e.preventDefault();

        var button = $(".analyze-field .show-quickvalues[data-field=" + $(this).attr("data-field") + "]");
        var quickvalues = $(".quickvalues[data-field=" + $(this).attr("data-field") + "]");

        showQuickValues($(this).attr("data-field"), quickvalues.parent(), true, calculateDirection(button), false);
    });

    $(".quickvalues .quickvalues-export").on("click", function(e) {
        e.preventDefault();

        // TODO
        alert("Exporting statistics is not implemented yet. (Issue: #239)");
    });

    $(".quickvalues .quickvalues-close").on("click", function(e) {
        e.preventDefault();

        var quickvalues = $(".quickvalues[data-field=" + $(this).attr("data-field") + "]");
        var button = $(".analyze-field .show-quickvalues[data-field=" + $(this).attr("data-field") + "]");

        button.removeAttr("disabled");

        quickvalues.attr("data-active", "false");
        quickvalues.hide();
    });

    $(".quickvalues .quickvalues-autorefresh").on("click", function(e) {
        e.preventDefault();
        var quickvalues = $(".quickvalues[data-field=" + $(this).attr("data-field") + "]");;

        if ($(this).hasClass("active")) {
            // Disabling autorefresh.
            quickvalues.attr("data-autorefresh", "false");
            $(this).removeClass("active");
        } else {
            // Enabling autorefresh.
            quickvalues.attr("data-autorefresh", "true");
            $(this).addClass("active");

            // Load once to trigger reload cycle again.
            var button = $(".analyze-field .show-quickvalues[data-field=" + $(this).attr("data-field") + "]");
            showQuickValues($(this).attr("data-field"), quickvalues.parent(), true, calculateDirection(button), true);
        }
    });

    function showStatistics(field, container) {
        var statistics = $(".statistics", container);

        // TODO: deduplicate
        var rangeType = $("#universalsearch-rangetype-permanent").text();
        var query = $("#universalsearch-query-permanent").text();

        var params = {
            "rangetype": rangeType,
            "q": query,
            "field": field
        }

        switch(rangeType) {
            case "relative":
                params["relative"] = $("#universalsearch-relative-permanent").text();
                break;
            case "absolute":
                params["from"] = $("#universalsearch-from-permanent").text();
                params["to"] = $("#universalsearch-to-permanent").text();
                break;
            case "keyword":
                params["keyword"] = $("#universalsearch-keyword-permanent").text();
                break;
        }

        $.ajax({
            url: '/a/search/fieldstats',
            data: params,
            success: function(data) {
                statistics.show();
                $(".analyzer-content", container).show();
                $("dd.count", statistics).text(data.count);
                $("dd.mean", statistics).text(data.mean.toFixed(2));
                $("dd.stddev", statistics).text(data.std_deviation.toFixed(2));
                $("dd.min", statistics).text(data.min);
                $("dd.max", statistics).text(data.max);
                $("dd.sum", statistics).text(data.sum.toFixed(2));
                $("dd.variance", statistics).text(data.variance.toFixed(2));
                $("dd.squares", statistics).text(data.sum_of_squares.toFixed(2));
            },
            statusCode: { 400: function() {
                $(".wrong-type", statistics).show();
                statistics.show();
            }},
            error: function(data) {
               if(data.status != 400) {
                    statistics.hide();
                    showError("Could not load field statistics.");
               }
            },
            complete: function() {
                $(".spinner", container).hide();
            }
        });
    }

    function showQuickValues(field, container, manualReload, direction, reload) {
        var quickvalues = $(".quickvalues", container);

        // Never update anything if this is a non-visible reload and we are not active or auto-refresh is disabled.
        // Prevents unneeded calculations when the windows is hidden and auto-refresh is enabled.
        if (reload && (quickvalues.attr("data-active") != "true" || quickvalues.attr("data-autorefresh") == "false")) {
            return;
        }

        var inlineSpin = "<i class='icon icon-spinner icon-spin'></i>";

        if (manualReload) {
            $(".terms-total", quickvalues).html(inlineSpin);
            $(".terms-missing", quickvalues).html(inlineSpin);
            $(".terms-other", quickvalues).html(inlineSpin);

            $(".terms tbody", quickvalues).empty();
            $(".terms tbody", quickvalues).append("<tr><td colspan='3'>" + inlineSpin + "</td></tr>");

            $(".terms-distribution", quickvalues).hide();
        }

        switch(direction)  {
            case "up":
                quickvalues.removeClass("quickvalues-down");
                quickvalues.addClass("quickvalues-up");
                break;
            case "down":
                quickvalues.removeClass("quickvalues-up");
                quickvalues.addClass("quickvalues-down");
                break;
        }

        quickvalues.show();

        /*
         * TODO:
         *
         *   - show button as selected, second click closes again
         *   - min.js.map
         *   - do not fail on huge numbers (long cast fail)
         *
         */

        if(reload) {
            $(".quickvalues-autorefresh", quickvalues).addClass("loading");
        }

        var rangeType = $("#universalsearch-rangetype-permanent").text();
        var query = $("#universalsearch-query-permanent").text();

        var params = {
            "rangetype": rangeType,
            "q": query,
            "field": field
        }

        switch(rangeType) {
            case "relative":
                params["relative"] = $("#universalsearch-relative-permanent").text();
                break;
            case "absolute":
                params["from"] = $("#universalsearch-from-permanent").text();
                params["to"] = $("#universalsearch-to-permanent").text();
                break;
            case "keyword":
                params["keyword"] = $("#universalsearch-keyword-permanent").text();
                break;
        }

        $.ajax({
            url: '/a/search/fieldterms',
            data: params,
            success: function(data) {
                $(".terms-total", quickvalues).text(data.total);
                $(".terms-other", quickvalues).text(data.other);
                $(".terms-missing", quickvalues).text(data.missing);

                // Remove all items before writing again.
                $(".terms tbody", quickvalues).empty();
                $(".terms-distribution", quickvalues).empty();

                $(".terms-distribution", quickvalues).show();

                var colors = d3.scale.category20c();

                sortedKeys = Object.keys(data.terms).sort(function(a,b){return data.terms[b] - data.terms[a]});

                for(var i = 0; i < sortedKeys.length; i++){
                    var key = sortedKeys[i];
                    var val = data.terms[key];

                    var percent = (val/data.total*100);

                    $(".terms tbody", quickvalues).append("<tr data-i='" + i + "' data-name='" + key + "'><td>" + key + "</td><td>" + percent.toFixed(2) + "%</td><td>" + val + "</td></tr>");
                    $(".terms-distribution", quickvalues).append("<div class='terms-bar terms-bar-" + i + "' style='width: " + percent + "%; background-color: " + colors(i) + ";'></div>");
                }
            },
            error: function(data) {
                if(data.status != 400) {
                    quickvalues.hide();
                    showError("Could not load quick values.");
                }
            },
            complete: function() {
                $(".nano").nanoScroller();

                if (reload) {
                    // Loading complete. Set autoreload button to old color again.
                    $(".quickvalues-autorefresh", quickvalues).removeClass("loading");

                    // Call everything again in 2.5sec
                    setTimeout(function() {
                        showQuickValues(field, container, false, direction, true);
                    }, 3000)
                }
            }
        });
    }

    // Quickterms table row highlighting.
    $(".quickvalues .terms tbody tr")
        .live("mouseenter", highlightTermsBar)
        .live("mouseleave", resetTermsBar);

    function highlightTermsBar() {
        var bar = $(".terms-bar-" + $(this).attr("data-i"));
        bar.attr("data-original-color", bar.css("background-color"));
        bar.css("background-color", "#dd514c");
    }

    function resetTermsBar() {
        var bar = $(".terms-bar-" + $(this).attr("data-i"));
        bar.css("background-color", bar.attr("data-original-color"));
    }

    function calculateDirection(linkel) {
        if (($(window).height() - linkel.offset().top) < 400) {
            return "up";
        } else {
            return "down";
        }
    }

});