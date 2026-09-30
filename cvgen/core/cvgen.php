<?php
define('ROOT_PATH', dirname(__DIR__) . '/');
class CVGen
{
    private $profiles = [];
    private $templates = [];
    private $data_path = ROOT_PATH . 'data/';
    private $profiles_path = ROOT_PATH . 'data/profiles/';
    private $images_path = ROOT_PATH . 'data/images/';
    private $templates_path = ROOT_PATH . 'templates/';

    function __construct()
    {
        $this->profiles = array_map(function ($n) {
            return str_replace(".json", "", $n);
        }, array_slice(scandir($this->profiles_path), 2));
        $this->templates = array_slice(scandir($this->templates_path), 3);
    }

    public function get_template_list()
    {
        return $this->templates;
    }

    public function get_template($name)
    {
        return file_get_contents($this->templates_path . $name);
    }

    public function compile($t, $p, $strategy, $privacy, $color)
    {
        $template = $this->get_template($t);
        $profile = $this->get_profile($p);

        foreach ($profile as $key => $value) {
            if (is_array($profile->$key)) {
                foreach ($profile->$key as $key_a => $value_a) {
                    if (is_object($value_a)) {
                        if (isset($value_a->tag)) {
                            if (!$strategy && $value_a->tag == "detailed") {
                                unset($profile->$key[$key_a]);
                                $profile->$key = array_values($profile->$key);
                            }
                        } else if (isset($value_a->level)) {
                            if (!$strategy && $value_a->level <= 6) {
                                unset($profile->$key[$key_a]);
                                $profile->$key = array_values($profile->$key);
                            }
                        }
                    }
                }
            } else if (is_object($profile->$key)) {
                $profile->$key = $strategy ? $profile->$key->detailed : $profile->$key->important;
            }
        }

        $template = $this->compile_lang($template, $profile->lang);
        $template = $this->compile_arrays($template, $profile);
        $template = $this->compile_variables($template, $profile, $privacy, $color);

        return preg_replace("/I(|%)=(.*?)=(|%)I/", "", $template);
    }

    private function compile_variables($template, $profile, $privacy, $color)
    {
        preg_match_all("/I%=(.*?)=%I/", $template, $variables);

        foreach ($variables[0] as $key => $value) {
            if ($variables[1][$key] == "color")
                $template = str_replace($value, "#" . $color, $template);
            else if ($variables[1][$key] == "photo_privacy")
                $template = str_replace($value, $privacy == 0 ? "none" : "block", $template);
            else if ($variables[1][$key] == "photo") {
                $template = str_replace($value, 'data:image/gif;base64,' . (base64_encode(file_get_contents($this->images_path . $profile->{$variables[1][$key]}))), $template);
            } else $template = str_replace($value, $profile->{$variables[1][$key]}, $template);
        }
        return $template;
    }

    private function compile_arrays($template, $profile)
    {
        $array_keys = [];
        foreach ($profile as $key => $value) {
            if (is_array($profile->$key)) array_push($array_keys, $key);
        }

        foreach ($array_keys as $array_key) {
            if (preg_match_all("/(?=I%=$array_key=I)(.*)(?<=I=$array_key=%I)/s", $template, $gauss_template) != false) {

                $template = str_replace($gauss_template[0][0], str_repeat($gauss_template[0][0], count($profile->{$array_key})), $template);
                preg_match_all("/(?<=I%=$array_key=I)(.*)(?=I=$array_key=%I)/sU", $template, $gauss_template);

                foreach ($gauss_template[0] as $gauss_key => $gauss_value) {
                    $gauss_value_first = $gauss_value;
                    preg_match_all("/I%=(.*?)=%I/", $gauss_value, $gauss_variables);
                    foreach ($gauss_variables[0] as $k => $v) {
                        $gauss_value = str_replace($v, $profile->{$array_key}[$gauss_key]->{$gauss_variables[1][$k]}, $gauss_value);
                    }
                    $template = preg_replace('/' . preg_quote($gauss_value_first, '/') . '/', $gauss_value, $template, 1);
                }
            }
        }
        return $template;
    }

    private function compile_lang($template, $lang)
    {
        $translations = $this->get_translations();

        preg_match_all("/I&=(.*?)=&I/", $template, $variables);
        foreach ($variables[0] as $key => $value)
            $template = str_replace($value, $translations->$lang->{$variables[1][$key]}, $template);
        return $template;
    }

    public function get_profile_list()
    {
        return array_values(array_filter($this->profiles, function ($v) {
            if ($v == "[EN] Example") return false;
            else return true;
        }));
    }

    public function get_profile($name)
    {
        return json_decode(file_get_contents($this->profiles_path . $name . '.json'));
    }

    public function get_translations()
    {
        return json_decode(file_get_contents($this->data_path . 'translation.json'));
    }

    function generate($url)
    {
        exec('wkhtmltopdf -L 0 -R 0 -T 7 -B 0 --dpi 300 --image-quality 100 --no-pdf-compression --page-offset 50 "' . str_replace("./core/ajax.php", "http://{$_SERVER['HTTP_HOST']}{$_SERVER['PHP_SELF']}", $url) . '" "../resume.pdf"');
    }
}
