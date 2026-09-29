<?php
error_reporting(E_ERROR);
session_start();

if (isset($_SESSION["refresh"]) && $_SESSION["refresh"]) {
  $_SESSION["refresh"] = false;
  header('Location: /');
}

if (!$_SESSION["next"] && (isset($_POST["answer"]) || (isset($_SESSION["level"]) && time() > $_SESSION["answer_timeout"]))) {
  if(isset($_POST["answer"]) && $_POST["answer"] == $_SESSION["answer"]) {
    $_SESSION["refresh"] = true;
    $_SESSION["score"] += strlen($_SESSION["answer"]) * 100;
    $result = "Doğru cevap verip. " . strlen($_SESSION["answer"]) * 100 . " puan kazanarak " . $_SESSION["score"] . " puana eriştiniz.";
  } else if (isset($_POST["answer"]) && $_POST["answer"] != $_SESSION["answer"]) {
    $result = "Yanlış cevap verdiniz. Doğru cevap: '" . $_SESSION["answer"] . "'";
  } else if (time() > $_SESSION["answer_timeout"]) {
    $result = "Süreniz dahilinde cevap veremediniz.";
  }

  if ($_SESSION["level"] > 6) {
    $result .= ' <a href="/" style="font-size: 12px;font-weight: bold;">YARIŞMAYI BİTİR >><a>';
  } else {
    $result .= ' <a href="/" style="font-size: 12px;font-weight: bold;">SONRAKİ SORUYA GEÇ >><a>';
  }

  $_SESSION["answered"] = true;
  $_SESSION["next"] = true;

  echo str_replace(
    ["%NAME%", "%RESULT%", "%SCORE%"],
    [$_SESSION["name"], $result, $_SESSION["score"]],
    file_get_contents("./template/result.xhtml")
  );
}
else if(isset($_POST["name"])) {
  $_SESSION["name"] = $_POST["name"];
  $_SESSION["joker"] = 10;
  $_SESSION["score"] = 0;
  $_SESSION["refresh"] = false;

  getQuestion(1);
}
else if (isset($_SESSION["name"])) {
  getQuestion($_SESSION["answered"] ? ++$_SESSION["level"] : $_SESSION["level"]);
}
else {
  $highScores = "";
  $i = 0;

  foreach ((array)json_decode(file_get_contents("./high-scores.json")) as $key => $value) {
    $i++;
    $highScores .= "<li>$key: <b>$value</b></li>";
  }

  echo str_replace("%HIGH_SCORES%", $highScores, file_get_contents("./template/login.xhtml"));
}

function getQuestion($level) {
  if ($level > 7) {
    if ($_SESSION["score"] > 0) {
      $scores = (array) json_decode(file_get_contents("./high-scores.json"));
      $scores[$_SESSION["name"]] = $_SESSION["score"];
      arsort($scores);
      $scores = array_slice($scores, 0, 10);
      file_put_contents("./high-scores.json", json_encode($scores, JSON_UNESCAPED_UNICODE));
    }

    $result = "Yarışmayı " . $_SESSION["score"] . ' puan ile tamamladınız. <a href="/" style="font-size: 12px;font-weight: bold;">Tekrar Oyna<a>';
    echo str_replace(
      ["%NAME%", "%RESULT%", "%SCORE%"],
      [$_SESSION["name"], $result, $_SESSION["score"]],
      file_get_contents("./template/final.xhtml")
    );
    session_destroy();
  } else {
    if ($_SESSION["next"] || (!isset($_SESSION["level"]) || $level != $_SESSION["level"])) {
      $_SESSION["level"] = $level;
      // primary: MySQL (docker-compose db). Fallback: SQLite, so the quiz
      // also runs in the browser playground (php-wasm has no MySQL server,
      // but pdo_sqlite is available) — the question bank is seeded from
      // default.sql on first use.
      try {
        $pdo = new PDO("mysql:host=db;dbname=default;charset=utf8", "root", "root");
        $lengthFn = "CHAR_LENGTH";
        $randomFn = "RAND";
      } catch (PDOException $e) {
        $pdo = kh_sqlite_db();
        $lengthFn = "LENGTH";
        $randomFn = "RANDOM";
      }
      $q = $pdo->prepare("SELECT * FROM q WHERE {$lengthFn}(answer) = :LENGTH ORDER BY {$randomFn}() LIMIT 1");
      $q->execute([":LENGTH" => $level + 3]);
      $data = $q->fetch();

      $_SESSION["question"] = $data["question"];
      $_SESSION["answer"] = $data["answer"];
      $hint = [];
      for ($i=0; $i < $level + 3; $i++) {
        $hint[] = "_";
      }
      $_SESSION["hint"] = implode(".", $hint);
      $_SESSION["answer_timeout"] = time() + 30;
      $_SESSION["answered"] = false;
      $_SESSION["next"] = false;
    }

    echo str_replace(
      ["%NAME%", "%QUESTION%", "%HINT%", "%SCORE%", "%JOKER%", "%TIME%"],
      [$_SESSION["name"], $_SESSION["level"] . ") ". $_SESSION["question"], $_SESSION["hint"], $_SESSION["score"], $_SESSION["joker"], $_SESSION["answer_timeout"] - time() ],
      file_get_contents("./template/question.xhtml")
    );
  }

}


/**
 * SQLite fallback for the in-browser PHP runtime (php-wasm): builds
 * keyword-hunter.sqlite from default.sql on first use. MySQL stays the
 * primary backend when the app runs under docker-compose.
 */
function kh_sqlite_db()
{
    $dbPath = __DIR__ . "/keyword-hunter.sqlite";
    $fresh = !file_exists($dbPath);
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    if ($fresh) {
        $pdo->exec("CREATE TABLE q (id INTEGER PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL)");
        $sql = file_get_contents(__DIR__ . "/default.sql");
        if (preg_match_all("/\((\d+),\s*'((?:[^']|\\')*)',\s*'((?:[^']|\\')*)'\)/", $sql, $m, PREG_SET_ORDER)) {
            $stmt = $pdo->prepare("INSERT INTO q (id, question, answer) VALUES (?, ?, ?)");
            foreach ($m as $row) {
                $stmt->execute([$row[1], str_replace("\'", "'", $row[2]), str_replace("\'", "'", $row[3])]);
            }
        }
    }
    return $pdo;
}
