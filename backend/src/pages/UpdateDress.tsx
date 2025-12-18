import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Input,
  InputLabel,
  FormControl,
  Button,
  Paper,
  FormControlLabel,
  Switch,
  TextField,
  FormHelperText,
 } from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/dresses'
import { useLanguage } from '@/context/LanguageContext'
import * as DressService from '@/services/DressService'
import * as helper from '@/common/helper'
import ErrorPage from './Error'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import NoMatch from './NoMatch'
import Avatar from '@/components/Avatar'
import MultipleImageUpload from '@/components/MultipleImageUpload'
import SupplierSelectList from '@/components/SupplierSelectList'
import LocationSelectList from '@/components/LocationSelectList'
import DressTypeList from '@/components/DressTypeList'
import DressSizeList from '@/components/DressSizeList'
import DressStyleList from '@/components/DressStyleList'
import DressMaterialList from '@/components/DressMaterialList'
import { UserContextType, useUserContext } from '@/context/UserContext'

import '@/assets/css/create-dress.css'

const UpdateDress = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const { user } = useUserContext() as UserContextType
  const [loading, setLoading] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [error, setError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dress, setDress] = useState<bookcarsTypes.Dress>()
  const [images, setImages] = useState<string[]>([])
  const [imageError, setImageError] = useState(false)
  const [imageSizeError, setImageSizeError] = useState(false)
  const [name, setName] = useState('')
  const [supplier, setSupplier] = useState('')
  const [locations, setLocations] = useState<bookcarsTypes.Option[]>([])
  const [price, setPrice] = useState('')
  const [discountedPrice, setDiscountedPrice] = useState('')
  const [available, setAvailable] = useState(true)
  const [fullyBooked, setFullyBooked] = useState(false)
  const [comingSoon, setComingSoon] = useState(false)
  const [type, setType] = useState('')
  const [size, setSize] = useState('')
  const [style, setStyle] = useState('')
  const [color, setColor] = useState('')
  const [length, setLength] = useState('')
  const [material, setMaterial] = useState('')
  const [customizable, setCustomizable] = useState(false)
  const [cancellation, setCancellation] = useState('')
  const [amendments, setAmendments] = useState('')
  const [dressCode, setDressCode] = useState('')

  const [formError, setFormError] = useState(false)
  const [deposit, setDeposit] = useState('')

  const handleBeforeUpload = () => {
    setLoading(true)
  }

  const handleImageChange = (_image: string) => {
    setLoading(false)
    setImageError(false)
    setImageSizeError(false)
  }

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages)
    setImageError(false)
    setImageSizeError(false)
  }

  const handleImageValidate = (valid: boolean) => {
    if (!valid) {
      setImageSizeError(true)
    }
  }

  const handleSupplierChange = (values: bookcarsTypes.Option[]) => {
    setSupplier(values.length > 0 ? values[0]._id : '')
  }

  const handleLocationsChange = (values: bookcarsTypes.Option[]) => {
    setLocations(values)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value)
  }

  const handleDiscountedPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscountedPrice(e.target.value)
  }

  const handleAvailableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvailable(e.target.checked)
  }

  const handleFullyBookedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullyBooked(e.target.checked)
  }

  const handleComingSoonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComingSoon(e.target.checked)
  }

  const handleTypeChange = (value: string) => {
    setType(value)
  }

  const handleSizeChange = (value: string) => {
    setSize(value)
  }

  const handleStyleChange = (value: string) => {
    setStyle(value)
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value)
  }

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLength(e.target.value)
  }

  const handleMaterialChange = (value: string) => {
    setMaterial(value)
  }

  const handleCustomizableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomizable(e.target.checked)
  }

  const handleCancellationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCancellation(e.target.value)
  }

  const handleAmendmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmendments(e.target.value)
  }

  const handleDressCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDressCode(e.target.value)
  }

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeposit(e.target.value)
  }

  const extraToNumber = (extra: string) => (extra === '' ? -1 : Number(extra))

  const getPrice = (price: string) => (price && Number(price)) || null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      setLoading(true)

      if (!images || images.length === 0) {
        setImageError(true)
        setImageSizeError(false)
        return
      }

      const data: bookcarsTypes.UpdateDressPayload = {
        _id: dress?._id as string,
        loggedUser: user?._id as string,
        name,
        supplier,

        locations: locations.map((l) => l._id),
        price: Number(price),
        discountedPrice: getPrice(discountedPrice) || undefined,

        deposit: Number(deposit),
        available,
        fullyBooked,
        comingSoon,
        type: type as bookcarsTypes.DressType,
        size: size as bookcarsTypes.DressSize,
        style: style as bookcarsTypes.DressStyle,
        color,
        length: Number(length),
        material: material as bookcarsTypes.DressMaterial,
        customizable,
        cancellation: extraToNumber(cancellation),
        amendments: extraToNumber(amendments),
        dressCode,

        range: '',
        accessories: [],
      }

      const status = await DressService.update(data)

      if (status === 200) {
        navigate('/dresses')
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onLoad = async () => {
    setLoading(true)
    setFormError(false)
    setImageError(false)
    setImageSizeError(false)
    setNoMatch(false)
    setError(false)

    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('dr')) {
        const id = params.get('dr')
        if (id && id !== '') {
          const _dress = await DressService.getDress(id)

          if (_dress) {
            setDress(_dress)
            setName(_dress.name)
            setSupplier(_dress.supplier._id || '')
            setLocations(_dress.locations as bookcarsTypes.Option[])
            setPrice(_dress.price.toString())
            setDiscountedPrice(_dress.discountedPrice?.toString() || '')
            setAvailable(_dress.available)
            setFullyBooked(_dress.fullyBooked || false)
            setComingSoon(_dress.comingSoon || false)
            setType(_dress.type)
            setSize(_dress.size)
            setStyle(_dress.style || '')
            setColor(_dress.color)
            setLength(_dress.length.toString())
            setMaterial(_dress.material)
            setCustomizable(_dress.customizable || false)
            setCancellation(_dress.cancellation === -1 ? '' : _dress.cancellation.toString())
            setAmendments(_dress.amendments === -1 ? '' : _dress.amendments.toString())
            setDressCode(_dress.dressCode || '')
            setImages(_dress.images || [])

            setDeposit(_dress.deposit.toString())
            setVisible(true)
          } else {
            setNoMatch(true)
          }
        } else {
          setNoMatch(true)
        }
      } else {
        setNoMatch(true)
      }
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {!error && !noMatch && (
        <div className="create-dress">
          <Paper className="dress-form dress-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
            <form onSubmit={handleSubmit}>
              <MultipleImageUpload
                dressId={dress?._id}
                images={images}
                onImagesChange={handleImagesChange}
                maxImages={10}
                readonly={false}
              />

              <div className="info">
                <InfoIcon />
                <span>{strings.RECOMMENDED_IMAGE_SIZE}</span>
              </div>

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{commonStrings.NAME}</InputLabel>
                <Input
                  id="name"
                  type="text"
                  required
                  onChange={(e) => {
                    setName(e.target.value)
                  }}
                  autoComplete="off"
                  value={name}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <SupplierSelectList
                  label={commonStrings.SUPPLIER}
                  required
                  value={supplier ? { _id: supplier, name: '', image: '' } : undefined}
                  onChange={handleSupplierChange}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <LocationSelectList
                  label={strings.LOCATIONS}
                  multiple
                  required
                  value={locations}
                  onChange={handleLocationsChange}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <DressTypeList
                  label={strings.DRESS_TYPE}
                  required
                  value={type}
                  onChange={handleTypeChange}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <DressSizeList
                  label={strings.DRESS_SIZE}
                  required
                  value={size}
                  onChange={handleSizeChange}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <DressStyleList
                  label={strings.DRESS_STYLE}
                  required
                  value={style}
                  onChange={handleStyleChange}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <DressMaterialList
                  label={strings.MATERIAL}
                  required
                  value={material}
                  onChange={handleMaterialChange}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{strings.COLOR}</InputLabel>
                <Input
                  id="color"
                  type="text"
                  required
                  onChange={handleColorChange}
                  autoComplete="off"
                  value={color}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{strings.DRESS_CODE}</InputLabel>
                <Input
                  id="dressCode"
                  type="text"
                  required
                  onChange={handleDressCodeChange}
                  autoComplete="off"
                  value={dressCode}
                  placeholder="Format: DR-YYYY-NNNN (e.g., DR-2024-0001)"
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{strings.LENGTH} (cm)</InputLabel>
                <Input
                  id="length"
                  type="number"
                  required
                  onChange={handleLengthChange}
                  autoComplete="off"
                  value={length}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{`${strings.PRICE} (${commonStrings.CURRENCY})`}</InputLabel>
                <Input
                  id="price"
                  type="number"
                  required
                  onChange={handlePriceChange}
                  autoComplete="off"
                  value={price}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{`${strings.DISCOUNTED_PRICE} (${commonStrings.CURRENCY})`}</InputLabel>
                <Input
                  id="discountedPrice"
                  type="number"
                  onChange={handleDiscountedPriceChange}
                  autoComplete="off"
                  value={discountedPrice}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <InputLabel>{`${strings.DEPOSIT} (${commonStrings.CURRENCY})`}</InputLabel>
                <Input
                  id="deposit"
                  type="number"
                  onChange={handleDepositChange}
                  autoComplete="off"
                  value={deposit}
                />
              </FormControl>



              <FormControl fullWidth margin="dense">
                <TextField
                  label={`${strings.CANCELLATION} (${commonStrings.CURRENCY})`}
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(\\.\\d+)?$' } }}
                  onChange={handleCancellationChange}
                  variant="standard"
                  autoComplete="off"
                  value={cancellation}
                />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <TextField
                  label={`${strings.AMENDMENTS} (${commonStrings.CURRENCY})`}
                  slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(\\.\\d+)?$' } }}
                  onChange={handleAmendmentsChange}
                  variant="standard"
                  autoComplete="off"
                  value={amendments}
                />
              </FormControl>

              <FormControl fullWidth margin="dense" className="checkbox-fc">
                <FormControlLabel
                  control={<Switch checked={customizable} onChange={handleCustomizableChange} color="primary" />}
                  label={strings.CUSTOMIZABLE}
                  className="checkbox-fcl"
                />
              </FormControl>

              <FormControl fullWidth margin="dense" className="checkbox-fc">
                <FormControlLabel
                  control={<Switch checked={available} onChange={handleAvailableChange} color="primary" />}
                  label={strings.AVAILABLE}
                  className="checkbox-fcl"
                />
              </FormControl>

              <FormControl fullWidth margin="dense" className="checkbox-fc">
                <FormControlLabel
                  control={<Switch checked={fullyBooked} onChange={handleFullyBookedChange} color="primary" />}
                  label={strings.FULLY_BOOKED}
                  className="checkbox-fcl"
                />
              </FormControl>

              <FormControl fullWidth margin="dense" className="checkbox-fc">
                <FormControlLabel
                  control={<Switch checked={comingSoon} onChange={handleComingSoonChange} color="primary" />}
                  label={strings.COMING_SOON}
                  className="checkbox-fcl"
                />
              </FormControl>

              <div className="buttons">
                <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={loading}>
                  {commonStrings.UPDATE}
                </Button>
                <Button
                  variant="contained"
                  className="btn-secondary btn-margin-bottom"
                  size="small"
                  onClick={() => {
                    navigate('/dresses')
                  }}
                >
                  {commonStrings.CANCEL}
                </Button>
              </div>

              <div className="form-error">
                {imageError && <Error message="At least one image is required" />}
                {imageSizeError && <Error message={strings.IMAGE_SIZE_ERROR} />}
                {formError && <Error message={commonStrings.FORM_ERROR} />}
              </div>
            </form>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.LOADING} />}
      {error && <ErrorPage />}
      {noMatch && <NoMatch />}
    </Layout>
  )
}

export default UpdateDress
