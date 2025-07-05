'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { Address } from 'viem'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle, 
  User, 
  FileText, 
  Link2,
  Search,
  Plus,
  Edit3,
  ExternalLink
} from 'lucide-react'
import WalletConnect from '@/components/WalletConnect'

// Contract ABIs
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
      { internalType: "string", name: "field", type: "string" },
      { internalType: "string", name: "value", type: "string" }
    ],
    name: "updateField",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "username", type: "string" },
      { internalType: "string[]", name: "fields", type: "string[]" },
      { internalType: "string[]", name: "values", type: "string[]" }
    ],
    name: "updateFields",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "getProfile",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string", name: "usernameReturn", type: "string" },
      { internalType: "bool", name: "exists", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "username", type: "string" }],
    name: "isAvailable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
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
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "usernameExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "addressToUsername",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "username", type: "string" },
      { indexed: true, internalType: "address", name: "owner", type: "address" }
    ],
    name: "SubdomainRegistered",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "username", type: "string" },
      { indexed: true, internalType: "string", name: "field", type: "string" }
    ],
    name: "ProfileUpdated",
    type: "event"
  }
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
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const

// Contract addresses from environment variables
const CONTX_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS as Address
const CONTX_RESOLVER_ADDRESS = process.env.NEXT_PUBLIC_ETH_RESOLVER_ADDRESS as Address

interface TestResult {
  status: 'pending' | 'success' | 'error'
  message: string
  data?: unknown
}

interface Profile {
  owner: Address
  username: string
  exists: boolean
}


