<?php
declare(strict_types=1);

session_start();

$config = require __DIR__ . '/admin-config.php';
$priceFile = __DIR__ . '/fuel-prices.js';
$appFile = __DIR__ . '/app.js';

$products = [
    '100' => ['label' => 'Gasoline 100', 'field' => 'price100'],
    '95' => ['label' => 'Gasoline 95', 'field' => 'price95'],
    'diesel' => ['label' => 'Diesel 10 PPM', 'field' => 'dieselPrice'],
    'diesel-shell' => ['label' => 'Extra Diezel Shell', 'field' => 'dieselShellPrice'],
    'lpg' => ['label' => 'LPG / Auto Gas', 'field' => 'lpgPrice'],
    'ev' => ['label' => 'EV Charging / kW', 'field' => 'evPrice'],
];

function h(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function isLoggedIn(): bool {
    return !empty($_SESSION['price_admin_logged_in']);
}

function checkPassword(string $password, array $config): bool {
    $hash = hash('sha256', $config['password_salt'] . $password);
    return hash_equals($config['password_hash'], $hash);
}

function readPrices(string $file, array $products): array {
    $source = file_get_contents($file);
    if ($source === false) {
        throw new RuntimeException('Could not read fuel-prices.js.');
    }

    $data = [];
    foreach ($products as $id => $product) {
        $pattern = '/id:\s*"' . preg_quote((string)$id, '/') . '".*?\byesterdayPrice:\s*(\d+).*?\bprice:\s*(\d+)/s';
        if (!preg_match($pattern, $source, $match)) {
            throw new RuntimeException("Could not find {$product['label']} in fuel-prices.js.");
        }
        $data[$product['field']] = (int)$match[2];
        $data[$product['field'] . '_previous'] = (int)$match[1];
    }

    if (!preg_match('/exchangeRate:\s*([0-9]+(?:\.[0-9]+)?)/', $source, $rateMatch)) {
        throw new RuntimeException('Could not find exchange rate.');
    }

    preg_match('/updatedAt:\s*"([^"]+)"/', $source, $updatedMatch);
    $data['exchangeRate'] = $rateMatch[1];
    $data['updatedAt'] = $updatedMatch[1] ?? '';

    return $data;
}

function formatDelta(int $current, int $previous): string {
    $delta = $current - $previous;
    if ($delta > 0) {
        return '+' . $delta;
    }
    return (string)$delta;
}

function deltaClass(int $current, int $previous): string {
    $delta = $current - $previous;
    if ($delta > 0) {
        return 'up';
    }
    if ($delta < 0) {
        return 'down';
    }
    return 'flat';
}

function updateProductPrice(string $source, string $id, int $newPrice): string {
    $pattern = '/(id:\s*"' . preg_quote($id, '/') . '".*?yesterdayPrice:\s*)(\d+)(.*?\bprice:\s*)(\d+)/s';
    $updated = preg_replace_callback($pattern, function (array $match) use ($newPrice): string {
        $currentPrice = (int)$match[4];
        if ($newPrice === $currentPrice) {
            return $match[0];
        }
        return $match[1] . $currentPrice . $match[3] . $newPrice;
    }, $source, 1, $count);

    if ($updated === null || $count !== 1) {
        throw new RuntimeException("Could not update product {$id}.");
    }

    return $updated;
}

function updateExchangeRate(string $source, string $rate): string {
    $updated = preg_replace('/(^\s*exchangeRate:\s*)([0-9]+(?:\.[0-9]+)?)/m', '${1}' . $rate, $source, 1, $count);
    if ($updated === null || $count !== 1) {
        throw new RuntimeException('Could not update exchange rate.');
    }
    return $updated;
}

function updateTimestamp(string $source, string $timestamp): string {
    $updated = preg_replace('/(^\s*updatedAt:\s*)(?:"[^"]*"|null)(,?\s*$)/m', '${1}"' . $timestamp . '"${2}', $source, 1, $count);
    if ($updated === null || $count !== 1) {
        throw new RuntimeException('Could not update timestamp.');
    }
    return $updated;
}

function appendPriceHistory(string $source, array $values, string $timestamp): string {
    $historyEntry = '    {' . PHP_EOL
        . '      date: "' . $timestamp . '",' . PHP_EOL
        . '      prices: {' . PHP_EOL
        . '        "100": ' . (int)$values['price100'] . ',' . PHP_EOL
        . '        "95": ' . (int)$values['price95'] . ',' . PHP_EOL
        . '        diesel: ' . (int)$values['dieselPrice'] . ',' . PHP_EOL
        . '        "diesel-shell": ' . (int)$values['dieselShellPrice'] . ',' . PHP_EOL
        . '        lpg: ' . (int)$values['lpgPrice'] . ',' . PHP_EOL
        . '        ev: ' . (int)$values['evPrice'] . PHP_EOL
        . '      }' . PHP_EOL
        . '    }';

    $pattern = '/(\n\s*history:\s*\[\s*)(.*?)(\n\s*\],\s*\n\s*products:\s*\[)/s';
    $updated = preg_replace_callback($pattern, function (array $match) use ($historyEntry): string {
        $existing = trim($match[2]);
        $body = $existing === '' ? $historyEntry : rtrim($match[2]) . ',' . PHP_EOL . $historyEntry;
        return $match[1] . $body . $match[3];
    }, $source, 1, $count);

    if ($updated === null || $count !== 1) {
        throw new RuntimeException('Could not append price history.');
    }

    return $updated;
}

function pricesHaveChanged(string $source, array $values, array $priceFields): bool {
    foreach ($priceFields as $id => $field) {
        $pattern = '/id:\s*"' . preg_quote((string)$id, '/') . '".*?\bprice:\s*(\d+)/s';
        if (!preg_match($pattern, $source, $match)) {
            throw new RuntimeException("Could not read current price for {$id}.");
        }
        if ((int)$match[1] !== (int)$values[$field]) {
            return true;
        }
    }
    return false;
}

function updateLocalFiles(string $priceFile, string $appFile, array $values): bool {
    $source = file_get_contents($priceFile);
    if ($source === false) {
        throw new RuntimeException('Could not read fuel-prices.js.');
    }

    $priceFields = [
        '100' => 'price100',
        '95' => 'price95',
        'diesel' => 'dieselPrice',
        'diesel-shell' => 'dieselShellPrice',
        'lpg' => 'lpgPrice',
        'ev' => 'evPrice',
    ];
    $pricesChanged = pricesHaveChanged($source, $values, $priceFields);
    $timestamp = date('c');

    foreach ($priceFields as $id => $field) {
        $source = updateProductPrice($source, (string)$id, (int)$values[$field]);
    }

    $source = updateExchangeRate($source, $values['exchangeRate']);
    if ($pricesChanged) {
        $source = appendPriceHistory($source, $values, $timestamp);
    }
    $source = updateTimestamp($source, $timestamp);

    if (file_put_contents($priceFile, $source, LOCK_EX) === false) {
        throw new RuntimeException('Could not write fuel-prices.js.');
    }

    if (is_file($appFile)) {
        $appSource = file_get_contents($appFile);
        if ($appSource !== false) {
            foreach ($priceFields as $id => $field) {
                $appSource = updateProductPrice($appSource, (string)$id, (int)$values[$field]);
            }
            $appSource = updateExchangeRate($appSource, $values['exchangeRate']);
            if ($pricesChanged) {
                $appSource = appendPriceHistory($appSource, $values, $timestamp);
            }
            $appSource = updateTimestamp($appSource, $timestamp);
            file_put_contents($appFile, $appSource, LOCK_EX);
        }
    }

    return $pricesChanged;
}

function githubRequest(string $method, string $url, array $config, ?array $body = null): array {
    $headers = [
        'Authorization: Bearer ' . $config['github_token'],
        'Accept: application/vnd.github+json',
        'X-GitHub-Api-Version: 2022-11-28',
        'User-Agent: Micka-Oil-Price-Admin',
    ];

    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_TIMEOUT, 20);

    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $response = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false) {
        throw new RuntimeException('GitHub request failed: ' . $error);
    }

    $decoded = json_decode($response, true);
    if ($status < 200 || $status >= 300) {
        $message = is_array($decoded) && isset($decoded['message']) ? $decoded['message'] : $response;
        throw new RuntimeException('GitHub error: ' . $message);
    }

    return is_array($decoded) ? $decoded : [];
}

