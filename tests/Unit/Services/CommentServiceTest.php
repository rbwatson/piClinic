<?php
declare(strict_types=1);

namespace PiClinic\Tests\Unit\Services;

use PHPUnit\Framework\TestCase;
use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Comment;
use PiClinic\Repositories\CommentRepository;
use PiClinic\Services\CommentService;

class CommentServiceTest extends TestCase
{
    private CommentRepository $repo;
    private CommentService    $service;

    /** @var array<string,mixed> */
    private array $commentRow = [
        'commentID'    => 1,
        'commentDate'  => '2026-04-06 10:30:00',
        'username'     => 'jsmith',
        'referringUrl' => 'http://localhost/patients',
        'referringPage' => 'patients',
        'returnUrl'    => null,
        'commentText'  => 'Test comment',
        'createdDate'  => '2026-04-06 10:30:01',
    ];

    protected function setUp(): void
    {
        $this->repo    = $this->createStub(CommentRepository::class);
        $this->service = new CommentService($this->repo);
    }

    // -------------------------------------------------------------------------
    // search()
    // -------------------------------------------------------------------------

    public function testSearchReturnsComments(): void
    {
        $this->repo->method('search')->willReturn([$this->commentRow]);

        $result = $this->service->search(['username' => 'jsmith']);

        $this->assertCount(1, $result);
        $this->assertInstanceOf(Comment::class, $result[0]);
        $this->assertSame('jsmith', $result[0]->username);
        $this->assertSame('Test comment', $result[0]->commentText);
    }

    public function testSearchReturnsEmptyArrayWhenNoneFound(): void
    {
        $this->repo->method('search')->willReturn([]);

        $result = $this->service->search(['username' => 'nobody']);

        $this->assertSame([], $result);
    }

    public function testSearchWithNoParamsReturnsRecentComments(): void
    {
        $this->repo->method('search')->willReturn([$this->commentRow]);

        $result = $this->service->search([]);

        $this->assertCount(1, $result);
    }

    // -------------------------------------------------------------------------
    // create()
    // -------------------------------------------------------------------------

    public function testCreateRequiresUsername(): void
    {
        $this->expectException(HttpException::class);
        $this->expectExceptionCode(400);

        $this->service->create(['commentText' => 'Missing username']);
    }

    public function testCreateReturnsComment(): void
    {
        $this->repo->method('create')->willReturn(1);
        $this->repo->method('findById')->willReturn($this->commentRow);

        $comment = $this->service->create([
            'username'    => 'jsmith',
            'commentText' => 'Test comment',
        ]);

        $this->assertInstanceOf(Comment::class, $comment);
        $this->assertSame('jsmith', $comment->username);
        $this->assertSame(1, $comment->commentID);
    }

    public function testCreateThrows500WhenRetrievalFails(): void
    {
        $this->repo->method('create')->willReturn(99);
        $this->repo->method('findById')->willReturn(null);

        $this->expectException(HttpException::class);
        $this->expectExceptionCode(500);

        $this->service->create(['username' => 'jsmith']);
    }

    public function testCreateTrimsWhitespaceFromUsername(): void
    {
        $trimmedRow = array_merge($this->commentRow, ['username' => 'jsmith']);
        $this->repo->method('create')->willReturn(1);
        $this->repo->method('findById')->willReturn($trimmedRow);

        $comment = $this->service->create(['username' => '  jsmith  ']);

        $this->assertSame('jsmith', $comment->username);
    }
}
