var Api = pc.createScript('api');

console.log("API script loaded");

window.addEventListener("message", function (event) {
    // if (event.origin === "http://127.0.0.1:5000/") { // always check message came from your website
    console.log("flask message recieved");
        var account_name = event.data.account_name;
        console.log(account_name);

        // call API method one:
        window.setName(account_name);
    // }
}, false);


window.setName = function (account_name) {
    console.log("window.setName called");
    var app = pc.Application.getApplication();
    var button_entity = app.root.findByName("Button");
    console.log(button_entity);
    button_entity.script.chat.setName(account_name);
};


window.sendEmail = function (email_address) {
    // Await maybe
    // 
    console.log("window.setName called");
    var app = pc.Application.getApplication();
    var button_entity = app.root.findByName("Button");
    console.log(button_entity);
    button_entity.script.chat.setName(account_name);
};
