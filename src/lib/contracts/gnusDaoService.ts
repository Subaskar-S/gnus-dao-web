import { ethers } from 'ethers'
import { GNUS_DAO_DIAMOND_ABI, GNUSDAODiamondInterface } from './abi'
import { getGNUSDAOContract, ProposalState, VoteSupport } from './gnusDao'
import { logger } from '@/lib/utils/logger'
import type {
  Proposal,
  VoteReceipt,
  QuadraticVoteReceipt,
  Facet
} from './gnusDao'

export class GNUSDAOService {
  private contract: ethers.Contract | null = null
  private provider: ethers.Provider | null = null
  private signer: ethers.Signer | null = null
  private chainId: number | null = null

  constructor() {}

  /**
   * Initialize the service with a provider and optional signer
   */
  async initialize(
    provider: ethers.Provider,
    signer?: ethers.Signer,
    chainId?: number
  ): Promise<boolean> {
    try {
      this.provider = provider
      this.signer = signer || null
      
      // Get chain ID if not provided
      if (!chainId) {
        const network = await provider.getNetwork()
        this.chainId = Number(network.chainId)
      } else {
        this.chainId = chainId
      }

      // Get contract configuration
      const contractConfig = getGNUSDAOContract(this.chainId)
      if (!contractConfig) {
        logger.warn(`GNUS DAO contract not deployed on chain ${this.chainId}`)
        return false
      }

      // Create contract instance
      this.contract = new ethers.Contract(
        contractConfig.address,
        GNUS_DAO_DIAMOND_ABI,
        signer || provider
      )

      return true
    } catch (error) {
      logger.error('Failed to initialize GNUS DAO service:', error as any)
      return false
    }
  }

  /**
   * Check if the service is properly initialized
   */
  isInitialized(): boolean {
    return this.contract !== null && this.chainId !== null
  }

  /**
   * Get the contract address
   */
  getContractAddress(): string | null {
    return this.contract?.target as string || null
  }

  /**
   * Get the current chain ID
   */
  getChainId(): number | null {
    return this.chainId
  }

