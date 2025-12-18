import React, { useState } from 'react'
import {
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Checkbox,
  Link,
  Box,
  Alert
} from '@mui/material'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import * as helper from '@/common/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import { useSecurityContext } from '@/context/SecurityContext'
import { SecureTextField, SecureEmailField, SecurePhoneField, SecurePasswordField } from '@/components/SecureFormComponents'
import { useFormSecurityMonitoring } from '@/hooks/useSecurityMonitoring'
import ValidationMiddleware from '@/middleware/ValidationMiddleware'
import { SecurityValidationSchemas } from '@/schemas/SecurityValidationSchemas'
import Layout from '@/components/Layout'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import DatePicker from '@/components/DatePicker'
import SocialLogin from '@/components/SocialLogin'
import Footer from '@/components/Footer'

import '@/assets/css/signup.css'

const schema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required' }),
  email: z.string().optional().refine((value) => !value || validator.isEmail(value), { message: commonStrings.EMAIL_NOT_VALID }),
  phone: z.string().min(1, { message: 'Phone number is required' }).refine((value) => validator.isMobilePhone(value), { message: commonStrings.PHONE_NOT_VALID }),
  birthDate: z.date().optional(),
  password: z.string().min(env.PASSWORD_MIN_LENGTH, { message: commonStrings.PASSWORD_ERROR }),
  confirmPassword: z.string(),
  tos: z.boolean().refine((value) => value, { message: commonStrings.TOS_ERROR })
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: commonStrings.PASSWORDS_DONT_MATCH,
})

type FormFields = z.infer<typeof schema>

