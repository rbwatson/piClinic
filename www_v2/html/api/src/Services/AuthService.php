<?php
declare(strict_types=1);

namespace PiClinic\Services;

use DateTime;
use PiClinic\Exceptions\HttpException;
use PiClinic\Middleware\LoggerMiddleware;
use PiClinic\Models\Session;
use PiClinic\Repositories\SessionRepository;
use PiClinic\Repositories\StaffRepository;

class AuthService
{
    public function __construct(
        private readonly SessionRepository $sessionRepo,
        private readonly StaffRepository   $staffRepo,
    ) {}

    /**
     * Validate credentials and create a new session.
     *
     * @throws HttpException 400 if username or password are empty
     * @throws HttpException 401 if credentials are invalid or account is disabled
     */
    public function login(
        string $username,
        string $password,
        string $ip,
        string $ua
    ): Session {
        if ($username === '' || $password === '') {
            throw new HttpException(400, 'username and password are required');
        }

        $staff = $this->staffRepo->findByUsername($username);

        // Return a generic 401 for both "not found" and "wrong password" to
        // avoid leaking whether a username exists.
        if ($staff === null) {
            LoggerMiddleware::getLogger()->warning('Login: unknown username', [
                'username' => $username,
                'ip'       => $ip,
            ]);
            throw new HttpException(401, 'Invalid username or password');
        }

        if (!(bool) $staff['active']) {
            LoggerMiddleware::getLogger()->warning('Login: inactive account', [
                'username' => $username,
            ]);
            throw new HttpException(401, 'Account is disabled');
        }

        if (!password_verify($password, (string) $staff['password'])) {
            LoggerMiddleware::getLogger()->warning('Login: wrong password', [
                'username' => $username,
                'ip'       => $ip,
            ]);
            throw new HttpException(401, 'Invalid username or password');
        }

        $now    = new DateTime();
        $expiry = (clone $now)->modify('+1 day');
        $token  = bin2hex(random_bytes(20)); // 40-char hex string; fits char(40)

        $this->sessionRepo->create([
            'token'                => $token,
            'username'             => (string) $staff['username'],
            'sessionIP'            => $ip,
            'sessionUA'            => $ua,
            'accessGranted'        => (string) $staff['accessGranted'],
            'sessionLanguage'      => (string) ($staff['preferredLanguage'] ?? 'en'),
            'sessionClinicPublicID' => $staff['preferredClinicPublicID'] ?? null,
            'expiresOnDate'        => $expiry->format('Y-m-d H:i:s'),
            'createdDate'          => $now->format('Y-m-d H:i:s'),
        ]);

        // Non-critical: update lastLogin on the staff record
        $this->staffRepo->updateLastLogin(
            (int) $staff['staffID'],
            $now->format('Y-m-d H:i:s')
        );

        LoggerMiddleware::getLogger()->info('Login: success', [
            'username' => $username,
            'ip'       => $ip,
        ]);

        return new Session(
            token:                 $token,
            username:              (string) $staff['username'],
            accessGranted:         (string) $staff['accessGranted'],
            sessionLanguage:       (string) ($staff['preferredLanguage'] ?? 'en'),
            sessionClinicPublicID: isset($staff['preferredClinicPublicID'])
                                       ? (string) $staff['preferredClinicPublicID']
                                       : null,
            expiresOnDate:         $expiry->format('Y-m-d H:i:s'),
        );
    }

    /**
     * Close an active session (soft delete — row is retained for audit).
     *
     * @throws HttpException 404 if the token does not match an active session
     */
    public function logout(string $token): void
    {
        $row = $this->sessionRepo->findByToken($token);

        if ($row === null || !(bool) $row['loggedIn']) {
            throw new HttpException(404, 'Session not found');
        }

        $this->sessionRepo->setLoggedOut($token);

        LoggerMiddleware::getLogger()->info('Logout', [
            'username' => $row['username'],
        ]);
    }

    /**
     * Validate a session token and return its data.
     *
     * Checks: token exists, loggedIn, not expired, same IP, same UA.
     *
     * @throws HttpException 401 if the session is not valid
     */
    public function validateSession(string $token, string $ip, string $ua): Session
    {
        $row = $this->sessionRepo->findByToken($token);

        if ($row === null) {
            throw new HttpException(401, 'Session not found');
        }

        if (!(bool) $row['loggedIn']) {
            throw new HttpException(401, 'Session has been closed');
        }

        if (time() > strtotime((string) $row['expiresOnDate'])) {
            throw new HttpException(401, 'Session has expired');
        }

        if ($ip !== (string) $row['sessionIP']) {
            LoggerMiddleware::getLogger()->warning('Session: IP mismatch', [
                'token'       => substr($token, 0, 8) . '...',
                'sessionIP'   => $row['sessionIP'],
                'requestIP'   => $ip,
            ]);
            throw new HttpException(401, 'Session is not valid from this location');
        }

        $sessionUA = (string) ($row['sessionUA'] ?? '');
        if ($ua !== $sessionUA) {
            LoggerMiddleware::getLogger()->warning('Session: UA mismatch', [
                'token' => substr($token, 0, 8) . '...',
            ]);
            throw new HttpException(401, 'Session is not valid from this client');
        }

        return Session::fromRow($row);
    }

    /**
     * Extend an active session's expiry by 24 hours.
     *
     * @throws HttpException 401 if the token does not belong to an active session
     */
    public function refresh(string $token, string $ip, string $ua): Session
    {
        // Validate first — same rules as a normal request
        $session = $this->validateSession($token, $ip, $ua);

        $newExpiry = (new DateTime())->modify('+1 day')->format('Y-m-d H:i:s');
        $this->sessionRepo->extendExpiry($token, $newExpiry);

        return new Session(
            token:                 $session->token,
            username:              $session->username,
            accessGranted:         $session->accessGranted,
            sessionLanguage:       $session->sessionLanguage,
            sessionClinicPublicID: $session->sessionClinicPublicID,
            expiresOnDate:         $newExpiry,
        );
    }
}
