particlesJS.load('particles', 'assets/particles.json');
$("#up").click(() => {
  $('html, body').animate({
    scrollTop: 0
  }, 800);
});
