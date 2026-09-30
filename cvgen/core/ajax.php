<?php

include "cvgen.php";

$CVGen = new CVGen();
if (isset($_GET["get"]))
    switch ($_GET["get"]) {
        case 'profile_list':
            echo json_encode($CVGen->get_profile_list(), JSON_UNESCAPED_UNICODE);
            break;
        case 'template_list':
            echo json_encode($CVGen->get_template_list(), JSON_UNESCAPED_UNICODE);
            break;
        case 'template':
            if (isset($_GET["t"]) && isset($_GET["profile"]) && isset($_GET["strategy"]) && isset($_GET["privacy"]) && isset($_GET["color"]) ) {
                echo $CVGen->compile($_GET["t"], $_GET["profile"], $_GET["strategy"], $_GET["privacy"], $_GET["color"]);
            }
            break;
        case 'generate':
            if (isset($_GET["url"])) {
                $CVGen->generate($_GET["url"]);
            }
            break;
        default:
            # code...
            break;
    }
