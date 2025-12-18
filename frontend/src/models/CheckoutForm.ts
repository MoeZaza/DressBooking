import { z } from 'zod'
import validator from 'validator'
import * as bookcarsTypes from ':bookcars-types'
import { strings as commonStrings } from '@/lang/common'

const baseSchema = z.object({
    // Customer details
    fullName: z.string().optional(),
    email: z.string().refine((value) => !value || validator.isEmail(value), {
        message: commonStrings.EMAIL_NOT_VALID,
    }).optional(),
    phone: z.string().refine((value) => !value || validator.isMobilePhone(value), {
        message: commonStrings.PHONE_NOT_VALID,
    }).optional(),
    birthDate: z.date().optional(),
    tos: z.boolean().refine((val) => val, {
        message: commonStrings.TOS_ERROR,
    }).optional(),

    // Payment options
    payLater: z.boolean().default(false).optional(),
    payDeposit: z.boolean().default(false).optional(),

    // Booking options
    cancellation: z.boolean().default(false).optional(),
    amendments: z.boolean().default(false).optional(),
    accessories: z.boolean().default(false).optional(),
})

export const createSchema = (_dress?: bookcarsTypes.Dress) => {
    return baseSchema
}

export type FormFields = z.infer<ReturnType<typeof createSchema>>
