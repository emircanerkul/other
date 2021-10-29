var currentHash = "";
var goesUp = false;

document.getElementById('up').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.goesUp = true;
});

document.addEventListener('scroll', () => {
  document.querySelectorAll('.anchor_tags').forEach(function (e) {
    var top = window.pageYOffset;
    var distance = top - e.offsetTop;
    var hash = e.id;
    if (top < 10 && currentHash != hash) {
      window.location.hash = "";
      currentHash = "";
      window.goesUp = false;

    } else if (distance < 30 && distance > -30 && currentHash != hash && !window.goesUp) {
      window.location.hash = (hash);
      currentHash = hash;
    }
  });
});
