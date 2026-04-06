<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\LogEntry;
use PiClinic\Repositories\LogRepository;

class LogService
{
    public function __construct(private LogRepository $repo) {}

    /**
     * @param array<string,string> $params  Query-string params from the request.
     * @return LogEntry[]
     */
    public function search(array $params): array
    {
        $rows = $this->repo->search($params);
        return array_map(fn(array $r) => LogEntry::fromRow($r), $rows);
    }

    /**
     * @param array<string,mixed> $data
     */
    public function write(array $data): LogEntry
    {
        if (empty($data['userToken'])) {
            throw new HttpException(400, 'Required field missing: userToken.');
        }
        if (empty($data['logClass'])) {
            throw new HttpException(400, 'Required field missing: logClass.');
        }
        if (empty($data['logStatusMessage'])) {
            throw new HttpException(400, 'Required field missing: logStatusMessage.');
        }

        $newId = $this->repo->create($data);
        $row   = $this->repo->findById($newId);
        if ($row === null) {
            throw new HttpException(500, 'Log entry created but could not be retrieved.');
        }
        return LogEntry::fromRow($row);
    }
}
