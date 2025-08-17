import { ethers } from "ethers";
import axios from "axios";
import { cfg } from "../config";

const provider = new ethers.JsonRpcProvider(cfg.rpcHttpUrl);

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export type OnchainStats = {
  address: string;
  chainId: number;
  name?: string | null;
  ethBalance: string;
  txCount: number;
  isContractDeployer: boolean;
  contractDeployments: number;
  erc20: Array<{ address: string; symbol: string; decimals: number; balance: string }>;
  nftCount: number;
  hasNFTs: boolean;
  daoVotes: number;
};
function sanitizeBigInts(obj: any): any {
    if (typeof obj === "bigint") {
      return obj.toString();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeBigInts);
    } else if (obj && typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, sanitizeBigInts(v)])
      );
    }
    return obj;
  }
  
export async function fetchOnchainStats(address: string): Promise<OnchainStats> {
  try {
    // Normalize checksum
    address = ethers.getAddress(address);

    // Core ETH stats
    const [net, balance, txCount, code, name] = await Promise.all([
      provider.getNetwork(),
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getCode(address),
      provider.lookupAddress(address)
    ]);

    const isContractDeployer = code !== "0x";

    // ERC20 tokens (you can add more to cfg.erc20List)
    const erc20: OnchainStats["erc20"] = [];
    for (const tokenAddr of cfg.erc20List) {
      try {
        const c = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
        const [rawBal, decimals, symbol] = await Promise.all([
          c.balanceOf(address),
          c.decimals(),
          c.symbol()
        ]);
        erc20.push({
          address: tokenAddr,
          symbol,
          decimals,
          balance: ethers.formatUnits(rawBal, decimals)
        });
      } catch (err) {
        console.error(`Error fetching token ${tokenAddr}:`, (err as Error).message);
      }
    }

    // NFTs via Alchemy
    let nftCount = 0;
    let hasNFTs = false;
    try {
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${address}`;
      const nftRes = await axios.get(alchemyUrl);
      nftCount = nftRes.data?.ownedNfts?.length || 0;
      hasNFTs = nftCount > 0;
    } catch (err) {
      console.error("NFT fetch error:", (err as Error).message);
    }

    // DAO Votes via Snapshot
    let daoVotes = 0;
    try {
      const snapshotUrl = `https://hub.snapshot.org/graphql`;
      const daoQuery = {
        query: `
          query {
            votes(where: { voter: "${address.toLowerCase()}" }) {
              id
            }
          }
        `,
      };
      const snapshotRes = await axios.post(snapshotUrl, daoQuery, {
        headers: { "Content-Type": "application/json" },
      });
      daoVotes = snapshotRes.data?.data?.votes?.length || 0;
    } catch (err) {
      console.error("Snapshot fetch error:", (err as Error).message);
    }

    return sanitizeBigInts({
        address,
        chainId: Number(net.chainId),
        name,
        ethBalance: ethers.formatEther(balance),
        txCount: Number(txCount),
        isContractDeployer,
        contractDeployments: isContractDeployer ? 1 : 0,
        erc20,
        nftCount,
        hasNFTs,
        daoVotes
      });
      
      
  } catch (err) {
    console.error("fetchOnchainStats error:", (err as Error).message);
    throw new Error("Failed to fetch onchain data");
  }
}
