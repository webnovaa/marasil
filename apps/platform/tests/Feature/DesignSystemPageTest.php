<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class DesignSystemPageTest extends TestCase
{
    public function test_design_system_showcase_is_available_outside_production(): void
    {
        $this->get('/dev/design-system')->assertOk();
    }
}
