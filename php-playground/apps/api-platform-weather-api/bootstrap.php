<?php
$zip = new ZipArchive();
if ($zip->open(__DIR__ . '/weather-api-pack.zip') === true) {
  // extractTo does not reliably overwrite pre-existing files in this
  // runtime — wipe the tree first so every deploy starts clean
  foreach ([__DIR__ . '/vendor', __DIR__ . '/config', __DIR__ . '/src', __DIR__ . '/public', __DIR__ . '/migrations', __DIR__ . '/translations', __DIR__ . '/templates', __DIR__ . '/var'] as $d) {
    if (is_dir($d)) { $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($d, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST); foreach ($it as $f) { $f->isDir() ? rmdir($f) : unlink($f); } rmdir($d); }
  }
  $zip->extractTo(__DIR__);
  $zip->close();
  echo "extracted";
}
