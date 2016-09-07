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
menuHiding = false,
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
helptour_running_allow_product_click = false, //It decides whether to allow product click when Help tour is running
helptour_instance, //Help tour instance
search_matching_tags = [], //Holds the matching tags for smart search
full_keyword_str = "", //This holds the original search text when user hit "Enter" key in search box
duplicate_conflicts = [],
partial_conflicts = [];

$(document).ready(function () {
    page_loaded = true;

    //Help button sliding
    $(".help-slider .btn-help").on('mouseenter', function () {
        if (localStorage.getItem("helptour-seen") == "true") {
            $(".help-slider").stop().animate({ "right": "0px" }, { duration: 300, queue: false });
            $(".help-slider .btn-help").css({ "backgroundColor": "#FF9800" });
        }
    });
    $(".help-slider").on('mouseleave', function () {
        if (localStorage.getItem("helptour-seen") == "true") {
            $(".help-slider").stop().animate({ "right": "-100px" });
            $(".help-slider .btn-help").css({ "backgroundColor": "#FFC107" });
        }
    });
})

$(document).scroll(function () {
    $("#main-search").select2("close");
    if (page_loaded == true) {
        if ($(document).scrollTop() <= 10) {
            if (menuHiding == false && g_popupOpened == false && helptour_running == false) {
                menuHiding = true;
                $(".top-menu-small").slideDown("fast", function () {
                    menuHiding = false;
                });
            }
        }
        if ($(document).scrollTop() > 10) {
            if (menuHiding == false) {
                menuHiding = true;
                $(".top-menu-small").slideUp("fast", function () {
                    menuHiding = false;
                });
            }
        }
    }
});

Handlebars.registerHelper("colorTag", function (categoryid) {
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

function fnColorTag(categoryid) {
    var color = '';
    $.each(categories, function (index, category) {
        if (category.id == categoryid) {
            color = category.color;
            return;
        }
    });
    return color;
}

var category_colors = ["bgm-red", "bgm-blue", "bgm-green", "bgm-lightgreen", "bgm-cyan", "bgm-pink", "bgm-lightblue",
    "bgm-orange", "bgm-purple", "bgm-deeporange", "bgm-teal", "bgm-amber", "bgm-gray", "bgm-indigo", "bgm-lime", "bgm-bluegray", "bgm-deeppurple"];

var categories = [];

$(function () {
    var xhr_tag_cat = createXHR();
    xhr_tag_cat.open("GET", g_api + '/api/tag_categories', true);
    xhr_tag_cat.onreadystatechange = function () {
        if (xhr_tag_cat.readyState == 4 && xhr_tag_cat.status == 200) {
            var cats = JSON.parse(xhr_tag_cat.responseText);

            //assign each category a color
            $.each(cats, function (index, cat) {
                var category = cat;
                category.color = category_colors[index];
                categories.push(category);
            });

            getTags();

        }
    }
    xhr_tag_cat.send();
});

function ProcessUrlParams() {
    var hash = window.location.hash.substr(1);
    var params = hash.split('&');
    var urlTags = "";
    g_price_min = 0;
    g_price_max = 10000;
   
    $(".about-section").hide()
    $(".product-list").show();

    var closePopup = false;
    for (var i = 0; i < params.length; i++) {
        if (params[i].length > 0) {
            var temp = params[i].split('=');
            var key = temp[0];
            if (key == "product_id") {
                closePopup = true;
            }
        }
    }
    if (closePopup == false)
        $.magnificPopup.close();

    g_tags = [];
    for (var i = 0; i < params.length; i++) {
        if (params[i].length > 0) {
            var temp = params[i].split('=');
            var key = temp[0];
            var value1 = temp[1];
            switch (key) {
                case "aboutus":
                    $(".product-list").fadeOut("fast", function () {
                        $(".about-section").fadeIn("fast");
                    });
                    break;
                case "min_price":
                    g_price_min = value1;
                    break;
                case "max_price":
                    g_price_max = value1;
                    break;
                case "product_id":
                    g_open_productid = value1;
                    if (g_popupOpened == false && g_load_popup && value1 > 0)
                        ShowProductPopup(value1);
                    break;
                case "tags":
                    if (value1 != null && value1.length > 0) {
                        urlTags = value1;
                    }
                    break;
            }
        }
    }
   
    if (g_price_min == 0 && g_price_max == 10000) {
        $("#min_max_selected").hide();
        $("#lbl_price_filter").show();
    }
    else {
        $("#min_max_selected").show();
        $("#lbl_price_filter").hide();
    }
    stepSlider.noUiSlider.set([g_price_min, g_price_max]);

    $("#lbl_min_price").html('<i class="zmdi zmdi-money"></i>' + g_price_min);
    $("#lbl_max_price").html(g_price_max == 10000 ? 'any' : '<i class="zmdi zmdi-money"></i>' + g_price_max);
    
    trigger_tags_change = false;
    $("#main-search").select2("val", "");
    trigger_tags_change = true;

    if (g_manual_tag_change == true && urlTags != "") {
        g_tags = urlTags.split(',');
       
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

//Range slider
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
                    //if Help Tour is running
                    if (helptour_running == true) {
                        if (adding_tag_in_helptour == true) {
                            //Move to next step in help tour
                            if (helptour_instance.getCurrentStep() == 3 || helptour_instance.getCurrentStep() == 5) {
                                $(".enjoyhint_next_btn").click();
                            }
                        }
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
        templateSelection: function (data,a) {
            a.addClass(fnColorTag(data.category_id));
            return data.text;
        },
        matcher: function (term, option) {
            if (typeof term.term != 'undefined') { //has terms
                if (/\S/.test(term.term)) { //if empty or spaces
                    if (option.name.toUpperCase().indexOf(term.term.toUpperCase()) >= 0
                        || option.category.name.toUpperCase().indexOf(term.term.toUpperCase()) >= 0
                        || option.text.toUpperCase().indexOf(term.term.toUpperCase()) >= 0) {
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

    if (window.location.hash.length > 0)
        ProcessUrlParams();
    else
        GetProducts();
}

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
                    if ($('body').scrollTop() > 25)
                        $('body').scrollTop(25);
                }
            }
            else
                $(".product-list").append(template({ products: data }));

            newFilterApplied = false;

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

            //Initialize sliding images for each product
            $(".carousel").on("mouseover", function (obj) {
                if (sliderRunning == false && overSlider == false) {
                    sliderRunning = true;
                    sliderInterval = setInterval(function () {
                        $(obj.currentTarget).children(".carousel-control.right").click();
                    }, 1500);
                }
            }).on("mouseleave", function () {
                sliderRunning = false;
                clearInterval(sliderInterval);
            });
            $(".carousel-control").on("mouseenter", function () {
                overSlider = true;
                clearInterval(sliderInterval);
                sliderRunning = false;
            });
            $(".carousel-control").on("mouseleave", function () {
                overSlider = false;
            });

            //Enabling swiping
            $(".carousel").swiperight(function () {
                $(this).carousel('prev');
            });
            $(".carousel").swipeleft(function () {
                $(this).carousel('next');
            });

            //Hide Page Loader
            HidePageLoader();

            //Reset
            g_hashchanged = false;

            //Show Help tour button
            $(".help-slider").css("visibility", "visible");
            if (localStorage.getItem("helptour-seen") != "true") {
                if (!helptour_running) {
                    if (!$(".help-slider-clone").find('div.popover:visible').length) {
                        //notification is not yet visible
                        setTimeout(function () {
                            $(".help-slider-clone").popover("show");
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
   
    var hash = "";
    if (g_aboutus_open == true)
        hash += "aboutus=" + g_aboutus_open;
    if(g_price_min != 0)
        hash += (hash == "" ? "" : "&") + "min_price=" + g_price_min;
    if( g_price_max != g_price_max_limit)
        hash += (hash == "" ? "" : "&") + "max_price=" + g_price_max;
    if (g_open_productid > 0)
        hash += (hash == "" ? "" : "&") + "product_id=" + g_open_productid;
    if (g_tags != null && g_tags.length > 0) {
        hash += (hash == "" ? "" : "&") + "tags=" + g_tags.join(",");
    }
    if (hash != "")
        window.location.hash = hash;
    else
        window.location.hash = "_";
}

function TriggerProductPopup(productid) {
    if (!helptour_running || (helptour_running && helptour_running_allow_product_click)) {
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
            document.title = "Zoltu Bag: " + product.name.substr(0, 1).toUpperCase() + product.name.substr(1) + " : $" + product.price;
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
                        BuildUrlHash();
                    },
                    close: function () {
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
                            $('#product-popup [data-imagezoom]').imageZoom();
                            $("#product-popup-right-column").css('min-height', $("#product-gallery").css("height"));
                        }
                        //Enabling swiping
                        $("#product-popup .carousel").swiperight(function () {
                            $(this).carousel('prev');
                        });
                        $("#product-popup .carousel").swipeleft(function () {
                            $(this).carousel('next');
                        });
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
        $(".product-popup .carousel .thumbnail-scroll").stop().animate({ 'scrollLeft': $(".product-popup .carousel .thumbnail-scroll").scrollLeft() - 70 }, { duration: 300, queue: false });
    }
    if (direction == "right") {
        $(".product-popup .carousel .thumbnail-scroll").stop().animate({ 'scrollLeft': $(".product-popup .carousel .thumbnail-scroll").scrollLeft() + 70 }, { duration: 300, queue: false });
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
            }, 1000);
        },
        onSkip: function () {
            helptour_running = false;
            helptour_running_allow_product_click = false;
            $.magnificPopup.close();
            localStorage.setItem("helptour-seen", "true");
            $("#main-search").select2("val", "");
            setTimeout(function () {
                $(".help-slider").removeClass("animated animated-short slideOutRight").addClass("animated animated-short slideInRight");
            }, 1000);
        },
        onStop: function () {
            helptour_running = false;
            helptour_running_allow_product_click = false;
            $.magnificPopup.close();
            localStorage.setItem("helptour-seen", "true");
            $("#main-search").select2("val", "");
            setTimeout(function () {
                $(".help-slider").removeClass("animated animated-short slideOutRight").addClass("animated animated-short slideInRight");
            }, 1000);
        }
    });

    //simple config. 
    //Only one step - highlighting(with description) "New" button 
    //hide EnjoyHint after a click on the button.
    var enjoyhint_script_steps = [
        {
            selector: '.product-list .product-card:first-child',
            description: "Each Bag has images and tags mentioning its properties.",
            showNext: true, 
            showSkip: true,
            margin: 0,
            skipButton: { text: "Skip Tour" },
            onBeforeStart: function () { adding_tag_in_helptour = false; }
        },
        {
            event: 'click',
            selector: '.product-list div:first-child .product-details',
            event_selector: '.product-list div:first-child .product-details .tags-container .tag',
            description: 'Select tag(s) which match<br/> with your ideal Bag.',
            showSkip: true,
            skipButton: { text: "Skip Tour" },
            showNext: true,
            margin: 0
        },
        {
            event: 'click',
            timeout: 400,
            selector: '.select2-selection',
            description: 'You can type here to search<br/> and add tags describing your bag',
            showSkip: true,
            skipButton: { text: "Skip Tour" },
            showNext: true,
            margin: 400,
            margin:10
        },
        {
            selector: '.select2-container',
            description: 'Start typing..<br/> Select tag with arrow keys<br/> and hit enter to add it',
            showSkip: true,
            skipButton: { text: "Skip Tour" },
            showNext: true,
            margin: 415,
            left: 202,
            right: 202,
            top: 203,
            onBeforeStart: function () {
                adding_tag_in_helptour = true;
            }
        },
        {
            event:'click',
            selector: '.select2-selection .select2-selection__choice__remove:first-child',
            event_selector: '.select2-selection .select2-selection__choice__remove:first-child',
            description: 'Clicking on cross button of the tag will remove it',
            shape: 'circle',
            radius: 15,
            showSkip: true,
            skipButton: { text: "Skip Tour" },
            showNext: true,
            onBeforeStart: function () {
                adding_tag_in_helptour = false;
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
        {
            event: 'click',
            selector: '.price-display',
            description: 'Want to see Bags within your budget?<br/> You can select a price range.',
            showSkip: true,
            skipButton: { className: "bg-primary", text: "End Tour" },
            showNext: false,
            margin: 0,
            onBeforeStart: function () {
                helptour_running = false;
                helptour_running_allow_product_click = false;
            }
        }
    ];

    //set script config
    helptour_instance.set(enjoyhint_script_steps);

    //run Enjoyhint script
    helptour_instance.run();
}

function createXHR() {
    try { return new XMLHttpRequest(); } catch (e) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) { }
    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) { }
    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) { }
    return null;
}

function ShareLink(channel, entity) {
    var url = "", tag_names = "";

    if(entity == "product")
        url = escape(window.location.href.replace(window.location.hash, "") + "#product_id=" + g_open_productid);
    else if(entity == "search")
        url = escape(window.location.href);

    switch (channel) {
        case 'facebook':
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, "_blank");
            break;
        case 'twitter':
            window.open('https://twitter.com/intent/tweet?url='+ url, "_blank");
            break;
        case 'googleplus':
            window.open('https://plus.google.com/share?url=' + url, "_blank");
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
    var keyword_str = $(txtbox).val().trim();
    var keyword_arr = keyword_str.split(" ");
    var matched_tags = [];
    if (keyword_str.length > 0) {

        search_matching_tags = [];
        var search_tags_without_duplicate = [];
        duplicate_conflicts = [];
        partial_conflicts = [];
        var unmatched_keywords = [];
        full_keyword_str = keyword_str;

        SplitBackwardAndMatch(keyword_str);

        for (var i = 0; i < search_matching_tags.length; i++) {
            var tag_exclude = false;
            for (var j = 0; j < search_matching_tags.length; j++) {
                if (search_matching_tags[i].id != search_matching_tags[j].id) {
                    if (search_matching_tags[i].name != search_matching_tags[j].name) {
                        if (search_matching_tags[j].name.indexOf(search_matching_tags[i].name) >= 0) {
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

function SplitBackwardAndMatch(keyword_str) {
    // Backward splitting
    var last_word = keyword_str.substr(keyword_str.lastIndexOf(' ') + 1).trim(),
    rest_str = keyword_str.substr(0, keyword_str.lastIndexOf(' ')).trim(),
    result1 = [],
    result2 = [];

    if (last_word.length > 0) {
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
