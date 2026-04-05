<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\Clinic;
use PiClinic\Repositories\ClinicRepository;

class ClinicService
{
    public function __construct(private ClinicRepository $repo) {}

    /**
     * @param array<string,string> $params  Query-string params.
     * @return Clinic[]
     */
    public function search(array $params): array
    {
        if (isset($params['thisClinic']) && ($params['thisClinic'] === '1' || $params['thisClinic'] === 'true')) {
            $row = $this->repo->findThisClinic();
            if ($row === null) {
                throw new HttpException(404, 'No clinic is designated as "this clinic".');
            }
            return [Clinic::fromRow($row)];
        }

        if (!empty($params['publicID'])) {
            $row = $this->repo->findByPublicID($params['publicID']);
            if ($row === null) {
                throw new HttpException(404, 'Clinic not found.');
            }
            return [Clinic::fromRow($row)];
        }

        if (!empty($params['shortName'])) {
            $rows = $this->repo->findByShortName($params['shortName']);
            return array_map(fn(array $r) => Clinic::fromRow($r), $rows);
        }

        throw new HttpException(400, 'At least one query parameter is required: thisClinic, publicID, or shortName.');
    }
}
