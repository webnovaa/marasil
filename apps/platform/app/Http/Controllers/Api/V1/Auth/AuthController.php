<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Identity\Actions\ForgotPassword;
use App\Domain\Identity\Actions\LoginUser;
use App\Domain\Identity\Actions\LogoutUser;
use App\Domain\Identity\Actions\RegisterUser;
use App\Domain\Identity\Actions\ResendOtp;
use App\Domain\Identity\Actions\ResetPassword;
use App\Domain\Identity\Actions\VerifyPhoneOtp;
use App\Domain\Identity\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendOtpRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyPhoneRequest;
use App\Http\Resources\UserResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUser $action): JsonResponse
    {
        $result = $action->handle($request->validated(), $request->ip());

        return ApiResponse::success([
            'user' => UserResource::make($result['user']),
            'message' => 'تم إنشاء الحساب. يرجى التحقق من رقم الهاتف.',
        ], 201);
    }

    public function verifyPhone(VerifyPhoneRequest $request, VerifyPhoneOtp $action): JsonResponse
    {
        $user = $action->handle(
            phoneE164: $request->string('phone_e164')->toString(),
            code: $request->string('code')->toString(),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        Auth::guard('web')->login($user, remember: true);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        return ApiResponse::success([
            'user' => UserResource::make($user->fresh(['profile', 'roles'])),
            'redirect_to' => $user->homeDashboardPath(),
            'message' => 'تم التحقق بنجاح. اختر خطتك للمتابعة.',
        ]);
    }

    public function resendOtp(ResendOtpRequest $request, ResendOtp $action): JsonResponse
    {
        $action->handle(
            phoneE164: $request->string('phone_e164')->toString(),
            ip: $request->ip(),
        );

        return ApiResponse::success([
            'message' => 'إن وُجد حساب مطابق فسيتم إرسال رمز جديد.',
        ]);
    }

    public function login(LoginRequest $request, LoginUser $action): JsonResponse
    {
        try {
            $result = $action->handle(
                phoneE164: $request->string('phone_e164')->toString(),
                password: $request->string('password')->toString(),
                ip: $request->ip(),
                userAgent: $request->userAgent(),
                deviceName: $request->input('device_name'),
            );
        } catch (HttpException $e) {
            return ApiResponse::error(
                $e->getMessage(),
                $this->statusMessage($e->getMessage()),
                $e->getStatusCode(),
            );
        }

        return ApiResponse::success([
            'user' => UserResource::make($result['user']),
            'auth_session_id' => $result['auth_session']->ulid,
            'redirect_to' => $result['user']->homeDashboardPath(),
        ]);
    }

    public function logout(Request $request, LogoutUser $action): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        $action->handle($user, $request->ip(), $request->userAgent());

        return ApiResponse::success(['message' => 'تم تسجيل الخروج.']);
    }

    public function forgotPassword(ForgotPasswordRequest $request, ForgotPassword $action): JsonResponse
    {
        $action->handle($request->string('phone_e164')->toString(), $request->ip());

        return ApiResponse::success([
            'message' => 'إن وُجد حساب مطابق فسيتم إرسال رمز إعادة التعيين.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request, ResetPassword $action): JsonResponse
    {
        $user = $action->handle(
            phoneE164: $request->string('phone_e164')->toString(),
            code: $request->string('code')->toString(),
            password: $request->string('password')->toString(),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success([
            'user' => UserResource::make($user),
            'message' => 'تم تحديث كلمة المرور.',
        ]);
    }

    private function statusMessage(string $code): string
    {
        return match ($code) {
            'PHONE_NOT_VERIFIED' => 'يجب التحقق من رقم الهاتف أولاً.',
            'ACCOUNT_PENDING_APPROVAL' => 'الحساب بانتظار موافقة الإدارة.',
            'ACCOUNT_SUSPENDED' => 'الحساب معلّق أو غير مفعّل.',
            default => 'غير مسموح.',
        };
    }
}
