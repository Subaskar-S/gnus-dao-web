import { ethers } from "ethers";
import { GNUS_DAO_DIAMOND_ABI, GNUSDAODiamondInterface } from "./abi";
import { getGNUSDAOContract, ProposalState, VoteSupport } from "./gnusDao";
import { logger } from "@/lib/utils/logger";
import type {
  Proposal,
  VoteReceipt,
  QuadraticVoteReceipt,
  Facet,
} from "./gnusDao";

export class GNUSDAOService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private chainId: number | null = null;

  constructor() {}

  /**
   * Initialize the service with a provider and optional signer
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer,
    chainId?: number,
  ): Promise<boolean> {
    try {
      this.provider = provider;
      this.signer = signer || null;

      // Get chain ID if not provided
      if (!chainId) {
        const network = await provider.getNetwork();
        this.chainId = Number(network.chainId);
      } else {
        this.chainId = chainId;
      }

      // Get contract configuration
      const contractConfig = getGNUSDAOContract(this.chainId);
      if (!contractConfig) {
        logger.warn(`GNUS DAO contract not deployed on chain ${this.chainId}`);
        return false;
      }

      // Create contract instance
      this.contract = new ethers.Contract(
        contractConfig.address,
        GNUS_DAO_DIAMOND_ABI,
        signer || provider,
      );

      return true;
    } catch (error) {
      logger.error("Failed to initialize GNUS DAO service:", error as any);
      return false;
    }
  }

  /**
   * Check if the service is properly initialized
   */
  isInitialized(): boolean {
    return this.contract !== null && this.chainId !== null;
  }

  /**
   * Get the contract address
   */
  getContractAddress(): string | null {
    return (this.contract?.target as string) || null;
  }

  /**
   * Get the current chain ID
   */
  getChainId(): number | null {
    return this.chainId;
  }

  // Diamond Loupe Functions
  /**
   * Get all facets and their function selectors
   */
  async getFacets(): Promise<Facet[]> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      const facets = await this.contract.facets?.();
      if (!facets) return [];
      return facets.map((facet: any) => ({
        facetAddress: facet.facetAddress,
        functionSelectors: facet.functionSelectors,
      }));
    } catch (error) {
      logger.error("Error getting facets:", error as any);
      throw error;
    }
  }

  /**
   * Check if the contract supports a specific interface
   */
  async supportsInterface(interfaceId: string): Promise<boolean> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.supportsInterface?.(interfaceId)) || false;
    } catch (error) {
      console.error("Error checking interface support:", error);
      return false;
    }
  }

  // Governance Token Functions
  /**
   * Get token information
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  } | null> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contract.name?.() || "GNUS Token",
        this.contract.symbol?.() || "GNUS",
        this.contract.decimals?.() || 18,
        this.contract.totalSupply?.() || 0n,
      ]);

      return { name, symbol, decimals, totalSupply };
    } catch (error) {
      console.error("Error getting token info:", error);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.balanceOf?.(address)) || 0n;
    } catch (error) {
      console.error("Error getting token balance:", error);
      return 0n;
    }
  }

  /**
   * Get voting power for an address
   */
  async getVotingPower(address: string): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.getCurrentVotes?.(address)) || 0n;
    } catch (error) {
      console.error("Error getting voting power:", error);
      return 0n;
    }
  }

  /**
   * Delegate voting power to another address
   */
  async delegate(
    delegatee: string,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error("Service not initialized or no signer available");
    }

    try {
      return await this.contract.delegate?.(delegatee);
    } catch (error) {
      console.error("Error delegating votes:", error);
      throw error;
    }
  }

  // Governance Functions
  /**
   * Get the total number of proposals
   */
  async getProposalCount(): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.getProposalCount?.()) || 0n;
    } catch (error) {
      console.error("Error getting proposal count:", error);
      return 0n;
    }
  }

  /**
   * Get proposal details by ID
   */
  async getProposal(proposalId: bigint): Promise<Proposal | null> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      const basicData = await this.contract.getProposalBasic?.(proposalId);

      if (!basicData) return null;

      // Handle tuple response correctly
      const [id, proposer, title, ipfsHash] = basicData;

      // Try to get status data, but don't fail if it's not available
      let statusData = null;
      try {
        statusData = await this.contract.getProposalStatus?.(proposalId);
      } catch (statusError) {
        console.warn("Could not fetch proposal status:", statusError);
      }

      return {
        id: proposalId, // Use the input ID instead of the returned one
        proposer,
        title,
        ipfsHash,
        startTime: statusData?.[0] || 0n,
        endTime: statusData?.[1] || 0n,
        totalVotes: statusData?.[2] || 0n,
        totalVoters: statusData?.[3] || 0n,
        executed: statusData?.[4] || false,
        cancelled: statusData?.[5] || false,
        // Legacy fields for compatibility
        eta: 0n,
        startBlock: 0n,
        endBlock: 0n,
        forVotes: 0n,
        againstVotes: 0n,
        abstainVotes: 0n,
        canceled: statusData?.[5] || false,
      };
    } catch (error) {
      console.error("Error getting proposal:", error);
      return null;
    }
  }

  /**
   * Get proposal state (calculated from status data)
   */
  async getProposalState(proposalId: bigint): Promise<ProposalState> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      // Get proposal status data
      const status = await this.contract.getProposalStatus?.(proposalId);
      if (!status) return ProposalState.Pending;

      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = Number(status.startTime);
      const endTime = Number(status.endTime);
      const executed = status.executed;
      const cancelled = status.cancelled;

      // Calculate state based on status
      if (cancelled) return ProposalState.Canceled;
      if (executed) return ProposalState.Executed;
      if (currentTime < startTime) return ProposalState.Pending;
      if (currentTime >= startTime && currentTime < endTime)
        return ProposalState.Active;
      if (currentTime >= endTime) {
        // Check if proposal succeeded (has enough votes)
        const totalVotes = Number(status.totalVotes);
        const quorum = 1000000; // Example quorum threshold
        return totalVotes >= quorum
          ? ProposalState.Succeeded
          : ProposalState.Defeated;
      }

      return ProposalState.Pending;
    } catch (error) {
      console.error("Error getting proposal state:", error);
      return ProposalState.Pending;
    }
  }

  /**
   * Create a new proposal using the correct deployed contract signature
   */
  async createProposal(
    title: string,
    ipfsHash: string,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error("Service not initialized or no signer available");
    }

    try {
      return await this.contract.propose?.(title, ipfsHash);
    } catch (error) {
      logger.error("Error creating proposal:", error as any);
      throw error;
    }
  }

  /**
   * Legacy createProposal function for backward compatibility
   * Converts old format to new format
   */
  async createProposalLegacy(
    targets: string[],
    values: bigint[],
    calldatas: string[],
    description: string,
  ): Promise<ethers.ContractTransactionResponse> {
    // Extract title from description (first line)
    const lines = description.split("\n");
    const title = lines[0] || "Untitled Proposal";

    // Create IPFS metadata with the full proposal data
    const metadata = {
      title,
      description,
      targets,
      values: values.map((v) => v.toString()),
      calldatas,
      created: Date.now(),
    };

    // For now, use a placeholder IPFS hash
    // In production, this should upload to IPFS first
    const ipfsHash = `QmPlaceholder${Date.now()}`;

    return this.createProposal(title, ipfsHash);
  }

  /**
   * Get voting configuration from the contract
   */
  async getVotingConfig(): Promise<{
    proposalThreshold: bigint;
    votingDelay: bigint;
    votingPeriod: bigint;
    quorumThreshold: bigint;
    maxVotesPerWallet: bigint;
    proposalCooldown: bigint;
  } | null> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      const config = await this.contract.getVotingConfig?.();
      if (!config) return null;

      return {
        proposalThreshold: config[0] || 0n,
        votingDelay: config[1] || 0n,
        votingPeriod: config[2] || 0n,
        quorumThreshold: config[3] || 0n,
        maxVotesPerWallet: config[4] || 0n,
        proposalCooldown: config[5] || 0n,
      };
    } catch (error) {
      console.error("Error getting voting config:", error);
      return null;
    }
  }

  /**
   * Cast a vote on a proposal (using the deployed contract's simple vote function)
   */
  async castVote(
    proposalId: bigint,
    support: VoteSupport,
    reason?: string,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error("Service not initialized or no signer available");
    }

    try {
      // The deployed contract has: vote(uint256 proposalId, uint256 votes)
      // We'll use 1 vote for "For" and 0 votes for "Against"
      const votesToCast = support === VoteSupport.For ? 1n : 0n;
      return await this.contract.vote?.(proposalId, votesToCast);
    } catch (error) {
      logger.error("Error casting vote:", error as any);
      throw error;
    }
  }

  /**
   * Get vote receipt for a voter on a proposal
   */
  async getVoteReceipt(
    proposalId: bigint,
    voter: string,
  ): Promise<VoteReceipt | null> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      // Use hasVoted function and getVote function from the deployed contract
      const hasVoted =
        (await this.contract.hasVoted?.(proposalId, voter)) || false;

      if (!hasVoted) {
        return {
          hasVoted: false,
          support: VoteSupport.Against,
          votes: 0n,
        };
      }

      // Try to get vote details
      const voteData = await this.contract.getVote?.(proposalId, voter);
      const votes = voteData || 0n;

      return {
        hasVoted: true,
        support: Number(votes) > 0 ? VoteSupport.For : VoteSupport.Against,
        votes: BigInt(votes),
      };
    } catch (error) {
      console.error("Error getting vote receipt:", error);
      return null;
    }
  }

  // Quadratic Voting Functions
  /**
   * Get vote credits for an address
   */
  async getVoteCredits(address: string): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.getVoteCredits?.(address)) || 0n;
    } catch (error) {
      console.error("Error getting vote credits:", error);
      return 0n;
    }
  }

  /**
   * Calculate quadratic vote weight from credits
   */
  async getQuadraticVoteWeight(voteCredits: bigint): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.getQuadraticVoteWeight?.(voteCredits)) || 0n;
    } catch (error) {
      console.error("Error calculating quadratic vote weight:", error);
      // Fallback calculation: sqrt(credits)
      return BigInt(Math.floor(Math.sqrt(Number(voteCredits))));
    }
  }

  /**
   * Cast a quadratic vote
   */
  async castQuadraticVote(
    proposalId: bigint,
    support: VoteSupport,
    voteCredits: bigint,
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error("Service not initialized or no signer available");
    }

    try {
      return await this.contract.castQuadraticVote?.(
        proposalId,
        support,
        voteCredits,
      );
    } catch (error) {
      console.error("Error casting quadratic vote:", error);
      throw error;
    }
  }

  // Treasury Functions
  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.treasuryBalance?.()) || 0n;
    } catch (error) {
      console.error("Error getting treasury balance:", error);
      return 0n;
    }
  }

  /**
   * Get treasury token balance
   */
  async getTreasuryTokenBalance(tokenAddress: string): Promise<bigint> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      return (await this.contract.treasuryTokenBalance?.(tokenAddress)) || 0n;
    } catch (error) {
      console.error("Error getting treasury token balance:", error);
      return 0n;
    }
  }

  // Governance Configuration
  /**
   * Get governance parameters
   */
  async getGovernanceConfig(): Promise<{
    votingDelay: bigint;
    votingPeriod: bigint;
    proposalThreshold: bigint;
    quorumVotes: bigint;
  } | null> {
    if (!this.contract) throw new Error("Service not initialized");

    try {
      const [votingDelay, votingPeriod, proposalThreshold, quorumVotes] =
        await Promise.all([
          this.contract.votingDelay?.() || 0n,
          this.contract.votingPeriod?.() || 0n,
          this.contract.proposalThreshold?.() || 0n,
          this.contract.quorumVotes?.() || 0n,
        ]);

      return { votingDelay, votingPeriod, proposalThreshold, quorumVotes };
    } catch (error) {
      console.error("Error getting governance config:", error);
      return null;
    }
  }

  // Event Listeners
  /**
   * Listen for proposal created events
   */
  onProposalCreated(callback: (event: any) => void): void {
    if (!this.contract) throw new Error("Service not initialized");

    this.contract.on?.("ProposalCreated", callback);
  }

  /**
   * Listen for vote cast events
   */
  onVoteCast(callback: (event: any) => void): void {
    if (!this.contract) throw new Error("Service not initialized");

    this.contract.on?.("VoteCast", callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (this.contract) {
      this.contract.removeAllListeners?.();
    }
  }
}

// Singleton instance
export const gnusDaoService = new GNUSDAOService();