function pushFileToGithub(string $localFile, string $repoPath, array $config): void {
    $owner = rawurlencode($config['github_owner']);
    $repo = rawurlencode($config['github_repo']);
    $path = str_replace('%2F', '/', rawurlencode($repoPath));
    $branch = rawurlencode($config['github_branch']);
    $url = "https://api.github.com/repos/{$owner}/{$repo}/contents/{$path}";

    $sha = null;
    try {
        $existing = githubRequest('GET', "{$url}?ref={$branch}", $config);
        $sha = $existing['sha'] ?? null;
    } catch (RuntimeException $error) {
        if (stripos($error->getMessage(), 'Not Found') === false) {
            throw $error;
        }
    }

    $body = [
        'message' => 'Update fuel prices ' . date('Y-m-d H:i'),
        'content' => base64_encode((string)file_get_contents($localFile)),
        'branch' => $config['github_branch'],
    ];

    if ($sha) {
        $body['sha'] = $sha;
    }

    githubRequest('PUT', $url, $config, $body);
}

function validateValues(array $post, array $products): array {
    $values = [];
    foreach ($products as $product) {
        $field = $product['field'];
        $value = trim((string)($post[$field] ?? ''));
        if (!ctype_digit($value) || (int)$value <= 0) {
            throw new RuntimeException("Invalid value for {$product['label']}.");
        }
        $values[$field] = (int)$value;
    }

    $rate = str_replace(',', '.', trim((string)($post['exchangeRate'] ?? '')));
    if (!preg_match('/^[0-9]+(?:\.[0-9]{1,2})?$/', $rate) || (float)$rate <= 0) {
        throw new RuntimeException('Invalid exchange rate.');
    }
    $values['exchangeRate'] = $rate;

    return $values;
}

