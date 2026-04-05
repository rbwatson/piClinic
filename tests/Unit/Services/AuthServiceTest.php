<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Session;
use PiClinic\Repositories\SessionRepository;
use PiClinic\Repositories\StaffRepository;
use PiClinic\Services\AuthService;

class AuthServiceTest extends TestCase
{
    // createStub() is used throughout setUp() — PHPUnit 12 generates a notice
    // when createMock() is used on doubles that never have expects() set on them.
    // Use createMock() only in tests that verify a method is called.
    private StaffRepository   $staffRepo;
    private SessionRepository $sessionRepo;
    private AuthService $authService;

    /** @var array<string,mixed> */
    private array $activeStaff;

    /** @var array<string,mixed> */
    private array $activeSession = [
        'token'                 => 'abc123',
        'username'              => 'jsmith',
        'accessGranted'         => 'ClinicStaff',
        'sessionLanguage'       => 'en',
        'sessionClinicPublicID' => 'CL01',
        'expiresOnDate'         => '2099-12-31 23:59:59',
        'loggedIn'              => 1,
        'sessionIP'             => '127.0.0.1',
        'sessionUA'             => 'TestAgent/1.0',
    ];

    protected function setUp(): void
    {
        $this->activeStaff = [
            'staffID'                => 1,
            'username'               => 'jsmith',
            'password'               => password_hash('correct-password', PASSWORD_DEFAULT),
            'active'                 => 1,
            'accessGranted'          => 'ClinicStaff',
            'preferredLanguage'      => 'en',
            'preferredClinicPublicID' => 'CL01',
        ];

        $this->staffRepo   = $this->createStub(StaffRepository::class);
        $this->sessionRepo = $this->createStub(SessionRepository::class);
        $this->authService = new AuthService($this->sessionRepo, $this->staffRepo);
    }

    // -------------------------------------------------------------------------
    // login()
    // -------------------------------------------------------------------------

    public function testLoginSuccessReturnsSession(): void
    {
        $this->staffRepo->method('findByUsername')->willReturn($this->activeStaff);
        $this->sessionRepo->method('create')->willReturn(true);
        $this->staffRepo->method('updateLastLogin')->willReturn(true);

        $session = $this->authService->login('jsmith', 'correct-password', '127.0.0.1', 'TestAgent/1.0');

        $this->assertInstanceOf(Session::class, $session);
        $this->assertSame('jsmith', $session->username);
        $this->assertSame('ClinicStaff', $session->accessGranted);
        $this->assertSame('en', $session->sessionLanguage);
        $this->assertSame(40, strlen($session->token));
    }

    public function testLoginWithEmptyUsernameThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->authService->login('', 'password', '127.0.0.1', '');
    }

    public function testLoginWithEmptyPasswordThrows400(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->authService->login('jsmith', '', '127.0.0.1', '');
    }

    public function testLoginWithUnknownUsernameThrows401(): void
    {
        $this->staffRepo->method('findByUsername')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->login('nobody', 'password', '127.0.0.1', '');
    }

    public function testLoginWithInactiveAccountThrows401(): void
    {
        $inactive = array_merge($this->activeStaff, ['active' => 0]);
        $this->staffRepo->method('findByUsername')->willReturn($inactive);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->login('jsmith', 'correct-password', '127.0.0.1', '');
    }

    public function testLoginWithWrongPasswordThrows401(): void
    {
        $this->staffRepo->method('findByUsername')->willReturn($this->activeStaff);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->login('jsmith', 'wrong-password', '127.0.0.1', '');
    }

    // -------------------------------------------------------------------------
    // logout()
    // -------------------------------------------------------------------------

    public function testLogoutWithValidTokenSucceeds(): void
    {
        // Use createMock() here so we can verify setLoggedOut() is called once.
        $sessionRepo = $this->createMock(SessionRepository::class);
        $sessionRepo->method('findByToken')->willReturn($this->activeSession);
        $sessionRepo->expects($this->once())->method('setLoggedOut');

        (new AuthService($sessionRepo, $this->staffRepo))->logout('abc123');
    }

    public function testLogoutWithUnknownTokenThrows404(): void
    {
        $this->sessionRepo->method('findByToken')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->authService->logout('bad-token');
    }

    public function testLogoutWithAlreadyClosedSessionThrows404(): void
    {
        $closed = array_merge($this->activeSession, ['loggedIn' => 0]);
        $this->sessionRepo->method('findByToken')->willReturn($closed);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(404);

        $this->authService->logout('abc123');
    }

    // -------------------------------------------------------------------------
    // validateSession()
    // -------------------------------------------------------------------------

    public function testValidateSessionWithValidTokenReturnsSession(): void
    {
        $this->sessionRepo->method('findByToken')->willReturn($this->activeSession);

        $session = $this->authService->validateSession('abc123', '127.0.0.1', 'TestAgent/1.0');

        $this->assertInstanceOf(Session::class, $session);
        $this->assertSame('jsmith', $session->username);
    }

    public function testValidateSessionWithUnknownTokenThrows401(): void
    {
        $this->sessionRepo->method('findByToken')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->validateSession('bad', '127.0.0.1', '');
    }

    public function testValidateSessionWithClosedSessionThrows401(): void
    {
        $closed = array_merge($this->activeSession, ['loggedIn' => 0]);
        $this->sessionRepo->method('findByToken')->willReturn($closed);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->validateSession('abc123', '127.0.0.1', 'TestAgent/1.0');
    }

    public function testValidateSessionWithExpiredSessionThrows401(): void
    {
        $expired = array_merge($this->activeSession, ['expiresOnDate' => '2000-01-01 00:00:00']);
        $this->sessionRepo->method('findByToken')->willReturn($expired);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->validateSession('abc123', '127.0.0.1', 'TestAgent/1.0');
    }

    public function testValidateSessionWithWrongIPThrows401(): void
    {
        $this->sessionRepo->method('findByToken')->willReturn($this->activeSession);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->validateSession('abc123', '10.0.0.1', 'TestAgent/1.0');
    }

    public function testValidateSessionWithWrongUAThrows401(): void
    {
        $this->sessionRepo->method('findByToken')->willReturn($this->activeSession);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(401);

        $this->authService->validateSession('abc123', '127.0.0.1', 'OtherAgent/2.0');
    }

    // -------------------------------------------------------------------------
    // refresh()
    // -------------------------------------------------------------------------

    public function testRefreshExtendsExpiry(): void
    {
        $this->sessionRepo->method('findByToken')->willReturn($this->activeSession);
        $this->sessionRepo->method('extendExpiry')->willReturn(true);

        $session = $this->authService->refresh('abc123', '127.0.0.1', 'TestAgent/1.0');

        $this->assertInstanceOf(Session::class, $session);
        $this->assertNotEmpty($session->expiresOnDate);
    }
}
