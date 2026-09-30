$(function () {
    $("input").keypress(function (e) {
        if (e.which == 13) {
            $(this).prop("disabled", true);
            $.ajax({
                type: "POST",
                url: "./core/ajax.php",
                data: { domain: $(this).val() },
                success: function (response) {
                    var data;
                    try { data = JSON.parse(response); } catch (e) { data = null; }
                    var raw = data && data.rawdata && data.rawdata.join ? data.rawdata.join("\n") : (data && data.rawdata);
                    if (!raw || !String(raw).trim()) {
                        // the whois server is unreachable from this sandboxed
                        // browser runtime (no outbound TCP) — say so instead
                        // of showing an empty box
                        raw = "Whois lookup unavailable: this page runs PHP in your browser via WebAssembly, which cannot open outbound connections to whois servers (port 43). Run the project locally or on a server for live lookups.";
                    }
                    $(".output").html(raw);
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
