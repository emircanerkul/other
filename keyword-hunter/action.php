<?php

session_start();

if (isset($_GET["r"]) && isset($_SESSION["name"])) {
  switch($_GET["r"]) {
    case "logout":
      session_destroy();
      break;
    case "joker":
      if (intval($_SESSION["joker"]) > 0) {

        $hints = explode(".", $_SESSION["hint"]);
        $availableHints = array_keys(array_filter($hints, function($hint){
          return $hint == "_";
        }));

        if (count($availableHints) > 1) {
          $selected = $availableHints[rand(0, count($availableHints) - 1)];
          $hints[$selected] = mb_substr($_SESSION["answer"], $selected, 1);

          $_SESSION["hint"] = implode("." , $hints);
          $_SESSION["joker"] = intval($_SESSION["joker"]) - 1;
        }
      }
      break;
  }
}

header("Location: /");
