import React, { forwardRef, ReactNode } from 'react'
import {
  TextField,
  TextFieldProps,
  FormControl,
  FormLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
  Alert,
  Box,
  Chip,
  Typography
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Security,
  Warning,
  Error as ErrorIcon,
  CheckCircle
} from '@mui/icons-material'
import {
  useSecureInput,
  useSecureEmailInput,
  useSecurePhoneInput,
  useSecurePasswordInput,
  useSecureUrlInput,
  useSecureTextAreaInput,
  SecureInputOptions
} from '../hooks/useSecureInput'
import { ThreatLevel } from '../services/ValidationService'

/**
 * Security indicator component
 */
interface SecurityIndicatorProps {
  threatLevel: string
  threats: any[]
  isValid: boolean
  showDetails?: boolean
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({
  threatLevel,
  threats,
  isValid,
  showDetails = false
}) => {
  const getColor = () => {
    if (!isValid) return 'error'
    switch (threatLevel) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'info'
      case 'LOW': return 'success'
      default: return 'success'
    }
  }

  const getIcon = () => {
    if (!isValid) return <ErrorIcon fontSize="small" />
    switch (threatLevel) {
      case 'CRITICAL': return <ErrorIcon fontSize="small" />
      case 'HIGH': return <Warning fontSize="small" />
      case 'MEDIUM': return <Security fontSize="small" />
      case 'LOW': return <CheckCircle fontSize="small" />
      default: return <CheckCircle fontSize="small" />
    }
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Chip
        icon={getIcon()}
        label={`Security: ${threatLevel}`}
        color={getColor()}
        size="small"
        variant="outlined"
      />
      {showDetails && threats.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {threats.length} threat(s) detected
        </Typography>
      )}
    </Box>
  )
}

/**
 * Base secure input props
 */
interface BaseSecureInputProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  secureOptions?: SecureInputOptions
  showSecurityIndicator?: boolean
  showThreats?: boolean
  onSecureChange?: (value: string, sanitizedValue: string, isValid: boolean) => void
}

/**
 * Secure text field component
 */
export const SecureTextField = forwardRef<HTMLInputElement, BaseSecureInputProps>(
  ({ secureOptions, showSecurityIndicator = false, showThreats = false, onSecureChange, ...props }, ref) => {
    const secureInput = useSecureInput(props.defaultValue as string || '', {
      ...secureOptions,
      fieldName: props.name || 'textfield'
    })

    React.useEffect(() => {
      if (onSecureChange) {
        onSecureChange(secureInput.value, secureInput.sanitizedValue, secureInput.isValid)
      }
    }, [secureInput.value, secureInput.sanitizedValue, secureInput.isValid, onSecureChange])

    const hasErrors = secureInput.errors.length > 0 || !secureInput.isValid
    const helperText = hasErrors 
      ? secureInput.errors.join(', ') 
      : props.helperText

    return (
      <FormControl fullWidth error={hasErrors}>
        <TextField
          {...props}
          ref={ref}
          value={secureInput.value}
          onChange={(e) => secureInput.onChange(e.target.value)}
          onBlur={secureInput.onBlur}
          onFocus={secureInput.onFocus}
          error={hasErrors}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: showSecurityIndicator ? (
              <InputAdornment position="end">
                <SecurityIndicator
                  threatLevel={secureInput.threatLevel}
                  threats={secureInput.threats}
                  isValid={secureInput.isValid}
                />
              </InputAdornment>
            ) : props.InputProps?.endAdornment
          }}
        />
        
        {showThreats && secureInput.threats.length > 0 && (
          <Box mt={1}>
            <Alert severity="warning">
              Security threats detected: {secureInput.threats.map(t => t.type).join(', ')}
            </Alert>
          </Box>
        )}
      </FormControl>
    )
  }
)

SecureTextField.displayName = 'SecureTextField'

/**
 * Secure email field component
 */
export const SecureEmailField = forwardRef<HTMLInputElement, BaseSecureInputProps>(
  ({ secureOptions, showSecurityIndicator = true, showThreats = false, onSecureChange, ...props }, ref) => {
    const secureInput = useSecureEmailInput(props.defaultValue as string || '', secureOptions)

    React.useEffect(() => {
      if (onSecureChange) {
        onSecureChange(secureInput.value, secureInput.sanitizedValue, secureInput.isValid)
      }
    }, [secureInput.value, secureInput.sanitizedValue, secureInput.isValid, onSecureChange])

    const hasErrors = secureInput.errors.length > 0 || !secureInput.isValid
    const helperText = hasErrors 
      ? secureInput.errors.join(', ') 
      : props.helperText

    return (
      <FormControl fullWidth error={hasErrors}>
        <TextField
          {...props}
          ref={ref}
          type="email"
          value={secureInput.value}
          onChange={(e) => secureInput.onChange(e.target.value)}
          onBlur={secureInput.onBlur}
          onFocus={secureInput.onFocus}
          error={hasErrors}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: showSecurityIndicator ? (
              <InputAdornment position="end">
                <SecurityIndicator
                  threatLevel={secureInput.threatLevel}
                  threats={secureInput.threats}
                  isValid={secureInput.isValid}
                />
              </InputAdornment>
            ) : props.InputProps?.endAdornment
          }}
        />
        
        {showThreats && secureInput.threats.length > 0 && (
          <Box mt={1}>
            <Alert severity="warning">
              Security threats detected: {secureInput.threats.map(t => t.type).join(', ')}
            </Alert>
          </Box>
        )}
      </FormControl>
    )
  }
)

