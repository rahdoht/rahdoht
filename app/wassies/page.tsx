import { WassieSearch } from "@/components/WassieSearch";

export default function Wassies() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h1 className="text-xl font-bold mb-1">All Wassies Are Rare Calculator</h1>
          <p className="text-neutral-500 text-sm mb-4">disclaimer: issa joke</p>
          <WassieSearch />
        </div>
      </div>
    </div>
  );
}
