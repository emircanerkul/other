$(".slider .pagination div").click(function () {
  let active = $(this).parentsUntil(".pages").find("li.active").removeClass("active");
  let pages = active.parent().children();

  pages.eq((pages.index(active) + ($(this).hasClass("left") ? -1 : +1)) % pages.length).addClass("active");
});