SecureEmailField.displayName = 'SecureEmailField'

/**
 * Secure phone field component
 */
export const SecurePhoneField = forwardRef<HTMLInputElement, BaseSecureInputProps>(
  ({ secureOptions, showSecurityIndicator = true, showThreats = false, onSecureChange, ...props }, ref) => {
    const secureInput = useSecurePhoneInput(props.defaultValue as string || '', secureOptions)

    React.useEffect(() => {
      if (onSecureChange) {
        onSecureChange(secureInput.value, secureInput.sanitizedValue, secureInput.isValid)
      }
    }, [secureInput.value, secureInput.sanitizedValue, secureInput.isValid, onSecureChange])

    const hasErrors = secureInput.errors.length > 0 || !secureInput.isValid
    const helperText = hasErrors 
      ? secureInput.errors.join(', ') 
      : props.helperText

    return (
      <FormControl fullWidth error={hasErrors}>
        <TextField
          {...props}
          ref={ref}
          type="tel"
          value={secureInput.value}
          onChange={(e) => secureInput.onChange(e.target.value)}
          onBlur={secureInput.onBlur}
          onFocus={secureInput.onFocus}
          error={hasErrors}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: showSecurityIndicator ? (
              <InputAdornment position="end">
                <SecurityIndicator
                  threatLevel={secureInput.threatLevel}
                  threats={secureInput.threats}
                  isValid={secureInput.isValid}
                />
              </InputAdornment>
            ) : props.InputProps?.endAdornment
          }}
        />
        
        {showThreats && secureInput.threats.length > 0 && (
          <Box mt={1}>
            <Alert severity="warning">
              Security threats detected: {secureInput.threats.map(t => t.type).join(', ')}
            </Alert>
          </Box>
        )}
      </FormControl>
    )
  }
)

SecurePhoneField.displayName = 'SecurePhoneField'

/**
 * Secure password field component
 */
interface SecurePasswordFieldProps extends BaseSecureInputProps {
  minLength?: number
  showPasswordStrength?: boolean
}

export const SecurePasswordField = forwardRef<HTMLInputElement, SecurePasswordFieldProps>(
  ({
    secureOptions,
    showSecurityIndicator = true,
    showThreats = false,
    onSecureChange,
    minLength = 8,
    showPasswordStrength = true,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const secureInput = useSecurePasswordInput(props.defaultValue as string || '', minLength, secureOptions)

    React.useEffect(() => {
      if (onSecureChange) {
        onSecureChange(secureInput.value, secureInput.sanitizedValue, secureInput.isValid)
      }
    }, [secureInput.value, secureInput.sanitizedValue, secureInput.isValid, onSecureChange])

    const hasErrors = secureInput.errors.length > 0 || !secureInput.isValid
    const helperText = hasErrors
      ? secureInput.errors.join(', ')
      : props.helperText

    const getPasswordStrength = () => {
      const password = secureInput.value
      if (!password) return { level: 0, text: 'No password' }

      let score = 0
      if (password.length >= 8) score++
      if (/[A-Z]/.test(password)) score++
      if (/[a-z]/.test(password)) score++
      if (/\d/.test(password)) score++
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

      const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
      return { level: score, text: levels[score] || 'Very Weak' }
    }

    const passwordStrength = getPasswordStrength()

    return (
      <FormControl fullWidth error={hasErrors}>
        <TextField
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={secureInput.value}
          onChange={(e) => secureInput.onChange(e.target.value)}
          onBlur={secureInput.onBlur}
          onFocus={secureInput.onFocus}
          error={hasErrors}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: (
              <InputAdornment position="end">
                <Box display="flex" alignItems="center" gap={1}>
                  {showSecurityIndicator && (
                    <SecurityIndicator
                      threatLevel={secureInput.threatLevel}
                      threats={secureInput.threats}
                      isValid={secureInput.isValid}
                    />
                  )}
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Box>
              </InputAdornment>
            )
          }}
        />

        {showPasswordStrength && secureInput.value && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Password Strength: {passwordStrength.text}
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 4,
                bgcolor: 'grey.300',
                borderRadius: 2,
                mt: 0.5
              }}
            >
              <Box
                sx={{
                  width: `${(passwordStrength.level / 5) * 100}%`,
                  height: '100%',
                  bgcolor: passwordStrength.level < 2 ? 'error.main' :
                           passwordStrength.level < 4 ? 'warning.main' : 'success.main',
                  borderRadius: 2,
                  transition: 'all 0.3s ease'
                }}
              />
            </Box>
          </Box>
        )}

        {showThreats && secureInput.threats.length > 0 && (
          <Box mt={1}>
            <Alert severity="warning">
              Security threats detected: {secureInput.threats.map(t => t.type).join(', ')}
            </Alert>
          </Box>
        )}
      </FormControl>
    )
  }
)

