<?php

class IpLogger
{
    private $REQUEST_METHOD;
    private $REQUEST_TIME;
    private $HTTP_REFERER;
    private $HTTP_USER_AGENT;
    private $SCRIPT_NAME;

    private $folder_base;
    private $folder_name;
    private $folder_path;
    private $ip_file_path;

    public function __construct($folder_base = "logs", $date_format = "d.m.Y")
    {
        $this->REQUEST_METHOD = $_SERVER['REQUEST_METHOD'];
        $this->REQUEST_TIME = $_SERVER['REQUEST_TIME'];
        $this->HTTP_REFERER = @$_SERVER['HTTP_REFERER'];
        $this->HTTP_USER_AGENT = $_SERVER['HTTP_USER_AGENT'];
        $this->SCRIPT_NAME = $_SERVER['SCRIPT_NAME'];

        $this->folder_name = strtotime(date($date_format, time()));
        $this->folder_base = __DIR__ . DIRECTORY_SEPARATOR . $folder_base;
        $this->folder_path = $this->folder_base . DIRECTORY_SEPARATOR . $this->folder_name;
        $this->ip_file_path = $this->folder_base . DIRECTORY_SEPARATOR . $this->folder_name . DIRECTORY_SEPARATOR . base64_encode(IpLogger::get_ip());

        if (!file_exists($this->folder_base)) {
            mkdir($this->folder_base);
        }

        if (!file_exists($this->folder_path)) {
            mkdir($this->folder_path);
        }

        $this->catch_ip();
    }

    private function catch_ip()
    {
        $browser = get_browser($this->HTTP_USER_AGENT);

        $data = array(
            "IP" => IpLogger::get_ip(),
            "REQUEST_METHOD" => $this->REQUEST_METHOD,
            "HTTP_REFERER" => $this->HTTP_REFERER,
            "BROWSER" => $browser->browser . " " . $browser->version,
            "OS" => IpLogger::get_os($this->HTTP_USER_AGENT),
            "SCRIPT_NAME" => $this->SCRIPT_NAME,
        );

        if (!file_exists($this->ip_file_path)) {
            $storedData[$this->REQUEST_TIME] = $data;
        } else {
            $storedData = json_decode(file_get_contents($this->ip_file_path), true);
            $storedData[$this->REQUEST_TIME] = $data;
        }

        file_put_contents($this->ip_file_path, json_encode($storedData));
    }

    private function get_ip()
    {
        $client = @$_SERVER['HTTP_CLIENT_IP'];
        $forward = @$_SERVER['HTTP_X_FORWARDED_FOR'];
        $remote = $_SERVER['REMOTE_ADDR'];

        if (filter_var($client, FILTER_VALIDATE_IP)) {
            $ip = $client;
        } elseif (filter_var($forward, FILTER_VALIDATE_IP)) {
            $ip = $forward;
        } else {
            $ip = $remote;
        }

        return $ip;
    }

    private function get_browser($user_agent)
    {
        if (empty($user_agent)) {
            return array('nav' => 'NC', 'name' => 'NC', 'version' => 'NC');
        }

        $content_nav['name'] = 'Bilinmiyor';

        if (strpos($user_agent, 'Opera') || strpos($user_agent, 'OPR/')) {

            $content_nav['name'] = 'Opera';

            if (strpos($user_agent, 'OPR/')) {
                $content_nav['reel_name'] = 'OPR/';
            } else {
                $content_nav['reel_name'] = 'Opera';
            }

        } elseif (strpos($user_agent, 'Edge')) {
            $content_nav['name'] = $content_nav['reel_name'] = 'Edge';
        } elseif (strpos($user_agent, 'Chrome')) {
            $content_nav['name'] = $content_nav['reel_name'] = 'Chrome';
        } elseif (strpos($user_agent, 'Safari')) {
            $content_nav['name'] = $content_nav['reel_name'] = 'Safari';
        } elseif (strpos($user_agent, 'Firefox')) {
            $content_nav['name'] = $content_nav['reel_name'] = 'Firefox';
        } elseif (strpos($user_agent, 'MSIE') || strpos($user_agent, 'Trident/7') || strpos($user_agent, 'Trident/7.0; rv:')) {
            $content_nav['name'] = 'Internet Explorer';

            if (strpos($user_agent, 'Trident/7.0; rv:')) {
                $content_nav['reel_name'] = 'Trident/7.0; rv:';
            } elseif (strpos($user_agent, 'Trident/7')) {
                $content_nav['reel_name'] = 'Trident/7';
            } else {
                $content_nav['reel_name'] = 'Opera';
            }

        }

        $pattern = '#' . $content_nav['reel_name'] . '\/*([0-9\.]*)#';

        $matches = array();

        if (preg_match($pattern, $user_agent, $matches)) {

            $content_nav['version'] = $matches[1];
            return $content_nav;

        }
        echo $content_nav['name'];
        return array('name' => $content_nav['name'], 'version' => 'Inconnu');
    }

    private static function get_os($user_agent)
    {
        $os_platform = "Unknown OS Platform";

        $os_array = array(
            '/windows nt 10/i' => 'Windows 10',
            '/windows nt 6.3/i' => 'Windows 8.1',
            '/windows nt 6.2/i' => 'Windows 8',
            '/windows nt 6.1/i' => 'Windows 7',
            '/windows nt 6.0/i' => 'Windows Vista',
            '/windows nt 5.2/i' => 'Windows Server 2003/XP x64',
            '/windows nt 5.1/i' => 'Windows XP',
            '/windows xp/i' => 'Windows XP',
            '/windows nt 5.0/i' => 'Windows 2000',
            '/windows me/i' => 'Windows ME',
            '/win98/i' => 'Windows 98',
            '/win95/i' => 'Windows 95',
            '/win16/i' => 'Windows 3.11',
            '/macintosh|mac os x/i' => 'Mac OS X',
            '/mac_powerpc/i' => 'Mac OS 9',
            '/linux/i' => 'Linux',
            '/ubuntu/i' => 'Ubuntu',
            '/iphone/i' => 'iPhone',
            '/ipod/i' => 'iPod',
            '/ipad/i' => 'iPad',
            '/android/i' => 'Android',
            '/blackberry/i' => 'BlackBerry',
            '/webos/i' => 'Mobile',
        );

        foreach ($os_array as $regex => $value) {

            if (preg_match($regex, $user_agent)) {
                $os_platform = $value;
            }

        }

        return $os_platform;
    }
}
