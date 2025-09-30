import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Loader2, Mail, Lock, Building2 } from 'lucide-react'

const Auth: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('signin')

  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess('Successfully signed in! Redirecting to dashboard...')
      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Check your email for the confirmation link!')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      {/* Main Login Container */}
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-[#E6E6E6]">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-[#596152] rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#2E2A2B] mb-2">
            Logga in på Nivo
          </h1>
          <p className="text-[#2E2A2B]/70 text-sm">
            Svensk företagsintelligensplattform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-[#2E2A2B] text-sm font-medium">
              E-post eller användarnamn
            </label>
            <Input
              id="email"
              type="email"
              placeholder="E-post eller användarnamn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-[#E6E6E6] text-[#2E2A2B] placeholder-[#2E2A2B]/50 rounded-lg h-12 px-4 focus:border-[#596152] focus:ring-0"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-[#2E2A2B] text-sm font-medium">
              Lösenord
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border-[#E6E6E6] text-[#2E2A2B] placeholder-[#2E2A2B]/50 rounded-lg h-12 px-4 focus:border-[#596152] focus:ring-0"
              required
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Login Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#596152] hover:bg-[#596152]/90 text-white font-semibold rounded-lg h-12 text-base transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loggar in...
              </>
            ) : (
              'Fortsätt'
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-8">
          <p className="text-[#2E2A2B]/70 text-sm">
            Har du inget konto?{' '}
            <button 
              onClick={() => setActiveTab('signup')}
              className="text-[#596152] underline hover:text-[#596152]/80 transition-colors"
            >
              Registrera dig för Nivo
            </button>
          </p>
        </div>
      </div>

      {/* Sign Up Modal (Hidden by default, shown when activeTab is 'signup') */}
      {activeTab === 'signup' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-[#E6E6E6]">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setActiveTab('signin')}
                className="text-[#2E2A2B]/70 hover:text-[#2E2A2B] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sign Up Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#2E2A2B] mb-2">
                Skapa konto
              </h2>
              <p className="text-[#2E2A2B]/70 text-sm">
                Registrera dig för att komma åt Nivo
              </p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-[#2E2A2B] text-sm font-medium">
                  E-post
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="E-post"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-[#E6E6E6] text-[#2E2A2B] placeholder-[#2E2A2B]/50 rounded-lg h-12 px-4 focus:border-[#596152] focus:ring-0"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="signup-password" className="text-[#2E2A2B] text-sm font-medium">
                  Lösenord
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Skapa ett lösenord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-[#E6E6E6] text-[#2E2A2B] placeholder-[#2E2A2B]/50 rounded-lg h-12 px-4 focus:border-[#596152] focus:ring-0"
                  required
                />
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-[#2E2A2B] text-sm font-medium">
                  Bekräfta lösenord
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Bekräfta ditt lösenord"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white border-[#E6E6E6] text-[#2E2A2B] placeholder-[#2E2A2B]/50 rounded-lg h-12 px-4 focus:border-[#596152] focus:ring-0"
                  required
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              {/* Sign Up Button */}
              <Button 
                type="submit" 
                className="w-full bg-[#596152] hover:bg-[#596152]/90 text-white font-semibold rounded-lg h-12 text-base transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Skapar konto...
                  </>
                ) : (
                  'Skapa konto'
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <p className="text-[#2E2A2B]/70 text-sm">
                Har du redan ett konto?{' '}
                <button 
                  onClick={() => setActiveTab('signin')}
                  className="text-[#596152] underline hover:text-[#596152]/80 transition-colors"
                >
                  Logga in
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Auth
