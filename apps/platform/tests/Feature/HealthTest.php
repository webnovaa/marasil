<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Support\ApiResponse;
use Tests\TestCase;

final class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_unified_payload(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.service', 'platform')
            ->assertJsonStructure([
                'success',
                'data' => ['status', 'service', 'time'],
                'meta' => ['request_id'],
            ]);
    }

    public function test_api_response_error_shape(): void
    {
        $response = ApiResponse::error(
            code: 'VALIDATION_ERROR',
            message: 'Invalid input.',
            status: 422,
            details: ['field' => 'phone'],
        );

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame([
            'success' => false,
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'Invalid input.',
                'details' => ['field' => 'phone'],
            ],
            'meta' => [
                'request_id' => $response->getData(true)['meta']['request_id'],
            ],
        ], $response->getData(true));
    }
}
