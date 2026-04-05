<?php
declare(strict_types=1);

namespace PiClinic\Models;

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
