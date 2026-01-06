import { useState, useCallback } from 'react'

interface ValidationError {
  email?: string
  password?: string
  password2?: string
  username?: string
}

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationError>({})

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 8
  }

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2
  }

  const validateLoginForm = useCallback(
    (email: string, password: string): boolean => {
      const newErrors: ValidationError = {}

      if (!email) {
        newErrors.email = 'Email is required'
      } else if (!validateEmail(email)) {
        newErrors.email = 'Invalid email format'
      }

      if (!password) {
        newErrors.password = 'Password is required'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    []
  )

  const validateRegisterForm = useCallback(
    (email: string, username: string, password: string, password2: string): boolean => {
      const newErrors: ValidationError = {}

      if (!email) {
        newErrors.email = 'Email is required'
      } else if (!validateEmail(email)) {
        newErrors.email = 'Invalid email format'
      }

      if (!username) {
        newErrors.username = 'Username is required'
      } else if (username.trim().length < 4) {
        newErrors.username = 'Username must be at least 4 characters'
      }

      if (!password) {
        newErrors.password = 'Password is required'
      } else if (!validatePassword(password)) {
        newErrors.password = 'Password must be at least 8 characters'
      }

      if (!password2) {
        newErrors.password2 = 'Password confirmation is required'
      } else if (password !== password2) {
        newErrors.password2 = 'Passwords do not match'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    []
  )

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validateLoginForm,
    validateRegisterForm,
    clearErrors,
  }
}
