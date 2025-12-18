import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  FormControlLabel,
  Switch
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { schema, FormFields } from '@/models/SupplierForm'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import LocationSelectList from '@/components/LocationSelectList'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/create-supplier'
import { useLanguage } from '@/context/LanguageContext'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import Avatar from '@/components/Avatar'
import * as helper from '@/common/helper'
import ContractList from '@/components/ContractList'
import { UserContextType, useUserContext } from '@/context/UserContext'

import '@/assets/css/create-supplier.css'

const CreateSupplier = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const { user } = useUserContext() as UserContextType

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const [contracts, setContracts] = useState<bookcarsTypes.Contract[]>([])
  const [selectedLocation, setSelectedLocation] = useState<bookcarsTypes.Location | null>(null)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      bio: '',
      payLater: false,
      priceChangeRate: '',
      supplierDressLimit: '',
      notifyAdminOnNewDress: false
    },
  })

  const {
    payLater,
    notifyAdminOnNewDress,
  } = useWatch({ control })

  const onBeforeUpload = () => {
    setLoading(true)
  }

  const onAvatarChange = (_avatar: string) => {
    setLoading(false)
    setAvatar(_avatar)

    if (_avatar !== null) {
      setAvatarError(false)
    }
  }

  const handleLocationChange = (locations: bookcarsTypes.Option[]) => {
    const location = locations.length > 0 ? locations[0] as bookcarsTypes.Location : null
    setSelectedLocation(location)
    setValue('location', location?._id || '')
    clearErrors('location')
  }

  const handleCancel = async () => {
    try {
      if (avatar) {
        await UserService.deleteTempAvatar(avatar)
      }

      for (const contract of contracts) {
        if (contract.file) {
          await SupplierService.deleteTempContract(contract.file)
        }
      }

      navigate('/suppliers')
    } catch {
      navigate('/suppliers')
    }
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
      setVisible(true)
    }
  }

  const onSubmit = async (data: FormFields) => {
    try {
      let status = await SupplierService.validate({ fullName: data.fullName })

      if (status !== 200) {
        setError('fullName', { message: strings.INVALID_SUPPLIER_NAME })
        setFocus('fullName')
        return
      }

      status = await UserService.validateEmail({ email: data.email })

      if (status !== 200) {
        setError('email', { message: commonStrings.EMAIL_ALREADY_REGISTERED })
        setFocus('email')
        return
      }

      if (!avatar) {
        setAvatarError(true)
        setSubmitError(false)
        return
      }

      const payload: bookcarsTypes.CreateUserPayload = {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone!,
        location: selectedLocation?._id || data.location!,
        bio: data.bio!,
        language: UserService.getLanguage(),
        type: bookcarsTypes.RecordType.Supplier,
        avatar,
        payLater: data.payLater,

        contracts,
        priceChangeRate: data.priceChangeRate ? Number(data.priceChangeRate) : undefined,
        supplierDressLimit: data.supplierDressLimit ? Number(data.supplierDressLimit) : undefined,
        notifyAdminOnNewDress: data.notifyAdminOnNewDress,
      }

      const user = await UserService.create(payload)

      if (user && user._id) {
        navigate('/suppliers')
      } else {
        setSubmitError(true)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const onError = () => {
    const firstErrorField = Object.keys(errors)[0] as keyof FormFields
    if (firstErrorField) {
      setFocus(firstErrorField)
    }
  }

  return (
    <Layout onLoad={onLoad} strict admin>
      <div className="create-supplier">

        <Paper className="supplier-form" elevation={10} style={visible ? {} : { display: 'none' }}>
          <form onSubmit={handleSubmit(onSubmit, onError)}>
            <Avatar
              type={bookcarsTypes.RecordType.Supplier}
              mode="create"
              record={null}
              size="large"
              readonly={false}
              onBeforeUpload={onBeforeUpload}
              onChange={onAvatarChange}
              color="disabled"
              className="avatar-ctn"
            />

            <div className="info">
              <InfoIcon />
              <span>{strings.RECOMMENDED_IMAGE_SIZE}</span>
            </div>

            <FormControl fullWidth margin="dense">
              <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
              <Input
                {...register('fullName')}
                type="text"
                error={!!errors.fullName}
                required
                autoComplete="off"
              />
              <FormHelperText error={!!errors.fullName}>
                {errors.fullName?.message || ''}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
              <Input
                {...register('email')}
                type="text"
                autoComplete="off"
                required
                error={!!errors.email}
              />
              <FormHelperText error={!!errors.email}>
                {errors.email?.message || ''}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <FormControlLabel
                control={(
                  <Switch
                    {...register('payLater')}
                    checked={payLater}
                    onChange={(e) => {
                      setValue('payLater', e.target.checked)
                    }}
                    color="primary"
                  />
                )}
                label={commonStrings.PAY_LATER}
              />
            </FormControl>

            <FormControl fullWidth margin="dense">
              <FormControlLabel
                control={(
                  <Switch
                    {...register('notifyAdminOnNewDress')}
                    checked={notifyAdminOnNewDress}
                    disabled={user?.type === bookcarsTypes.UserType.Supplier}
                    onChange={(e) => {
                      setValue('notifyAdminOnNewDress', e.target.checked)
                    }}
                    color="primary"
                  />
                )}
                label={commonStrings.NOTIFY_ADMIN_ON_NEW_DRESS}
              />
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>{commonStrings.SUPPLIER_DRESS_LIMIT}</InputLabel>
              <Input
                {...register('supplierDressLimit')}
                type="text"
                autoComplete="off"
                error={!!errors.supplierDressLimit}
                onChange={() => clearErrors('supplierDressLimit')}
              />
              <FormHelperText error={!!errors.supplierDressLimit}>
                {errors.supplierDressLimit?.message || ''}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>{commonStrings.PRICE_CHANGE_RATE}</InputLabel>
              <Input
                {...register('priceChangeRate')}
                type="text"
                autoComplete="off"
                error={!!errors.priceChangeRate}
                onChange={() => clearErrors('priceChangeRate')}
              />
              <FormHelperText error={!!errors.priceChangeRate}>
                {errors.priceChangeRate?.message || ''}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>{commonStrings.PHONE}</InputLabel>
              <Input
                {...register('phone', {
                  onBlur: () => trigger('phone'),
                })}
                type="text"
                autoComplete="off"
                error={!!errors.phone}
                onChange={() => clearErrors('phone')}
              />
              <FormHelperText error={!!errors.phone}>
                {errors.phone?.message || ''}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <LocationSelectList
                label={commonStrings.LOCATION}
                variant="standard"
                value={selectedLocation || undefined}
                onChange={handleLocationChange}
                required={false}
              />
              <FormHelperText error={!!errors.location}>
                {errors.location?.message || ''}
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>{commonStrings.BIO}</InputLabel>
              <Input
                {...register('bio')}
                type="text"
                autoComplete="off" />
            </FormControl>

            <FormControl fullWidth margin="dense">
              <ContractList
                onUpload={(language, filename) => {
                  const _contracts = bookcarsHelper.cloneArray(contracts) as bookcarsTypes.Contract[]
                  const contract = _contracts.find((c) => c.language === language)
                  if (contract) {
                    contract.file = filename
                  } else {
                    _contracts.push({ language, file: filename })
                  }
                  setContracts(_contracts)
                }}
                onDelete={(language) => {
                  const _contracts = bookcarsHelper.cloneArray(contracts) as bookcarsTypes.Contract[]
                  _contracts.find((c) => c.language === language)!.file = null
                  setContracts(_contracts)
                }}
              />
            </FormControl>

            <div className="buttons">
              <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={isSubmitting}>
                {commonStrings.CREATE}
              </Button>
              <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" onClick={handleCancel}>
                {commonStrings.CANCEL}
              </Button>
            </div>

            <div className="form-error">
              {submitError && <Error message={commonStrings.GENERIC_ERROR} />}
              {avatarError && <Error message={commonStrings.IMAGE_REQUIRED} />}
            </div>
          </form>
        </Paper>
      </div>

      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateSupplier
