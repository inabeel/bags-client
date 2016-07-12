var g_api = 'https://bags-api.zoltu.com';
var g_tags = [];
var g_page_count = 24;
var newFilterApplied = true;
var currentRequest = null;
var g_price_min = 0;
var g_price_max = 10000;
var g_price_max_limit = 10000;
var g_open_productid = 0;
var g_popupOpened = false;
var menuHiding = false;
var g_hashchanged = false;
var g_dynamic_tag_change = true;
var g_load_bags = true;
var g_load_popup = true;
$(document).scroll(function () {
    if ($(document).scrollTop() < 10) {
        if (menuHiding == false && g_popupOpened == false) {
            menuHiding = true;
            $(".top-menu-small").slideDown("fast",function () {
                menuHiding = false;
            });
            
        }
    }
    if ($(document).scrollTop() >= 10) {
        if (menuHiding == false) {
            menuHiding = true;
            $(".top-menu-small").slideUp("fast", function () {
                menuHiding = false;
            });
        }
    }
});

Handlebars.registerHelper("colorTag", function (categoryid) {
    return fnColorTag(categoryid);
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
$.ajax({
    url: g_api + '/api/tag_categories',
    type: 'GET',
    dataType: 'JSON',
    success: function (cats) {
        //assign each category a color
        $.each(cats, function (index, cat) {
            var category = cat;
            category.color = category_colors[index];
            categories.push(category);
        });

        getTags();
        
    },
    error: function () {
        alert('error in fetching categories');
    }
});

function ProcessUrlParams() {
    var hash = window.location.hash.substr(1);
    var params = hash.split('&');
    var urlTags = "";
    g_price_min = 0;
    g_price_max = 10000;
   

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
                case "min_price":
                    g_price_min = value1;
                    break;
                case "max_price":
                    g_price_max = value1;
                    break;
                case "product_id":
                    g_open_productid = value1;
                    if (g_load_popup)
                        if (value1 > 0)
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
    g_load_popup = true;
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

    
        $("#main-search").select2("val","");

    if (g_dynamic_tag_change = true && urlTags != "") {
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
    g_dynamic_tag_change = true;
    newFilterApplied = true;
    g_result_from_product_id = 1;
    ProcessUrlParams();
});

//Range slider

var stepSlider = document.getElementById('price-slider');

noUiSlider.create(stepSlider, {
    start: [0, g_price_max],
    step: 1,
    tooltips: true,
    range: {
        'min': 0,
        'max': 1050
    },
    format: {
        to: function (value) {
            if (value >= 1050)
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
  
    g_price_max = (values[1] == 1050) ? 10000 : Math.round(values[1]);
    if (g_price_min > g_price_max) {
        g_price_min = 0;
    }
    BuildUrlHash();
});

var tagsData = [];
function getTags() {
    $.ajax({
        url: g_api + '/api/tags',
        type: 'GET',
        dataType: 'JSON',
        success: function (tags) {

            tagsData = $.map(tags, function (obj, index) {
                obj.id = obj.id;
                obj.text = "#" + obj.category.name + ": " + obj.name;
                return obj;
            });

            $("#main-search").on("change", function (e) {
                //reseting product id to 1 to fetch result from start
                if (g_dynamic_tag_change == true) {
                    newFilterApplied = true;
                    g_result_from_product_id = 1;
                    if(g_load_bags)
                        GetProducts();
                }
                else {
                    g_tags = $("#main-search").val();
                    BuildUrlHash();
                }
            });
            $("#main-search").on("select2:unselect", function (e) {
                if (g_popupOpened)
                    g_load_popup = false;
                $("#main-search option[value='" + e.params.data.id + "'").prop('selected', false);
                $("#main-search").trigger("change");
            });

            //Load all tags in the search
            loadTags();
        },
        error: function () {
            alert('error in fetching tags');
        }
    });
}

function loadTags() {
    $("#main-search").select2({
        placeholder: "Search by tags..",
        data: tagsData,
        allowClear: true,
        templateSelection: function (data,a) {
            a.addClass(fnColorTag(data.category_id));
            return data.text;
        },
        matcher: function (term, option) {
            if (typeof term.term != 'undefined') { //has terms
                if (/\S/.test(term.term)) { //if empty or spaces
                    if (option.name.toUpperCase().indexOf(term.term.toUpperCase()) >= 0 || option.category.name.toUpperCase().indexOf(term.term.toUpperCase()) >= 0) {
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
var visibleTagCnt = 5;
var sliderInterval;
var sliderRunning = false;
var overSlider = false;

var g_result_from_product_id = 1;

function ShowMore() {
    newFilterApplied = false;

    //Disabling Show More button
    $("#show-more-panel button").attr("disabled", true);

    //Loading button
    $("#show-more-panel button").html("<i class='fa fa-spinner fa-spin'></i> Wait a moment..");

    //Fetch Product
    GetProducts();
}
function GetProducts() {
    g_load_bags = true;
    //Show bags view in case About us is openend
    ShowBagsView();

    g_dynamic_tag_change = false;

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
    currentRequest = $.ajax({
        url: api,
        type: 'GET',
        dataType: 'JSON',
        beforeSend: function () {
            if (currentRequest != null) {
                currentRequest.abort();
            }
        },
        success: function (data) {

            //Setting product id to fetch next result from
            if (data.length > 0) {
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
                $('html,body').animate({
                    scrollTop: 0
                }, 500);
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
            $(".product-list .product-card .card-body .tag").on("click", function () {
                g_load_bags = true;
                g_dynamic_tag_change = true;
                $(this).tooltip('hide');
                if ($.inArray($(this).attr('tag-id'), g_tags) < 0) {
                    if (g_tags == null) g_tags = [];
                    g_tags.push($(this).attr('tag-id'));
                }
                BuildUrlHash();
            });

            //Initialize sliding images for each product
            $(".carousel").on("mouseover", function (obj) {
                if (sliderRunning == false && overSlider == false) {
                    sliderRunning = true;
                    sliderInterval = setInterval(function () {
                        $(obj.currentTarget).children(".carousel-control.right").click();
                    }, 1000);
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

            if ($('[data-toggle="tooltip"]')[0]) {
                $('[data-toggle="tooltip"]').tooltip();
            }
            HideInitialLoader();

            //Reset
            g_hashchanged = false;
        },
        error: function () { }
    });
}

function HideInitialLoader() {
    if (!$('html').hasClass('ismobile')) {
        if ($('.page-loader')[0]) {
            setTimeout(function () {
                $('.page-loader').fadeOut();
            }, 500);

        }
    }
}

function BuildUrlHash() {
    
    var hash = "";
    if(g_price_min != 0)
        hash += "min_price=" + g_price_min;
    if( g_price_max != g_price_max_limit)
        hash += (hash == "" ? "" : "&") + "max_price=" + g_price_max;
    if (g_open_productid > 0)
        hash += (hash == "" ? "" : "&") + "product_id=" + g_open_productid;
    
    if (g_tags != null && g_tags.length > 0) {
        hash += (hash == "" ? "" : "&") + "tags=" + g_tags.join(",");
    }
    window.location.hash = hash;
}

function TriggerProductPopup(productid) {
    g_open_productid = productid;
    g_load_bags = false;
    BuildUrlHash();
}

function ShowProductPopup(productid) {
    $("#product-popup-loader").fadeIn("fast", function () {
        $("body").css("overflow-y", "hidden");
        $.ajax({
            url: g_api + '/api/products/' + productid,
            success: function (product) {
                var template = Handlebars.templates['product-details'];
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
                            $("#product-popup-loader").hide();
                            this.st.mainClass = "mfp-zoom-in";
                        },
                        beforeClose: function () {
                            g_open_productid = 0;
                            g_load_bags = false;
                            g_load_popup = false;
                            $("#product-popup-loader").hide();
                            BuildUrlHash();
                        },
                        close: function(){
                            $("body").css("overflow-y", "auto");
                            setTimeout(function () {
                                g_popupOpened = false;
                                g_load_bags = true;
                            }, 1000);
                        },
                        open: function () {
                            g_popupOpened = true;
                            //Click event on Tags
                            $(".product-popup .product-tags .tag").on("click", function () {
                                g_load_bags = true;
                                g_load_popup = false;
                                g_dynamic_tag_change = true;
                                $(this).tooltip('hide');
                                if ($.inArray($(this).attr('tag-id'), g_tags) < 0) {
                                    if (g_tags == null) g_tags = [];
                                    g_tags.push($(this).attr('tag-id'));
                                }
                                BuildUrlHash();
                            });
                            if(!$('html').hasClass('ismobile')) {
                                $('#product-popup [data-imagezoom]').imageZoom();
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
                        }
                    }
                });
            },
            error: function () {
                alert('error fetching product')
            }
        });
    });
}

function ThumbnailScroll(direction) {
    if (direction == "left") {
        $(".product-popup .carousel .thumbnail-scroll").animate({ 'scrollLeft': $(".product-popup .carousel .thumbnail-scroll").scrollLeft() - 70 }, 300);
    }
    if (direction == "right") {
        console.dir($(this).scrollLeft() + 66);
        $(".product-popup .carousel .thumbnail-scroll").animate({ 'scrollLeft': $(".product-popup .carousel .thumbnail-scroll").scrollLeft() + 70 }, 300);
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
    $(".product-list").fadeOut("fast", function () {
        $(".about-section").fadeIn("fast");
    })
}
function ShowBagsView() {
    $(".about-section").fadeOut("fast", function () {
        $(".product-list").fadeIn("fast");
    })
}