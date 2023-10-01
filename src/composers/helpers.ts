import dayjs from 'dayjs'
import Debug from 'debug'
import flatten from 'lodash.flatten'
import { evaluate } from 'mathjs'
import { ParseMode } from '@grammyjs/types'
import { Keyboard, InlineKeyboard } from 'grammy'

import firefly from '../lib/firefly'
import Mapper from '../lib/Mapper'
import type { MyContext } from '../types/MyContext'
import { TransactionRead } from '../lib/firefly/model/transaction-read'
import { TransactionTypeProperty } from '../lib/firefly/model/transaction-type-property'
import { TransactionSplit } from '../lib/firefly/model/transaction-split'
import { AccountTypeFilter } from '../lib/firefly/model/account-type-filter'
// import { AccountTypeEnum } from '../lib/firefly/model/account'
import { AccountRead } from '../lib/firefly/model/account-read'

const debug = Debug('bot:transactions:helpers')

export {
  createAccountsMenuKeyboard,
  listAccountsMapper,
  listTransactionsMapper,
  addTransactionsMapper,
  editTransactionsMapper,
  parseAmountInput,
  formatTransaction,
  formatTransactionUpdate,
  formatTransactionKeyboard,
  createCategoriesKeyboard,
  createAccountsKeyboard,
  createEditMenuKeyboard,
  createMainKeyboard,
  generateWelcomeMessage
}

const listAccountsMapper = {
  list: new Mapper('LIST_ACCOUNTS|TYPE=${type}'),
  close: new Mapper('LIST_ACCOUNTS|DONE'),
}

const listTransactionsMapper = {
  list: new Mapper('LIST_TRANSACTIONS|TYPE=${type}&START=${start}'),
  close: new Mapper('LIST_TRANSACTIONS|DONE'),
}

const addTransactionsMapper = {
  delete: new Mapper('DELETE|TRANSACTION_ID=${trId}'),
}

const editTransactionsMapper = {
  assignCategory: new Mapper('ASSIGN_TRANSACTION_CATEGORY_ID=${trId}'),
  editMenu: new Mapper('EDIT_TRANSACTION_ID=${trId}'),
  done: new Mapper('DONE_EDIT_TRANSACTION_ID=${trId}'),
  editDate: new Mapper('CHANGE_TRANSACTION_DATE_ID=${trId}'),
  editAmount: new Mapper('CHANGE_TRANSACTION_AMOUNT_ID=${trId}'),
  editDesc: new Mapper('CHANGE_TRANSACTION_DESCRIPTION_ID=${trId}'),
  editCategory: new Mapper('CHANGE_TRANSACTION_CATEGORY_ID=${trId}'),
  setCategory: new Mapper('SET_TRANSACTION_CATEGORY_ID=${categoryId}'),
  editSourceAccount: new Mapper('CHANGE_SOURCE_ACCOUNT_ID=${trId}'),
  setSourceAccount: new Mapper('SET_SOURCE_ACCOUNT_ID=${accountId}'),
  editDestinationAccount: new Mapper('CHANGE_DESTINATION_ACCOUNT_ID=${trId}'),
  setDestinationAccount: new Mapper('SET_DESTINATION_ACCOUNT_ID=${accountId}'),
}

