import { formatAud } from "@/lib/format";
import { panel } from "@/lib/ui";

type SnapshotItem = {
  id: string;
  nameSnapshot: string;
  variantSnapshot: string | null;
  priceCentsSnapshot: number;
  quantity: number;
};

export function OrderItemsView({
  items,
  totalCents,
}: {
  items: SnapshotItem[];
  totalCents: number;
}) {
  return (
    <>
      <ul className={`${panel()} divide-y divide-zinc-100 overflow-hidden sm:hidden`}>
        {items.map((item) => (
          <li key={item.id} className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-zinc-800">{item.nameSnapshot}</p>
                {item.variantSnapshot && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {item.variantSnapshot}
                  </p>
                )}
              </div>
              <p className="shrink-0 font-semibold">
                {formatAud(item.priceCentsSnapshot * item.quantity)}
              </p>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {item.quantity} × {formatAud(item.priceCentsSnapshot)}
            </p>
          </li>
        ))}
        <li className="flex items-center justify-between bg-zinc-50/70 p-3.5 font-semibold">
          <span>Total</span>
          <span>{formatAud(totalCents)}</span>
        </li>
      </ul>

      <div className={`${panel()} hidden overflow-hidden sm:block`}>
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th scope="col" className="w-[58%] py-3 pl-4 pr-3">Item</th>
              <th scope="col" className="px-3 text-center">Qty</th>
              <th scope="col" className="py-3 pl-3 pr-4 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 pl-4 pr-3">
                  <span className="font-medium text-zinc-800">
                    {item.nameSnapshot}
                  </span>
                  {item.variantSnapshot && (
                    <span className="text-zinc-500"> — {item.variantSnapshot}</span>
                  )}
                  <span className="block text-xs text-zinc-400">
                    {formatAud(item.priceCentsSnapshot)} each
                  </span>
                </td>
                <td className="px-3 text-center text-zinc-600">{item.quantity}</td>
                <td className="py-2.5 pl-3 pr-4 text-right font-medium">
                  {formatAud(item.priceCentsSnapshot * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50/60">
            <tr>
              <td className="py-3 pl-4 font-semibold">Total</td>
              <td />
              <td className="py-3 pl-3 pr-4 text-right font-semibold">
                {formatAud(totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
