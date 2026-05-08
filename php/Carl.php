<?php

declare(strict_types=1);

namespace Carl;

use InvalidArgumentException;
use RuntimeException;

final class Html
{
    private function __construct(private readonly string $html)
    {
    }

    public static function raw(string $html): self
    {
        return new self($html);
    }

    public function render(): string
    {
        return $this->html;
    }
}

final class Renderer
{
    /** @var array<string, array<string, mixed>> */
    private array $components = [];

    /** @param array<string, mixed> $manifest */
    public function __construct(array $manifest)
    {
        if (($manifest['format'] ?? null) !== 'carl.manifest') {
            throw new InvalidArgumentException('Expected a Carl manifest.');
        }

        if (($manifest['version'] ?? null) !== 1) {
            throw new InvalidArgumentException('Unsupported Carl manifest version.');
        }

        foreach (($manifest['components'] ?? []) as $component) {
            if (!is_array($component) || !isset($component['tagName'])) {
                throw new InvalidArgumentException('Carl manifest contains an invalid component.');
            }

            $this->components[(string) $component['tagName']] = $component;
        }
    }

    public static function fromManifestFile(string $path): self
    {
        $json = file_get_contents($path);

        if ($json === false) {
            throw new RuntimeException("Unable to read Carl manifest: {$path}");
        }

        $manifest = json_decode($json, true);

        if (!is_array($manifest)) {
            throw new RuntimeException("Unable to parse Carl manifest: {$path}");
        }

        return new self($manifest);
    }

    /** @param array{props?: array<string, mixed>, attrs?: array<string, mixed>, children?: mixed, slots?: array<string, mixed>} $options */
    public function render(string $tagName, array $options = []): string
    {
        if (!isset($this->components[$tagName])) {
            throw new InvalidArgumentException("Unknown Carl component: {$tagName}");
        }

        return $this->renderComponent($this->components[$tagName], $options);
    }

    /** @param array<string, mixed> $component */
    private function renderComponent(array $component, array $options): string
    {
        $tagName = (string) $component['tagName'];
        self::assertCustomElementName($tagName);

        $props = array_merge(
            is_array($component['defaults'] ?? null) ? $component['defaults'] : [],
            is_array($options['props'] ?? null) ? $options['props'] : []
        );
        $attrs = is_array($options['attrs'] ?? null) ? $options['attrs'] : [];
        $slots = is_array($options['slots'] ?? null) ? $options['slots'] : [];
        $children = $options['children'] ?? ($slots['default'] ?? '');
        $styles = is_array($component['styles'] ?? null) ? $component['styles'] : [];
        $shadow = $this->normalizeShadow($component['shadow'] ?? null);
        $body = $this->renderTemplate((string) ($component['template'] ?? ''), $props);
        $hostAttributes = $this->renderAttributes($attrs);

        if ($shadow === false) {
            return "<{$tagName}{$hostAttributes}>{$this->renderStyles($styles)}{$body}</{$tagName}>";
        }

        $lightDom = $this->renderLightDom($children, $slots);

        return "<{$tagName}{$hostAttributes}>{$this->renderShadowRoot($shadow, $styles, $body)}{$lightDom}</{$tagName}>";
    }

    /** @param array<string, mixed> $props */
    private function renderTemplate(string $template, array $props): string
    {
        return (string) preg_replace_callback(
            '/\{\{\{\s*([A-Za-z_$][A-Za-z0-9_.$-]*)\s*\}\}\}|\{\{\s*([A-Za-z_$][A-Za-z0-9_.$-]*)\s*\}\}/',
            function (array $matches) use ($props): string {
                $rawPath = ($matches[1] ?? '') !== '' ? (string) $matches[1] : null;
                $path = $rawPath ?? (string) ($matches[2] ?? '');
                $value = $this->readPath($props, $path);

                if ($value === null || $value === false) {
                    return '';
                }

                return $rawPath !== null ? (string) $value : self::escape($value);
            },
            $template
        );
    }

    /** @param array<string, mixed> $props */
    private function readPath(array $props, string $path): mixed
    {
        $value = $props;

        foreach (explode('.', $path) as $key) {
            if (!is_array($value) || !array_key_exists($key, $value)) {
                return null;
            }

            $value = $value[$key];
        }

        return $value;
    }

    /** @param array<string, mixed> $attrs */
    private function renderAttributes(array $attrs): string
    {
        $output = '';

        foreach ($attrs as $name => $value) {
            self::assertSafeHtmlName((string) $name, 'attribute');

            if ($value === null || $value === false) {
                continue;
            }

            if ($value === true) {
                $output .= " {$name}";
                continue;
            }

            $output .= " {$name}=\"" . self::escape($value) . '"';
        }

        return $output;
    }

    /** @param array<string, mixed> $slots */
    private function renderLightDom(mixed $children, array $slots): string
    {
        $output = $this->renderValue($children);

        foreach ($slots as $name => $value) {
            if ($name === 'default') {
                continue;
            }

            self::assertSafeHtmlName((string) $name, 'slot');
            $output .= '<span slot="' . self::escape($name) . '">' . $this->renderValue($value) . '</span>';
        }

        return $output;
    }

    private function renderValue(mixed $value): string
    {
        if ($value === null || $value === false) {
            return '';
        }

        if ($value instanceof Html) {
            return $value->render();
        }

        if (is_array($value)) {
            return implode('', array_map(fn (mixed $item): string => $this->renderValue($item), $value));
        }

        return self::escape($value);
    }

    /** @param array<int, mixed> $styles */
    private function renderStyles(array $styles): string
    {
        return implode('', array_map(
            fn (mixed $style): string => '<style>' . str_ireplace('</style', '<\/style', (string) $style) . '</style>',
            $styles
        ));
    }

    /** @param array{mode: string, delegatesFocus?: bool} $shadow */
    private function renderShadowRoot(array $shadow, array $styles, string $body): string
    {
        $mode = $shadow['mode'];
        $delegatesFocus = !empty($shadow['delegatesFocus']) ? ' shadowrootdelegatesfocus' : '';

        return "<template shadowrootmode=\"{$mode}\"{$delegatesFocus}>{$this->renderStyles($styles)}{$body}</template>";
    }

    /** @return array{mode: string, delegatesFocus?: bool}|false */
    private function normalizeShadow(mixed $shadow): array|false
    {
        if ($shadow === false) {
            return false;
        }

        if ($shadow === null || $shadow === 'open' || $shadow === 'closed') {
            return ['mode' => $shadow ?? 'open'];
        }

        if (is_array($shadow) && in_array($shadow['mode'] ?? null, ['open', 'closed'], true)) {
            return [
                'mode' => $shadow['mode'],
                'delegatesFocus' => (bool) ($shadow['delegatesFocus'] ?? false)
            ];
        }

        throw new InvalidArgumentException('Invalid Carl shadow root configuration.');
    }

    private static function escape(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private static function assertSafeHtmlName(string $name, string $type): void
    {
        if (!preg_match('/^[A-Za-z_:][A-Za-z0-9:._-]*$/', $name)) {
            throw new InvalidArgumentException("Invalid {$type} name: {$name}");
        }
    }

    private static function assertCustomElementName(string $tagName): void
    {
        if (!preg_match('/^[a-z][.0-9_a-z-]*-[.0-9_a-z-]*$/', $tagName)) {
            throw new InvalidArgumentException("Carl components must use a valid custom element tag name: {$tagName}");
        }
    }
}
