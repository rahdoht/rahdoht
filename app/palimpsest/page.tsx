import { Palimpsest } from "@/components/Palimpsest";

export default function PalimpsestPage() {
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
