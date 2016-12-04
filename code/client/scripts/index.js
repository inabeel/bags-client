var g_api = 'https://bags-api.zoltu.com',
g_result_from_product_id = 1,
g_tags = [], //holds selected tags
g_tagsData = [], //holds tags data returned by api
g_page_count = 24, //number of items to load by each api (by_tags) call
newFilterApplied = true, //indicates that a filter applied which should reload the bags data
currentRequest = null,
g_price_min = 0,
g_price_max = 10000,
g_price_max_limit = 10000,
g_open_productid = 0,
g_popupOpened = false,
g_hashchanged = false,
g_manual_tag_change = true, //This indicates that url hash is changed manually (and not by back/forward of browser)
g_load_bags = true, //This verify whether to load bags or not while Url hash changes
g_load_popup = true, //This verify whether to load popup or not while Url hash changes
g_aboutus_open = false,
visibleTagCnt = 5, //number of visible tags on each product tile
sliderInterval,
sliderRunning = false,
overSlider = false,
page_loaded = false,
trigger_tags_change = true,
g_popup_just_closed = false,
g_tag_changed_when_popup_open = false,
helptour_running = false, //Turns to true during the Help tour running
helptour_instance, //Help tour instance
search_matching_tags = [], //Holds the matching tags for smart search
full_keyword_str = "", //This holds the original search text when user hit "Enter" key in search box
duplicate_conflicts = [],
partial_conflicts = [],
top_menu_hidden = false;

$(document).ready(function () {

    page_loaded = true;

    //Help button sliding
    $(".btn-floating.help .icon").on('mouseenter', function () {
        if (localStorage.getItem("helptour-seen") == "true") {
            $(".btn-floating.help").addClass("push");
        }
    });
    $(".btn-floating.help").on('mouseleave', function () {
        if (localStorage.getItem("helptour-seen") == "true") {
            $(".btn-floating.help").removeClass("push");
        }
    });

    $(".btn-floating.share").on('mouseenter', function () {
        if (!$('html').hasClass('ismobile')) {
            $(".btn-floating.share").addClass("push");
        }
    });
    $(".btn-floating.share").on('mouseleave', function () {
        $(".btn-floating.share").removeClass('open');
        $(".btn-floating.share").removeClass("push");
    });

    $(".btn-floating.feedback").on('mouseenter', function () {
        $(".btn-floating.feedback").addClass("push");
    });
    $(".btn-floating.feedback").on('mouseleave', function () {
        $(".btn-floating.feedback").removeClass("push");
    });

    setTimeout(function () {
        $(".banner .caption-text").addClass("animated animated-short zoomIn").show();
    }, 1000);
}).scroll(function () {
    if (page_loaded == true) {
        if ($(document).scrollTop() <= 24) {
            if (g_popupOpened == false && helptour_running == false) {
                $("#header").removeClass("push");
            }
        }
        if ($(document).scrollTop() > 200) {
            $("#header").addClass("push");
        }
    }
});

$(window).resize(function () {
    if (g_popupOpened == true) {
        if ($("#product-popup-right-column").height() <= 370) {
            if (!$('html').hasClass('ismobile')) {
                $("#product-popup-right-column").css('min-height',370);
                $("#product-popup-right-column .product-popup-buttons").css("position", "absolute");
            }
        }
        else {
            $("#product-popup-right-column").css('min-height', "initial");
            $("#product-popup-right-column .product-popup-buttons").css("position", "initial");
        }
    }
})

Handlebars.registerHelper("colorTag", function (categoryid) {
    if ($('body').hasClass('design-v2'))
        return "teal"
    else
       return fnColorTag(categoryid);
});

