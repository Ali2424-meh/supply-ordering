import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-48" />
      ))}
    </div>
  );
}
