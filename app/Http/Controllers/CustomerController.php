<?php

namespace App\Http\Controllers;

use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::query()
            ->when($request->search, fn ($q, $s) =>
                $q->where('name', 'like', "%$s%")->orWhere('phone', 'like', "%$s%"))
            ->when($request->tag, fn ($q, $t) => $q->whereJsonContains('tags', $t))
            ->latest()
            ->paginate(20);

        return CustomerResource::collection($customers);
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'interactions' => fn ($q) => $q->latest()->limit(50),
            'orders'       => fn ($q) => $q->latest()->limit(20),
            'assignedTo:id,name',
        ]);

        return new CustomerResource($customer);
    }
}
