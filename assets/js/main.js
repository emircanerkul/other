$(function () {
    $("input").keypress(function (e) {
        if (e.which == 13) {
            $(this).prop("disabled", true);
            $.ajax({
                type: "POST",
                url: "./core/ajax.php",
                data: { domain: $(this).val() },
                success: function (response) {
                    console.log(response);
                    $(".output").html(JSON.parse(response).rawdata);
                    $(".output").css("display", "block");
                    $(".output").animate({ height: 200 }, 500, function () {
                        $("input").prop("disabled", false);
                        $("input").prop("placeholder", $("input").val());
                        $("input").val("");
                    });
                }
            });
        }
    });

    $("input").click(function () {
        $(".output").animate({ height: 0 }, 500, function () {
            $(".output").css("display", "none");
        });
    })
});