const SignUp = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType
  const { isSecure, getThreatSummary } = useSecurityContext()
  const { reportFormThreat, reportValidationFailure } = useFormSecurityMonitoring('SignUp')

  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [securityWarning, setSecurityWarning] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, clearErrors, setValue } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onSubmit'
  })

  const onSubmit = async (data: FormFields) => {
    try {
      // Basic security validation before submission (less strict for registration)
      const validationResult = await ValidationMiddleware.validateWithSchema(
        data,
        SecurityValidationSchemas.User,
        {
          sanitize: true,
          blockOnThreats: false, // Note: Don't block on threats for registration
          logThreats: true,
          strictMode: false // Note: Less strict mode for registration
        }
      )

      if (!validationResult.isValid) {
        setSecurityWarning('Please check your input and try again')
        return
      }

      // Use sanitized data
      const sanitizedData = validationResult.sanitizedData as FormFields

      // Only validate email if provided
      if (sanitizedData.email) {
        const emailStatus = await UserService.validateEmail({ email: sanitizedData.email })
        if (emailStatus !== 200) {
          setError('email', { message: commonStrings.EMAIL_ALREADY_REGISTERED })
          return
        }
      }

      let recaptchaToken = ''
      if (reCaptchaLoaded) {
        recaptchaToken = await generateReCaptchaToken()
        if (!(await helper.verifyReCaptcha(recaptchaToken))) {
          recaptchaToken = ''
        }
      }

      if (env.RECAPTCHA_ENABLED && !recaptchaToken) {
        setRecaptchaError(true)
        return
      }

      const payload: bookcarsTypes.SignUpPayload = {
        email: sanitizedData.email || '', // Provide empty string if undefined
        phone: sanitizedData.phone,
        password: sanitizedData.password,
        fullName: sanitizedData.fullName,
        birthDate: sanitizedData.birthDate,
        language: UserService.getLanguage()
      }

      const status = await UserService.signup(payload)

      if (status === 200) {
        const signInResult = await UserService.signin({
          email: sanitizedData.email,
          password: sanitizedData.password,
        })

        if (signInResult.status === 200) {
          const user = await UserService.getUser(signInResult.data._id)
          setUser(user)
          setUserLoaded(true)
          navigate(`/${window.location.search}`)
        }
      }
    } catch (err) {
      console.error(err)
      setError('root', { message: strings.SIGN_UP_ERROR })
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user) {
      navigate('/')
    } else {
      setLanguage(UserService.getLanguage())
      setVisible(true)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      <div className="signup">
        <Paper className={`signup-form ${visible ? '' : 'hidden'}`} elevation={10}>
          <h1 className="signup-form-title">{strings.SIGN_UP_HEADING}</h1>

          {/* Security Warning */}
          {securityWarning && (
            <Box mb={2}>
              <Alert severity="error" onClose={() => setSecurityWarning('')}>
                {securityWarning}
              </Alert>
            </Box>
          )}

          {/* Security Status */}
          {!isSecure() && (
            <Box mb={2}>
              <Alert severity="warning">
                Security threats detected. Please review your input.
              </Alert>
            </Box>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <SecureTextField
                label={commonStrings.FULL_NAME}
                name="fullName"
                required
                fullWidth
                margin="dense"
                autoComplete="off"
                showSecurityIndicator={true}
                secureOptions={{
                  required: true,
                  fieldName: 'fullName',
                  maxLength: 100
                }}
                onSecureChange={(_value, sanitizedValue, isValid) => {
                  setFormData(prev => ({ ...prev, fullName: sanitizedValue }))
                  setValue('fullName', sanitizedValue)
                  if (!isValid) {
                    reportValidationFailure('fullName', ['Invalid name format or security threat'])
                  }
                }}
                error={!!errors.fullName}
                helperText={errors.fullName?.message || ''}
              />
              <SecureEmailField
                label={commonStrings.EMAIL}
                name="email"
                required
                fullWidth
                margin="dense"
                autoComplete="off"
                showSecurityIndicator={true}
                secureOptions={{
                  required: true,
                  fieldName: 'email'
                }}
                onSecureChange={(_value, sanitizedValue, isValid) => {
                  setFormData(prev => ({ ...prev, email: sanitizedValue }))
                  setValue('email', sanitizedValue)
                  if (!isValid) {
                    reportValidationFailure('email', ['Invalid email format or security threat'])
                  }
                }}
                error={!!errors.email}
                helperText={errors.email?.message || ''}
              />
              <SecurePhoneField
                label={commonStrings.PHONE}
                name="phone"
                required
                fullWidth
                margin="dense"
                autoComplete="off"
                showSecurityIndicator={true}
                secureOptions={{
                  required: true,
                  fieldName: 'phone'
                }}
                onSecureChange={(_value, sanitizedValue, isValid) => {
                  setFormData(prev => ({ ...prev, phone: sanitizedValue }))
                  setValue('phone', sanitizedValue)
                  if (!isValid) {
                    reportValidationFailure('phone', ['Invalid phone format or security threat'])
                  }
                }}
                error={!!errors.phone}
                helperText={errors.phone?.message || ''}
              />
              <FormControl fullWidth margin="dense" error={!!errors.birthDate}>
                <DatePicker
                  label={commonStrings.BIRTH_DATE}
                  variant="outlined"
                  required
                  onChange={(birthDate) => {
                    if (birthDate) {
                      clearErrors('birthDate')
                      setValue('birthDate', birthDate, { shouldValidate: true })
                    }
                  }}
                  language={language}
                />

                <FormHelperText error={!!errors.birthDate}>{errors.birthDate?.message || ''}</FormHelperText>
              </FormControl>
              <SecurePasswordField
                label={commonStrings.PASSWORD}
                name="password"
                required
                fullWidth
                margin="dense"
                autoComplete="new-password"
                showSecurityIndicator={true}
                showPasswordStrength={true}
                minLength={env.PASSWORD_MIN_LENGTH}
                secureOptions={{
                  required: true,
                  fieldName: 'password'
                }}
                onSecureChange={(_value, sanitizedValue, isValid) => {
                  setFormData(prev => ({ ...prev, password: sanitizedValue }))
                  setValue('password', sanitizedValue)
                  if (!isValid) {
                    reportValidationFailure('password', ['Password does not meet security requirements'])
                  }
                }}
                error={!!errors.password}
                helperText={errors.password?.message || ''}
              />
              <SecurePasswordField
                label={commonStrings.CONFIRM_PASSWORD}
                name="confirmPassword"
                required
                fullWidth
                margin="dense"
                autoComplete="new-password"
                showSecurityIndicator={true}
                showPasswordStrength={false}
                minLength={env.PASSWORD_MIN_LENGTH}
                secureOptions={{
                  required: true,
                  fieldName: 'confirmPassword'
                }}
                onSecureChange={(_value, sanitizedValue, isValid) => {
                  setFormData(prev => ({ ...prev, confirmPassword: sanitizedValue }))
                  setValue('confirmPassword', sanitizedValue)
                  if (!isValid) {
                    reportValidationFailure('confirmPassword', ['Password confirmation does not meet security requirements'])
                  }
                }}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message || ''}
              />

              <div className="signup-tos">
                <table>
                  <tbody>
                    <tr>
                      <td aria-label="tos">
                        <Checkbox
                          {...register('tos')}
                          color="primary"
                          onChange={() => clearErrors('tos')}
                        />
                      </td>
                      <td>
                        <Link href="/tos" target="_blank" rel="noreferrer">
                          {commonStrings.TOS}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <FormHelperText error={!!errors.tos}>{errors.tos?.message || ''}</FormHelperText>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <SocialLogin facebook google redirectToHomepage />

              <div className="buttons">
                <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" disabled={isSubmitting}>
                  {strings.SIGN_UP}
                </Button>
                <Button variant="outlined" color="primary" className="btn-margin-bottom" onClick={() => navigate('/')}>
                  {commonStrings.CANCEL}
                </Button>
              </div>
            </div>
            <div className="form-error">
              {errors.root && <Error message={errors.root.message!} />}
              {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
            </div>
          </form>
        </Paper>
      </div>

      <Footer />

      {isSubmitting && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default SignUp
