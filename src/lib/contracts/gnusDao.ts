import { ethers } from 'ethers'
import { getContractAddress } from '@/lib/config/env'

// GNUS DAO Diamond contract addresses from environment configuration
export const GNUS_DAO_CONTRACTS = {
  // Sepolia testnet - deployed Diamond
  11155111: {
    diamond: getContractAddress('sepolia') || '0x57AE78C65F7Dd6d158DE9F4cA9CCeaA98C988199',
    deployer: '0x6Ec7f5dFb77c7CAbAB4Ed722660b1d8bA1605B43',
  },
  // Base mainnet
  8453: {
    diamond: getContractAddress('base') || '0x0000000000000000000000000000000000000000',
    deployer: '0x0000000000000000000000000000000000000000',
  },
  // SKALE Europa Hub
  2046399126: {
    diamond: getContractAddress('skale') || '0x0000000000000000000000000000000000000000',
    deployer: '0x0000000000000000000000000000000000000000',
  },
  // Polygon
  137: {
    diamond: getContractAddress('polygon') || '0x0000000000000000000000000000000000000000',
    deployer: '0x0000000000000000000000000000000000000000',
  },
  // Ethereum mainnet
  1: {
    diamond: getContractAddress('ethereum') || '0x0000000000000000000000000000000000000000',
    deployer: '0x0000000000000000000000000000000000000000',
  },
} as const

// Core Diamond functions from the deployed contract
export const GNUS_DAO_CORE_ABI = [
  // Diamond Loupe functions
  'function facets() external view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])',
  'function facetFunctionSelectors(address _facet) external view returns (bytes4[])',
  'function facetAddresses() external view returns (address[])',
  'function facetAddress(bytes4 _functionSelector) external view returns (address)',
  'function supportsInterface(bytes4 _interfaceId) external view returns (bool)',
  
  // Diamond Cut functions
  'function diamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata) external',
  
  // Ownership functions
  'function owner() external view returns (address)',
  'function transferOwnership(address _newOwner) external',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function getRoleAdmin(bytes32 role) external view returns (bytes32)',
  'function grantRole(bytes32 role, address account) external',
  'function revokeRole(bytes32 role, address account) external',
  'function renounceRole(bytes32 role, address account) external',
  
  // Events
  'event DiamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)',
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
] as const

// Governance Token functions (ERC20-like)
export const GOVERNANCE_TOKEN_ABI = [
  // ERC20 standard functions
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  
  // Governance token specific functions
  'function delegate(address delegatee) external',
  'function delegates(address account) external view returns (address)',
  'function getCurrentVotes(address account) external view returns (uint256)',
  'function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)',
  'event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)',
] as const

// Governance functions for proposals and voting (ACTUAL DEPLOYED CONTRACT)
export const GOVERNANCE_ABI = [
  // Proposal functions - CORRECTED TO MATCH DEPLOYED CONTRACT
  'function propose(string memory title, string memory ipfsHash) external returns (uint256)',
  'function getProposalCount() external view returns (uint256)',
  'function getProposalBasic(uint256 proposalId) external view returns (tuple(uint256,address,string,string))',
  'function getProposalStatus(uint256 proposalId) external view returns (tuple(uint256 startTime, uint256 endTime, uint256 totalVotes, uint256 totalVoters, bool executed, bool cancelled))',
  'function hasVoted(uint256 proposalId, address voter) external view returns (bool)',
  'function getVote(uint256 proposalId, address voter) external view returns (tuple(uint256 votes, uint256 tokensCost))',
  
  // Voting functions - CORRECTED TO MATCH DEPLOYED CONTRACT
  'function vote(uint256 proposalId, uint256 votes) external',
  'function calculateQuadraticCost(uint256 votes) external view returns (uint256)',
  'function validateVote(uint256 votes, uint256 maxVotesPerWallet, uint256 tokenBalance) external view returns (tuple(bool valid, uint256 cost))',

  // Execution functions - CORRECTED TO MATCH DEPLOYED CONTRACT
  'function executeProposal(uint256 proposalId) external',
  'function cancelProposal(uint256 proposalId) external',
  
  // Configuration functions - CORRECTED TO MATCH DEPLOYED CONTRACT
  'function getVotingConfig() external view returns (tuple(uint256 proposalThreshold, uint256 votingDelay, uint256 votingPeriod, uint256 quorumThreshold, uint256 maxVotesPerWallet, uint256 proposalCooldown))',

  // Events - CORRECTED TO MATCH DEPLOYED CONTRACT
  'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, string ipfsHash, uint256 startTime, uint256 endTime)',
  'event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 votes, uint256 tokensCost)',
  'event ProposalCancelled(uint256 indexed proposalId)',
  'event ProposalExecuted(uint256 indexed proposalId)',
] as const

