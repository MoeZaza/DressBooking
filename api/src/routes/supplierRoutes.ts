import express from 'express'
import multer from 'multer'
import routeNames from '../config/supplierRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as supplierController from '../controllers/supplierController'

const routes = express.Router()

/**
 * @swagger
 * /api/validate-supplier:
 *   post:
 *     tags: [Suppliers]
 *     summary: Validate supplier
 *     description: Validate supplier credentials and permissions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *             properties:
 *               supplierId:
 *                 type: string
 *                 format: objectId
 *                 description: Supplier ID to validate
 *           example:
 *             supplierId: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Supplier validation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 supplier:
 *                   $ref: '#/components/schemas/User'
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["manage_dresses", "view_bookings", "manage_appointments"]
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.validate).post(authJwt.verifyToken, supplierController.validate)
routes.route(routeNames.update).put(authJwt.verifyToken, supplierController.update)
routes.route(routeNames.delete).delete(authJwt.verifyToken, supplierController.deleteSupplier)
routes.route(routeNames.getSupplier).get(authJwt.verifyToken, supplierController.getSupplier)
routes.route(routeNames.getSuppliers).get(authJwt.verifyToken, supplierController.getSuppliers)
/**
 * @swagger
 * /api/all-suppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get all suppliers
 *     description: Retrieve list of all suppliers (public endpoint)
 *     security: []
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: objectId
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   avatar:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   location:
 *                     type: string
 *                   active:
 *                     type: boolean
 *             example:
 *               - _id: "507f1f77bcf86cd799439011"
 *                 fullName: "Sofia Boutique"
 *                 email: "sofia@boutique.com"
 *                 location: "Jenin, Palestine"
 *                 active: true
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.getAllSuppliers).get(supplierController.getAllSuppliers)

/**
 * @swagger
 * /api/frontend-suppliers:
 *   post:
 *     tags: [Suppliers]
 *     summary: Get suppliers for frontend
 *     description: Retrieve paginated list of suppliers with filtering for frontend display
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *               size:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *               location:
 *                 type: string
 *                 format: objectId
 *                 description: Filter by location
 *               keyword:
 *                 type: string
 *                 description: Search keyword
 *           example:
 *             page: 1
 *             size: 10
 *             location: "507f1f77bcf86cd799439014"
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
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
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.getFrontendSuppliers).post(supplierController.getFrontendSuppliers)
routes.route(routeNames.getBackendSuppliers).post(authJwt.verifyToken, supplierController.getBackendSuppliers)
routes.route(routeNames.createContract).post([authJwt.verifyToken, multer({ storage: multer.memoryStorage() }).single('file')], supplierController.createContract)
routes.route(routeNames.updateContract).post([authJwt.verifyToken, multer({ storage: multer.memoryStorage() }).single('file')], supplierController.updateContract)
routes.route(routeNames.deleteContract).post(authJwt.verifyToken, supplierController.deleteContract)
routes.route(routeNames.deleteTempContract).post(authJwt.verifyToken, supplierController.deleteTempContract)

export default routes
