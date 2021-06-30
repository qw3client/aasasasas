let activeTab;
let itemList = [];
let cart = [];

window.onload = () => {
    let infoMessageCookie = Cookies.get("info-message");
    if (infoMessageCookie !== undefined && infoMessageCookie === "read") {
        document.getElementById("info-message").setAttribute("style", "display: none;");
    }
}

axios.get("https://api.batmod.com/shop?cosmetics").then(response => {
    let itemsDiv = document.getElementById("items");
    let categoriesDiv = document.getElementById("categories");

    Object.keys(response.data).forEach(function (identifier) {
        let category = response.data[identifier];

        Object.keys(category.items).forEach(function (identifier) {
            let item = category.items[identifier];
            itemList.push(item);
        });

        if (categoriesDiv.childElementCount === 0) {
            activeTab = identifier;
        }

        let tab = document.createElement("a");
        tab.className = "item";
        tab.setAttribute("data-tab", identifier);
        tab.innerText = category.display_name;

        let segment = document.createElement("div");
        segment.className = "ui bottom attached tab segment";
        segment.setAttribute("data-tab", identifier);

        categoriesDiv.append(tab);
        itemsDiv.append(segment);
    });

    window.semantic = {
        handler: {}
    };

    semantic.tab = {};

    semantic.tab.ready = function () {
        $(".menu .item").tab({
            apiSettings: {
                mockResponse: function (settings) {
                    let cards = document.createElement("div");
                    cards.className = "ui special centered cards";

                    let items = response.data[settings.urlData.tab].items;

                    Object.keys(items).forEach(function (identifier) {
                        let item = items[identifier];

                        cards.append(createCard(item));
                        cards.append(createModal(item))
                    });

                    return cards;
                }
            },
            onLoad: function () {
                Object.keys(itemList).forEach(function (identifier) {
                    let item = itemList[identifier];

                    attachCard(item);
                });

                updateCart();
                updateButtons();
            },
            cache: true,
            context: "parent",
            auto: false,
            path: "/",
        }).tab("change tab", activeTab);

        updateCartSemantic();

        $(".message .close").on("click", function () {
            $(this).closest(".message").transition("fade");
            Cookies.set("info-message", "read");
        });
    };

    $(document).ready(semantic.tab.ready);

    let cartCookie = Cookies.get("cart");
    if (cartCookie !== undefined) {
        cartCookie.split(",").forEach(sku => {
            if (!isNaN(parseInt(sku))) {
                let item = itemList.find(value => {
                    return value.sku === parseInt(sku);
                });
                addItem(item);
            }
        });
    }
}).catch(err => {
    console.error(err);
});

window.addEventListener("resize", updateCartSemantic);

function updateCartSemantic() {
    $(".shopping-cart").popup({
        boundary: ".main-container",
        on: "click",
        lastResort: "bottom right",
        prefer: "adjacent",
        offset: window.innerWidth < 480 ? 25 - (window.innerWidth - 400) / 2 : -32,
    }).popup("hide");
    let element = document.getElementById("shopping-cart-popup");
    element.className = element.className.replace("visible", "hidden");
}

function updateButtons() {
    Object.keys(itemList).forEach(function (identifier) {
        let item = itemList[identifier];

        for (let i = 0; i <= 1; i++) {
            let buttonArray = document.getElementsByClassName((i === 0 ? "ui toggle bottom attached button sku" : "ui labeled icon button sku") + item.sku);
            if (buttonArray.length === 1) {
                let button = buttonArray[0];

                if (cart.includes(item.sku)) {
                    if (button.className.includes("positive")) {
                        button.className = button.className.replace(" positive", " approve");
                        button.innerHTML = "<i class=\"check icon\"></i>Added to cart";
                    }
                } else {
                    if (!button.className.includes("positive")) {
                        button.className += " positive";
                        button.innerHTML = "<i class=\"plus icon\"></i>Add to cart";
                    }
                }
            }
        }
    });

    let checkout = document.getElementById("checkout");
    if (cart.length > 0) {
        if (checkout.className.includes("disabled")) {
            checkout.className = checkout.className.replace(" disabled", "");
        }
    } else {
        if (!checkout.className.includes("disabled")) {
            checkout.className += " disabled";
        }
    }
}

