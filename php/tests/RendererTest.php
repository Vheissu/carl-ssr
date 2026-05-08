<?php

declare(strict_types=1);

require __DIR__ . '/../Carl.php';

use Carl\Html;
use Carl\Renderer;

$tests = [];

$test = function (string $name, callable $callback) use (&$tests): void {
    $tests[] = [$name, $callback];
};

$test('loads component names from a manifest file', function (): void {
    $renderer = Renderer::fromManifestFile(__DIR__ . '/../../tests/fixtures/portable.manifest.json');

    assertSame(['carl-greeting', 'carl-badge', 'carl-action-panel'], $renderer->componentNames());
    assertSame(true, $renderer->has('carl-greeting'));
    assertSame(false, $renderer->has('carl-missing'));
});

$test('renders a shadow component with escaped props and raw light DOM', function (): void {
    $renderer = Renderer::fromManifestFile(__DIR__ . '/../../tests/fixtures/portable.manifest.json');

    assertSame(
        '<carl-greeting data-runtime="php"><template shadowrootmode="open"><style>:host{display:block}.name{font-weight:700}</style><p>Hello, <span class="name">Dwayne &amp; Carl</span>.</p><slot></slot></template><p>Projected</p></carl-greeting>',
        $renderer->render('carl-greeting', [
            'props' => [
                'name' => 'Dwayne & Carl',
            ],
            'attrs' => [
                'data-runtime' => 'php',
                'hidden' => false,
            ],
            'children' => Html::raw('<p>Projected</p>'),
        ])
    );
});

$test('renders a light DOM component without projecting children', function (): void {
    $renderer = Renderer::fromManifestFile(__DIR__ . '/../../tests/fixtures/portable.manifest.json');

    assertSame(
        '<carl-badge><span class="badge">Ready &amp; waiting</span></carl-badge>',
        $renderer->render('carl-badge', [
            'props' => [
                'label' => 'Ready & waiting',
            ],
            'children' => 'ignored',
        ])
    );
});

$test('renders named slots and delegatesFocus', function (): void {
    $renderer = Renderer::fromManifestFile(__DIR__ . '/../../tests/fixtures/portable.manifest.json');

    assertSame(
        '<carl-action-panel><template shadowrootmode="closed" shadowrootdelegatesfocus><style>:host{display:block}header{font-weight:700}</style><section><header>Danger &amp; recovery</header><main><slot></slot></main><footer><slot name="actions"></slot></footer></section></template><p>Body</p><span slot="actions"><button>Save</button></span></carl-action-panel>',
        $renderer->render('carl-action-panel', [
            'props' => [
                'title' => 'Danger & recovery',
            ],
            'children' => Html::raw('<p>Body</p>'),
            'slots' => [
                'actions' => Html::raw('<button>Save</button>'),
            ],
        ])
    );
});

$test('supports escaped, dotted, and raw template placeholders', function (): void {
    assertSame(
        '<h2>Dwayne &lt;D&gt;</h2><p>trusted</p>',
        Renderer::renderTemplate('<h2>{{ author.name }}</h2>{{{ trustedHtml }}}', [
            'author' => [
                'name' => 'Dwayne <D>',
            ],
            'trustedHtml' => '<p>trusted</p>',
        ])
    );
});

$test('throws for unknown components and invalid manifests', function (): void {
    $renderer = Renderer::fromManifestFile(__DIR__ . '/../../tests/fixtures/portable.manifest.json');

    assertThrows(
        fn (): string => $renderer->render('carl-missing'),
        InvalidArgumentException::class
    );

    assertThrows(
        fn (): Renderer => Renderer::fromManifestJson('{nope'),
        RuntimeException::class
    );

    assertThrows(
        fn (): Renderer => Renderer::fromManifestArray([
            'format' => 'carl.manifest',
            'version' => 1,
            'components' => [
                [
                    'tagName' => 'notcustom',
                    'template' => '<p></p>',
                ],
            ],
        ]),
        InvalidArgumentException::class
    );
});

runTests($tests);

/** @param list<array{0: string, 1: callable}> $tests */
function runTests(array $tests): void
{
    $failures = 0;

    foreach ($tests as [$name, $callback]) {
        try {
            $callback();
            echo ". {$name}\n";
        } catch (Throwable $throwable) {
            $failures += 1;
            fwrite(STDERR, "F {$name}\n{$throwable->getMessage()}\n");
        }
    }

    if ($failures > 0) {
        fwrite(STDERR, "{$failures} PHP test(s) failed.\n");
        exit(1);
    }

    echo count($tests) . " PHP tests passed.\n";
}

function assertSame(mixed $expected, mixed $actual): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            "Expected:\n" . var_export($expected, true) . "\nActual:\n" . var_export($actual, true)
        );
    }
}

/** @param class-string<Throwable> $className */
function assertThrows(callable $callback, string $className): void
{
    try {
        $callback();
    } catch (Throwable $throwable) {
        if ($throwable instanceof $className) {
            return;
        }

        throw new RuntimeException("Expected {$className}, got " . $throwable::class);
    }

    throw new RuntimeException("Expected {$className} to be thrown.");
}