SecurePasswordField.displayName = 'SecurePasswordField'

/**
 * Secure URL field component
 */
export const SecureUrlField = forwardRef<HTMLInputElement, BaseSecureInputProps>(
  ({ secureOptions, showSecurityIndicator = true, showThreats = false, onSecureChange, ...props }, ref) => {
    const secureInput = useSecureUrlInput(props.defaultValue as string || '', secureOptions)

    React.useEffect(() => {
      if (onSecureChange) {
        onSecureChange(secureInput.value, secureInput.sanitizedValue, secureInput.isValid)
      }
    }, [secureInput.value, secureInput.sanitizedValue, secureInput.isValid, onSecureChange])

    const hasErrors = secureInput.errors.length > 0 || !secureInput.isValid
    const helperText = hasErrors
      ? secureInput.errors.join(', ')
      : props.helperText

    return (
      <FormControl fullWidth error={hasErrors}>
        <TextField
          {...props}
          ref={ref}
          type="url"
          value={secureInput.value}
          onChange={(e) => secureInput.onChange(e.target.value)}
          onBlur={secureInput.onBlur}
          onFocus={secureInput.onFocus}
          error={hasErrors}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: showSecurityIndicator ? (
              <InputAdornment position="end">
                <SecurityIndicator
                  threatLevel={secureInput.threatLevel}
                  threats={secureInput.threats}
                  isValid={secureInput.isValid}
                />
              </InputAdornment>
            ) : props.InputProps?.endAdornment
          }}
        />

        {showThreats && secureInput.threats.length > 0 && (
          <Box mt={1}>
            <Alert severity="warning">
              Security threats detected: {secureInput.threats.map(t => t.type).join(', ')}
            </Alert>
          </Box>
        )}
      </FormControl>
    )
  }
)

SecureUrlField.displayName = 'SecureUrlField'

/**
 * Secure text area component
 */
interface SecureTextAreaProps extends BaseSecureInputProps {
  maxLength?: number
}

export const SecureTextArea = forwardRef<HTMLInputElement, SecureTextAreaProps>(
  ({
    secureOptions,
    showSecurityIndicator = true,
    showThreats = false,
    onSecureChange,
    maxLength = 2000,
    ...props
  }, ref) => {
    const secureInput = useSecureTextAreaInput(props.defaultValue as string || '', maxLength, secureOptions)

    React.useEffect(() => {
      if (onSecureChange) {
        onSecureChange(secureInput.value, secureInput.sanitizedValue, secureInput.isValid)
      }
    }, [secureInput.value, secureInput.sanitizedValue, secureInput.isValid, onSecureChange])

    const hasErrors = secureInput.errors.length > 0 || !secureInput.isValid
    const helperText = hasErrors
      ? secureInput.errors.join(', ')
      : props.helperText

    return (
      <FormControl fullWidth error={hasErrors}>
        <TextField
          {...props}
          ref={ref}
          multiline
          rows={4}
          value={secureInput.value}
          onChange={(e) => secureInput.onChange(e.target.value)}
          onBlur={secureInput.onBlur}
          onFocus={secureInput.onFocus}
          error={hasErrors}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: showSecurityIndicator ? (
              <InputAdornment position="end">
                <SecurityIndicator
                  threatLevel={secureInput.threatLevel}
                  threats={secureInput.threats}
                  isValid={secureInput.isValid}
                />
              </InputAdornment>
            ) : props.InputProps?.endAdornment
          }}
        />

        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="caption" color="text.secondary">
            {secureInput.value.length} / {maxLength} characters
          </Typography>
          {showSecurityIndicator && (
            <SecurityIndicator
              threatLevel={secureInput.threatLevel}
              threats={secureInput.threats}
              isValid={secureInput.isValid}
              showDetails
            />
          )}
        </Box>

        {showThreats && secureInput.threats.length > 0 && (
          <Box mt={1}>
            <Alert severity="warning">
              Security threats detected: {secureInput.threats.map(t => t.type).join(', ')}
            </Alert>
          </Box>
        )}
      </FormControl>
    )
  }
)

SecureTextArea.displayName = 'SecureTextArea'