  // Diamond Loupe Functions
  /**
   * Get all facets and their function selectors
   */
  async getFacets(): Promise<Facet[]> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      const facets = await this.contract.facets?.()
      if (!facets) return []
      return facets.map((facet: any) => ({
        facetAddress: facet.facetAddress,
        functionSelectors: facet.functionSelectors,
      }))
    } catch (error) {
      logger.error('Error getting facets:', error as any)
      throw error
    }
  }

  /**
   * Check if the contract supports a specific interface
   */
  async supportsInterface(interfaceId: string): Promise<boolean> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.supportsInterface?.(interfaceId) || false
    } catch (error) {
      console.error('Error checking interface support:', error)
      return false
    }
  }

  // Governance Token Functions
  /**
   * Get token information
   */
  async getTokenInfo(): Promise<{
    name: string
    symbol: string
    decimals: number
    totalSupply: bigint
  } | null> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contract.name?.() || 'GNUS Token',
        this.contract.symbol?.() || 'GNUS',
        this.contract.decimals?.() || 18,
        this.contract.totalSupply?.() || 0n,
      ])

      return { name, symbol, decimals, totalSupply }
    } catch (error) {
      console.error('Error getting token info:', error)
      return null
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.balanceOf?.(address) || 0n
    } catch (error) {
      console.error('Error getting token balance:', error)
      return 0n
    }
  }

  /**
   * Get voting power for an address
   */
  async getVotingPower(address: string): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.getCurrentVotes?.(address) || 0n
    } catch (error) {
      console.error('Error getting voting power:', error)
      return 0n
    }
  }

  /**
   * Delegate voting power to another address
   */
  async delegate(delegatee: string): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized or no signer available')
    }
    
    try {
      return await this.contract.delegate?.(delegatee)
    } catch (error) {
      console.error('Error delegating votes:', error)
      throw error
    }
  }

  // Governance Functions
  /**
   * Get the total number of proposals
   */
  async getProposalCount(): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.proposalCount?.() || 0n
    } catch (error) {
      console.error('Error getting proposal count:', error)
      return 0n
    }
  }

  /**
   * Get proposal details by ID
   */
  async getProposal(proposalId: bigint): Promise<Proposal | null> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      const proposal = await this.contract.proposals?.(proposalId)
      if (!proposal) return null

      return {
        id: proposal.id,
        proposer: proposal.proposer,
        eta: proposal.eta,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        canceled: proposal.canceled,
        executed: proposal.executed,
      }
    } catch (error) {
      console.error('Error getting proposal:', error)
      return null
    }
  }

  /**
   * Get proposal state
   */
  async getProposalState(proposalId: bigint): Promise<ProposalState> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.state?.(proposalId) || ProposalState.Pending
    } catch (error) {
      console.error('Error getting proposal state:', error)
      return ProposalState.Pending
    }
  }

  /**
   * Create a new proposal
   */
  async createProposal(
    targets: string[],
    values: bigint[],
    calldatas: string[],
    description: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized or no signer available')
    }
    
    try {
      return await this.contract.propose?.(targets, values, calldatas, description)
    } catch (error) {
      logger.error('Error creating proposal:', error as any)
      throw error
    }
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(
    proposalId: bigint,
    support: VoteSupport,
    reason?: string
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized or no signer available')
    }
    
    try {
      if (reason) {
        return await this.contract.castVoteWithReason?.(proposalId, support, reason)
      } else {
        return await this.contract.castVote?.(proposalId, support)
      }
    } catch (error) {
      logger.error('Error casting vote:', error as any)
      throw error
    }
  }

  /**
   * Get vote receipt for a voter on a proposal
   */
  async getVoteReceipt(proposalId: bigint, voter: string): Promise<VoteReceipt | null> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      const receipt = await this.contract.getReceipt?.(proposalId, voter)
      if (!receipt) return null

      return {
        hasVoted: receipt.hasVoted,
        support: receipt.support,
        votes: receipt.votes,
      }
    } catch (error) {
      console.error('Error getting vote receipt:', error)
      return null
    }
  }

  // Quadratic Voting Functions
  /**
   * Get vote credits for an address
   */
  async getVoteCredits(address: string): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.getVoteCredits?.(address) || 0n
    } catch (error) {
      console.error('Error getting vote credits:', error)
      return 0n
    }
  }

  /**
   * Calculate quadratic vote weight from credits
   */
  async getQuadraticVoteWeight(voteCredits: bigint): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.getQuadraticVoteWeight?.(voteCredits) || 0n
    } catch (error) {
      console.error('Error calculating quadratic vote weight:', error)
      // Fallback calculation: sqrt(credits)
      return BigInt(Math.floor(Math.sqrt(Number(voteCredits))))
    }
  }

  /**
   * Cast a quadratic vote
   */
  async castQuadraticVote(
    proposalId: bigint,
    support: VoteSupport,
    voteCredits: bigint
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.contract || !this.signer) {
      throw new Error('Service not initialized or no signer available')
    }
    
    try {
      return await this.contract.castQuadraticVote?.(proposalId, support, voteCredits)
    } catch (error) {
      console.error('Error casting quadratic vote:', error)
      throw error
    }
  }

  // Treasury Functions
  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.treasuryBalance?.() || 0n
    } catch (error) {
      console.error('Error getting treasury balance:', error)
      return 0n
    }
  }

  /**
   * Get treasury token balance
   */
  async getTreasuryTokenBalance(tokenAddress: string): Promise<bigint> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      return await this.contract.treasuryTokenBalance?.(tokenAddress) || 0n
    } catch (error) {
      console.error('Error getting treasury token balance:', error)
      return 0n
    }
  }

  // Governance Configuration
  /**
   * Get governance parameters
   */
  async getGovernanceConfig(): Promise<{
    votingDelay: bigint
    votingPeriod: bigint
    proposalThreshold: bigint
    quorumVotes: bigint
  } | null> {
    if (!this.contract) throw new Error('Service not initialized')
    
    try {
      const [votingDelay, votingPeriod, proposalThreshold, quorumVotes] = await Promise.all([
        this.contract.votingDelay?.() || 0n,
        this.contract.votingPeriod?.() || 0n,
        this.contract.proposalThreshold?.() || 0n,
        this.contract.quorumVotes?.() || 0n,
      ])

      return { votingDelay, votingPeriod, proposalThreshold, quorumVotes }
    } catch (error) {
      console.error('Error getting governance config:', error)
      return null
    }
  }

  // Event Listeners
  /**
   * Listen for proposal created events
   */
  onProposalCreated(callback: (event: any) => void): void {
    if (!this.contract) throw new Error('Service not initialized')
    
    this.contract.on?.('ProposalCreated', callback)
  }

  /**
   * Listen for vote cast events
   */
  onVoteCast(callback: (event: any) => void): void {
    if (!this.contract) throw new Error('Service not initialized')
    
    this.contract.on?.('VoteCast', callback)
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (this.contract) {
      this.contract.removeAllListeners?.()
    }
  }
}

// Singleton instance
export const gnusDaoService = new GNUSDAOService()
