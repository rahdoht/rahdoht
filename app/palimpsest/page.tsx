import { notFound } from "next/navigation";
import { Palimpsest } from "@/components/Palimpsest";

export default function PalimpsestPage() {
  if (process.env.NEXT_PUBLIC_PALIMPSEST_ENABLED !== "true") notFound();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Palimpsest</h1>
        <p className="text-neutral-500 text-sm">
          write your literature onto a cigarette pack. mint it on Base.
        </p>
      </div>
      <Palimpsest />
    </div>
  );
}
