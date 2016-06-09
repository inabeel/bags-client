var g_api = 'https://bags-api.zoltu.com';
var g_page_count = 24;
var newFilterApplied = true;
var currentRequest = null;

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
        console.dir(cats);
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

var tagsData = [];
function getTags() {
    $.ajax({
        url: g_api + '/api/tags',
        type: 'GET',
        dataType: 'JSON',
        success: function (tags) {
            console.dir(tags);
            tagsData = $.map(tags, function (obj, index) {
                obj.id = obj.id;
                obj.text = "#" + obj.category.name + ": " + obj.name;
                return obj;
            });

            //Load all tags in the search
            loadTags();

            $("#main-search").on("change", function (e) {
                console.log("main-search-change");
                if ($("#main-search").val())
                    $("#search-tag-cnt").text($("#main-search").val().length).show();
                else
                    $("#search-tag-cnt").text(0).hide();

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
        placeholder: "Start typing..",
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
    $("#main-search").on("select2:selecting", function (event) {
        console.dir(event.params.args.data);
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
    $("#show-more-panel button").html("<i class='fa fa-spinner fa-spin'></i> Showing in a moment..");

    //Fetch Product
    GetProducts();
}
function GetProducts() {
    
    var api = g_api + '/api/products/by_tags?starting_product_id=' + g_result_from_product_id + '&products_per_page=' + g_page_count;

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
    console.log("g_result_from_product_id - " + g_result_from_product_id);
    console.log(api);
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
            console.dir(data);

            //Setting product id to fetch next result from
            if (data.length > 0) {
                g_result_from_product_id = data[data.length - 1].id + 1
                console.log("Next result from product id - " + g_result_from_product_id);
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
            if ($('[data-toggle="tooltip"]')[0]) {
                $('[data-toggle="tooltip"]').tooltip();
            }
        },
        error: function () { }
    });
}
function ShowProductPopup(productid) {
    $("body").css("margin-right:17px;overflow:hidden");
    $("#product-popup-loader").fadeIn("fast",function () {
        $.ajax({
            url: g_api + '/api/products/' + productid,
            success: function (product) {
                console.dir(product);
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
                            $("body").css("margin-right overflow:hidden");
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