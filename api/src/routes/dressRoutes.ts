import express from 'express'
import multer from 'multer'
import routeNames from '../config/dressRoutes.config'
import roleAuth from '../middlewares/roleAuth'
import * as dressController from '../controllers/dressController'

const routes = express.Router()

// Admin/Supplier only routes with data isolation

/**
 * @swagger
 * /api/create-dress:
 *   post:
 *     tags: [Dresses]
 *     summary: Create a new dress
 *     description: Create a new dress in the catalog (Admin/Supplier only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DressCreateRequest'
 *           example:
 *             name: "Elegant Evening Dress"
 *             supplier: "507f1f77bcf86cd799439011"
 *             locations: ["507f1f77bcf86cd799439012"]
 *             price: 500
 *             deposit: 100
 *             type: "evening"
 *             size: "M"
 *             color: "Navy Blue"
 *             length: 150
 *             material: "silk"
 *             cancellation: 10
 *             amendments: 5
 *             range: "evening"
 *             designerName: "Sofia Boutique"
 *     responses:
 *       201:
 *         description: Dress created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dress'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.create).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.create
)

/**
 * @swagger
 * /api/update-dress:
 *   put:
 *     tags: [Dresses]
 *     summary: Update a dress
 *     description: Update an existing dress in the catalog (Admin/Supplier only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/DressCreateRequest'
 *               - type: object
 *                 required:
 *                   - _id
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: objectId
 *           example:
 *             _id: "507f1f77bcf86cd799439013"
 *             name: "Updated Evening Dress"
 *             price: 550
 *             available: true
 *     responses:
 *       200:
 *         description: Dress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dress'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.update).put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.update
)
routes.route(routeNames.checkDress).get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.checkDress
)
routes.route(routeNames.delete).delete(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.deleteDress
)
routes.route(routeNames.createImage).post([
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  multer({ storage: multer.memoryStorage() }).single('image')
], dressController.createImage)
routes.route(routeNames.updateImage).post([
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  multer({ storage: multer.memoryStorage() }).single('image')
], dressController.updateImage)
routes.route(routeNames.deleteImage).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.deleteImage
)
routes.route(routeNames.deleteTempImage).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.deleteTempImage
)
routes.route(routeNames.addImages).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.addImages
)
routes.route(routeNames.reorderImages).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.reorderImages
)
routes.route(routeNames.uploadMultipleImages).post([
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  multer({ storage: multer.memoryStorage() }).array('images', 10) // Allow up to 10 images
], dressController.uploadMultipleImages)

// Public routes

/**
 * @swagger
 * /api/dress/{id}/{language}:
 *   get:
 *     tags: [Dresses]
 *     summary: Get dress details
 *     description: Retrieve detailed information about a specific dress
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/languageParam'
 *     responses:
 *       200:
 *         description: Dress details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dress'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.getDress).get(dressController.getDress)

/**
 * @swagger
 * /api/frontend-dresses/{page}/{size}:
 *   post:
 *     tags: [Dresses]
 *     summary: Search and filter dresses
 *     description: Get paginated list of dresses with filtering options for frontend
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplier:
 *                 type: string
 *                 format: objectId
 *                 description: Filter by supplier
 *               location:
 *                 type: string
 *                 format: objectId
 *                 description: Filter by location
 *               from:
 *                 type: string
 *                 format: date-time
 *                 description: Availability from date
 *               to:
 *                 type: string
 *                 format: date-time
 *                 description: Availability to date
 *               type:
 *                 type: string
 *                 enum: [wedding, evening, cocktail, casual, formal]
 *                 description: Filter by dress type
 *               size:
 *                 type: string
 *                 enum: [XS, S, M, L, XL, XXL]
 *                 description: Filter by size
 *               material:
 *                 type: string
 *                 enum: [silk, cotton, lace, satin, chiffon]
 *                 description: Filter by material
 *               range:
 *                 type: string
 *                 enum: [mini, midi, maxi, bridal, evening, cocktail, casual]
 *                 description: Filter by range
 *               minPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum price filter
 *               maxPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Maximum price filter
 *               keyword:
 *                 type: string
 *                 description: Search keyword
 *           example:
 *             location: "507f1f77bcf86cd799439012"
 *             type: "evening"
 *             size: "M"
 *             minPrice: 200
 *             maxPrice: 800
 *     responses:
 *       200:
 *         description: Dresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Dress'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.getFrontendDresses).post(dressController.getFrontendDresses)

// Admin/Supplier only routes with supplier data isolation
routes.route(routeNames.getDresses).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  dressController.getDresses
)
routes.route(routeNames.getBookingDresses).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  dressController.getBookingDresses
)
routes.route(routeNames.getDressAnalytics).get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  dressController.getDressAnalytics
)
routes.route(routeNames.getDressBookingHistory).get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  dressController.getDressBookingHistory
)
routes.route(routeNames.getSupplierAnalytics).get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  dressController.getSupplierAnalytics
)
routes.route('/api/inventory-stats').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireSupplierAccess,
  dressController.getInventoryStats
)
routes.route('/api/bulk-update-dresses').put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  dressController.bulkUpdateDresses
)

// Dress code management (owner-only)
routes.route('/api/dress-codes/:id').put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireDressCodeAccess,
  dressController.updateDressCode
)
routes.route('/api/dress-codes/:id').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireDressCodeAccess,
  dressController.getDressCode
)
routes.route('/api/dress-codes/:id/generate').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireDressCodeAccess,
  dressController.generateNewDressCode
)
routes.route('/api/validate-dress-code/:dressCode').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireDressCodeAccess,
  dressController.validateDressCode
)
routes.route('/api/supplier-dress-codes/:supplierId').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireDressCodeAccess,
  dressController.getSupplierDressCodes
)

export default routes
