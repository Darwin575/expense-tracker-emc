'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useFormValidation } from '@/hooks/useFormValidation'
import Image from "next/image";

interface FormData {
  email: string
  username: string
  password: string
  password2: string
}

interface PasswordVisibility {
  password: boolean
  password2: boolean
}

const INPUT_BASE_CLASSES = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-colors'
const ERROR_CLASSES = 'border-red-500 focus:ring-red-500'
const DEFAULT_CLASSES = 'border-slate-300 dark:border-slate-600'

function FormInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled,
  showToggle,
  onToggle,
  isVisible,
  helpText,
}: {
  id: string
  label: string
  type?: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  disabled?: boolean
  showToggle?: boolean
  onToggle?: () => void
  isVisible?: boolean
  helpText?: string
}) {
  const inputType = showToggle ? (isVisible ? 'text' : 'password') : type
  const isPassword = type === 'password'

  return (
    <div >
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${INPUT_BASE_CLASSES} ${isPassword ? 'pr-10' : ''} ${error ? ERROR_CLASSES : DEFAULT_CLASSES}`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            disabled={disabled}
          >
            {isVisible ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {helpText && <p className="mt-1 text-xs text-gray-300 dark:text-slate-400">{helpText}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuth()
  const { errors, validateRegisterForm, clearErrors } = useFormValidation()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    password2: '',
  })
  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
    password: false,
    password2: false,
  })
  const [serverError, setServerError] = useState('')
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    clearErrors()
  }

  const togglePasswordVisibility = (field: keyof PasswordVisibility) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (!validateRegisterForm(formData.email, formData.username, formData.password, formData.password2)) {
      return
    }

    try {
      await register(formData.email, formData.username, formData.password, formData.password2)
      setRegistrationSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error: any) {
      setServerError(error.message || 'Registration failed. Please try again.')
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-lavender-smoke dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Registration Successful!
            </h1>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Your account is pending admin approval. You will receive an email once your account is activated. Redirecting to login...
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block w-full text-center py-2 px-4 bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-lavender-smoke dark:bg-slate-800 rounded-lg shadow-lg p-8">
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
              Get Started
            </h1>
            <p className="text-slate-800 dark:text-slate-400">Create your account</p>
          </div>

          {/* Error Messages */}
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {serverError}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              id="username"
              label="Username"
              placeholder="johndoe"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              disabled={isLoading}
            />

            <FormInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isLoading}
            />

            <FormInput
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
              showToggle
              onToggle={() => togglePasswordVisibility('password')}
              isVisible={passwordVisibility.password}
              helpText="Minimum 8 characters"
            />

            <FormInput
              id="password2"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.password2}
              onChange={handleChange}
              error={errors.password2}
              disabled={isLoading}
              showToggle
              onToggle={() => togglePasswordVisibility('password2')}
              isVisible={passwordVisibility.password2}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>


          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <hr className="flex-1 border-slate-300 dark:border-slate-600" />
            <span className="text-sm text-white dark:text-slate-400 whitespace-nowrap">
              Already have an account?
            </span>
            <hr className="flex-1 border-slate-300 dark:border-slate-600" />
          </div>

          {/* Login Link */}
          <Link
            href="/auth/login"
            className="block w-full text-center py-2 px-4 border-2 border-slate-600 dark:border-slate-600 text-white dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-400 font-medium rounded-lg transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