function parseAmountInput(amount: string, oldAmount?: string): number | null {
  const validInput = /^[-+/*]?\d{1,}(?:[.,]\d+)?([-+/*^]\d{1,}(?:[.,]\d+)?)*$/
  if (!validInput.exec(amount)) return null

  if (oldAmount && (amount.startsWith('+') || amount.startsWith('-')
    || amount.startsWith('/') || amount.startsWith('*'))) {
      return Math.abs(evaluate(`${oldAmount}${amount}`))
    }

  return Math.abs(evaluate(amount))
}

function formatTransactionKeyboard(ctx: MyContext, tr: TransactionRead) {
  const log = debug.extend('formatTransactionKeyboard')
  const trKeyboard = new InlineKeyboard()
  // If transaction does not have a category, show button to specify one
  if (!tr.attributes.transactions[0].category_name) {
    trKeyboard
      .text(
        ctx.i18n.t('labels.CHANGE_CATEGORY'),
        editTransactionsMapper.assignCategory.template({ trId: tr.id })
      )
  }

  trKeyboard
    .text(
      ctx.i18n.t('labels.EDIT_TRANSACTION'),
      editTransactionsMapper.editMenu.template({ trId: tr.id })
    )

  log('trKeyboard: %O', trKeyboard.inline_keyboard)

  return {
    parse_mode: 'Markdown' as ParseMode,
    reply_markup: trKeyboard
  }
}

function formatTransaction(ctx: MyContext, tr: Partial<TransactionRead>){
  const trSplit = tr.attributes!.transactions[0]
  const baseProps: any = {
    amount: parseFloat(trSplit.amount),
    source: trSplit.source_name,
    destination: trSplit.destination_name,
    description: trSplit.description,
    currency: trSplit.currency_symbol,
    date: dayjs(trSplit.date).format('LLL'),
    trId: tr.id
  }

  let translationString: string
  switch (trSplit.type) {
    case TransactionTypeProperty.Withdrawal:
      translationString = 'transactions.add.withdrawalMessage'
      baseProps.category = trSplit.category_name
      break
    case TransactionTypeProperty.Deposit:
      translationString = 'transactions.add.depositMessage'
      break
    case TransactionTypeProperty.Transfer:
      translationString = 'transactions.add.transferMessage'
      break
    default:
      translationString = '👻 Unexpected transaction type'
  }
  return ctx.i18n.t(translationString, { ...baseProps })
}

async function createCategoriesKeyboard(ctx: MyContext, mapper: Mapper) {
  const log = debug.extend('createCategoriesKeyboard')
  try {
    const categories = (await firefly(ctx.session.userSettings).Categories.listCategory()).data.data
    log('categories: %O', categories)

    const keyboard = new InlineKeyboard()

    for (let i = 0; i < categories.length; i++) {
      const c = categories[i]
      const last = categories.length - 1
      const cbData = mapper.template({ categoryId: c.id })

      keyboard.text(c.attributes.name, cbData)
      // Split categories keyboard into two columns so that every odd indexed
      // category starts from new row as well as the last category in the list.
      if (i % 2 !== 0 || i === last) keyboard.row()
    }

    return keyboard
  } catch (err) {
    log('Error: %O', err)
    console.error('Error occurred creating categories keyboard: ', err)
    throw err
  }
}

async function createAccountsKeyboard(
  ctx: MyContext,
  accountType: AccountTypeFilter | AccountTypeFilter[],
  mapper: Mapper,
  opts?: { skipAccountId: string }
) {
  const log = debug.extend('createAccountKeyboard')
  try {
    let accounts: AccountRead[] = []
    const now = dayjs().format('YYYY-MM-DD')

    if (Array.isArray(accountType)) {
      const promises: any = []
      accountType.forEach(accType => promises.push(firefly(ctx.session.userSettings).Accounts.listAccount(1, now, accType)))
      const responses = await Promise.all(promises)

      log('Responses length: %s', responses.length)

      accounts = flatten(responses.map(r => {
        return r.data.data
      }))
    } else {
      accounts = (await firefly(ctx.session.userSettings).Accounts.listAccount(1, now, accountType)).data.data
    }

    log('accounts: %O', accounts)
    const keyboard = new InlineKeyboard()

    // Prevent from choosing same account when doing transfers
    if (opts) accounts = accounts.filter(acc => opts.skipAccountId !== acc.id.toString())

    accounts
      .reverse() // we want top accounts be closer to the bottom of the screen
      .forEach((acc, i) => {
        const last = accounts.length - 1
        const cbData = mapper.template({ accountId: acc.id })

        keyboard.text(acc.attributes.name, cbData)
        // Split accounts keyboard into two columns so that every odd indexed
        // account starts from new row as well as the last account in the list.
        if (i % 2 !== 0 || i === last) keyboard.row()
      })

    log('keyboard.inline_keyboard: %O', keyboard.inline_keyboard)

    return keyboard
  } catch (err) {
    log('Error: %O', err)
    console.error('Error occurred creating acounts keyboard: ', err)
    throw err
  }
}

function formatTransactionUpdate(
  ctx: MyContext,
  trRead: Partial<TransactionRead>,
  trSplit: Partial<TransactionSplit>
): string {
  const log = debug.extend('formatTransactionUpdate')
  try {
    log('trRead: %O', trRead)
    log('trSplit: %O', trSplit)
    const oldTransaction = trRead.attributes!.transactions[0]

    const oldAmount = parseFloat(oldTransaction.amount).toString()
    const newAmount = trSplit.amount!.toString()
    const oldCategory = oldTransaction.category_name
    const newCategory = trSplit.category_name
    const oldDescr = oldTransaction.description
    const newDescr = trSplit.description
    const oldDest = oldTransaction.destination_name
    const newDest = trSplit.destination_name
    const oldDate = oldTransaction.date
    const newDate = trSplit.date
    let diffPart = '<b>Ваши изменения</b>:'

    if (newCategory && newCategory !== oldCategory)
    diffPart = `<s>${oldCategory}</s> ${newCategory}`

    if (newAmount && newAmount !== oldAmount)
    diffPart = `${diffPart}\nСумма: <s>${oldAmount}</s> <b>${newAmount}</b>`

    if (newDescr && newDescr !== oldDescr)
    diffPart = `${diffPart}\n<s>${oldDescr}</s> <b>${newDescr}</b>`

    if (newDest && newDest !== oldDest)
    diffPart = `${diffPart}\n<s>${oldDest}</s> <b>${newDest}</b>`

    if (newDate && newDate !== oldDate)
    diffPart = `${diffPart}\n<s>${oldDate}</s> <b>${newDate}</b>`

    return `${formatTransaction(ctx, trRead)}\n${diffPart}`

  } catch (err: any) {
    console.error(err)
    return err.message
  }
}

function createEditMenuKeyboard(ctx: MyContext, tr: TransactionRead) {
  const keyboard = new InlineKeyboard()
  const trId = tr.id
  const { fireflyUrl } = ctx.session.userSettings

  // Only withdrawal transactions may have category assigned
  if (tr.attributes.transactions[0].type === 'withdrawal') {
    keyboard
      .text(ctx.i18n.t('labels.CHANGE_CATEGORY'), editTransactionsMapper.editCategory.template({trId})).row()
  }

  keyboard
    .text(ctx.i18n.t('labels.CHANGE_SOURCE_ACCOUNT'), editTransactionsMapper.editSourceAccount.template({trId}))
    .text(ctx.i18n.t('labels.CHANGE_DEST_ACCOUNT'), editTransactionsMapper.editDestinationAccount.template({trId})).row()
    .text(ctx.i18n.t('labels.CHANGE_DESCRIPTION'), editTransactionsMapper.editDesc.template({trId}))
    // TODO Add functionality to change the date of a transaction
    // .text(ctx.i18n.t('labels.CHANGE_DATE'), editTransactionsMapper.editDate.template({trId}))
    .text(ctx.i18n.t('labels.CHANGE_AMOUNT'), editTransactionsMapper.editAmount.template({trId})).row()
    .url(ctx.i18n.t('labels.OPEN_IN_BROWSER'), `${fireflyUrl}/transactions/show/${trId}`).row()
    .text(ctx.i18n.t('labels.DELETE'), addTransactionsMapper.delete.template({ trId: tr.id }))
    .text('🔙', editTransactionsMapper.done.template({trId})).row()

  return keyboard
}

function createAccountsMenuKeyboard( ctx: MyContext, accType: AccountTypeFilter) {
  const mapper = listAccountsMapper
  const keyboard = new InlineKeyboard()

  // Dynamically add only relevant transactin type buttons
  switch (accType) {
    case AccountTypeFilter.Asset:
      keyboard
        .text(ctx.i18n.t('accounts.labels.expense'),
          listAccountsMapper.list.template({ type: AccountTypeFilter.Expense })).row()
        .text(ctx.i18n.t('accounts.labels.revenue'),
          mapper.list.template({ type: AccountTypeFilter.Revenue })).row()
        .text(ctx.i18n.t('accounts.labels.liability'),
          mapper.list.template({ type: AccountTypeFilter.Liability })).row()
      break
    case AccountTypeFilter.Expense:
      keyboard
        .text(ctx.i18n.t('accounts.labels.asset'),
          listAccountsMapper.list.template({ type: AccountTypeFilter.Asset })).row()
        .text(ctx.i18n.t('accounts.labels.revenue'),
          mapper.list.template({ type: AccountTypeFilter.Revenue })).row()
        .text(ctx.i18n.t('accounts.labels.liability'),
          mapper.list.template({ type: AccountTypeFilter.Liability })).row()
      break
    case AccountTypeFilter.Revenue:
      keyboard
        .text(ctx.i18n.t('accounts.labels.asset'),
          listAccountsMapper.list.template({ type: AccountTypeFilter.Asset })).row()
        .text(ctx.i18n.t('accounts.labels.expense'),
          mapper.list.template({ type: AccountTypeFilter.Expense })).row()
        .text(ctx.i18n.t('accounts.labels.liability'),
          mapper.list.template({ type: AccountTypeFilter.Liability })).row()
      break
    case AccountTypeFilter.Liability:
      keyboard
        .text(ctx.i18n.t('accounts.labels.asset'),
          listAccountsMapper.list.template({ type: AccountTypeFilter.Asset })).row()
        .text(ctx.i18n.t('accounts.labels.expense'),
          mapper.list.template({ type: AccountTypeFilter.Expense })).row()
        .text(ctx.i18n.t('accounts.labels.revenue'),
          mapper.list.template({ type: AccountTypeFilter.Revenue })).row()
      break
    default:
      keyboard
        .text(ctx.i18n.t('accounts.labels.asset'),
          listAccountsMapper.list.template({ type: AccountTypeFilter.Asset })).row()
        .text(ctx.i18n.t('accounts.labels.expense'),
          mapper.list.template({ type: AccountTypeFilter.Expense })).row()
        .text(ctx.i18n.t('accounts.labels.revenue'),
          mapper.list.template({ type: AccountTypeFilter.Revenue })).row()
        .text(ctx.i18n.t('accounts.labels.liability'),
          mapper.list.template({ type: AccountTypeFilter.Liability })).row()
  }
  keyboard.text(ctx.i18n.t('labels.DONE'), listAccountsMapper.close.template())
  return keyboard
}

function generateWelcomeMessage(ctx: MyContext) {
  const log = debug.extend('generateWelcomeMessage')

  log('start: %O', ctx.message)
  const { fireflyUrl, fireflyAccessToken } = ctx.session.userSettings

  let welcomeMessage: string = ctx.i18n.t('welcome')
  const isConfigured = !!(fireflyUrl && fireflyAccessToken)
  log('isConfigured: %O', isConfigured)

  if (!isConfigured) {
    welcomeMessage = welcomeMessage.concat('\n', ctx.i18n.t('needToSet'))
  }
  if (!fireflyUrl) {
    welcomeMessage = welcomeMessage.concat('\n', ctx.i18n.t('setFireflyUrl'))
  }
  if (!fireflyAccessToken) {
    welcomeMessage = welcomeMessage.concat('\n', ctx.i18n.t('setFireflyAccessToken'))
  }
  if (!isConfigured) {
    welcomeMessage = welcomeMessage.concat('\n\n', ctx.i18n.t('navigateToSettings'))
  }

  return welcomeMessage
}

function createMainKeyboard(ctx: MyContext) {
  return new Keyboard()
    .text(ctx.i18n.t('labels.ACCOUNTS'))
    .text(ctx.i18n.t('labels.TRANSACTIONS')).row()
    .text(ctx.i18n.t('labels.REPORTS'))
    .text(ctx.i18n.t('labels.CATEGORIES')).row()
    .text(ctx.i18n.t('labels.SETTINGS'))
}
