<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class TraitFinder
{
    public static $API_ENDPOINT = 'https://api.github.com/repos/%USER%/%REPOSITORY%/git/trees/%PATH%';

    protected $httpClient;

    /** @param HttpClientInterface $httpClientInterface */
    public function __construct(HttpClientInterface $httpClientInterface)
    {
        $this->httpClient = $httpClientInterface->withOptions([
            'headers' => ['Authorization' => 'token ' . $_ENV['GITHUB_TOKEN']]
        ]);
    }

    public function findAllFiles($user, $repository, $path, $include = 'trait.php'): array
    {
        $files = [];
        if (str_contains($path, 'https://') || str_contains($path, 'http://')) {
            $url = $path;
        } else {
            $url = str_replace(
                ['%USER%', '%REPOSITORY%', '%PATH%'],
                [$user, $repository, $path],
                self::$API_ENDPOINT
            );
        }

        $request = $this->httpClient->request('GET', $url);

        $content = json_decode($request->getContent());

        foreach ($content->tree as $branch) {
            if ($branch->type == 'tree') {
                $files = $files + $this->findAllFiles($user, $repository, $branch->url);
            } elseif ($branch->type == 'blob' &&
                strpos(strtolower($branch->path), $include) !== false) {
                $files[] = $branch->url;
            }
        }

        return $files;
    }

    public function getFileContent($url)
    {
        $request = $this->httpClient->request('GET', $url);
        $content = json_decode($request->getContent())->content;
        return base64_decode($content);
    }
}
