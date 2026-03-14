const {Router} = require('express')
const authRouter = Router()
const { loginUserController, registerUserController, logOutUserController, getMeController } = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth.middleware')



/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */

authRouter.post('/register',registerUserController)


/**
 * @route POST /api/auth/login
 * @description Login an existing user
 * @access Public
 */
authRouter.post('/login',loginUserController)


/**
 * @route GET /api/auth/logout
 * @description Logout an existing user and Blacklist the token
 * @access Public
 */
authRouter.get('/logout',logOutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get the current logged-in user's information
 * @access Public
 */
authRouter.get('/get-me',authMiddleware.authUser, getMeController)


module.exports = authRouter;

