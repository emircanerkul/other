$(function () {
    $folderList = $("#folderList");
    $fileList = $("#dataList");
    $backList = $("#backList");
    $log = '<div class="log"><div class="header"><span class="time">%DATE%</span><span class="right"><strong>%METHOD%</strong> ❝%URL%❞</span></div><div class="content">%LOG%</div></div>';

    $.ajax({
        type: "POST",
        url: "system/ajax.php",
        data: { type: "getFolders" }
    }).success(function (data) {
        $.each($.parseJSON(data), function (val, data) {

            var unixTimeStamp = data[0];
            var timestampInMilliSeconds = unixTimeStamp * 1000;
            var date = new Date(timestampInMilliSeconds);

            var day = (date.getDate() < 10 ? '0' : '') + date.getDate();
            var month = (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
            var year = date.getFullYear();

            $folderList.append('<li date="' + day + '.' + month + '.' + year + '">' + day + '.' + month + '.' + year + ' <span>' + data[1] + '</span></li>');
        });
    });

    $folderList.find(".delete-button").click(function () {
        $(this).parent().fadeOut(500);
    });

    $folder = null;

    $folderList.on("click", "li", function () {
        $fileList.html("");
        $folder = $(this).attr("date");
        $.ajax({
            type: "POST",
            url: "system/ajax.php",
            data: { type: "getFiles", data: $folder }
        }).success(function (data) {
            $.each($.parseJSON(data), function (key, data) {
                $fileList.append('<li file-ip="' + data[0] + '" file-title="' + data[0] + '">' + $.base64.decode(data[0]) + ' <span>' + data[1] + '</span></li>');
            });

            $folderList.hide();
            $fileList.show();
            $backList.attr("disabled", false);
        });
    });

    $backList.click(function () {
        $folderList.show();
        $fileList.hide();
        $backList.attr("disabled", true);
    });

    $fileList.on("click", "li", function () {
        $li = $(this);
        $li.removeClass("active");
        $li.addClass("active");
        $(".logs").find(".row").html("");

        $.ajax({
            type: "POST",
            url: "system/ajax.php",
            data: { type: "getFile", folder: $folder, file: $(this).attr("file-title") }
        }).success(function (result) {

            $.each($.parseJSON(result), function (key, data) {

                var timestampInMilliSeconds = key * 1000;
                var date = new Date(timestampInMilliSeconds);

                var day = (date.getDate() < 10 ? '0' : '') + date.getDate();
                var month = (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1);
                var year = date.getFullYear();
                var hour = date.getHours();
                var min = date.getMinutes();

                $(".logs").find(".row").append($.parseHTML($log.replace("%DATE%", day + '.' + month + '.' + year + " " + hour + ":" + min).replace("%LOG%", "<b>IP: </b>" + data.IP + "<br><b>Tarayıcı: </b>" + data.BROWSER + "<br><b>İşletim Sistemi: </b>" + data.OS + "<br><b>Yönlendiren: </b>" + data.HTTP_REFERER).replace("%METHOD%", data.REQUEST_METHOD).replace("%URL%", data.SCRIPT_NAME)));
            });

            /*
                   Suported Ip Api: https://ipstack.com/product
                Register and get free api. Free 10.000/month query
                        Get access key and change variable
            */
            var api_access_key = "";

            if (api_access_key != "")
                $.getJSON("http://api.ipstack.com/" + $.base64.decode($li.attr("file-ip")) + "?access_key=" + api_access_key, function (data) {

                    $(".logs").find(".row").prepend($.parseHTML('<div class="infobox"><div class="columns three"><b>IP:</b> ' + data.ip + '</div><div class="columns three"><b>Ülke: </b>' + data.country_name + ' ' + data.country_code + '</div><div class="columns three"><b>Şehir: </b>' + data.region_name + '</div><div class="columns three">' + data.latitude + ' ' + data.longitude + '</div></div>'));

                });
        })
    });
});
