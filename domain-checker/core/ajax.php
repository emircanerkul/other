<?php

if (isset($_POST['domain'])) {

    include 'whois/whois.main.php';
    include 'whois/whois.utils.php';

    $whois = new Whois();
    $whois->deep_whois = false;
    $whois->non_icann = false;

    echo str_replace('\r', '<br>', json_encode($whois->Lookup($_POST['domain']), JSON_UNESCAPED_UNICODE));
}
