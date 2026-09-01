<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Grace period after subscription end
    |--------------------------------------------------------------------------
    |
    | After ends_at, the tenant may continue limited use until grace_ends_at.
    |
    */
    'grace_days' => (int) env('SUBSCRIPTION_GRACE_DAYS', 3),
];
