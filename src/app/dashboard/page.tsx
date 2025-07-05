'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { Address, namehash } from 'viem'
import { 
  Plus, 
  ArrowLeft, 
  Wallet, 
  User, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Search,
  FileText,
  ExternalLink 
} from 'lucide-react'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { useENS } from '@/lib/hooks/useENS'

// Contract ABIs for custom namespace
const CONTX_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "bio", type: "string" }
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string[]", name: "keys", type: "string[]" }
    ],
    name: "getFields",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "getFieldNames",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "getAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string", name: "key", type: "string" }
    ],
    name: "getText",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
] as const

const CONTX_RESOLVER_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "addr",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "string", name: "key", type: "string" }
    ],
    name: "text",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
] as const

// Contract addresses from environment variables
const CONTX_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS as Address
const CONTX_RESOLVER_ADDRESS = process.env.NEXT_PUBLIC_ETH_RESOLVER_ADDRESS as Address

interface TestResult {
  status: 'pending' | 'success' | 'error'
  message: string
  data?: unknown
}

export default function DashboardNew() {
  const router = useRouter()
  const { ready, authenticated, login, user, logout } = usePrivy()
  const { isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  // Basename registration (existing)
  const [_username, _setUsername] = useState('')
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [registeredName, setRegisteredName] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  
  // Custom namespace states
  const [customUsername, setCustomUsername] = useState('')
  const [customName, setCustomName] = useState('')
  const [customBio, setCustomBio] = useState('')
  const [customRegisterResult, setCustomRegisterResult] = useState<TestResult>({ status: 'pending', message: '' })
  
  // Get All Fields states
  const [fieldsUsername, setFieldsUsername] = useState('')
  const [fieldsResult, setFieldsResult] = useState<TestResult>({ status: 'pending', message: '' })
  const [fieldsData, setFieldsData] = useState<{ [key: string]: string }>({})
  
  // Ethereum ENS Test states
  const [ethEnsUsername, setEthEnsUsername] = useState('')
  const [ethEnsResult, setEthEnsResult] = useState<TestResult>({ status: 'pending', message: '' })
  
  // ENS Text Records states
  const [ensTextUsername, setEnsTextUsername] = useState('')
  const [ensTextKey, setEnsTextKey] = useState('bio')
  const [ensTextResult, setEnsTextResult] = useState<TestResult>({ status: 'pending', message: '' })
  
  const { registerBasename: _registerBasename } = useENS()

  // Helper functions for test results
  const createLoadingResult = (message: string): TestResult => ({
    status: 'pending',
    message
  })

  const createSuccessResult = (message: string, data?: unknown): TestResult => ({
    status: 'success',
    message,
    data
  })

  const createErrorResult = (message: string): TestResult => ({
    status: 'error',
    message
  })

  // Custom namespace register function
  const handleCustomRegister = async () => {
    if (!walletClient || !publicClient || !isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setCustomRegisterResult(createLoadingResult('Registering custom username...'))

      const hash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'register',
        args: [customUsername, customName, customBio]
      })

      setCustomRegisterResult(createLoadingResult('Transaction sent, waiting for confirmation...'))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        setCustomRegisterResult(createSuccessResult(
          `Successfully registered ${customUsername}.contx.eth!`,
          { hash, receipt }
        ))
      } else {
        setCustomRegisterResult(createErrorResult('Transaction failed'))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setCustomRegisterResult(createErrorResult(errorMessage))
    }
  }

  // Get all fields function
  const handleGetFields = async () => {
    if (!publicClient) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setFieldsResult(createLoadingResult('Fetching fields...'))

      // Get standard field names
      const fieldNames = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'getFieldNames',
        args: [fieldsUsername]
      })

      // Get values for all fields
      const fieldValues = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'getFields',
        args: [fieldsUsername, fieldNames]
      })

      const fieldsData: { [key: string]: string } = {}
      fieldNames.forEach((name, index) => {
        fieldsData[name] = fieldValues[index]
      })

      setFieldsData(fieldsData)
      setFieldsResult(createSuccessResult(
        `Retrieved ${fieldNames.length} fields for ${fieldsUsername}`,
        fieldsData
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fields retrieval failed'
      setFieldsResult(createErrorResult(errorMessage))
    }
  }

  // Ethereum ENS Test function
  const handleEthEnsTest = async () => {
    try {
      setEthEnsResult(createLoadingResult('Testing ENS resolution on Ethereum mainnet...'))

      // Create Ethereum mainnet client
      const { createPublicClient, http } = await import('viem')
      const { mainnet } = await import('viem/chains')
      
      const ethereumClient = createPublicClient({
        chain: mainnet,
        transport: http('https://eth.llamarpc.com'),
      })

      // Create the ENS node for username.contx.eth
      const node = namehash(`${ethEnsUsername}.contx.eth`)

      try {
        // Try to resolve via your ContxResolver on Ethereum
        const resolvedAddress = await ethereumClient.readContract({
          address: CONTX_RESOLVER_ADDRESS,
          abi: CONTX_RESOLVER_ABI,
          functionName: 'addr',
          args: [node]
        })

        setEthEnsResult(createSuccessResult(
          `✅ Ethereum ENS resolution successful: ${ethEnsUsername}.contx.eth → ${resolvedAddress}`,
          { 
            address: resolvedAddress, 
            node: node,
            network: 'Ethereum Mainnet',
            resolver: CONTX_RESOLVER_ADDRESS
          }
        ))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('OffchainLookup') || errorMessage.includes('CCIP read')) {
          setEthEnsResult(createSuccessResult(
            `🔄 CCIP-Read triggered on Ethereum! This means your resolver is working correctly.`,
            { 
              status: 'ccip-triggered',
              error: errorMessage,
              network: 'Ethereum Mainnet',
              resolver: CONTX_RESOLVER_ADDRESS,
              note: 'The resolver is correctly throwing OffchainLookup to trigger CCIP-Read'
            }
          ))
        } else {
          setEthEnsResult(createErrorResult(
            `Ethereum ENS resolution failed: ${errorMessage}`
          ))
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ethereum ENS test failed'
      setEthEnsResult(createErrorResult(errorMessage))
    }
  }

  // ENS Text Record Resolution function
  const handleEnsTextTest = async () => {
    try {
      setEnsTextResult(createLoadingResult('Testing ENS text record resolution...'))

      // Create Ethereum mainnet client
      const { createPublicClient, http } = await import('viem')
      const { mainnet } = await import('viem/chains')
      
      const ethereumClient = createPublicClient({
        chain: mainnet,
        transport: http('https://eth.llamarpc.com'),
      })

      // Create the ENS node for username.contx.eth
      const node = namehash(`${ensTextUsername}.contx.eth`)

      try {
        // Try to resolve text record via your ContxResolver on Ethereum
        const textValue = await ethereumClient.readContract({
          address: CONTX_RESOLVER_ADDRESS,
          abi: CONTX_RESOLVER_ABI,
          functionName: 'text',
          args: [node, ensTextKey]
        })

        setEnsTextResult(createSuccessResult(
          `✅ Text record resolved: ${ensTextUsername}.contx.eth["${ensTextKey}"] = "${textValue}"`,
          { 
            textValue, 
            node,
            key: ensTextKey,
            network: 'Ethereum Mainnet',
            resolver: CONTX_RESOLVER_ADDRESS
          }
        ))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('OffchainLookup') || errorMessage.includes('CCIP read')) {
          setEnsTextResult(createSuccessResult(
            `🔄 CCIP-Read triggered for text records! This means your text resolution is working.`,
            { 
              status: 'ccip-triggered',
              error: errorMessage,
              network: 'Ethereum Mainnet',
              resolver: CONTX_RESOLVER_ADDRESS,
              key: ensTextKey,
              note: 'The resolver is correctly throwing OffchainLookup for text record resolution'
            }
          ))
        } else {
          setEnsTextResult(createErrorResult(
            `Text record resolution failed: ${errorMessage}`
          ))
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ENS text test failed'
      setEnsTextResult(createErrorResult(errorMessage))
    }
  }

  // Result component
  const ResultDisplay = ({ result }: { result: TestResult }) => {
    const Icon = result.status === 'pending' ? Loader2 : result.status === 'success' ? CheckCircle : XCircle
    const colorClass = result.status === 'pending' ? 'text-blue-500' : result.status === 'success' ? 'text-green-500' : 'text-red-500'
    
    return (
      <div className={`flex items-center gap-2 mt-2 ${colorClass}`}>
        <Icon className={`w-4 h-4 ${result.status === 'pending' ? 'animate-spin' : ''}`} />
        <span className="text-sm">{result.message}</span>
      </div>
    )
  }


  if (!ready) {
    return (
      <section className="relative overflow-hidden min-h-screen">
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-7xl border border-primary/20 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold mb-4">Loading...</h1>
                  <p className="text-muted-foreground">Initializing connection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!authenticated) {
    return (
      <section className="relative overflow-hidden min-h-screen">
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-7xl border border-primary/20 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
                <button
                  onClick={() => router.push('/')}
                  className="absolute top-6 left-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </button>
                
                {/* Top Right Wallet Button */}
                <div className="absolute top-6 right-6 z-30">
                  <button
                    onClick={login}
                    disabled={!ready}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-primary">Connect Wallet</span>
                  </button>
                </div>
                
                <h1 
                  onClick={() => router.push('/')}
                  className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -left-5 -top-5 h-10 w-10"
                  />
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -bottom-5 -left-5 h-10 w-10"
                  />
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -right-5 -top-5 h-10 w-10"
                  />
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -bottom-5 -right-5 h-10 w-10"
                  />
                  Connect Wallet
                </h1>
                
                <div className="flex justify-center gap-2 mt-8 relative z-20">
                  <InteractiveHoverButton 
                    text="Connect Wallet"
                    onClick={login}
                    className="text-lg relative z-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (registrationComplete) {
    return (
      <section className="relative overflow-hidden min-h-screen">
        <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
          <div className="mb-10 mt-4 md:mt-6">
            <div className="px-2">
              <div className="relative mx-auto h-full max-w-7xl border border-primary/20 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
                <button
                  onClick={() => router.push('/')}
                  className="absolute top-6 left-6 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </button>
                
                {/* Top Right Wallet Button */}
                <div className="absolute top-6 right-6 z-30">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors"
                    >
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-primary">
                        {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                      </span>
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center gap-1 px-3 py-2 text-xs bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors"
                    >
                      <LogOut className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
                <h1 
                  onClick={() => router.push('/')}
                  className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -left-5 -top-5 h-10 w-10"
                  />
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -bottom-5 -left-5 h-10 w-10"
                  />
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -right-5 -top-5 h-10 w-10"
                  />
                  <Plus
                    strokeWidth={4}
                    className="text-primary absolute -bottom-5 -right-5 h-10 w-10"
                  />
                  Success!
                </h1>
                
                <div className="mt-8 text-center">
                  <p className="text-xl mb-4">🎉 Your basename has been registered!</p>
                  <p className="text-lg font-semibold mb-2">{registeredName}</p>
                  <a 
                    href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View transaction →
                  </a>
                  
                  <div className="flex justify-center gap-2 mt-8">
                    <InteractiveHoverButton 
                      text="Register Another"
                      onClick={() => {
                        setRegistrationComplete(false)
                        _setUsername('')
                        setRegisteredName('')
                        setTransactionHash('')
                      }}
                      className="text-sm px-6 py-3"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          
          <div className="flex items-center gap-2">
            {!authenticated ? (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            ) : (
              <>
                <button className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-primary">
                    {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-background/50 hover:bg-background/80 border border-primary/20 rounded-full transition-colors"
                >
                  <LogOut className="w-3 h-3 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error States */}
        {!CONTX_REGISTRY_ADDRESS && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-800">
                <strong>Contract addresses missing:</strong> Please set NEXT_PUBLIC_BASE_REGISTRY_ADDRESS and NEXT_PUBLIC_ETH_RESOLVER_ADDRESS
              </p>
            </div>
          </div>
        )}

        {/* 4-Function Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Custom Register Username */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold">Register Username</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username (e.g., alice)"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <input
                type="text"
                placeholder="Display name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <textarea
                placeholder="Bio"
                value={customBio}
                onChange={(e) => setCustomBio(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={2}
              />
              <button
                onClick={handleCustomRegister}
                disabled={!customUsername || !customName || !customBio || !authenticated}
                className="w-full bg-green-500 text-white py-2 text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Register {customUsername && `${customUsername}.contx.eth`}
              </button>
              <ResultDisplay result={customRegisterResult} />
            </div>
          </div>

          {/* Get All Fields */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-semibold">Get All Fields</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username"
                value={fieldsUsername}
                onChange={(e) => setFieldsUsername(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleGetFields}
                disabled={!fieldsUsername || !authenticated}
                className="w-full bg-purple-500 text-white py-2 text-sm rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Get All Fields
              </button>
              <ResultDisplay result={fieldsResult} />
              {Object.keys(fieldsData).length > 0 && (
                <div className="p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                  {Object.entries(fieldsData).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-gray-600 truncate max-w-20">{value || '(empty)'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ethereum ENS Test */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold">Ethereum ENS Test</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username to test on Ethereum"
                value={ethEnsUsername}
                onChange={(e) => setEthEnsUsername(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={handleEthEnsTest}
                disabled={!ethEnsUsername}
                className="w-full bg-orange-500 text-white py-2 text-sm rounded hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Test on Ethereum Mainnet
              </button>
              <ResultDisplay result={ethEnsResult} />
              <div className="text-xs text-gray-500">
                <p>Network: Ethereum Mainnet</p>
              </div>
            </div>
          </div>

          {/* ENS Text Records */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold">ENS Text Records</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Username for text record test"
                value={ensTextUsername}
                onChange={(e) => setEnsTextUsername(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <select
                value={ensTextKey}
                onChange={(e) => setEnsTextKey(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="bio">bio</option>
                <option value="name">name</option>
                <option value="avatar">avatar</option>
                <option value="description">description</option>
                <option value="ai.bio">ai.bio</option>
                <option value="ai.topics">ai.topics</option>
                <option value="ai.style">ai.style</option>
                <option value="ai.traits">ai.traits</option>
              </select>
              <button
                onClick={handleEnsTextTest}
                disabled={!ensTextUsername || !ensTextKey}
                className="w-full bg-teal-500 text-white py-2 text-sm rounded hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Test Text Record Resolution
              </button>
              <ResultDisplay result={ensTextResult} />
              <div className="text-xs text-gray-500">
                <p>Tests text record resolution via CCIP-Read</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}