function attachCard(item) {
    $(".ui.modal.sku" + item.sku).modal("attach events", ".special.centered.cards .image .button.sku" + item.sku, "show").modal({
        onApprove: function () {
            buttonClassName = "ui labeled icon button sku" + item.sku;
            let buttonArray = document.getElementsByClassName(buttonClassName);
            if (buttonArray.length === 1) {
                if (cart.includes(item.sku)) {
                    removeItem(item);
                } else {
                    addItem(item);
                }
            }
        }
    });

    let buttonClassName = ".special.centered.cards .bottom.button.sku" + item.sku;

    $(buttonClassName).on("click", function () {
        buttonClassName = "ui toggle bottom attached button sku" + item.sku;
        let buttonArray = document.getElementsByClassName(buttonClassName);
        if (buttonArray.length === 1) {
            if (cart.includes(item.sku)) {
                removeItem(item);
            } else {
                addItem(item);
            }
        }
    });

    $(".special.centered.cards .dimmable.image").dimmer({
        on: "hover"
    });
}

function updateCart() {
    let cartDiv = document.getElementById("shopping-cart");

    let children = cartDiv.children;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let classNames = child.className.split(" ");
        let className = classNames[classNames.length - 1];

        if (className === "empty_cart") {
            cartDiv.removeChild(child);
        }
    }

    if (cart.length < 1) {
        let itemDiv = document.createElement("div");
        itemDiv.className = "item empty_cart";

        let content = document.createElement("div");
        content.className = "content";

        let contentHeader = document.createElement("div");
        contentHeader.className = "header";
        contentHeader.innerText = "Your cart is empty";
        contentHeader.setAttribute("style", "font-size: 17px; padding: 30px; text-align: center;");

        content.append(contentHeader);
        itemDiv.append(content);

        cartDiv.append(itemDiv);
    }

    let total = 0;
    cart.forEach(sku => {
        let item = itemList.find(value => {
            return value.sku === sku;
        });

        total += item.price;
    });

    let totalElement = document.getElementById("shopping-cart-total");
    totalElement.innerText = "Total " + getPrettyPrice(total) + " USD";
}

function getPrettyPrice(price) {
    return (price / 100).toFixed(2);
}

function addItem(item) {
    cart.push(item.sku);
    Cookies.set("cart", cart, {expires: 7})

    let cartDiv = document.getElementById("shopping-cart");
    cartDiv.append(createCartItem(item));

    $(".ui.small.basic.icon.button.sku" + item.sku).on("click", function () {
        removeItem(item);
    });

    updateCart();
    updateButtons();
}

function removeItem(item) {
    const index = cart.indexOf(item.sku);
    if (index !== -1) {
        cart.splice(index, 1);
    }
    Cookies.set("cart", cart, {expires: 7})

    let cartDiv = document.getElementById("shopping-cart");

    let children = cartDiv.children;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let classNames = child.className.split(" ");
        let className = classNames[classNames.length - 1];

        if (className === "empty_cart") {
            cartDiv.removeChild(child);
        } else if (className.startsWith("sku")) {
            let sku = parseInt(className.replace("sku", ""));
            if (!cart.includes(sku)) {
                cartDiv.removeChild(child);
            }
        }
    }

    updateCart();
    updateButtons();
}

