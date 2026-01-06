'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useFormValidation } from '@/hooks/useFormValidation'
import { authService } from '@/lib/auth-service'
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { errors, validateLoginForm, clearErrors } = useFormValidation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotForm, setShowForgotForm] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (!validateLoginForm(email, password)) {
      return
    }

    try {
      setIsSubmitting(true)
      await login(email, password)
      router.push('/dashboard')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password. Please try again.'
      setServerError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleForgotCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (!forgotEmail) {
      setServerError('Please enter your email address')
      return
    }

    setForgotLoading(true)
    try {
      await authService.requestCredentialReset(forgotEmail)
      setForgotSuccess(true)
      setForgotEmail('')
      setTimeout(() => {
        setShowForgotForm(false)
        setForgotSuccess(false)
      }, 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request'
      setServerError(errorMessage)
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-lavender-smoke dark:bg-slate-800 rounded-lg shadow-lg p-8">
          {!showForgotForm ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Image
                    src="/images/logo.jpeg"
                    alt="Logo"
                    width={120}
                    height={120}
                    className="size-16 rounded-full"
                  />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome Back
                </h1>
                <p className="text-slate-800 dark:text-slate-400">Sign in to your account</p>
              </div>

              {/* Error Messages */}
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {serverError}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearErrors()
                    }}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors ${errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 dark:border-slate-600'
                      }`}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        clearErrors()
                      }}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors pr-10 ${errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      disabled={isLoading}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isSubmitting ? 'Signing in...' : (isLoading ? 'Please wait...' : 'Sign In')}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <hr className="flex-1 border-slate-300 dark:border-slate-600" />
                <span className="text-sm text-white dark:text-slate-400 whitespace-nowrap">
                  Need help?
                </span>
                <hr className="flex-1 border-slate-300 dark:border-slate-600" />
              </div>


              {/* Buttons */}
              <div className="space-y-3">
                <Link
                  href="/auth/register"
                  className="block w-full text-center py-2 px-4 border-2 border-slate-600 dark:border-slate-600 text-white dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-400 font-medium rounded-lg transition-colors duration-200"
                >
                  Create Account
                </Link>

                <button
                  type="button"
                  onClick={() => setShowForgotForm(true)}
                  className="block w-full text-center py-2 px-4 border-2 border-slate-600 dark:border-slate-600 text-white dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-400 font-medium rounded-lg transition-colors duration-200"
                >
                  Forgot Credentials?
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Forgot Credentials Form */}
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Credential Reset
                </h1>
                <p className="text-slate-900 dark:text-slate-400 text-sm">Enter your email and an admin will contact you</p>
              </div>

              {/* Error Messages */}
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {serverError}
                </div>
              )}

              {/* Success Message */}
              {forgotSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                  ✓ Request submitted successfully. An admin will contact you shortly.
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleForgotCredentials} className="space-y-4">
                <div className="mb-6">
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                    disabled={forgotLoading}
                  />
                  <p className="mt-2 text-xs text-gray-300 dark:text-slate-400">
                    Our admin team will verify your identity and reset your credentials.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {forgotLoading ? 'Submitting...' : 'Request Reset'}
                </button>
              </form>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setShowForgotForm(false)
                  setForgotEmail('')
                  setServerError('')
                }}
                className="w-full mt-4 text-center py-2 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
