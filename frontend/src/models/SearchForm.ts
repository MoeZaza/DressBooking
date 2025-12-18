import { z } from 'zod'
import env from '@/config/env.config'
import { strings } from '@/lang/search-form'

// Location types for dress rental
const locationValueSchema = z.object({
    _id: z.string(),
    language: z.string(),
    value: z.string(),
})

const countrySchema = z.object({
    _id: z.string(),
    values: z.array(locationValueSchema),
    name: z.string(),
})

const locationSchema = z.object({
    _id: z.string(),
    country: countrySchema,
    values: z.array(locationValueSchema),
    name: z.string(),
    image: z.string().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
})

// Dress search form schema - includes single location selection for dress rental
export const schema = z.object({
    keyword: z.string().optional(),
    from: z.date().nullable(),
    to: z.date().nullable(),
    location: locationSchema.nullable(),
    dressType: z.string().optional(),
    dressSize: z.string().optional(),
    dressStyle: z.string().optional(),
    priceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
    }).optional(),
}).superRefine((data, ctx) => {
    const { from, to } = data

    const minRentalStartDuration = env.MIN_RENTAL_START_HOURS * 60 * 60 * 1000
    const minRentalDuration = env.MIN_RENTAL_HOURS * 60 * 60 * 1000

    if (from) {
        const rentalStartTime = from.getTime() - Date.now()

        if (rentalStartTime < minRentalStartDuration) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['from'],
                message: strings.MIN_RENTAL_START_HOURS_ERROR,
            })
        }
    }

    if (from && to) {
        const rentalDuration = to.getTime() - from.getTime()

        if (rentalDuration < minRentalDuration) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['to'],
                message: strings.MIN_RENTAL_HOURS_ERROR,
            })
        }
    }
})

export type FormFields = z.infer<typeof schema>
export type LocationField = z.infer<typeof locationSchema>