function createCard(item) {
    let card = document.createElement("div");
    card.className = "card";
    card.setAttribute("style", "width: 200px");

    let dimmableImage = document.createElement("div");
    dimmableImage.className = "dimmable image";

    let imageUiDimmer = document.createElement("div");
    imageUiDimmer.className = "ui dimmer";

    let imageContent = document.createElement("div");
    imageContent.className = "content";

    let imageCenter = document.createElement("div");
    imageCenter.className = "center";

    let imageUiInvertedButton = document.createElement("div");
    imageUiInvertedButton.className = "ui inverted button sku" + item.sku;
    imageUiInvertedButton.innerHTML = "<i class=\"info icon\"></i>Click for more details";

    let image = document.createElement("img");
    image.setAttribute("src", item.picture);
    image.setAttribute("alt", item.display_name);

    let content = document.createElement("div");
    content.className = "content";

    let header = document.createElement("div");
    header.className = "header";
    header.innerText = item.display_name;
    header.setAttribute("style", "font-size: 17px");

    let meta = document.createElement("div");
    meta.className = "meta";

    let metaSpan = document.createElement("span");
    metaSpan.setAttribute("style", "color: #407112");
    metaSpan.innerText = "$" + getPrettyPrice(item.price);

    let addToCart = document.createElement("div");
    addToCart.className = "ui toggle bottom attached button sku" + item.sku + " positive";
    addToCart.innerHTML = "<i class=\"plus icon\"></i>Add to cart";

    imageCenter.append(imageUiInvertedButton);
    imageContent.append(imageCenter);
    imageUiDimmer.append(imageContent);
    dimmableImage.append(imageUiDimmer);
    dimmableImage.append(image);
    card.append(dimmableImage);
    content.append(header);
    meta.append(metaSpan);
    content.append(meta);
    card.append(content);
    card.append(addToCart);

    return card;
}

function createModal(item) {
    let modal = document.createElement("div");
    modal.className = "ui modal sku" + item.sku;

    let closeIcon = document.createElement("i");
    closeIcon.className = "close icon";

    let header = document.createElement("div");
    header.className = "header";
    header.innerText = item.display_name;

    let imageContent = document.createElement("div");
    imageContent.className = "image content";

    let uiMediumImage = document.createElement("div");
    uiMediumImage.className = "ui medium image";

    let image = document.createElement("img");
    image.setAttribute("src", item.picture);
    image.setAttribute("alt", item.display_name);

    let description = document.createElement("div");
    description.className = "description";

    let descriptionHeader = document.createElement("div");
    descriptionHeader.className = "ui header";
    descriptionHeader.innerText = getPrettyPrice(item.price) + " USD";
    descriptionHeader.setAttribute("style", "color: #407112");

    let innerDescription = document.createElement("p");
    innerDescription.innerText = item.description;

    let actions = document.createElement("div");
    actions.className = "actions";

    let addToCart = document.createElement("div");
    addToCart.className = "ui labeled icon button sku" + item.sku + " positive";
    addToCart.innerHTML = "<i class=\"plus icon\"></i>Add to cart";

    modal.append(closeIcon);
    modal.append(header);
    uiMediumImage.append(image);
    imageContent.append(uiMediumImage);
    description.append(descriptionHeader);
    description.append(innerDescription);
    imageContent.append(description);
    modal.append(imageContent);
    actions.append(addToCart);
    modal.append(actions);

    return modal;
}

function createCartItem(item) {
    let itemDiv = document.createElement("div");
    itemDiv.className = "item sku" + item.sku;

    let image = document.createElement("img");
    image.className = "ui tiny image";
    image.setAttribute("src", item.picture);
    image.setAttribute("alt", item.display_name);
    image.setAttribute("style", "border-radius: 5px");

    let content = document.createElement("div");
    content.className = "content";

    let contentHeader = document.createElement("div");
    contentHeader.className = "header";
    contentHeader.innerText = item.display_name;
    contentHeader.setAttribute("style", "font-size: 17px");

    let contentMeta = document.createElement("div");
    contentMeta.className = "meta";

    contentMetaSpan = document.createElement("span");
    contentMetaSpan.innerText = "$" + getPrettyPrice(item.price);
    contentMetaSpan.setAttribute("style", "color: #407112; font-size: 14px");

    let rightContent = document.createElement("div");
    rightContent.className = "right floated content";
    rightContent.setAttribute("style", "margin-top: 25px");

    let removeDiv = document.createElement("div");
    removeDiv.className = "ui small basic icon button sku" + item.sku;

    let removeIcon = document.createElement("i");
    removeIcon.className = "trash icon";

    itemDiv.append(image);
    content.append(contentHeader);
    content.append(contentMeta);
    contentMeta.append(contentMetaSpan);
    itemDiv.append(content);
    removeDiv.append(removeIcon);
    rightContent.append(removeDiv);
    itemDiv.append(rightContent);

    return itemDiv;
}