<?php

declare(strict_types=1);

namespace Carl;

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
