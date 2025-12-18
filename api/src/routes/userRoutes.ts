import express from 'express'
import multer from 'multer'
import routeNames from '../config/userRoutes.config'
import authJwt from '../middlewares/authJwt'
import roleAuth from '../middlewares/roleAuth'
import * as userController from '../controllers/userController'
import { enhancedDatabaseSecurityStack, databaseSecurityStack } from '../middlewares/databaseSecurity'

const routes = express.Router()

/**
 * @swagger
 * /api/sign-up:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateRequest'
 *           example:
 *             email: "user@example.com"
 *             fullName: "Sarah Ahmed"
 *             password: "securePassword123"
 *             phone: "+972501234567"
 *             language: "ar"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 userId:
 *                   type: string
 *                   format: objectId
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Conflict"
 *               message: "User already exists"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

routes.route(routeNames.signup).post(...enhancedDatabaseSecurityStack, userController.signup)

/**
 * @swagger
 * /api/sign-in/{type}:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and return access token
 *     security: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, supplier, user]
 *         description: User type for login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "securePassword123"
 *             stayConnected: false
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               user:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 email: "user@example.com"
 *                 fullName: "Sarah Ahmed"
 *                 type: "user"
 *                 verified: true
 *                 active: true
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               blacklisted: false
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *               message: "Invalid email or password"
 *       403:
 *         description: Account not verified or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden"
 *               message: "Account not verified"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.adminSignup).post(userController.adminSignup)
routes.route(routeNames.create).post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdmin,
  userController.create
)
routes.route(routeNames.checkToken).get(userController.checkToken)
routes.route(routeNames.deleteTokens).delete(userController.deleteTokens)
routes.route(routeNames.resend).post(userController.resend)
routes.route(routeNames.activate).post(userController.activate)
routes.route(routeNames.signin).post(...enhancedDatabaseSecurityStack, userController.signin)

/**
 * @swagger
 * /api/social-sign-in:
 *   post:
 *     tags: [Authentication]
 *     summary: Social media login
 *     description: Authenticate user using social media providers (Google, etc.)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - token
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, facebook]
 *                 description: Social media provider
 *               token:
 *                 type: string
 *                 description: Social media access token
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Social login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.socialSignin).post(userController.socialSignin)

/**
 * @swagger
 * /api/sign-out:
 *   post:
 *     tags: [Authentication]
 *     summary: User logout
 *     description: Logout user and invalidate access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: objectId
 *                 description: User ID to logout
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.signout).post(userController.signout)
routes.route(routeNames.getPushToken).get(authJwt.verifyToken, userController.getPushToken)
routes.route(routeNames.createPushToken).post(authJwt.verifyToken, userController.createPushToken)
routes.route(routeNames.deletePushToken).post(authJwt.verifyToken, userController.deletePushToken)
routes.route(routeNames.validateEmail).post(userController.validateEmail)
routes.route(routeNames.validateAccessToken).post(authJwt.verifyToken, userController.validateAccessToken)
routes.route(routeNames.confirmEmail).get(userController.confirmEmail)
routes.route(routeNames.resendLink).post(authJwt.verifyToken, userController.resendLink)
routes.route(routeNames.update).post(authJwt.verifyToken, userController.update)
routes.route(routeNames.updateEmailNotifications).post(authJwt.verifyToken, userController.updateEmailNotifications)
routes.route(routeNames.updateLanguage).post(authJwt.verifyToken, userController.updateLanguage)
/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     description: Retrieve user profile information
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.getUser).get(authJwt.verifyToken, userController.getUser)

/**
 * @swagger
 * /api/update-user:
 *   post:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: Update user profile information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UserUpdateRequest'
 *               - type: object
 *                 required:
 *                   - _id
 *                 properties:
 *                   _id:
 *                     type: string
 *                     format: objectId
 *           example:
 *             _id: "507f1f77bcf86cd799439011"
 *             fullName: "Sarah Ahmed Updated"
 *             phone: "+972501234567"
 *             language: "en"
 *             bio: "Updated bio"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
/**
 * @swagger
 * /api/create-avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload user avatar
 *     description: Upload a new avatar image for the user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - userId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *               userId:
 *                 type: string
 *                 format: objectId
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avatar uploaded successfully"
 *                 avatar:
 *                   type: string
 *                   description: Avatar file path
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.createAvatar).post([authJwt.verifyToken, multer({ storage: multer.memoryStorage() }).single('image')], userController.createAvatar)

/**
 * @swagger
 * /api/update-avatar/{userId}:
 *   post:
 *     tags: [Users]
 *     summary: Update user avatar
 *     description: Update existing avatar image for the user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New avatar image file
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Avatar updated successfully"
 *                 avatar:
 *                   type: string
 *                   description: Updated avatar file path
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
routes.route(routeNames.updateAvatar).post([authJwt.verifyToken, multer({ storage: multer.memoryStorage() }).single('image')], userController.updateAvatar)
routes.route(routeNames.deleteAvatar).post(authJwt.verifyToken, userController.deleteAvatar)
routes.route(routeNames.deleteTempAvatar).post(authJwt.verifyToken, userController.deleteTempAvatar)
routes.route(routeNames.changePassword).post(authJwt.verifyToken, userController.changePassword)
routes.route(routeNames.checkPassword).get(authJwt.verifyToken, userController.checkPassword)
routes.route(routeNames.getUsers).post(
  ...databaseSecurityStack,
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdmin,
  userController.getUsers
)
routes.route(routeNames.delete).post(
  ...enhancedDatabaseSecurityStack,
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdmin,
  userController.deleteUsers
)
routes.route(routeNames.verifyRecaptcha).post(userController.verifyRecaptcha)
routes.route(routeNames.sendEmail).post(userController.sendEmail)
routes.route(routeNames.hasPassword).get(authJwt.verifyToken, userController.hasPassword)

export default routes
