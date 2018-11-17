<?php

error_reporting(0);

if (isset($_POST['type'])) {
    switch ($_POST['type']) {
        case 'getFile':
            if (isset($_POST['folder']) && isset($_POST['file'])) {
                $directory = './logs/' . strtotime($_POST['folder']) . "/" . $_POST['file'];
                echo file_get_contents($directory);
            }
            break;

        case 'getFiles':
            if (isset($_POST['data'])) {

                $data = array();
                $directory = './logs/' . strtotime($_POST['data']);
                $files = array_slice(scandir($directory), 2);

                foreach ($files as $file) {
                    array_push($data, [$file, count(json_decode(file_get_contents($directory . "/" . $file), true))]);
                }

                usort($data, function ($a, $b) {
                    return $b[1] - $a[1];
                });

                echo json_encode($data);
            }
            break;

        case 'getFolders':
            $data = [];
            $directory = './logs';
            $files = array_slice(scandir($directory), 2);
            arsort($files);
            foreach ($files as $file) {

                $dir = opendir($directory);
                $i = 0;

                while (false !== ($f = readdir($dir))) {
                    $i++;
                }

                array_push($data, [$file, $i - 2]);
            }
            echo json_encode($data);
            break;

        default:
            break;
    }
}
