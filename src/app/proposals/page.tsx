'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, Users, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AuthGuard } from '@/components/auth/AuthButton'
import { useWeb3Store } from '@/lib/web3/reduxProvider'
import { gnusDaoService } from '@/lib/contracts/gnusDaoService'
import { ProposalState, VoteSupport } from '@/lib/contracts/gnusDao'
import type { Proposal } from '@/lib/contracts/gnusDao'
import { CreateProposalModal } from '@/components/proposals/CreateProposalModal'

interface ProposalWithMetadata extends Proposal {
  title: string
  description: string
  totalVotes: bigint
  quorumReached: boolean
  timeRemaining: string
  state: ProposalState
}

export default function ProposalsPage() {
  const { wallet, gnusDaoInitialized } = useWeb3Store()
  const [proposals, setProposals] = useState<ProposalWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState<ProposalState | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load proposals
  useEffect(() => {
    const loadProposals = async () => {
      // Use real contract data if available, otherwise show empty state
      if (!gnusDaoInitialized) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const proposalCount = await gnusDaoService.getProposalCount()
        const proposalPromises: Promise<ProposalWithMetadata | null>[] = []

        // Load last 20 proposals or all if less than 20
        const startId = proposalCount > 20n ? proposalCount - 20n : 1n
        for (let i = startId; i <= proposalCount; i++) {
          proposalPromises.push(loadProposalWithMetadata(i))
        }

        const loadedProposals = await Promise.all(proposalPromises)
        const validProposals = loadedProposals.filter((p): p is ProposalWithMetadata => p !== null)
        
        // Sort by ID descending (newest first)
        validProposals.sort((a, b) => Number(b.id - a.id))
        setProposals(validProposals)
      } catch (error) {
        console.error('Failed to load proposals:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProposals()
  }, [gnusDaoInitialized])

  const loadProposalWithMetadata = async (proposalId: bigint): Promise<ProposalWithMetadata | null> => {
    try {
      const [proposal, state] = await Promise.all([
        gnusDaoService.getProposal(proposalId),
        gnusDaoService.getProposalState(proposalId)
      ])

      if (!proposal) return null

      // Calculate metadata
      const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
      const quorumReached = totalVotes >= 1000000n // Example quorum of 1M tokens
      const timeRemaining = calculateTimeRemaining(proposal.endBlock)

      // For now, create meaningful titles and descriptions based on proposal data
      // In a real implementation, you'd fetch this from proposal events or IPFS
      const title = `Proposal #${proposalId}`
      const description = `Governance proposal submitted by ${proposal.proposer.slice(0, 6)}...${proposal.proposer.slice(-4)}`

      return {
        ...proposal,
        title,
        description,
        totalVotes,
        quorumReached,
        timeRemaining,
        state,
      }
    } catch (error) {
      console.error(`Failed to load proposal ${proposalId}:`, error)
      return null
    }
  }

  const calculateTimeRemaining = (endBlock: bigint): string => {
    // Simplified calculation using estimated current Sepolia block
    // Sepolia has ~12 second block times
    const currentBlock = 9241000 // Approximate current Sepolia block
    const blocksRemaining = Number(endBlock) - currentBlock
    if (blocksRemaining <= 0) return 'Ended'

    const secondsRemaining = blocksRemaining * 12 // 12 second blocks on Sepolia
    const hoursRemaining = Math.floor(secondsRemaining / 3600)
    if (hoursRemaining < 24) return `${hoursRemaining}h remaining`

    const daysRemaining = Math.floor(hoursRemaining / 24)
    return `${daysRemaining}d remaining`
  }

  const getStateColor = (state: ProposalState): string => {
    switch (state) {
      case ProposalState.Active:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case ProposalState.Succeeded:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case ProposalState.Executed:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case ProposalState.Defeated:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case ProposalState.Canceled:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case ProposalState.Queued:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStateName = (state: ProposalState): string => {
    return ProposalState[state] || 'Unknown'
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterState === 'all' || proposal.state === filterState
    return matchesSearch && matchesFilter
  })

  // Show proposals interface even when not initialized (with mock data)

  return (
    <AuthGuard requireAuth={false}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Governance Proposals</h1>
            <p className="text-muted-foreground">
              Participate in GNUS DAO governance by voting on proposals
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 flex items-center gap-2"
            data-testid="create-proposal-button"
          >
            <Plus className="h-4 w-4" />
            Create Proposal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                <p className="text-2xl font-bold">{proposals.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {proposals.filter(p => p.state === ProposalState.Active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Executed</p>
                <p className="text-2xl font-bold">
                  {proposals.filter(p => p.state === ProposalState.Executed).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {proposals.filter(p => p.state === ProposalState.Pending).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="search-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as ProposalState | 'all')}
              className="px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All States</option>
              <option value={ProposalState.Active}>Active</option>
              <option value={ProposalState.Pending}>Pending</option>
              <option value={ProposalState.Succeeded}>Succeeded</option>
              <option value={ProposalState.Executed}>Executed</option>
              <option value={ProposalState.Defeated}>Defeated</option>
              <option value={ProposalState.Canceled}>Canceled</option>
            </select>
          </div>
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading proposals...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterState !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Be the first to create a proposal for the DAO.'}
            </p>
            {!searchTerm && filterState === 'all' && (
              <Button onClick={() => setShowCreateModal(true)}>
                Create First Proposal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id.toString()} proposal={proposal} />
            ))}
          </div>
        )}

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <CreateProposalModal
            onClose={() => setShowCreateModal(false)}
            onProposalCreated={() => {
              setShowCreateModal(false)
              // Reload proposals
              window.location.reload()
            }}
          />
        )}
      </div>
    </AuthGuard>
  )
}

interface ProposalCardProps {
  proposal: ProposalWithMetadata
}

function ProposalCard({ proposal }: ProposalCardProps) {
  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow" data-testid="proposal-card">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{proposal.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(proposal.state)}`}>
              {getStateName(proposal.state)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mb-2">
            Proposal #{proposal.id.toString()}
          </p>
          <p className="text-sm line-clamp-2">{proposal.description}</p>
        </div>
        <div className="text-right mt-4 sm:mt-0">
          <p className="text-sm text-muted-foreground">{proposal.timeRemaining}</p>
          {proposal.quorumReached && (
            <p className="text-xs text-green-600 dark:text-green-400">Quorum reached</p>
          )}
        </div>
      </div>

      {/* Voting Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>For: {proposal.forVotes.toString()}</span>
          <span>Against: {proposal.againstVotes.toString()}</span>
          <span>Abstain: {proposal.abstainVotes.toString()}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-l-full"
            style={{
              width: `${proposal.totalVotes > 0n 
                ? Number(proposal.forVotes * 100n / proposal.totalVotes) 
                : 0}%`
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        {proposal.state === ProposalState.Active && (
          <Button size="sm">
            Vote
          </Button>
        )}
      </div>
    </div>
  )
}

function getStateColor(state: ProposalState): string {
  switch (state) {
    case ProposalState.Active:
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case ProposalState.Succeeded:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case ProposalState.Executed:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case ProposalState.Defeated:
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case ProposalState.Canceled:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    case ProposalState.Queued:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

function getStateName(state: ProposalState): string {
  return ProposalState[state] || 'Unknown'
}
