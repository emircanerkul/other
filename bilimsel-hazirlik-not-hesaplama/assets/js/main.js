$(function () {

    var lessons = [".matematik", ".fizik", ".kimya"];
    var grade = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];

    function calculate() {
        $.cookie('grade', JSON.stringify(grade), { expires: 365 });

        var matematik_toplam = grade[0][0] + grade[0][1] + grade[0][2] + grade[0][3];
        var fizik_toplam = grade[1][0] + grade[1][1] + grade[1][2] + grade[1][3];
        var kimya_toplam = grade[2][0] + grade[2][1] + grade[2][2] + grade[2][3];

        var toplam_not = (matematik_toplam * 50 / 100) + (fizik_toplam * 30 / 100) + (kimya_toplam * 20 / 100);
        if (toplam_not >= 60) $sonuç = "Geçtin";
        else $sonuç = "Kaldın";

        $(".page>.result").html("<span class='" + (toplam_not >= 60 ? "green" : "red") + "'>" + $sonuç + "</span> <span class='small'>(" + toFixed(toplam_not, 1) + ")</span>");
        $(".matematik>.grade").html("Ortalama: " + toFixed(matematik_toplam, 1));
        $(".fizik>.grade").html("Ortalama: " + toFixed(fizik_toplam, 1));
        $(".kimya>.grade").html("Ortalama: " + toFixed(kimya_toplam, 1));
    }

    $.each(lessons, function (index, el) {

        $(el).find("#v1_input").slider({
            max: 100,
            step: 1,
            slide: function (event, ui) {
                $(el).find("#v1_text").text(ui.value);
                grade[index][0] = ui.value * 20 / 100;
                calculate();
            }
        });

        $(el).find("#v2_input").slider({
            max: 100,
            step: 1,
            slide: function (event, ui) {
                $(el).find("#v2_text").text(ui.value);
                grade[index][1] = ui.value * 20 / 100;
                calculate();
            }
        });

        $(el).find("#v3_input").slider({
            max: 100,
            step: 1,
            slide: function (event, ui) {
                $(el).find("#v3_text").text(ui.value);
                grade[index][2] = ui.value * 20 / 100;
                calculate();
            }
        });

        $(el).find("#f1_input").slider({
            max: 100,
            step: 1,
            slide: function (event, ui) {
                $(el).find("#f1_text").text(ui.value);
                grade[index][3] = ui.value * 40 / 100;
                calculate();
            }
        });
    });


    if ($.cookie('grade') != undefined) {
        grade = JSON.parse($.cookie('grade'));

        $.each(lessons, function (index, el) {
            $(el).find("#v1_input").slider("value", grade[index][0] * 100 / 20);
            $(el).find("#v2_input").slider("value", grade[index][1] * 100 / 20);
            $(el).find("#v3_input").slider("value", grade[index][2] * 100 / 20);
            $(el).find("#f1_input").slider("value", grade[index][3] * 100 / 40);

            $(el).find("#v1_text").text(Math.round(grade[index][0] * 100 / 20));
            $(el).find("#v2_text").text(Math.round(grade[index][1] * 100 / 20));
            $(el).find("#v3_text").text(Math.round(grade[index][2] * 100 / 20));
            $(el).find("#f1_text").text(Math.round(grade[index][3] * 100 / 40));
        });

        calculate();
    }

});

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}