$message = '';
$error = '';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_password'])) {
        if (checkPassword((string)$_POST['login_password'], $config)) {
            $_SESSION['price_admin_logged_in'] = true;
            header('Location: admin-prices.php');
            exit;
        }
        $error = 'Wrong password.';
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['logout'])) {
        session_destroy();
        header('Location: admin-prices.php');
        exit;
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isLoggedIn()) {
        $values = validateValues($_POST, $products);
        $pricesChanged = updateLocalFiles($priceFile, $appFile, $values);
        pushFileToGithub($priceFile, 'fuel-prices.js', $config);
        pushFileToGithub($appFile, 'app.js', $config);
        $message = $pricesChanged
            ? 'Prices updated live, recorded in history, and pushed to GitHub.'
            : 'Values saved and pushed to GitHub. No fuel price changed, so no duplicate history entry was added.';
    }

    $data = readPrices($priceFile, $products);
} catch (Throwable $caught) {
    $error = $caught->getMessage();
    $data = readPrices($priceFile, $products);
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Micka Oil Price Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f3f5f7; color: #17202a; }
    main { width: min(780px, 100%); margin: 0 auto; padding: 20px; }
    h1 { margin: 8px 0 4px; font-size: 28px; }
    .meta { color: #657383; margin: 0 0 18px; font-size: 14px; }
    form { display: grid; gap: 14px; }
    label { display: grid; gap: 7px; font-weight: 800; }
    input { width: 100%; min-height: 54px; border: 1px solid #cbd4dc; border-radius: 8px; padding: 10px 12px; background: #fff; font-size: 22px; }
    button { min-height: 56px; border: 0; border-radius: 8px; background: #08783d; color: #fff; font-size: 18px; font-weight: 800; }
    .logout { background: #25313d; }
    .banner { margin: 0 0 16px; padding: 12px; border-radius: 8px; font-weight: 800; }
    .success { background: #dcf5e7; color: #116431; }
    .error { background: #ffe1e1; color: #9b1c1c; }
    .actions { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 4px; }
    .note { margin-top: 16px; color: #687887; font-size: 13px; line-height: 1.4; }
    .admin-summary { display: grid; gap: 10px; margin: 0 0 18px; padding: 14px; border: 1px solid #d7e0e8; border-radius: 10px; background: #fff; }
    .admin-summary strong { color: #0f1720; }
    .price-field { padding: 12px; border: 1px solid #dfe6ed; border-radius: 10px; background: #fff; }
    .price-field__top { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .price-field__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; color: #607080; font-size: 13px; font-weight: 700; }
    .delta { min-width: 58px; padding: 6px 10px; border-radius: 999px; text-align: center; font-size: 13px; font-weight: 900; }
    .delta.up { color: #9b1c1c; background: #ffe1e1; }
    .delta.down { color: #116431; background: #dcf5e7; }
    .delta.flat { color: #576575; background: #eef2f6; }
  </style>
</head>
<body>
  <main>
    <h1>Micka Oil Prices</h1>
    <p class="meta">Updated: <?= h((string)$data['updatedAt']) ?></p>

    <?php if ($message): ?><div class="banner success"><?= h($message) ?></div><?php endif; ?>
    <?php if ($error): ?><div class="banner error"><?= h($error) ?></div><?php endif; ?>

    <?php if (!isLoggedIn()): ?>
      <form method="post">
        <label>
          <span>Password</span>
          <input name="login_password" type="password" autocomplete="current-password" required>
        </label>
        <button type="submit">Open Price Admin</button>
      </form>
    <?php else: ?>
      <div class="admin-summary">
        <strong>Live update workflow</strong>
        <span>This panel writes fuel-prices.js, updates app.js fallback data, records every genuine price change with its time, then pushes both files to GitHub.</span>
      </div>
      <form method="post">
        <?php foreach ($products as $product): ?>
          <?php
            $field = $product['field'];
            $current = (int)$data[$field];
            $previous = (int)$data[$field . '_previous'];
          ?>
          <label class="price-field">
            <span class="price-field__top">
              <span><?= h($product['label']) ?></span>
              <span class="delta <?= h(deltaClass($current, $previous)) ?>"><?= h(formatDelta($current, $previous)) ?></span>
            </span>
            <input name="<?= h($product['field']) ?>" type="number" min="1" step="1" value="<?= h((string)$data[$product['field']]) ?>" required>
            <span class="price-field__meta">
              <span>Previous: <?= h((string)$previous) ?></span>
              <span>Current: <?= h((string)$current) ?></span>
            </span>
          </label>
        <?php endforeach; ?>
        <label>
          <span>1 Euro in Lek</span>
          <input name="exchangeRate" type="number" min="1" step="0.01" value="<?= h((string)$data['exchangeRate']) ?>" required>
        </label>
        <div class="actions">
          <button type="submit">Update Live + GitHub</button>
        </div>
      </form>
      <form method="post" class="actions">
        <input type="hidden" name="logout" value="1">
        <button class="logout" type="submit">Log Out</button>
      </form>
    <?php endif; ?>

    <p class="note">This page changes the live website files on the server and then syncs the same files to GitHub.</p>
  </main>
</body>
</html>
