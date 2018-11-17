<?php

include_once "IpLogger.php";

new IpLogger(); //Ultra easy usage
new IpLogger("data"); //Change default save directory name logs instead of data
new IpLogger("data", "d.m.y"); //Change default daily directory name d.m.Y instead of d.m.y 2th parameter must be date format http://php.net/manual/tr/function.date.php
