import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat, sepolia, mainnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Neobank",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [hardhat, sepolia, mainnet],
});
