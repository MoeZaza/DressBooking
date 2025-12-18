import express from 'express'
import roleAuth from '../middlewares/roleAuth'
import * as accountingController from '../controllers/accountingController'

const routes = express.Router()

// Expense routes (admin/owner only)
routes.route('/create-expense').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireExpenseAccess,
  accountingController.createExpense
)
routes.route('/expenses').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireExpenseAccess,
  accountingController.getExpenses
)
routes.route('/expenses/:id').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireExpenseAccess,
  accountingController.getExpenseById
)
routes.route('/expenses/:id').put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireExpenseAccess,
  accountingController.updateExpense
)
routes.route('/expenses/:id').delete(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireExpenseAccess,
  accountingController.deleteExpense
)

// Revenue routes (admin/owner only)
routes.route('/revenues').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.getRevenues
)

// Financial reports (admin/owner only)
routes.route('/financial-summary').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.getFinancialSummary
)
routes.route('/monthly-report').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.getMonthlyReport
)

// Enhanced inventory management routes (admin/owner only)
routes.route('/inventory-analytics').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.getInventoryAnalytics
)

routes.route('/inventory/:dressId').put(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  accountingController.updateInventoryItem
)

routes.route('/inventory/:dressId/maintenance').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAdminOrSupplier,
  accountingController.addMaintenanceRecord
)

routes.route('/profit-loss').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.getProfitLossStatement
)

// Monthly analytics routes
routes.route('/monthly-analytics/:year').get(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.getMonthlyAnalytics
)

routes.route('/monthly-analytics/:year/:month/generate').post(
  roleAuth.verifyTokenAndUser,
  roleAuth.requireAccountingAccess,
  accountingController.generateMonthlyAnalytics
)

export default routes
