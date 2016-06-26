var g_api = 'https://bags-api.zoltu.com';
var g_page_count = 24;
var newFilterApplied = true;
var currentRequest = null;
var g_price_min = 0;
var g_price_max = 10000;
var g_price_max_limit = 10000;

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
        GetProducts();
    },
    error: function () {
        alert('error in fetching categories');
    }
});

//Range slider

var stepSlider = document.getElementById('price-slider');

noUiSlider.create(stepSlider, {
    start: [0, g_price_max],
    step: 50,
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
                return '$' + value;
        },
        from: function (value) {
            return value.replace('$', '');
        }
    }
});

stepSlider.noUiSlider.on("change", function (texts, btn_index, values) {
    g_price_min = values[0];
    g_price_max = (values[1] == 1050) ? 10000 : values[1];
    $("#lbl_min_price").html('<i class="zmdi zmdi-money"></i>' + g_price_min);
    $("#lbl_max_price").html(g_price_max == 10000 ? 'any' : '<i class="zmdi zmdi-money"></i>' + g_price_max);
    $("#min_max_selected").show();
    $("#lbl_price_filter").hide();
    newFilterApplied = true;
    g_result_from_product_id = 1;
    GetProducts();
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

            //Load all tags in the search
            loadTags();

            $("#main-search").on("change", function (e) {

                //reseting product id to 1 to fetch result from start
                newFilterApplied = true;
                g_result_from_product_id = 1;
                GetProducts();
            });
            $("#main-search").on("select2:unselect", function (e) {
                $("#main-search option[value='" + e.params.data.id + "'").prop('selected', false);
                $("#main-search").trigger("change");
            });

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
    //Disabling Show More button
    $("#show-more-panel button").attr("disabled", true);

    //Loading button
    $("#show-more-panel button").html("<i class='fa fa-spinner fa-spin'></i> Wait a moment..");

    //Fetch Product
    GetProducts();
}
function GetProducts() {

    var api = g_api + '/api/products/by_tags?starting_product_id=' + g_result_from_product_id + '&products_per_page=' + g_page_count +
        '&min_price=' + g_price_min + '&max_price=' + g_price_max;

    //Use selected tags as parameters for api
    var selectedTags = $("#main-search").val();
    if (selectedTags && selectedTags.length > 0) {
        var tagids = [];
        for (var i = 0; i < selectedTags.length; i++) {
            tagids.push("tag_id=" + selectedTags[i]);
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
                $(this).tooltip('hide');
                $('#header').addClass('search-toggled');
                $("#main-search option[value=" + $(this).attr('tag-id') + "]").prop('selected', true);
                $("#main-search").trigger("change");
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
        },
        error: function () { }
    });
}
function ShowProductPopup(productid) {

   
    $("#product-popup-loader").fadeIn("fast",function () {
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
                            $("body").css("overflow-y", "hidden");
                            $("#product-popup-loader").hide();
                            this.st.mainClass = "mfp-zoom-in";
                        },
                        close: function(){
                            $("body").css("overflow-y", "auto");
                        },
                        open: function () {
                            //Click event on Tags
                            $(".product-popup .product-tags .tag").on("click", function () {
                                $(this).tooltip('hide');
                                $('#header').addClass('search-toggled');
                                $("#main-search option[value=" + $(this).attr('tag-id') + "]").prop('selected', true);
                                $("#main-search").trigger("change");
                            });
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
function ApplyPriceRange(bound, amount) {
    $("#min_max_selected").show();
    $("#lbl_price_filter").hide();

    if (bound == "min") {
        g_price_min = amount;
        if (g_price_min > g_price_max) {
            g_price_max = g_price_max_limit;
        }
        stepSlider.noUiSlider.set([amount, g_price_max]);
    }
    else {
        g_price_max = amount;
        if (g_price_min > g_price_max) {
            g_price_min = 0;
        }
        stepSlider.noUiSlider.set([g_price_min, amount]);
    }
    $("#lbl_min_price").html('<i class="zmdi zmdi-money"></i>' + g_price_min);
    $("#lbl_max_price").html(g_price_max == 10000 ? 'any' : '<i class="zmdi zmdi-money"></i>' + g_price_max);

    newFilterApplied = true;
    g_result_from_product_id = 1;
    GetProducts();
}


function ResetPriceFilter() {

    g_price_min = 0;
    g_price_max = g_price_max_limit;

    $("#min_max_selected").hide();
    $("#lbl_price_filter").show();

    stepSlider.noUiSlider.set([g_price_min, g_price_max]);
    $("#lbl_min_price").html('<i class="zmdi zmdi-money"></i>' + g_price_min);
    $("#lbl_max_price").html('<i class="zmdi zmdi-money"></i>' + g_price_max);

    newFilterApplied = true;
    g_result_from_product_id = 1;
    GetProducts();
}