Handlebars.registerHelper("isSelected", function (categoryid) {
    var selected = false;
    for (var i = 0; i < g_tags.length; i++) {
        if (categoryid == g_tags[i])
            selected = true;
    }
    if (selected) {
        return "tag-hidden";
    }
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('isLengthOf', function (array, operator, length, options) {
    if (array != null) {
        switch (operator) {
            case '==':
                return (array.length == length) ? options.fn(this) : options.inverse(this);
            case '<':
                return (array.length < length) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (array.length <= length) ? options.fn(this) : options.inverse(this);
            case '>':
                return (array.length > length) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (array.length >= length) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    }
    else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('countMoreLength', function (array) {
    return array.length - visibleTagCnt;
});

Handlebars.registerHelper('titleCase', function (name) {
    return name.substr(0, 1).toUpperCase() + name.substr(1);
});

Handlebars.registerHelper('getBrandName', function (tags) {
    return Enumerable.From(tags).Where(w=>w.category.name == "brand").Select(s => s.name).Single();
});

Handlebars.registerHelper('categoryIcon', function (name) {
    var cssClass = "";
    switch (name) {
        case 'accents':
            return cssClass = "fa-star"
        case 'brand':
            return cssClass = "fa-tag"
        case 'closure':
            return cssClass = "fa-chain"
        case 'color':
            return cssClass = "fa-adjust"
        case 'handle':
            return cssClass = "fa-hand-grab-o"
        case 'material':
            return cssClass = "fa-cog"
        case 'misc':
            return cssClass = "fa-sliders"
        case 'pattern':
            return cssClass = "fa-diamond"
        case 'size':
            return cssClass = "fa-object-ungroup"
        case 'strap':
            return cssClass = "fa-circle-o-notch fa-rotate-180 mln15 mr15"
        case 'style':
            return cssClass = "fa-shopping-bag"
    }
});

function fnColorTag(categoryid) {
    var color = '';
    $.each(g_categories, function (index, category) {
        if (category.id == categoryid) {
            color = category.color;
            return;
        }
    });
    return color;
}

var category_colors = ["bgm-red", "bgm-blue", "bgm-green", "bgm-lightgreen", "bgm-cyan", "bgm-pink", "bgm-lightblue",
    "bgm-orange", "bgm-purple", "bgm-deeporange", "bgm-teal", "bgm-amber", "bgm-gray", "bgm-indigo", "bgm-lime", "bgm-bluegray", "bgm-deeppurple"];

var g_categories = [];

$(function () {

    ShowPageLoader();
    
    var xhr_tag_cat = createXHR();
    xhr_tag_cat.open("GET", g_api + '/api/tag_categories', true);
    xhr_tag_cat.onreadystatechange = function () {
        if (xhr_tag_cat.readyState == 4 && xhr_tag_cat.status == 200) {
            var cats = JSON.parse(xhr_tag_cat.responseText);

            //assign each category a color
            $.each(cats, function (index, cat) {
                var category = cat;
                category.color = category_colors[index];
                g_categories.push(category);
            });

            getTags();

            //bind categories in side filter
            var template = Handlebars.templates['filter-category'];
            $(".side-categories").append(template({ categories: Enumerable.From(cats).OrderBy("$.name").ToArray() }));
           
            $('.side-categories').mCustomScrollbar({
                theme: 'minimal-dark',
                scrollInertia: 100,
                axis: 'yx',
                mouseWheel: {
                    enable: true,
                    axis: 'y',
                    preventDefault: true
                }
            });
        }
    }
    xhr_tag_cat.send();
});

function ProcessUrlParams() {
    var path = window.location.pathname;

    var productId = (path.match(/product\/(\d+)/i) || [])[1];
    var aboutUs = (path.match(/aboutus/i) || [])[0];
    var tags = (path.match(/tags\/(.*?)\/*?$/i) || [])[1];
    var minPrice = (path.match(/minprice\/(\d+)/i) || [])[1];
    var maxPrice = (path.match(/maxprice\/(\d+)/i) || [])[1];

    // price
    g_price_min = minPrice || 0;
    g_price_max = maxPrice || g_price_max_limit;
    if (g_price_min == 0 && g_price_max == g_price_max_limit) {
        $("#min_max_selected").hide();
        $("#lbl_price_filter").show();
    }
    else {
        $("#min_max_selected").show();
        $("#lbl_price_filter").hide();
    }
    stepSlider.noUiSlider.set([g_price_min, g_price_max]);
    $("#lbl_min_price").html('<i class="zmdi zmdi-money"></i>' + g_price_min);
    $("#lbl_max_price").html(g_price_max == g_price_max_limit ? 'any' : '<i class="zmdi zmdi-money"></i>' + g_price_max);

    if (!productId)
        $.magnificPopup.close();

    // open product
    g_open_productid = productId
    if (g_popupOpened == false && g_load_popup && productId > 0)
        ShowProductPopup(g_open_productid);

    // about us
    $(".about-section").hide();
    $(".bags-section").show();

    if (aboutUs) {
        $(".bags-section").fadeOut("fast", function () {
            $(".about-section").fadeIn("fast");
        });
    }
    
    // tags
    g_tags = (tags || "").split("_");
    if (g_tags.length == 1 && g_tags[0] == "")
        g_tags = [];
    trigger_tags_change = false;
    $("#main-search").val(null);
    trigger_tags_change = true;
    if (g_manual_tag_change == true) {
        for (var i = 0; i < g_tags.length; i++) {
            $("#main-search option[value=" + g_tags[i] + "]").attr('selected', true);
            $("#main-search option[value=" + g_tags[i] + "]").prop('selected', true);
        }
        $("#main-search").trigger("change");
    }
    else {
        if (g_load_bags)
            GetProducts();
    }
}

$(window).on('hashchange', function () {
    g_load_popup = true;
    if (!(g_popup_just_closed == true && g_tag_changed_when_popup_open == false)) {
        ShowPageLoader();
        newFilterApplied = true;
        g_manual_tag_change = true;
        if (g_load_bags)
            g_result_from_product_id = 1;
        ProcessUrlParams();
    }
    else {
        g_manual_tag_change = false;
    }
    g_popup_just_closed = false;
});

//Price slider
var stepSlider = document.getElementById('price-slider');

noUiSlider.create(stepSlider, {
    start: [0, g_price_max],
    step: 1,
    tooltips: true,
    range: {
        'min': 0,
        'max': 1001
    },
    format: {
        to: function (value) {
            if (value >= 1001)
                return ">&nbsp;$1000";
            else
                return '$' + Math.round(value);
        },
        from: function (value) {
            return value.replace('$', '');
        }
    }
});

stepSlider.noUiSlider.on("change", function (texts, btn_index, values) {
    //Change global values for Price

    g_price_min = Math.round(values[0]);
    if (g_price_min > g_price_max) {
        g_price_max = g_price_max_limit;
    }

    g_price_max = (values[1] == 1001) ? 10000 : Math.round(values[1]);
    if (g_price_min > g_price_max) {
        g_price_min = 0;
    }
    BuildUrlHash();

});

var handleLower = stepSlider.querySelector('.noUi-handle-lower');
var handleUpper = stepSlider.querySelector('.noUi-handle-upper');

handleLower.setAttribute('tabindex', 0);
handleUpper.setAttribute('tabindex', 0);

handleLower.addEventListener('click', function () {
    this.focus();
});
handleUpper.addEventListener('click', function () {
    this.focus();
});

handleLower.addEventListener('keydown', function (e) {
    switch (e.which) {
        case 37:
            g_price_min--;
            BuildUrlHash();
            break;
        case 39:
            g_price_min++;
            BuildUrlHash();
            break;
    }
});
handleUpper.addEventListener('keydown', function (e) {
    switch (e.which) {
        case 37:
            if (g_price_max == g_price_max_limit) {
                g_price_max = 1000;
            }
            g_price_max--;
            BuildUrlHash();
            break;
        case 39:
            g_price_max++;
            BuildUrlHash();
            break;
    }
});

function getTags() {
    var xhr_tags = createXHR();
    xhr_tags.open("GET", g_api + '/api/tags', true);
    xhr_tags.onreadystatechange = function () {
        if (xhr_tags.readyState == 4 && xhr_tags.status == 200) {
            var tags = JSON.parse(xhr_tags.responseText);

            g_tagsData = $.map(tags, function (obj, index) {
                obj.id = obj.id;
                obj.text = "#" + obj.category.name + ": " + obj.name;
                return obj;
            });

            $("#main-search").on("change", function (e) {
                if (trigger_tags_change) {
                    newFilterApplied = true;
                    if (g_manual_tag_change == true) {
                        if (!g_popupOpened) {
                            if (g_load_bags) {
                                //reseting product id to 1 to fetch result from start
                                g_result_from_product_id = 1;
                                GetProducts();
                            }
                        }
                    }
                    else {
                        g_tags = $("#main-search").val();
                        BuildUrlHash();
                    }
                }

               
            });

            $("#main-search").on("select2:unselect", function (e) {
                if (g_popupOpened)
                    g_load_popup = false;
                $("#main-search option[value='" + e.params.data.id + "'").prop('selected', false);
                $("#main-search").trigger("change");
                $("#pnl_confirm_tags").empty().hide();
            });

            //Load all tags in the search
            loadTags();

            //Populate brands filter
            var brands = Enumerable.From(g_tagsData).Where(w=>w.category.name == "brand").OrderBy(o=>o.name).ToArray();
            var template = Handlebars.templates['filter-brands'];
            $(".brands-list").html(template({ brands: brands }));
            $(".brands-list > .listview > .lv-body > a").on("keyup", function (event) {
                if (event.key == "ArrowDown") {
                    $(this).next("a").focus();
                }
                if (event.key == "ArrowUp") {
                    $(this).prev("a").focus();
                }
            });
        }
    }
    xhr_tags.send();
}

function loadTags() {

    $("#main-search").select2({
        placeholder: "e.g.: small black crossbody michael kors",
        data: g_tagsData,
        closeOnSelect: true,
        minimumInputLength: 0,
        allowClear: true,
        templateSelection: function (data, a) {
            if ($('body').hasClass('design-v2')) { } else {
                a.addClass(fnColorTag(data.category_id));
            }
            return data.text;
        },
        dropdownParent: $(".search-container"),
        matcher: function (term, option) {
            if (typeof term.term != 'undefined') { //has terms
                if (/\S/.test(term.term)) { //if empty or spaces
                    if (option.name.toUpperCase().indexOf(term.term.toUpperCase()) >= 0
                        || option.category.name.toUpperCase().indexOf(term.term.toUpperCase().replace(/#/g,"")) >= 0
                        || option.text.toUpperCase().indexOf(term.term.toUpperCase().replace(/#/g,"")) >= 0) {
                        return option;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else {
                return null;
            }
        },
    });

    $("#main-search").on('select2:select', function (evt) {
        $(".select2-search__field").val('');
    });

    $(document).on('keyup keypress keydown', ".select2-search__field", function (e) {
        if (e.which == 13) {
            ExecuteSmartSearch(e.target);
        }
    });

    ProcessUrlParams();
}

function ShowMore() {
    ShowPageLoader();

    newFilterApplied = false;

    //Disabling Show More button
    $("#show-more-panel button").attr("disabled", true);

    //Loading button
    $("#show-more-panel button").html("Wait a moment..");

    //Fetch Product
    GetProducts();
}

function GetProducts() {

    g_load_bags = true;
    //Show bags view in case About us is openend

    g_manual_tag_change = false;

    g_tag_changed_when_popup_open = false;

    var api = g_api + '/api/products/by_tags?starting_product_id=' + g_result_from_product_id + '&products_per_page=' + g_page_count +
        '&min_price=' + g_price_min + '&max_price=' + g_price_max;

    //Use selected tags as parameters for api
    if (g_tags && g_tags.length > 0) {
        var tagids = [];
        for (var i = 0; i < g_tags.length; i++) {
            tagids.push("tag_id=" + g_tags[i]);
        }
        api += "&" + tagids.join("&");
    }

    //Call api to get products;

    if (currentRequest && currentRequest.readyState != 4) {
        currentRequest.abort();
    }

    currentRequest = createXHR();
    currentRequest.open("GET", api, true);
    currentRequest.onreadystatechange = function () {
        if (currentRequest.readyState == 4 && currentRequest.status == 200)
        {
            var data = JSON.parse(currentRequest.responseText);

            //Setting product id to fetch next result from
            if (data.length > 0) {
                data = RemoveSelectedTags(data);
                g_result_from_product_id = data[data.length - 1].id + 1
            }

            //Initialize product template
            var template = Handlebars.templates['product'];

            //Remove Show More button if already exists
            if ($("#show-more-panel"))
                $("#show-more-panel").remove();

            //Bind products on UI

            if (newFilterApplied) {
                
                $(".product-list").html(template({ products: data }));
               
                if (helptour_running == false) {
                    if ($('body').hasClass('design-v2')) {
                        if (window.location.pathname != "/" && window.location.pathname != "/#" && window.location.pathname != "/app") {
                            $(".banner").hide();
                        }
                        else {
                            $(".banner").show();
                        }
                    }
                    //Add more top padding to bags list so it doesn't go behind expanded header

                    if ($('body').hasClass('design-v2')) {
                        if (window.location.pathname != "/" && window.location.pathname != "/#" && window.location.pathname != "/app") {
                            $("#main").css("padding-top", $("#top-search-wrap > .container").height() + 40 + "px");
                            if ($('body').scrollTop() > 25)
                                $('body').scrollTop(25);
                        }
                        else {
                            $("#main").css("padding-top", "50px");
                            $('body').scrollTop(0);
                        }
                    }
                    else {
                        $("#main").css("padding-top", $("#top-search-wrap > .container").height() + 40 + "px");

                        if ($('body').scrollTop() > 25)
                            $('body').scrollTop(25);
                    }
                }
            }
            else
                $(".product-list").append(template({ products: data }));

            //Remove animation class (after animation completes)
            setTimeout(function () {
                $(".product-list > div > .card,animated").removeClass("animated fadeInUp");
            },2000);

            newFilterApplied = false;

            PrepareWaves();

            //Append Show More button
            if (data.length >= g_page_count) {
                var template = Handlebars.templates['show-more'];
                $(".product-list").append(template({}));
            }

            //Click event on Tags
            $(".product-list .product-card .card-body .tag:not('.event-binded')").on("click", function () {
                g_load_bags = true;
                flyToElement($(this), $('#centerpoint_search'));

                if ($.inArray($(this).attr('tag-id'), g_tags) < 0) {
                    if (g_tags == null) g_tags = [];
                    g_tags.push($(this).attr('tag-id'));
                }
                BuildUrlHash();
            }).addClass("event-binded");

            //initialize owl-carousel
            $(".product-list .product-card .card-header .owl-carousel:not('.event-binded')").owlCarousel({
                items: 1,
                responsive: false,
                slideSpeed: 500,
                lazyLoad: true,
                navigation: true,
                navigationText: [
                  "<i class='fa fa-chevron-left'></i>",
                  "<i class='fa fa-chevron-right'></i>"
                ],
            }).addClass("event-binded");

            //Initialize sliding images for each product

            if (!$('html').hasClass('ismobile')) {
                $(".owl-carousel .owl-wrapper-outer").on("mouseover", function (obj) {
                    if (sliderRunning == false && overSlider == false) {
                        sliderRunning = true;
                        sliderInterval = setInterval(function () {
                            $(obj.currentTarget).parent(".owl-carousel").data('owlCarousel').next();
                        }, 1500);
                    }
                }).on("mouseleave", function () {
                    sliderRunning = false;
                    clearInterval(sliderInterval);
                });

                $(".owl-buttons > div").on("mouseenter", function () {
                    overSlider = true;
                    clearInterval(sliderInterval);
                    sliderRunning = false;
                }).on("mouseleave", function () {
                    overSlider = false;
                });

                $(".product-list .product-card .owl-wrapper > .owl-item > a > img").on("mousedown", function () {
                    overSlider = true;
                    clearInterval(sliderInterval);
                    sliderRunning = false;
                }).on("mouseup", function () {
                    overSlider = false;
                });
            }

            //Hide Page Loader
            HidePageLoader();

            //Show Banner Button
            setTimeout(function () {
                $(".banner .down-arrow").addClass("animated fadeInDown").show();
            });
            
            //Reset
            g_hashchanged = false;

            //Show Help tour button
            $(".help-slider").css("visibility", "visible");
            if (localStorage.getItem("helptour-seen") != "true") {
                if (!helptour_running) {
                    if ($(".help-slider-clone").css('display') != "none") {
                        if (!$(".help-slider-clone").find('div.popover:visible').length) {
                            //notification is not yet visible
                            setTimeout(function () {
                                $(".help-slider-clone").popover("show");
                            }, 2000);
                        }
                    }
                    else {
                        setTimeout(function () {
                            $(".help-btn-mobile").popover("show");
                        }, 2000);
                    }
                }
            }
        }
    };
    currentRequest.send();
}

function ShowPageLoader() {
    $('.page-loader').show();
}

function HidePageLoader() {
    $('.page-loader').hide();
}

function BuildUrlHash() {
    
    var path = "/app";
    if (g_aboutus_open == true)
        path += "/aboutus";
    if (g_open_productid > 0)
        path += "/product/" + g_open_productid;
    if (g_price_min != 0)
        path += "/minprice/" + g_price_min;
    if (g_price_max != g_price_max_limit)
        path += "/maxprice/" + g_price_max;
    if (g_tags != null && g_tags.length > 0)
        path += "/tags/" + g_tags.join("_");
    window.history.pushState({ url: path }, "", path);
}

(function (history) {
    var pushState = history.pushState;
    history.pushState = function (state) {
        pushState.apply(history, arguments);

        if (typeof history.onpushstate == "function") {
            history.onpushstate({ state: state });
        }
        g_load_popup = true;
        if (!(g_popup_just_closed == true && g_tag_changed_when_popup_open == false)) {
            ShowPageLoader();
            newFilterApplied = true;
            g_manual_tag_change = true;
            if (g_load_bags)
                g_result_from_product_id = 1;
            ProcessUrlParams();
        }
        else {
            g_manual_tag_change = false;
        }
        g_popup_just_closed = false;
    }
})(window.history);

window.onpopstate = function (event) {
    g_load_popup = true;
    if (!(g_popup_just_closed == true && g_tag_changed_when_popup_open == false)) {
        ShowPageLoader();
        newFilterApplied = true;
        g_manual_tag_change = true;
        if (g_load_bags)
            g_result_from_product_id = 1;
        ProcessUrlParams();
    }
    else {
        g_manual_tag_change = false;
    }
    g_popup_just_closed = false;
};

function TriggerProductPopup(productid) {
    if (!helptour_running) {
        g_open_productid = productid;
        g_load_bags = false;
        BuildUrlHash();
    }
}

function ShowProductPopup(productid) {
    var xhr_product = createXHR();
    xhr_product.open("GET", g_api + '/api/products/' + productid, true);
    xhr_product.onreadystatechange = function () {
        if (xhr_product.readyState == 4 && xhr_product.status == 200) {
            var product = JSON.parse(xhr_product.responseText);
            var template = Handlebars.templates['product-details'];
            document.title = product.name.substr(0, 1).toUpperCase() + product.name.substr(1) + " : $" + product.price;
            $.magnificPopup.open({
                closeBtnInside: true,
                removalDelay: 500,
                closeOnContentClick: false,
                items: {
                    src: template(product),
                    type: 'inline'
                },
                callbacks: {
                    beforeOpen: function () {
                        $("body").addClass("showing-product");
                        HidePageLoader();
                        this.st.mainClass = "mfp-zoom-in";
                    },
                    beforeClose: function () {
                        g_open_productid = 0;
                        g_load_bags = true;
                        g_load_popup = false;
                        g_popupOpened = false;
                        g_popup_just_closed = true;
                        g_manual_tag_change = true;
                        
                    },
                    close: function () {
                        BuildUrlHash();
                        document.title = "Zoltu Bags";
                        HidePageLoader();
                        $("body").removeClass("showing-product");
                    },
                    open: function () {
                        g_popupOpened = true;
                        //Click event on Tags
                        $(".product-popup .product-tags .tag:not('.event-binded')").on("click", function () {
                            //this will allow data reload + the scrolling up the page after popup is closed, because tags are changed
                            g_tag_changed_when_popup_open = true;
                            g_load_bags = true;
                            g_load_popup = false;
                            g_manual_tag_change = true;
                            flyToElement($(this), $('#centerpoint_search'));

                            if ($.inArray($(this).attr('tag-id'), g_tags) < 0) {
                                if (g_tags == null) g_tags = [];
                                g_tags.push($(this).attr('tag-id'));
                            }
                            BuildUrlHash();
                        }).addClass("event-binded");

                        if (!$('html').hasClass('ismobile')) {
                            if ($("#product-popup-right-column").height() < 370) {
                                $("#product-popup-right-column").css('min-height', 370);
                                $("#product-popup-right-column .product-popup-buttons").css("position", "absolute");
                            }
                            setTimeout(function () {
                                $('#product-popup [data-imagezoom]').imageZoom();
                            },1000);
                        }
                      
                        $(".mfp-wrap").removeAttr("tabindex");
                        g_load_bags = true;
                        PrepareWaves();
                    }
                }
            });
        }
    }
    xhr_product.send();
}

function ThumbnailScroll(direction) {
    if (direction == "left") {
        $(".product-popup .carousel .thumbnail-scroll").stop().animate({ 'scrollLeft': $(".product-popup .carousel .thumbnail-scroll").scrollLeft() - 70 }, { duration: 200, queue: false });
    }
    if (direction == "right") {
        $(".product-popup .carousel .thumbnail-scroll").stop().animate({ 'scrollLeft': $(".product-popup .carousel .thumbnail-scroll").scrollLeft() + 70 }, { duration: 200, queue: false });
    }
}

function ChangeHashForPrice(bound, amount) {
    g_load_bags = true;
    //Change global values for Price
    if (bound == "min") {
        g_price_min = amount;
        if (g_price_min > g_price_max) {
            g_price_max = g_price_max_limit;
        }
    }
    else {
        g_price_max = amount;
        if (g_price_min > g_price_max) {
            g_price_min = 0;
        }
    }
    BuildUrlHash();
}

function ResetPriceFilter() {
    g_price_min = 0;
    g_price_max = g_price_max_limit;
    g_load_bags = true;
    BuildUrlHash();
}

function ShowAboutUsView() {
    g_aboutus_open = true;
    BuildUrlHash();
}

function ShowBagsView() {
    g_aboutus_open = false;
    BuildUrlHash();
}

function ShowHelpTour() {

    //initialize instance
    helptour_instance = new EnjoyHint({
        onStart: function () {
            helptour_running = true;
            setTimeout(function () {
                $(".help-slider-clone").popover("destroy");
                $(".help-slider").removeClass("animated animated-short slideInRight").addClass("animated animated-short slideOutRight");
                $(".btn-floating").css("visibility", "hidden");
            }, 1000);
        },
        onSkip: function () {
            helptour_running = false;
            $.magnificPopup.close();
            localStorage.setItem("helptour-seen", "true");
            $("#main-search").val("");
            $("#main-search").select2("val", "");
            $("#main-search").trigger("change");
            setTimeout(function () {
                $(".btn-floating").css("visibility", "visible");
            }, 1000);
        },
        onStop: function () {
            helptour_running = false;
            $.magnificPopup.close();
            localStorage.setItem("helptour-seen", "true");
            $("#main-search").val("");
            $("#main-search").select2("val", "");
            $("#main-search").trigger("change");
            setTimeout(function () {
                $(".btn-floating").css("visibility", "visible");
            }, 1000);
        }
    });

    //simple config.
    //Only one step - highlighting(with description) "New" button
    //hide EnjoyHint after a click on the button.
    var enjoyhint_script_steps = [
        {
            selector: '.product-list .product-card:first-child',
            description: "Each bag has images as well as<br/> tags for each of its attributes.",
            showNext: true,
            showSkip: false,
            margin: 0,
            skipButton: { text: "Skip Tour" },
        },
        {
            event: 'click',
            selector: '.product-list .product-card:first-child',
            event_selector: '.product-list div:first-child .product-details .tags-container .tag',
            description: "When you like something in a bag,<br/> e.g.: <span class='label label-helptour bgm-lightgreen'>#style: handbag</span>, click on it's tag and<br/> we will only show you bags with that attribute.",
            showSkip: false,
            showNext: true,
            top: 250,
            margin:0
        },
        {
            timeout: 400,
            selector: '.select2-selection',
            description: 'Alternatively, you can describe your dream bag here.<br/> e.g.: <span class="label-tour-eg">"small blue crossbody handbag"</span>',
            showSkip: false,
            showNext: true,
            margin: 10,
        },
        {
            event:'click',
            selector: '.select2-selection .select2-selection__choice__remove:first-child',
            event_selector: '.select2-selection .select2-selection__choice__remove:first-child',
            description: 'We filter bags displayed by their tags. <br/>You can remove a filter tag any time.<br/><span class="label-tour-eg">Happy Shopping!</span>',
            shape: 'circle',
            radius: 15,
            showSkip: true,
            skipButton: { text: "End Tour" },
            showNext: false,
            onBeforeStart: function () {
                if (g_tags == null || g_tags.length == 0) {
                    $("#main-search option[value=" + $("#main-search option:first-child").val() + "]").attr('selected', true);
                    $("#main-search option[value=" + $("#main-search option:first-child").val() + "]").prop('selected', true);
                    $('.select2').bind('click', '.select2-selection__choice__remove', function () {
                        if (helptour_instance.getCurrentStep() == 5) {
                            $(".enjoyhint_next_btn").click();
                        }
                    });
                    $("#main-search").trigger("change");
                }
            }
        },
    ];

    //set script config
    helptour_instance.set(enjoyhint_script_steps);

    //run Enjoyhint script
    helptour_instance.run();
}

function ShowMobileHelpTour() {

    //adding ids to elements as bootstraptour cant find element with given selector
    $(".product-list .product-card:first-child").attr("id", "bootstraptour-step1"); 
    $(".product-list .product-card:first-child .tags-container").attr("id", "bootstraptour-step2")

    // Instance the tour
    var tour = new Tour({
        storage: false,
        autoscroll: false,
        onStart: function (tour) {
            //below flag with prevent some animation and scroll to happen till the helptour is running
            helptour_running = true;

            //hide help notification popover
            $(".help-btn-mobile").popover("destroy");

            //hidding floating buttons
            $(".help-btn-mobile").css("visibility","hidden");
            $(".btn-floating").css("visibility", "hidden");
            $('body').scrollTop(250 - ($(window).height() - $(".product-list .product-card:first-child").height()));
        },
        onEnd: function (tour) {
            //below flags with prevent some animation and scroll to happen till the helptour is running
            helptour_running = false;

            //Set the helptour as seen in local storage
            localStorage.setItem("helptour-seen", "true");

            //Get the screen back to top
            $('body').scrollTop(25);

            //revoking fix for header z-index issue with backdrop
            $("#header").css('z-index', '1051');

            //showing floating buttons back again
            $(".help-btn-mobile").css("visibility", "visible");
            $(".btn-floating").css("visibility", "visible");

            //Remove if any tour popover failed to go off
            $(".popover.tour").remove();

            //Clearing search box
            $("#main-search").val("");
            $("#main-search").select2("val", "");
            $("#main-search").trigger("change");
        },
        steps: [
            {
                onShow: function () {
                    $(".product-list .product-card:first-child").attr("id", "bootstraptour-step1");

                    //revoking fix for header z-index issue with backdrop
                    $("#header").css('z-index', '1051');
                },
                backdrop: true,
                element: "#bootstraptour-step1",
                title: "",
                placement: 'bottom',
                content: "Each bag has images as well as tags for each of its attributes.",
                template: "<div class='popover tour'><div class='arrow'></div><div class='popover-content'></div>" +
                   "<div class='popover-navigation'>" +
                       "<button class='btn btn-default btn-primary' data-role='next'>Next »</button>" +
                       "<button class='btn btn-default' data-role='end'>End tour</button></div>" +
                   "</div>",
            },
            {
                onShow: function () {
                    $(".product-list .product-card:first-child .tags-container").attr("id", "bootstraptour-step2");

                    //revoking fix for header z-index issue with backdrop
                    $("#header").css('z-index', '1051');
                },
                backdrop: true,
                backdropPadding: {
                    top: 0,
                    left: 10,
                    right: 10,
                    bottom:10
                },
                element: "#bootstraptour-step2",
                title: null,
                placement: 'top',
                content: "When you like something in a bag, e.g.: <span class='label fs12 bgm-lightgreen fw400'>#style: handbag</span>, click on it's tag and we will only show you bags with that attribute.",
                template: "<div class='popover tour'><div class='arrow'></div><div class='popover-content'></div>" +
                  "<div class='popover-navigation'>" +
                      "<button class='btn btn-default btn-primary' data-role='next'>Next »</button>" +
                      "<button class='btn btn-default' data-role='end'>End tour</button></div>" +
                  "</div>",
            },
            {
                backdrop: true,
                element: "#top-search-wrap",
                title: null,
                placement: 'bottom',
                content: 'Alternatively, you can describe your dream bag here. e.g.:<br/> <b>"small blue crossbody handbag"</b>',
                onShow: function (tour) {
                    //fix for header z-index issue with backdrop
                    $("#header").css('z-index', '1101');
                },
                template: "<div class='popover tour'><div class='arrow'></div><div class='popover-content'></div>" +
                  "<div class='popover-navigation'>" +
                      "<button class='btn btn-default btn-primary' data-role='next'>Next »</button>" +
                      "<button class='btn btn-default' data-role='end'>End tour</button></div>" +
                  "</div>",
            },
            {
                backdrop: true,
                backdropPadding: {
                    top: 0,
                    left: 5,
                    right: 0,
                    bottom: 5
                },
                onShow: function (tour) {
                    //fix for header z-index issue with backdrop
                    $("#header").css('z-index', '1101');

                    //For the step adding a temp tag in the search bar
                    if (g_tags == null || g_tags.length == 0) {
                        $("#main-search option[value=" + $("#main-search option:first-child").val() + "]").attr('selected', true);
                        $("#main-search option[value=" + $("#main-search option:first-child").val() + "]").prop('selected', true);
                        $("#main-search").trigger("change");
                    }
                },
                element: '.select2-selection .select2-selection__choice:first .select2-selection__choice__remove:first',
                title: null,
                placement: 'bottom',
                content: 'We filter bags displayed by their tags. You can remove a filter tag any time. <b>Happy Shopping!</b>',
                template: "<div class='popover tour'><div class='arrow'></div><div class='popover-content'></div>" +
                  "<div class='popover-navigation'>" +
                      "<button class='btn btn-primary' data-role='end'>End tour</button></div>" +
                  "</div>",
            },
        ]
    });

    // Initialize the tour
    tour.init();

    // Start the tour
    tour.start();
}

function createXHR() {
    try { return new XMLHttpRequest(); } catch (e) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) { }
    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) { }
    return null;
}

function ShareLink(channel, entity, product_imgurl, product_name, product_brand) {
    var url = "", tag_names = "";

    if (entity == "product") 
        url = escape(window.location.href.replace(window.location.pathname, "") + "/app/product/" + g_open_productid);
    else if (entity == "search")
        url = escape(window.location.href.replace("#", ""));

    switch (channel) {
        case 'facebook':
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, "_blank");
            break;
        case 'twitter':
            var tweet_text = "";
            if (entity == "product")
                tweet_text = product_brand + ": " + product_name;
            else if (entity == "search") {

            }
            window.open('https://twitter.com/intent/tweet?text=' + tweet_text + '&url=' + url + '&hashtags=BagCupid', "_blank");
            break;
        case 'googleplus':
            window.open('https://plus.google.com/share?url=' + url, "_blank");
            break;
        case 'pinterest':
            var pin_desc = "";
            if (entity == "product")
                pin_desc = product_brand + ": " + product_name;
            else if (entity == "search") {
                var path = window.location.pathname;

                var productId = (path.match(/product\/(\d+)/i) || [])[1];
                var tags = (path.match(/tags\/(.*?)\/*?$/i) || [])[1];
                var minPrice = (path.match(/minprice\/(\d+)/i) || [])[1];
                var maxPrice = (path.match(/maxprice\/(\d+)/i) || [])[1];

                if (!(productId || tags || minPrice || maxPrice)){
                    //Sharing base webpage
                    product_imgurl = window.location.origin + $("img.header-logo").attr("src");
                    pin_desc = "Find Your Perfect Bag, We Make It Easy.";
                }
                else {
                    if (!productId) {
                        product_imgurl = $(".product-list > div:first-child").find("img:first-child").attr("src");
                    }
                   
                    var selected_tags = $("#main-search option:selected");

                    for (var i = 0; i < selected_tags.length; i++) {
                       
                        pin_desc += selected_tags[i].text + ", ";
                    }
                    pin_desc = pin_desc.trim().slice(0, -1)
                }
            }
            window.open('https://pinterest.com/pin/create/link/?url=' + encodeURIComponent(url) + '&media=' + encodeURIComponent(product_imgurl) + '&description=' + escape(pin_desc), "_blank");
            break;
    }
}

function RemoveSelectedTags(data) {
    $.each(data, function (index, product) {
        var tags_to_remove = [];
        $.each(product.tags, function (index, tag) {
            $.each(g_tags, function (index, selectedtag) {
                if (selectedtag == tag.id) {
                    tags_to_remove.push(tag);
                }
            })
        });
        $.each(tags_to_remove, function (index, tag) {
            product.tags.splice(product.tags.indexOf(tag), 1);
        });
    });
    return data;
}

function SkipHelpTourNotification() {
    localStorage.setItem("helptour-seen", "true");
    $(".help-slider-clone").popover("destroy");
}

function ExecuteSmartSearch(txtbox) {
    var keyword_str = RemoveRepeatingWords($(txtbox).val().trim());
    //remove # from the keywords
    keyword_str = keyword_str.replace(/#/g, "");
    var keyword_arr = keyword_str.split(" ");
    var matched_tags = [];
    if (keyword_str.length > 0) {

        search_matching_tags = [];
        var search_tags_without_duplicate = [], unmatched_keywords = [];
        duplicate_conflicts = [];
        partial_conflicts = [];
        full_keyword_str = keyword_str;

        SplitBackwardAndMatch(keyword_str);

        for (var i = 0; i < search_matching_tags.length; i++) {
            var tag_exclude = false;
            for (var j = 0; j < search_matching_tags.length; j++) {
                if (search_matching_tags[i].id != search_matching_tags[j].id) {
                    if (search_matching_tags[i].name != search_matching_tags[j].name) {
                        if (search_matching_tags[j].name.indexOf(search_matching_tags[i].name) >= 0) {
                            if (keyword_str.indexOf(search_matching_tags[j].name) > 0)
                                tag_exclude = true;
                        }
                    }
                    else {
                        tag_exclude = true;
                        duplicate_conflicts.push(search_matching_tags[i]);
                    }
                }
            }
            if (!tag_exclude) {
                search_tags_without_duplicate.push(search_matching_tags[i]);
            }
        }

        for (var i = 0; i < keyword_arr.length; i++) {
            var similar_tags = $.grep(search_tags_without_duplicate, function (e) { return e.name.indexOf(keyword_arr[i]) == 0; });
            switch (similar_tags.length) {
                case 0:
                    break;
                case 1:
                    if ($.inArray(similar_tags[0].id, g_tags) < 0) {
                        if (g_tags == null) g_tags = [];
                        g_tags.push(similar_tags[0].id);
                    }
                    break;
                default:
                    var partial_conflict = {
                        keyword: keyword_arr[i],
                        tags: similar_tags
                    };
                    partial_conflicts.push(partial_conflict);
                    break;
            }
            var tags_with_keywords = $.grep(search_matching_tags, function (e) { return e.name.indexOf(keyword_arr[i]) >= 0; });
            if (tags_with_keywords.length == 0) {
                var matchingTags = $.grep(g_tagsData, function (e) { return e.name.indexOf(keyword_arr[i]) == 0; });
                if (matchingTags.length == 0) {
                    unmatched_keywords.push({ keyword: keyword_arr[i] });
                }
                else {
                    g_tags.push(matchingTags[0].id);
                }
            }
        }

        if (duplicate_conflicts.length > 0 || partial_conflicts.length > 0 || unmatched_keywords.length > 0) {

            var template = Handlebars.templates['confirm-tags'];

            if (duplicate_conflicts.length > 0) {
                duplicate_conflicts = Enumerable.From(duplicate_conflicts)
                .GroupBy("$.name", null,
                         function (key, g) {
                             return {
                                 keyword: key,
                                 tags: g.source
                             }
                         })
                .ToArray();
            }

            $("#pnl_confirm_tags").html(template({
                duplicate_conflicts: duplicate_conflicts,
                partial_conflicts: partial_conflicts,
                unmatched_keywords: unmatched_keywords
            })).show();

            $("#pnl_confirm_tags .tag").click(function () {
                g_load_bags = true;
                flyToElement($(this), $('#centerpoint_search'));

                if ($.inArray($(this).attr('tag-id'), g_tags) < 0) {
                    if (g_tags == null) g_tags = [];
                    g_tags.push($(this).attr('tag-id'));
                }

                //remove the conflict row
                $(this).parent().parent().remove();
                if ($("#pnl_confirm_tags").find("#list-confirm-tags tr").length == 0)
                    $("#pnl_confirm_tags").empty().hide();

                BuildUrlHash();
            });
        }
        else {
            $("#pnl_confirm_tags").empty().hide();
        }

        g_load_bags = true;
        g_manual_tag_change = true;
        $(txtbox).val("");
        BuildUrlHash();
    }
}

function RemoveRepeatingWords(string) {
    var arr = string.split(" ");
    var unique = [];
    $.each(arr, function (index, word) {
        if ($.inArray(word, unique) === -1)
            unique.push(word);
    });
    return unique.join(" ");
}

function SplitBackwardAndMatch(keyword_str) {
    // Backward splitting
    var last_word = keyword_str.substr(keyword_str.lastIndexOf(' ') + 1).trim(),
    rest_str = keyword_str.substr(0, keyword_str.lastIndexOf(' ')).trim(),
    result1 = [],
    result2 = [];



    if (last_word.length > 0) {
        result1 = $.grep(g_tagsData, function (e) { return e.name == last_word; });

        if(result1.length == 0)
            result1 = $.grep(g_tagsData, function (e) { return e.name.indexOf(last_word) == 0; });

        if (result1.length > 0) {
            for (var i = 0; i < result1.length; i++) {
                if (result1[i].name != last_word) {
                    var extraText = result1[i].name.replace(last_word, "").trim();
                    if (extraText.length > 2) {
                        if (keyword_str.replace(last_word, "").indexOf(extraText) < 0)
                            search_matching_tags.push(result1[i]);
                    }
                    else {
                        search_matching_tags.push(result1[i]);
                    }
                }
                else {
                    search_matching_tags.push(result1[i]);
                }
            }
        }
    }
    if (rest_str.length > 0) {

        result2 = $.grep(g_tagsData, function (e) { return e.name == rest_str; });

        if (result2.length == 0)
            result2 = $.grep(g_tagsData, function (e) { return e.name.indexOf(rest_str) == 0; });

        if (result2.length > 0) {
            for (var i = 0; i < result2.length; i++) {
                if (result2[i].name != rest_str) {
                    var extraText = result2[i].name.replace(rest_str, "").trim();
                    if (extraText.length > 2) {
                        if (keyword_str.replace(rest_str, "").indexOf(extraText) < 0)
                            search_matching_tags.push(result2[i]);
                    }
                    else {
                        search_matching_tags.push(result2[i]);
                    }
                }
                else {
                    search_matching_tags.push(result2[i]);
                }
            }
        }
        else {
            SplitBackwardAndMatch(rest_str);
        }
    }
}

function RemoveConflictRow(btn) {
    $(btn).parent().parent().remove();
    if ($("#pnl_confirm_tags").find("#list-confirm-tags tr").length == 0)
        $("#pnl_confirm_tags").empty().hide();
}

function ShowFilterCategory() {
    $(".side-categories").removeClass("slideOutLeft").addClass("animated animated-short slideInLeft");
    $(".side-tags").removeClass("slideInRight").addClass("animated animated-short slideOutRight");
    $(".side-categories-container .header .btn-back-to-category").hide();
    $("#side-filter-title").text("BAG PROPERTIES");

    $('.side-tags').mCustomScrollbar({
        theme: 'minimal-dark',
        scrollInertia: 100,
        axis: 'yx',
        mouseWheel: {
            enable: true,
            axis: 'y',
            preventDefault: true
        }
    });
}

function SelectFilterCategory(category_name, category_id) {
    var tags = Enumerable.From(g_tagsData).Where(w=>w.category.id == category_id).ToArray();
    $(".side-categories").removeClass("slideInLeft").addClass("animated animated-short slideOutLeft");
    $(".side-tags").removeClass("slideOutRight").addClass("animated animated-short slideInRight").show();
    $(".side-categories-container .header .btn-back-to-category").show();

    $('.side-tags').mCustomScrollbar("destroy");

    //bind tags in side filter
    var template = Handlebars.templates['filter-tag'];

    $(".side-tags").html(template({ tags: Enumerable.From(tags).OrderBy("$.name").ToArray() }));

    $("#side-filter-title").text(category_name.toUpperCase());

    $('.side-tags').mCustomScrollbar("destroy");
    $('.side-tags').mCustomScrollbar({
            theme: 'minimal-dark',
            scrollInertia: 100,
            axis: 'yx',
            mouseWheel: {
                enable: true,
                axis: 'y',
                preventDefault: true
            }
        });
}

function SelectFilterTag(tag_id) {
    if ($.inArray(tag_id, g_tags) < 0) {
        if (g_tags == null) g_tags = [];
        g_tags.push(tag_id);
    }
    BuildUrlHash();
     
}

function SearchFilterBrand(event, input) {
    if (event.key == "ArrowDown") {
        $(".brands-list > .listview > .lv-body a:visible:first").focus();
    }
    $(".brands-list .lv-body a").css('display','block').filter(function(){
        return $(this).text().toLowerCase().indexOf($(input).val().toLowerCase().trim()) < 0;
    }).css('display','none');
}

function SelectBrandFilter(brandid) {
    g_load_bags = true;

    if ($.inArray(brandid, g_tags) < 0) {
        if (g_tags == null) g_tags = [];
        g_tags.push(brandid);
    }
    BuildUrlHash();

    $('.btn-brand-filter').click();
}

function ShowingBrandFilter() {
    $(".brands-list .listview .lv-body").mCustomScrollbar({
        theme: 'minimal-dark',
        scrollInertia: 100,
        axis: 'yx',
        keyboard: {
            enable: false
        },
        mouseWheel: {
            enable: true,
            axis: 'y',
            preventDefault: true
        }
    });
    $("#txt-brand-search").val('');
    $(".brands-list > .listview > .lv-body a").css('display', 'block');
    
}

function HideBanner() {
    $("html, body").stop().animate({ scrollTop: $(".banner").height() - 25}, '500');    
}