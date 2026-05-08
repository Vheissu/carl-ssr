<?php

declare(strict_types=1);

require __DIR__ . '/../php/Carl.php';

use Carl\Html;
use Carl\Renderer;

$renderer = Renderer::fromManifestFile(__DIR__ . '/card.manifest.json');

echo $renderer->render('carl-greeting', [
    'props' => [
        'name' => 'Dwayne & Carl',
    ],
    'attrs' => [
        'data-example' => 'php',
    ],
    'children' => Html::raw('<p>This light DOM content is projected through the default slot.</p>'),
]) . PHP_EOL;
