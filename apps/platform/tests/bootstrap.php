<?php

// Docker passes variables through getenv(), which can otherwise override PHPUnit's
// $_ENV values. Apply the forced test configuration before Laravel boots.
$configuration = simplexml_load_file(dirname(__DIR__).'/phpunit.xml');
foreach ($configuration->php->env as $variable) {
    if ((string) $variable['force'] !== 'true') {
        continue;
    }
    $name = (string) $variable['name'];
    $value = (string) $variable['value'];
    putenv($name.'='.$value);
    $_ENV[$name] = $_SERVER[$name] = $value;
}
// Never load or clear the running application's cached configuration.
putenv('APP_CONFIG_CACHE='.__DIR__.'/nonexistent-config-cache.php');
$_ENV['APP_CONFIG_CACHE'] = $_SERVER['APP_CONFIG_CACHE'] = __DIR__.'/nonexistent-config-cache.php';

require dirname(__DIR__).'/vendor/autoload.php';
