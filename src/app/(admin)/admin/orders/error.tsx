"use client";

export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-6 text-center">
      <p className="mb-2 font-medium text-red-700">
        Something went wrong loading orders.
      </p>
      <button
        onClick={reset}
        className="min-h-10 rounded bg-red-700 px-3 py-1.5 text-sm text-white"
      >
        Try again
      </button>
    </div>
  );
}