// Quadratic Voting Mechanism functions
export const QUADRATIC_VOTING_ABI = [
  // Quadratic voting functions
  'function castQuadraticVote(uint256 proposalId, uint8 support, uint256 voteCredits) external returns (uint256)',
  'function getVoteCredits(address voter) external view returns (uint256)',
  'function getQuadraticVoteWeight(uint256 voteCredits) external pure returns (uint256)',
  'function quadraticVoteReceipts(uint256 proposalId, address voter) external view returns (tuple(bool hasVoted, uint8 support, uint256 credits, uint256 weight))',
  
  // Credit management
  'function allocateVoteCredits(address voter, uint256 credits) external',
  'function burnVoteCredits(address voter, uint256 credits) external',
  'function transferVoteCredits(address to, uint256 credits) external',
  
  // Events
  'event QuadraticVoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 credits, uint256 weight)',
  'event VoteCreditsAllocated(address indexed voter, uint256 credits)',
  'event VoteCreditsBurned(address indexed voter, uint256 credits)',
  'event VoteCreditsTransferred(address indexed from, address indexed to, uint256 credits)',
] as const

// Treasury management functions
export const TREASURY_ABI = [
  // Treasury functions
  'function treasuryBalance() external view returns (uint256)',
  'function treasuryTokenBalance(address token) external view returns (uint256)',
  'function proposeTreasuryAction(address target, uint256 value, bytes calldata, string description) external returns (uint256)',
  'function executeTreasuryAction(uint256 actionId) external',
  
  // Events
  'event TreasuryActionProposed(uint256 indexed actionId, address indexed proposer, address target, uint256 value, string description)',
  'event TreasuryActionExecuted(uint256 indexed actionId, address target, uint256 value)',
] as const

// Combined ABI for the complete Diamond contract
export const GNUS_DAO_DIAMOND_ABI = [
  ...GNUS_DAO_CORE_ABI,
  ...GOVERNANCE_TOKEN_ABI,
  ...GOVERNANCE_ABI,
  ...QUADRATIC_VOTING_ABI,
  ...TREASURY_ABI,
] as const

export interface GNUSDAOContract {
  address: string
  abi: typeof GNUS_DAO_DIAMOND_ABI
}

export function getGNUSDAOContract(chainId: number): GNUSDAOContract | null {
  const contracts = GNUS_DAO_CONTRACTS[chainId as keyof typeof GNUS_DAO_CONTRACTS]
  if (!contracts || contracts.diamond === '0x0000000000000000000000000000000000000000') {
    return null
  }
  
  return {
    address: contracts.diamond,
    abi: GNUS_DAO_DIAMOND_ABI,
  }
}

// Contract instance creation helper
export function createGNUSDAOContract(
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract | null {
  const contractConfig = getGNUSDAOContract(chainId)
  if (!contractConfig) return null
  
  return new ethers.Contract(
    contractConfig.address,
    contractConfig.abi,
    signerOrProvider
  )
}

// Proposal states enum
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

// Vote support enum
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

// TypeScript interfaces for contract data
export interface Proposal {
  id: bigint
  proposer: string
  title: string
  ipfsHash: string
  startTime: bigint
  endTime: bigint
  totalVotes: bigint
  totalVoters: bigint
  executed: boolean
  cancelled: boolean
  // Legacy fields for compatibility
  eta: bigint
  startBlock: bigint
  endBlock: bigint
  forVotes: bigint
  againstVotes: bigint
  abstainVotes: bigint
  canceled: boolean
}

export interface VoteReceipt {
  hasVoted: boolean
  support: VoteSupport
  votes: bigint
}

export interface QuadraticVoteReceipt {
  hasVoted: boolean
  support: VoteSupport
  credits: bigint
  weight: bigint
}

export interface Facet {
  facetAddress: string
  functionSelectors: string[]
}
