"use client";

import { motion } from "motion/react";
import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/statuses";

export type TimelineEvent = {
  id: string;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: Date | string;
};

export function StatusTimeline({
  events,
  showNotes,
}: {
  events: TimelineEvent[];
  showNotes: boolean;
}) {
  return (
    <motion.ol
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="relative ml-2 border-l-2 border-zinc-200 pl-4"
      data-testid="status-timeline"
    >
      {events.map((event) => (
        <motion.li
          key={event.id}
          variants={{
            hidden: { opacity: 0, x: -8 },
            show: { opacity: 1, x: 0 },
          }}
          className="relative mb-4"
        >
          <span
            className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${STATUS_STYLES[event.toStatus].dot}`}
          />
          <p className="text-sm font-medium">{STATUS_LABELS[event.toStatus]}</p>
          <p className="text-xs text-zinc-500">
            {new Date(event.createdAt).toLocaleString("en-AU", {
              timeZone: "Australia/Sydney",
            })}
          </p>
          {showNotes && event.note && (
            <p className="mt-1 text-xs text-zinc-600">{event.note}</p>
          )}
        </motion.li>
      ))}
    </motion.ol>
  );
}
