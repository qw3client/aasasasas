let itemList = [];
let cart = [];

let usernameInput;
let uuid;
let username;

let cartCookie = Cookies.get("cart");
if (cartCookie === undefined || cartCookie === "") {
    window.location.href = "shop";
}

window.onload = () => {
    let infoMessageCookie = Cookies.get("info-message");
    if (infoMessageCookie !== undefined && infoMessageCookie === "read") {
        document.getElementById("info-message").setAttribute("style", "display: none;");
    }

    initializeRequiredFields();

    paypal.Buttons({
        style: {
            shape: "rect",
            color: "gold",
            layout: "vertical",
            label: "pay",

        },

        createOrder: function () {
            return fetch("https://api.batmod.com/shop/paypal/create-order?cart=" + cart + "&uuid=" + uuid + "&username=" + username, {
                method: "post",
                headers: {
                    "content-type": "application/json"
                }
            }).then(function (res) {
                return res.json();
            }).then(function (data) {
                return data.id;
            });
        },

        onApprove: function (data) {
            return fetch("https://api.batmod.com/shop/paypal/capture-order?order-id=" + data.orderID, {
                method: "post",
                headers: {
                    "content-type": "application/json"
                }
            }).then(function (res) {
                return res.json();
            }).then(function (details) {

                if (details.status === "COMPLETED") {
                    // remove cookies
                    Cookies.remove("cart");

                    window.location.href = "payment-successful?status=" + details.status + "&id=" + details.id + "&email=" + details.email;
                } else {
                    window.location.href = "payment-failed?error=" + details.error + "&description=" + details.description;
                }
            });
        },

        onError: function (err) {
            console.log(err);
            window.location.href = "payment-failed?error=buttons&description=could not create PayPal buttons";
        }
    }).render("#checkout-paypal");

    setInterval(() => {
        updateUser();
    }, 1000);
}

axios.get("https://api.batmod.com/shop?cosmetics").then(response => {
    Object.keys(response.data).forEach(function (identifier) {
        let category = response.data[identifier];

        Object.keys(category.items).forEach(function (identifier) {
            let item = category.items[identifier];
            itemList.push(item);
        });
    });

    window.semantic = {
        handler: {}
    };

    semantic.tab = {};

    semantic.tab.ready = function () {
        $(".message .close").on("click", function () {
            $(this).closest(".message").transition("fade");
            Cookies.set("info-message", "read");
        });

        $(".ui.checkbox").checkbox().first().checkbox({
            onChecked: function () {
                termsField = true;
                updateRequiredTermsField();
            },
            onUnchecked: function () {
                termsField = false;
                updateRequiredTermsField();
            }
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

    if (cart.length < 1) {
        window.location.href = "shop";
    }
}).catch(err => {
    console.error(err);
});

let termsField = false;
let usernameField = false;

function initializeRequiredFields() {
    updateRequiredTermsField();
    updateRequiredUsernameField();
}

function updateRequiredTermsField() {
    document.getElementById("tos-required").setAttribute("style", termsField ? "display: none;" : "color: #db2828;");

    document.getElementById("checkout-paypal-cover").setAttribute("style", termsField && usernameField ? "" : "pointer-events: none;");
}

function updateRequiredUsernameField() {
    document.getElementById("username-required").setAttribute("style", usernameField ? "display: none;" : "color: #db2828;");

    document.getElementById("checkout-paypal-cover").setAttribute("style", termsField && usernameField ? "" : "pointer-events: none;");
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
        contentHeader.innerHTML = "<p>Your cart is empty</p><p><a href=\"shop\">Return back to the shop</a></p>";
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

    if (cart.length < 1) {
        let container = document.getElementById("checkout-container");
        let segment = container.getElementsByClassName("ui segment").item(0);
        let header = container.getElementsByClassName("ui header centered").item(0);

        segment.remove();
        header.innerHTML = "<i class=\"credit card outline icon\"></i>Nothing to purchase";
    }
}

function updateUser() {
    let inputElement = document.getElementById("username_input");

    let input = inputElement.value;
    if (usernameInput !== input) {
        usernameInput = input;

        if (input === username || !input) {
            setMissingUser();
            return;
        }

        axios.get("https://api.ashcon.app/mojang/v2/user/" + input).then(result => {
            let imageElement = document.getElementById("username_img");
            uuid = result.data.uuid;
            username = result.data.username;
            imageElement.src = "https://crafatar.com/avatars/" + result.data.uuid + "?size=38&default=606e2ff0-ed77-4842-9d6c-e1d3321c7838&overlay";
            imageElement.alt = username;

            usernameField = true;
            updateRequiredUsernameField();
        }).catch(error => {
            setMissingUser();
        });
    }
}

function setMissingUser() {
    let imageElement = document.getElementById("username_img");
    uuid = undefined;
    username = undefined;
    imageElement.src = "https://crafatar.com/avatars/606e2ff0-ed77-4842-9d6c-e1d3321c7838?size=38&overlay";
    imageElement.alt = "Missing";

    usernameField = false;
    updateRequiredUsernameField();
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

/*
const payPaymentwall = () => {
    let actualCart = checkIfCartEmpty();

    let username = document.getElementsByName("username")[0].value;
    if (actualCart === true) {
        return false;
    }

    actualCart = actualCart.filter(v => {
        return v != null;
    });

    actualCart = JSON.stringify(actualCart);

    axios.get("/pay", {
        headers: {
            method: "paymentwall",
            actualCart,
            username
        }
    }).then(result => {
        document.getElementById("paymentwall-widget").className += " is-active";
        document.getElementById("paymentwall-widget").innerHTML = result.data.url;
        document.getElementById("shop-container").style = "visibility: hidden;";
    });
};

const payPaypal = () => {
    let actualCart = checkIfCartEmpty();
    let username = document.getElementsByName("username")[0].value;
    if (actualCart === true) {
        return false;
    }

    actualCart = actualCart.filter(v => {
        return v != null;
    });

    actualCart = JSON.stringify(actualCart);

    axios.get("/pay", {
        headers: {
            method: "paypal",
            actualCart,
            username
        }
    }).then(result => {
        window.location.href = result.data.url.href;
    });
};
 */