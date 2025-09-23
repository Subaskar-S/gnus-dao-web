'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  DollarSign,
  Code,
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useWeb3Store } from '@/lib/web3/reduxProvider'
import { gnusDaoService } from '@/lib/contracts/gnusDaoService'
import { toast } from 'react-hot-toast'

interface CreateProposalModalProps {
  onClose: () => void
  onProposalCreated: () => void
}

interface ProposalAction {
  target: string
  value: string
  signature: string
  calldata: string
}

export function CreateProposalModal({ onClose, onProposalCreated }: CreateProposalModalProps) {
  const { wallet, tokenBalance } = useWeb3Store()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'basic' | 'actions' | 'review'>('basic')
  
  // Basic proposal info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'treasury' | 'protocol' | 'governance' | 'community'>('treasury')
  
  // Proposal actions
  const [actions, setActions] = useState<ProposalAction[]>([
    { target: '', value: '0', signature: '', calldata: '0x' }
  ])

  const categories = [
    {
      id: 'treasury' as const,
      name: 'Treasury Management',
      description: 'Proposals for managing DAO treasury funds',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      id: 'protocol' as const,
      name: 'Protocol Upgrade',
      description: 'Technical changes to smart contracts',
      icon: <Code className="h-5 w-5" />,
    },
    {
      id: 'governance' as const,
      name: 'Governance Change',
      description: 'Changes to voting rules and parameters',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      id: 'community' as const,
      name: 'Community Initiative',
      description: 'Community programs and initiatives',
      icon: <Users className="h-5 w-5" />,
    },
  ]

  const addAction = () => {
    setActions([...actions, { target: '', value: '0', signature: '', calldata: '0x' }])
  }

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index))
    }
  }

  const updateAction = (index: number, field: keyof ProposalAction, value: string) => {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], [field]: value } as ProposalAction
    setActions(newActions)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate actions
    const validActions = actions.filter(action => 
      action.target.trim() !== '' || action.signature.trim() !== ''
    )

    if (validActions.length === 0) {
      toast.error('Please add at least one action')
      return
    }

    try {
      setLoading(true)

      // Prepare proposal data
      const targets = validActions.map(action => action.target)
      const values = validActions.map(action => action.value || '0')
      const signatures = validActions.map(action => action.signature)
      const calldatas = validActions.map(action => action.calldata || '0x')
      const proposalDescription = `${title}\n\n${description}`

      const tx = await gnusDaoService.createProposal(
        targets,
        values.map(v => BigInt(v)),
        calldatas,
        proposalDescription
      )

      toast.success('Proposal submitted! Waiting for confirmation...')
      await tx.wait()
      toast.success('Proposal created successfully!')

      onProposalCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create proposal:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create proposal')
    } finally {
      setLoading(false)
    }
  }

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Proposal Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a clear, descriptive title"
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {title.length}/100 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Category *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                category === cat.id
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {cat.icon}
                <span className="font-medium">{cat.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {cat.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide a detailed description of your proposal, including rationale and expected outcomes..."
          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={6}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {description.length}/2000 characters
        </p>
      </div>
    </div>
  )

  const renderActionsStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Proposal Actions
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Define the on-chain actions that will be executed if this proposal passes. 
              Leave fields empty for proposals that don't require on-chain execution.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {actions.map((action, index) => (
          <div key={index} className="border border-input rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Action {index + 1}</h4>
              {actions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Contract
                </label>
                <input
                  type="text"
                  value={action.target}
                  onChange={(e) => updateAction(index, 'target', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  ETH Value
                </label>
                <input
                  type="text"
                  value={action.value}
                  onChange={(e) => updateAction(index, 'value', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Function Signature
                </label>
                <input
                  type="text"
                  value={action.signature}
                  onChange={(e) => updateAction(index, 'signature', e.target.value)}
                  placeholder="transfer(address,uint256)"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Calldata
                </label>
                <input
                  type="text"
                  value={action.calldata}
                  onChange={(e) => updateAction(index, 'calldata', e.target.value)}
                  placeholder="0x"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm font-mono"
                />
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addAction}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Action
        </Button>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-4">
        <h4 className="font-medium mb-3">Proposal Summary</h4>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Title:</span>
            <p className="mt-1">{title}</p>
          </div>
          <div>
            <span className="font-medium">Category:</span>
            <p className="mt-1">{categories.find(c => c.id === category)?.name}</p>
          </div>
          <div>
            <span className="font-medium">Description:</span>
            <p className="mt-1 whitespace-pre-wrap">{description}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <h4 className="font-medium mb-3">Actions ({actions.filter(a => a.target || a.signature).length})</h4>
        {actions.filter(a => a.target || a.signature).length === 0 ? (
          <p className="text-sm text-muted-foreground">No on-chain actions</p>
        ) : (
          <div className="space-y-3">
            {actions.filter(a => a.target || a.signature).map((action, index) => (
              <div key={index} className="text-sm border border-input rounded p-3">
                <div className="font-medium mb-2">Action {index + 1}</div>
                <div className="space-y-1 text-xs font-mono">
                  <div>Target: {action.target || 'Not specified'}</div>
                  <div>Value: {action.value} ETH</div>
                  <div>Function: {action.signature || 'Not specified'}</div>
                  <div>Calldata: {action.calldata}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              Important Notice
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Once submitted, this proposal cannot be modified. Please review all details carefully.
              The proposal will be subject to community voting and may take several days to complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Create Proposal
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step === 'basic' ? '1' : step === 'actions' ? '2' : '3'} of 3
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step === 'basic' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'basic' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Basic Info</span>
          </div>
          <div className="flex-1 h-px bg-border mx-4" />
          <div className={`flex items-center ${step === 'actions' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'actions' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Actions</span>
          </div>
          <div className="flex-1 h-px bg-border mx-4" />
          <div className={`flex items-center ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Review</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 'basic' && renderBasicStep()}
        {step === 'actions' && renderActionsStep()}
        {step === 'review' && renderReviewStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'actions') setStep('basic')
              else if (step === 'review') setStep('actions')
              else onClose()
            }}
            disabled={loading}
          >
            {step === 'basic' ? 'Cancel' : 'Back'}
          </Button>
          
          <Button
            onClick={() => {
              if (step === 'basic') setStep('actions')
              else if (step === 'actions') setStep('review')
              else handleSubmit()
            }}
            disabled={loading || (step === 'basic' && (!title.trim() || !description.trim()))}
          >
            {loading ? 'Submitting...' : (step === 'review' ? 'Submit Proposal' : 'Next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
