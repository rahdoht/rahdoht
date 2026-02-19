import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import ABI from "./PalimpsestABI.json";

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export function useMintPrice() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "packPriceInEth",
  });
}

export function useMintPaused() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "mintPaused",
  });
}

export function useMint() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const mint = (parent: string, tokenURI: string, value: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: "mint",
      args: [parent, tokenURI],
      value,
    });
  };

  return { mint, txHash, isPending, isConfirming, isSuccess, error };
}