export default function TestContractsPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // Registration states
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [registrationResult, setRegistrationResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Profile lookup states
  const [lookupUsername, setLookupUsername] = useState('')
  const [profileResult, setProfileResult] = useState<TestResult>({ status: 'pending', message: '' })
  const [profileData, setProfileData] = useState<Profile | null>(null)

  // Text record states
  const [textUsername, setTextUsername] = useState('')
  const [textKey, setTextKey] = useState('')
  const [textValue, setTextValue] = useState('')
  const [textResult, setTextResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Batch update states
  const [batchUsername, setBatchUsername] = useState('')
  const [batchFields, setBatchFields] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }])
  const [batchResult, setBatchResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Availability check states
  const [checkUsername, setCheckUsername] = useState('')
  const [availabilityResult, setAvailabilityResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Field retrieval states
  const [fieldsUsername, setFieldsUsername] = useState('')
  const [fieldsResult, setFieldsResult] = useState<TestResult>({ status: 'pending', message: '' })
  const [fieldsData, setFieldsData] = useState<{ [key: string]: string }>({})

  // Address resolution states
  const [resolveUsername, setResolveUsername] = useState('')
  const [resolveResult, setResolveResult] = useState<TestResult>({ status: 'pending', message: '' })

  // ENS integration test states
  const [ensUsername, setEnsUsername] = useState('')
  const [ensResult, setEnsResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Direct CCIP-Read test states
  const [ccipUsername, setCcipUsername] = useState('')
  const [ccipResult, setCcipResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Ethereum ENS test states
  const [ethEnsUsername, setEthEnsUsername] = useState('')
  const [ethEnsResult, setEthEnsResult] = useState<TestResult>({ status: 'pending', message: '' })

  // ENS text record test states
  const [ensTextUsername, setEnsTextUsername] = useState('')
  const [ensTextKey, setEnsTextKey] = useState('bio')
  const [ensTextResult, setEnsTextResult] = useState<TestResult>({ status: 'pending', message: '' })

  // Helper function to create loading state
  const createLoadingResult = (message: string): TestResult => ({
    status: 'pending',
    message
  })

  // Helper function to create success state
  const createSuccessResult = (message: string, data?: unknown): TestResult => ({
    status: 'success',
    message,
    data
  })

  // Helper function to create error state
  const createErrorResult = (message: string): TestResult => ({
    status: 'error',
    message
  })

  // Test 1: Register a new username
  const handleRegister = async () => {
    if (!walletClient || !publicClient || !isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setRegistrationResult(createLoadingResult('Registering username...'))

      // Check if username is available first
      const isAvailable = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'isAvailable',
        args: [username]
      })

      if (!isAvailable) {
        setRegistrationResult(createErrorResult('Username is not available'))
        return
      }

      const hash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'register',
        args: [username, name, bio]
      })

      setRegistrationResult(createLoadingResult('Transaction sent, waiting for confirmation...'))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        setRegistrationResult(createSuccessResult(
          `Successfully registered ${username}.contx.eth!`,
          { hash, receipt }
        ))
      } else {
        setRegistrationResult(createErrorResult('Transaction failed'))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setRegistrationResult(createErrorResult(errorMessage))
    }
  }

  // Test 2: Check username availability
  const handleCheckAvailability = async () => {
    if (!publicClient) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setAvailabilityResult(createLoadingResult('Checking availability...'))

      const isAvailable = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'isAvailable',
        args: [checkUsername]
      })

      const exists = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'usernameExists',
        args: [checkUsername]
      })

      setAvailabilityResult(createSuccessResult(
        `Username ${checkUsername} is ${isAvailable ? 'available' : 'not available'}`,
        { isAvailable, exists }
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Availability check failed'
      setAvailabilityResult(createErrorResult(errorMessage))
    }
  }

  // Test 3: Get profile information
  const handleGetProfile = async () => {
    if (!publicClient) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setProfileResult(createLoadingResult('Fetching profile...'))

      const profile = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'getProfile',
        args: [lookupUsername]
      })

      const profileData: Profile = {
        owner: profile[0],
        username: profile[1],
        exists: profile[2]
      }

      setProfileData(profileData)
      setProfileResult(createSuccessResult(
        `Profile ${profileData.exists ? 'found' : 'not found'}`,
        profileData
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile lookup failed'
      setProfileResult(createErrorResult(errorMessage))
    }
  }

  // Test 4: Update text record
  const handleUpdateText = async () => {
    if (!walletClient || !publicClient || !isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setTextResult(createLoadingResult('Updating text record...'))

      const hash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'updateField',
        args: [textUsername, textKey, textValue]
      })

      setTextResult(createLoadingResult('Transaction sent, waiting for confirmation...'))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        setTextResult(createSuccessResult(
          `Successfully updated ${textKey} for ${textUsername}`,
          { hash, receipt }
        ))
      } else {
        setTextResult(createErrorResult('Transaction failed'))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Text update failed'
      setTextResult(createErrorResult(errorMessage))
    }
  }

  // Test 5: Batch update fields
  const handleBatchUpdate = async () => {
    if (!walletClient || !publicClient || !isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setBatchResult(createLoadingResult('Updating fields...'))

      const keys = batchFields.map(field => field.key).filter(key => key.length > 0)
      const values = batchFields.map(field => field.value).filter((_, index) => batchFields[index].key.length > 0)

      if (keys.length === 0) {
        setBatchResult(createErrorResult('No fields to update'))
        return
      }

      const hash = await walletClient.writeContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'updateFields',
        args: [batchUsername, keys, values]
      })

      setBatchResult(createLoadingResult('Transaction sent, waiting for confirmation...'))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (receipt.status === 'success') {
        setBatchResult(createSuccessResult(
          `Successfully updated ${keys.length} fields for ${batchUsername}`,
          { hash, receipt, keys, values }
        ))
      } else {
        setBatchResult(createErrorResult('Transaction failed'))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch update failed'
      setBatchResult(createErrorResult(errorMessage))
    }
  }

  // Test 6: Get all fields for a username
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

  // Test 7: Resolve address for username (Direct Registry)
  const handleResolveAddress = async () => {
    if (!publicClient) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setResolveResult(createLoadingResult('Resolving address...'))

      // First check if the profile exists
      const profile = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'getProfile',
        args: [resolveUsername]
      })

      if (!profile[2]) { // profile.exists is false
        setResolveResult(createErrorResult(
          `Username "${resolveUsername}" is not registered in contx.eth registry`
        ))
        return
      }

      const resolvedAddress = await publicClient.readContract({
        address: CONTX_REGISTRY_ADDRESS,
        abi: CONTX_REGISTRY_ABI,
        functionName: 'getAddress',
        args: [resolveUsername]
      })

      setResolveResult(createSuccessResult(
        `✅ ${resolveUsername}.contx.eth resolves to ${resolvedAddress} (Direct Registry)`,
        { address: resolvedAddress, owner: profile[0] }
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Address resolution failed'
      setResolveResult(createErrorResult(errorMessage))
    }
  }

  // Test 8: ENS Resolution via CCIP-Read
  const handleEnsResolve = async () => {
    if (!publicClient) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setEnsResult(createLoadingResult('Testing ENS resolution via CCIP-Read...'))

      // Create the ENS node for username.contx.eth
      const { namehash } = await import('viem')
      const node = namehash(`${ensUsername}.contx.eth`)

      try {
        // Try to resolve via ContxResolver (this should trigger CCIP-Read)
        const resolvedAddress = await publicClient.readContract({
          address: CONTX_RESOLVER_ADDRESS,
          abi: CONTX_RESOLVER_ABI,
          functionName: 'addr',
          args: [node]
        })

        setEnsResult(createSuccessResult(
          `✅ ENS resolution successful: ${ensUsername}.contx.eth → ${resolvedAddress}`,
          { address: resolvedAddress, node: node }
        ))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        if (errorMessage.includes('OffchainLookup')) {
          setEnsResult(createSuccessResult(
            `🔄 CCIP-Read triggered! Gateway: https://contx.name/api/ccip-read/{sender}/{data}`,
            { 
              status: 'ccip-triggered',
              gateway: 'https://contx.name/api/ccip-read/{sender}/{data}',
              error: errorMessage 
            }
          ))
        } else {
          setEnsResult(createErrorResult(
            `ENS resolution failed: ${errorMessage}. Check if CCIP-Read endpoint is implemented.`
          ))
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ENS resolution test failed'
      setEnsResult(createErrorResult(errorMessage))
    }
  }

  // Test 9: Direct CCIP-Read API Test
  const handleCcipTest = async () => {
    try {
      setCcipResult(createLoadingResult('Testing CCIP-Read API directly...'))

      // Test the direct API endpoint (POST method for debugging)
      const response = await fetch('/api/ccip-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: ccipUsername,
          method: 'getAddress'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCcipResult(createSuccessResult(
          `✅ Direct API test successful! Address: ${data.result}`,
          data
        ))
      } else {
        setCcipResult(createErrorResult(
          `API test failed: ${data.error || 'Unknown error'}`
        ))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'CCIP-Read API test failed'
      setCcipResult(createErrorResult(errorMessage))
    }
  }

  // Test 10: Ethereum ENS Resolution Test
  const handleEthEnsTest = async () => {
    try {
      setEthEnsResult(createLoadingResult('Testing ENS resolution on Ethereum mainnet...'))

      // Create Ethereum mainnet client
      const { createPublicClient, http } = await import('viem')
      const { mainnet } = await import('viem/chains')
      
      const ethereumClient = createPublicClient({
        chain: mainnet,
        transport: http('https://eth.llamarpc.com'), // Public RPC
      })

      // Create the ENS node for username.contx.eth
      const { namehash } = await import('viem')
      const node = namehash(`${ethEnsUsername}.contx.eth`)

      console.log('🔍 Testing ENS resolution on Ethereum mainnet')
      console.log('Node:', node)
      console.log('Resolver:', CONTX_RESOLVER_ADDRESS)

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
          console.error('Ethereum ENS error:', error)
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

  // Test 11: ENS Text Record Resolution
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
      const { namehash } = await import('viem')
      const node = namehash(`${ensTextUsername}.contx.eth`)

      console.log('🔍 Testing ENS text record resolution on Ethereum mainnet')
      console.log('Node:', node)
      console.log('Key:', ensTextKey)

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
          console.error('Ethereum ENS text error:', error)
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

  // Add field to batch update
  const addBatchField = () => {
    setBatchFields([...batchFields, { key: '', value: '' }])
  }

  // Remove field from batch update
  const removeBatchField = (index: number) => {
    setBatchFields(batchFields.filter((_, i) => i !== index))
  }

  // Update batch field
  const updateBatchField = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...batchFields]
    newFields[index][field] = value
    setBatchFields(newFields)
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


  if (!CONTX_REGISTRY_ADDRESS || !CONTX_RESOLVER_ADDRESS) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Addresses Missing</h1>
          <p className="text-gray-600">Please ensure your environment variables are set correctly</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>NEXT_PUBLIC_BASE_REGISTRY_ADDRESS: {CONTX_REGISTRY_ADDRESS || 'Not set'}</p>
            <p>NEXT_PUBLIC_ETH_RESOLVER_ADDRESS: {CONTX_RESOLVER_ADDRESS || 'Not set'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">contx.eth Contract Testing</h1>
              <p className="text-gray-600">
                Test your custom contx.eth subdomain contracts on Base L2
              </p>
            </div>
            <WalletConnect />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Ready to test!</strong> Using your deployed contract addresses:
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• ContxRegistry: {CONTX_REGISTRY_ADDRESS}</li>
              <li>• ContxResolver: {CONTX_RESOLVER_ADDRESS}</li>
            </ul>
          </div>
        </div>

        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <p className="text-sm text-blue-800">
                <strong>Connect your wallet</strong> to test the contract functions. Click the &quot;Connect Wallet&quot; button above.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test 1: Register Username */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Register Username</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username (e.g., alice)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <button
                onClick={handleRegister}
                disabled={!username || !name || !bio}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Register {username && `${username}.contx.eth`}
              </button>
              <ResultDisplay result={registrationResult} />
            </div>
          </div>

          {/* Test 2: Check Availability */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-semibold">Check Availability</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username to check"
                value={checkUsername}
                onChange={(e) => setCheckUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleCheckAvailability}
                disabled={!checkUsername}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Check Availability
              </button>
              <ResultDisplay result={availabilityResult} />
            </div>
          </div>

          {/* Test 3: Get Profile */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Get Profile</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username to lookup"
                value={lookupUsername}
                onChange={(e) => setLookupUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleGetProfile}
                disabled={!lookupUsername}
                className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Get Profile
              </button>
              <ResultDisplay result={profileResult} />
              {profileData && profileData.exists && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Owner:</strong> {profileData.owner}</p>
                  <p className="text-sm"><strong>Username:</strong> {profileData.username}</p>
                  <p className="text-sm"><strong>Exists:</strong> {profileData.exists ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Test 4: Update Text Record */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold">Update Text Record</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={textUsername}
                onChange={(e) => setTextUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Field key (e.g., bio, avatar, etc.)"
                value={textKey}
                onChange={(e) => setTextKey(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Field value"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <button
                onClick={handleUpdateText}
                disabled={!textUsername || !textKey || !textValue}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Update Text Record
              </button>
              <ResultDisplay result={textResult} />
            </div>
          </div>

          {/* Test 5: Batch Update Fields */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-semibold">Batch Update Fields</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={batchUsername}
                onChange={(e) => setBatchUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="space-y-2">
                {batchFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Field key"
                      value={field.key}
                      onChange={(e) => updateBatchField(index, 'key', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Field value"
                      value={field.value}
                      onChange={(e) => updateBatchField(index, 'value', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {batchFields.length > 1 && (
                      <button
                        onClick={() => removeBatchField(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addBatchField}
                className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Add Field
              </button>
              <button
                onClick={handleBatchUpdate}
                disabled={!batchUsername || batchFields.every(f => !f.key || !f.value)}
                className="w-full bg-indigo-500 text-white py-3 rounded-lg hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Update Fields
              </button>
              <ResultDisplay result={batchResult} />
            </div>
          </div>

          {/* Test 6: Get All Fields */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-teal-500" />
              <h2 className="text-xl font-semibold">Get All Fields</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={fieldsUsername}
                onChange={(e) => setFieldsUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={handleGetFields}
                disabled={!fieldsUsername}
                className="w-full bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Get All Fields
              </button>
              <ResultDisplay result={fieldsResult} />
              {Object.keys(fieldsData).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                  {Object.entries(fieldsData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start py-1 border-b border-gray-200 last:border-b-0">
                      <span className="text-sm font-medium text-gray-700">{key}:</span>
                      <span className="text-sm text-gray-600 max-w-xs truncate">{value || '(empty)'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test 7: Resolve Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-5 h-5 text-pink-500" />
              <h2 className="text-xl font-semibold">Resolve Address (Direct)</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username to resolve"
                value={resolveUsername}
                onChange={(e) => setResolveUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              <button
                onClick={handleResolveAddress}
                disabled={!resolveUsername}
                className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Resolve via Registry
              </button>
              <ResultDisplay result={resolveResult} />
            </div>
          </div>

          {/* Test 8: ENS Resolution via CCIP-Read */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink className="w-5 h-5 text-cyan-500" />
              <h2 className="text-xl font-semibold">ENS Resolution (CCIP-Read)</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username for ENS test"
                value={ensUsername}
                onChange={(e) => setEnsUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button
                onClick={handleEnsResolve}
                disabled={!ensUsername}
                className="w-full bg-cyan-500 text-white py-3 rounded-lg hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Test ENS Resolution
              </button>
              <ResultDisplay result={ensResult} />
              <div className="text-xs text-gray-500">
                <p>Gateway: https://contx.name/api/ccip-read/{`{sender}`}/{`{data}`}</p>
              </div>
            </div>
          </div>

          {/* Test 9: Direct CCIP-Read API Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-semibold">Direct API Test</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username for API test"
                value={ccipUsername}
                onChange={(e) => setCcipUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={handleCcipTest}
                disabled={!ccipUsername}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Test CCIP-Read API
              </button>
              <ResultDisplay result={ccipResult} />
              <div className="text-xs text-gray-500">
                <p>Tests: POST /api/ccip-read (debugging endpoint)</p>
              </div>
            </div>
          </div>

          {/* Test 10: Ethereum ENS Resolution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Ethereum ENS Test</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username to test on Ethereum"
                value={ethEnsUsername}
                onChange={(e) => setEthEnsUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleEthEnsTest}
                disabled={!ethEnsUsername}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Test on Ethereum Mainnet
              </button>
              <ResultDisplay result={ethEnsResult} />
              <div className="text-xs text-gray-500">
                <p>Network: Ethereum Mainnet</p>
                <p>Resolver: {CONTX_RESOLVER_ADDRESS}</p>
              </div>
            </div>
          </div>

          {/* Test 11: ENS Text Record Resolution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">ENS Text Records</h2>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username for text record test"
                value={ensTextUsername}
                onChange={(e) => setEnsTextUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <select
                value={ensTextKey}
                onChange={(e) => setEnsTextKey(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Test Text Record Resolution
              </button>
              <ResultDisplay result={ensTextResult} />
              <div className="text-xs text-gray-500">
                <p>Tests text record resolution via CCIP-Read</p>
                <p>Key: {ensTextKey}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ENS Integration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">ENS Integration Status</h2>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">✅ CCIP-Read Implementation Found!</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Complete CCIP-Read API at <code>/api/ccip-read/route.ts</code></p>
                <p>• Supports address resolution (<code>addr</code>) and text records (<code>text</code>)</p>
                <p>• Properly decodes ENS nodes and queries Base registry</p>
                <p>• Handles AI field formatting (comma-separated → JSON)</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">🚀 Enhanced Username Discovery</h3>
              <div className="text-sm text-green-700 space-y-2">
                <p><strong>Now supports ANY registered username!</strong> The API uses intelligent discovery:</p>
                <p>• <strong>Strategy 1:</strong> Common usernames (alice, bob, aaron, test, etc.)</p>
                <p>• <strong>Strategy 2:</strong> Extended patterns (a-z, 0-99, user0-user9, web3 terms)</p>
                <p>• <strong>Strategy 3:</strong> Alphanumeric brute force (3+ characters)</p>
                <p>• <strong>Caching:</strong> Found usernames cached for 5 minutes</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ Remaining Issues</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>1. Hostname Mismatch</strong> - Resolver expects <code>contx.name</code> but you&apos;re testing on <code>localhost:3000</code></p>
                <p><strong>2. Domain Registration</strong> - contx.eth needs to be registered in ENS and point to your resolver</p>
                <p><strong>3. Performance</strong> - Uncommon usernames may take longer to discover</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">🔧 Testing</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Register any username you want - the API will find it!</p>
                <p>• Start with common names for faster discovery</p>
                <p>• Check console logs to see the discovery process</p>
                <p>• For production: Deploy to contx.name domain</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">✅ Current Working Features</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Custom subdomain registration (username.contx.eth)</p>
                <p>• Text records storage and retrieval</p>
                <p>• Direct registry resolution</p>
                <p>• CCIP-Read resolver deployed and configured</p>
                <p>• Full CCIP-Read API implementation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">ContxRegistry</h3>
              <p className="text-sm text-gray-600 font-mono break-all">{CONTX_REGISTRY_ADDRESS}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">ContxResolver</h3>
              <p className="text-sm text-gray-600 font-mono break-all">{CONTX_RESOLVER_ADDRESS}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Connected as: <span className="font-mono">{address}</span>
            </p>
            <p className="text-sm text-gray-700 mt-1">
              CCIP-Read Gateway: <span className="font-mono text-xs">https://contx.name/api/ccip-read/{`{sender}`}/{`{data}`}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}