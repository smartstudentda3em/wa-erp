<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request)
    {
        $order = DB::transaction(function () use ($request) {
            $order = Order::create([
                'order_number'    => $this->generateNumber(),
                'customer_id'     => $request->validated('customer_id'),
                'conversation_id' => $request->validated('conversation_id'),
                'created_by'      => $request->user()->id,
                'status'          => 'pending',
                'currency'        => $request->validated('currency', 'SAR'),
                'notes'           => $request->validated('notes'),
            ]);

            $total = 0;
            foreach ($request->validated('items') as $item) {
                $subtotal = $item['quantity'] * $item['unit_price'];
                $order->items()->create([
                    'product_id'   => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'quantity'     => $item['quantity'],
                    'unit_price'   => $item['unit_price'],
                    'subtotal'     => $subtotal,
                ]);
                $total += $subtotal;
            }

            $order->update(['total_amount' => $total]);

            $order->customer->interactions()->create([
                'user_id'     => $request->user()->id,
                'type'        => 'order_created',
                'description' => "تم إنشاء الطلب {$order->order_number}",
            ]);

            return $order;
        });

        return new OrderResource($order->load('items'));
    }

    protected function generateNumber(): string
    {
        $seq = Order::whereYear('created_at', now()->year)->count() + 1;
        return 'ORD-' . now()->format('Y') . '-' . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
