<?php

namespace App\Exports;

use App\Models\TestMessage;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * تصدير سجل رسائل الاختبار إلى ملف .xlsx مُنسّق (يحترم الفلاتر).
 */
class TestMessagesExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function __construct(protected array $filters = []) {}

    public function query()
    {
        return TestMessage::query()
            ->with(['user:id,name', 'template:id,name'])
            ->when($this->filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($this->filters['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
            ->when($this->filters['template_id'] ?? null, fn ($q, $id) => $q->where('message_template_id', $id))
            ->latest();
    }

    public function headings(): array
    {
        return ['الحالة', 'الرقم', 'القالب', 'المُرسِل', 'معرّف واتساب', 'الخطأ', 'التاريخ'];
    }

    public function map($t): array
    {
        return [
            $t->status === 'sent' ? 'ناجحة' : 'فاشلة',
            $t->to_phone,
            $t->template?->name ?? '—',
            $t->user?->name ?? '—',
            $t->wa_message_id ?? '',
            $t->error_message ?? '',
            $t->created_at->format('Y-m-d H:i'),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->setRightToLeft(true); // ورقة عربية RTL

        // تنسيق صف العناوين: عريض بخلفية خضراء فاتحة
        $sheet->getStyle('A1:G1')->getFont()->setBold(true);
        $sheet->getStyle('A1:G1')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('DCFCE7');

        return [];
    }
}
