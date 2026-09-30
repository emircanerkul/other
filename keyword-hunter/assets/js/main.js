$time = document.querySelector("#time");
if (parseInt($time.innerHTML) <= 10) {
  $time.className = "badge badge-danger";
}

setInterval(() => {
  var time = parseInt($time.innerHTML);

  if (time <= 0) {
    window.location.reload();
  }
  else if (time <= 11 && $time.className != "badge badge-danger") {
    $time.className = "badge badge-danger";
  }

  if (time > 0) {
    $time.innerHTML = --time;
  }
}, 1000);
