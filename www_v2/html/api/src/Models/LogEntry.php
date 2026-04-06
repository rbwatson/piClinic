<?php
declare(strict_types=1);

namespace PiClinic\Models;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'LogEntry',
    required: ['userToken', 'logClass', 'logStatusMessage'],
    properties: [
        new OA\Property(property: 'logId',            type: 'integer', readOnly: true, nullable: true, example: 1),
        new OA\Property(property: 'sourceModule',     type: 'string',  nullable: true, example: 'patient'),
        new OA\Property(property: 'userToken',        type: 'string',  example: 'abc123'),
        new OA\Property(property: 'logClass',         type: 'string',  example: 'API'),
        new OA\Property(property: 'logTable',         type: 'string',  nullable: true, example: 'patient'),
        new OA\Property(property: 'logAction',        type: 'string',  nullable: true, example: 'GET'),
        new OA\Property(property: 'logQueryString',   type: 'string',  nullable: true),
        new OA\Property(property: 'logBeforeData',    type: 'string',  nullable: true),
        new OA\Property(property: 'logAfterData',     type: 'string',  nullable: true),
        new OA\Property(property: 'logStatusCode',    type: 'string',  nullable: true, example: '200'),
        new OA\Property(property: 'logStatusMessage', type: 'string',  example: 'Success'),
        new OA\Property(property: 'logDate',          type: 'string',  format: 'date-time', readOnly: true, nullable: true),
    ]
)]
readonly class LogEntry
{
    public function __construct(
        public ?int    $logId,
        public ?string $sourceModule,
        public string  $userToken,
        public string  $logClass,
        public ?string $logTable,
        public ?string $logAction,
        public ?string $logQueryString,
        public ?string $logBeforeData,
        public ?string $logAfterData,
        public ?string $logStatusCode,
        public string  $logStatusMessage,
        public ?string $logDate,
    ) {}

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            logId:            isset($row['logId'])            ? (int)    $row['logId']            : null,
            sourceModule:     isset($row['sourceModule'])     ? (string) $row['sourceModule']     : null,
            userToken:        (string) ($row['userToken']     ?? ''),
            logClass:         (string) ($row['logClass']      ?? ''),
            logTable:         isset($row['logTable'])         ? (string) $row['logTable']         : null,
            logAction:        isset($row['logAction'])        ? (string) $row['logAction']        : null,
            logQueryString:   isset($row['logQueryString'])   ? (string) $row['logQueryString']   : null,
            logBeforeData:    isset($row['logBeforeData'])    ? (string) $row['logBeforeData']    : null,
            logAfterData:     isset($row['logAfterData'])     ? (string) $row['logAfterData']     : null,
            logStatusCode:    isset($row['logStatusCode'])    ? (string) $row['logStatusCode']    : null,
            logStatusMessage: (string) ($row['logStatusMessage'] ?? ''),
            logDate:          isset($row['createdDate'])      ? (string) $row['createdDate']      : null,
        );
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'logId'            => $this->logId,
            'sourceModule'     => $this->sourceModule,
            'userToken'        => $this->userToken,
            'logClass'         => $this->logClass,
            'logTable'         => $this->logTable,
            'logAction'        => $this->logAction,
            'logQueryString'   => $this->logQueryString,
            'logBeforeData'    => $this->logBeforeData,
            'logAfterData'     => $this->logAfterData,
            'logStatusCode'    => $this->logStatusCode,
            'logStatusMessage' => $this->logStatusMessage,
            'logDate'          => $this->logDate,
        ];
    }
}
