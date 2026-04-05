<?php
declare(strict_types=1);

namespace PiClinic\Models;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Clinic',
    required: ['clinicID', 'thisClinic'],
    properties: [
        new OA\Property(property: 'clinicID',           type: 'integer', example: 1),
        new OA\Property(property: 'thisClinic',         type: 'integer', example: 1, description: '1 if this is the local clinic record'),
        new OA\Property(property: 'publicID',           type: 'string',  nullable: true, example: 'PUB001'),
        new OA\Property(property: 'typeCode',           type: 'string',  nullable: true),
        new OA\Property(property: 'careLevel',          type: 'string',  nullable: true),
        new OA\Property(property: 'longName',           type: 'string',  nullable: true, example: 'Community Health Clinic'),
        new OA\Property(property: 'shortName',          type: 'string',  nullable: true, example: 'CHC'),
        new OA\Property(property: 'currency',           type: 'string',  nullable: true, example: 'USD'),
        new OA\Property(property: 'address1',           type: 'string',  nullable: true),
        new OA\Property(property: 'address2',           type: 'string',  nullable: true),
        new OA\Property(property: 'clinicNeighborhood', type: 'string',  nullable: true),
        new OA\Property(property: 'clinicCity',         type: 'string',  nullable: true),
        new OA\Property(property: 'clinicState',        type: 'string',  nullable: true),
        new OA\Property(property: 'clinicRegion',       type: 'string',  nullable: true),
        new OA\Property(property: 'clinicDirector',     type: 'string',  nullable: true),
        new OA\Property(property: 'clinicService',      type: 'string',  nullable: true),
        new OA\Property(property: 'modifiedDate',       type: 'string',  format: 'date-time', nullable: true),
        new OA\Property(property: 'createdDate',        type: 'string',  format: 'date-time', nullable: true),
    ]
)]
readonly class Clinic
{
    public function __construct(
        public int     $clinicID,
        public int     $thisClinic,
        public ?string $publicID,
        public ?string $typeCode,
        public ?string $careLevel,
        public ?string $longName,
        public ?string $shortName,
        public ?string $currency,
        public ?string $address1,
        public ?string $address2,
        public ?string $clinicNeighborhood,
        public ?string $clinicCity,
        public ?string $clinicState,
        public ?string $clinicRegion,
        public ?string $clinicDirector,
        public ?string $clinicService,
        public ?string $modifiedDate,
        public ?string $createdDate,
    ) {}

    /** @param array<string,mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            clinicID:           (int)    ($row['clinicID']           ?? 0),
            thisClinic:         (int)    ($row['thisClinic']         ?? 0),
            publicID:           isset($row['publicID'])           ? (string) $row['publicID']           : null,
            typeCode:           isset($row['typeCode'])           ? (string) $row['typeCode']           : null,
            careLevel:          isset($row['careLevel'])          ? (string) $row['careLevel']          : null,
            longName:           isset($row['longName'])           ? (string) $row['longName']           : null,
            shortName:          isset($row['shortName'])          ? (string) $row['shortName']          : null,
            currency:           isset($row['currency'])           ? (string) $row['currency']           : null,
            address1:           isset($row['address1'])           ? (string) $row['address1']           : null,
            address2:           isset($row['address2'])           ? (string) $row['address2']           : null,
            clinicNeighborhood: isset($row['clinicNeighborhood']) ? (string) $row['clinicNeighborhood'] : null,
            clinicCity:         isset($row['clinicCity'])         ? (string) $row['clinicCity']         : null,
            clinicState:        isset($row['clinicState'])        ? (string) $row['clinicState']        : null,
            clinicRegion:       isset($row['clinicRegion'])       ? (string) $row['clinicRegion']       : null,
            clinicDirector:     isset($row['clinicDirector'])     ? (string) $row['clinicDirector']     : null,
            clinicService:      isset($row['clinicService'])      ? (string) $row['clinicService']      : null,
            modifiedDate:       isset($row['modifiedDate'])       ? (string) $row['modifiedDate']       : null,
            createdDate:        isset($row['createdDate'])        ? (string) $row['createdDate']        : null,
        );
    }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'clinicID'           => $this->clinicID,
            'thisClinic'         => $this->thisClinic,
            'publicID'           => $this->publicID,
            'typeCode'           => $this->typeCode,
            'careLevel'          => $this->careLevel,
            'longName'           => $this->longName,
            'shortName'          => $this->shortName,
            'currency'           => $this->currency,
            'address1'           => $this->address1,
            'address2'           => $this->address2,
            'clinicNeighborhood' => $this->clinicNeighborhood,
            'clinicCity'         => $this->clinicCity,
            'clinicState'        => $this->clinicState,
            'clinicRegion'       => $this->clinicRegion,
            'clinicDirector'     => $this->clinicDirector,
            'clinicService'      => $this->clinicService,
            'modifiedDate'       => $this->modifiedDate,
            'createdDate'        => $this->createdDate,
        ];
    }
}
