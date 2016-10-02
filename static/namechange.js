$(document).ready(function() {

    console.log('Document is ready!');

    var username = Cookies.get('username');
    if (username === undefined) username = "Guest";
    $("#name-input").val(username);

    $("#name-input").on("change paste keyup", function() {
        console.log('Changed name', $(this).val());
        Cookies.set('username', $(this).val());
    });

})
