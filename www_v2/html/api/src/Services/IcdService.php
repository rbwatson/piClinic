<?php
declare(strict_types=1);

namespace PiClinic\Services;

use PiClinic\Exceptions\HttpException;
use PiClinic\Models\IcdCode;
use PiClinic\Repositories\IcdRepository;

class IcdService
{
    private const VALID_LANGUAGES = ['en', 'es'];
    private const ORDER_COLS = [
        'c' => 'icd10index',
        't' => 'shortDescription',
        'd' => 'lastUsedDate',
    ];
    private const DEFAULT_ORDER = 'icd10index';

    public function __construct(private IcdRepository $repo) {}

    /**
     * @param array<string,string> $params  Query-string params.
     * @return IcdCode[]
     */
    public function search(array $params): array
    {
        $q        = $params['q']        ?? '';
        $t        = $params['t']        ?? '';
        $c        = $params['c']        ?? '';
        $language = $params['language'] ?? 'en';
        $sort     = $params['sort']     ?? 'c';

        if ($q === '' && $t === '' && $c === '') {
            throw new HttpException(400, 'At least one search parameter is required: q, t, or c.');
        }

        if (!in_array($language, self::VALID_LANGUAGES, true)) {
            throw new HttpException(400, 'Invalid language. Allowed: en, es.');
        }

        $orderCol = self::ORDER_COLS[$sort[0] ?? 'c'] ?? self::DEFAULT_ORDER;

        if ($q !== '') {
            $rows = $this->repo->searchByCodeOrText($q, $language, $orderCol);
        } elseif ($t !== '') {
            $rows = $this->repo->searchByText($t, $language, $orderCol);
        } else {
            $rows = $this->repo->searchByCode($c, $language, $orderCol);
        }

        return array_map(fn(array $r) => IcdCode::fromRow($r), $rows);
    }

    public function getByCode(string $icd10code, string $language = 'en'): IcdCode
    {
        if (!in_array($language, self::VALID_LANGUAGES, true)) {
            throw new HttpException(400, 'Invalid language. Allowed: en, es.');
        }

        $row = $this->repo->findExactByCode($icd10code, $language);
        if ($row === null) {
            throw new HttpException(404, 'ICD-10 code not found.');
        }
        return IcdCode::fromRow($row);
    }
}
