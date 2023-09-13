import dayjs from 'dayjs'
import debug from 'debug'
import { Composer, InlineKeyboard } from 'grammy'
import { Router } from "@grammyjs/router"
import { ParseMode } from '@grammyjs/types'
import { Menu } from '@grammyjs/menu'

import type { MyContext } from '../types/MyContext'
import i18n, { getLanguageIcon } from '../lib/i18n';
import { command } from '../lib/constants'
import { createMainKeyboard, generateWelcomeMessage } from './helpers'
import firefly from '../lib/firefly'
import { AccountTypeFilter } from '../lib/firefly/model/account-type-filter'
import { AccountRead } from '../lib/firefly/model/account-read'
import { handleCallbackQueryError } from '../lib/errorHandler'

export enum Route {
  FIREFLY_URL          = 'SETTINGS|FIREFLY_URL',
  FIREFLY_ACCESS_TOKEN = 'SETTINGS|FIREFLY_ACCESS_TOKEN'
}

const rootLog = debug(`bot:settings`)

const CANCEL                       = 'CANCEL_SETTINGS'
const DONE                         = 'DONE_SETTINGS'
const INPUT_FIREFLY_URL            = 'INPUT_FIREFLY_URL'
const INPUT_FIREFLY_ACCESS_TOKEN   = 'INPUT_FIREFLY_ACCESS_TOKEN'
const SELECT_DEFAULT_ASSET_ACCOUNT = 'SELECT_DEFAULT_ASSET_ACCOUNT'
const SWITCH_LANGUAGE              = /^SWITCH_LANGUAGE=(.+)$/
const TEST_CONNECTION              = 'TEST_CONNECTION'

const bot = new Composer<MyContext>()
const router = new Router<MyContext>((ctx) => ctx.session.step)

const settingsMenu = new Menu<MyContext>('settings')
  // .text(ctx => ctx.i18n.t('labels.FIREFLY_URL_BUTTON'), inputFireflyUrlCbQH).row()
  // .text(ctx => ctx.i18n.t('labels.FIREFLY_ACCESS_TOKEN_BUTTON'), inputFireflyAccessTokenCbQH).row()
  // .text(ctx => ctx.i18n.t('labels.TEST_CONNECTION'), testConnectionCbQH).row()
  // .text(ctx => ctx.i18n.t('labels.DEFAULT_ASSET_ACCOUNT_BUTTON'), selectDefaultAssetAccountCbQH).row()
  .submenu(
      ctx => ctx.i18n.t('labels.SWITCH_LANG'),
      'switch-lang', // navigation target menu
      ctx => ctx.editMessageText(ctx.i18n.t('settings.selectBotLang'), { parse_mode: 'HTML', })
  ).row()
  .text(ctx => ctx.i18n.t('labels.DONE'), doneCbQH)

const langMenu = new Menu<MyContext>('switch-lang')
  .text(ctx => `${ctx.i18n.t('labels.SWITCH_TO_RUSSIAN')}${ctx.i18n.languageCode === 'ru' ? ' ✅' : ''}`, switchLanguageToRu).row()
  .text(ctx => `${ctx.i18n.t('labels.SWITCH_TO_ENGLISH')}${ctx.i18n.languageCode === 'en' ? ' ✅' : ''}`, switchLanguageToEn).row()
  .text(ctx => `${ctx.i18n.t('labels.SWITCH_TO_ITALIAN')}${ctx.i18n.languageCode === 'it' ? ' ✅' : ''}`, switchLanguageToIt).row()
  // .back('🔙');
  // .back('⬅️');
  .back('←', ctx => ctx.editMessageText(settingsText(ctx)));
  // .back('↩');
  // .back('◄');

settingsMenu.register(langMenu)
bot.use(settingsMenu)


bot.command(command.SETTINGS, settingsCommandHandler)
bot.hears(i18n.t('en', 'labels.SETTINGS'), settingsCommandHandler)
bot.hears(i18n.t('ru', 'labels.SETTINGS'), settingsCommandHandler)
bot.hears(i18n.t('it', 'labels.SETTINGS'), settingsCommandHandler)
// bot.callbackQuery(INPUT_FIREFLY_URL, inputFireflyUrlCbQH)
// bot.callbackQuery(INPUT_FIREFLY_ACCESS_TOKEN, inputFireflyAccessTokenCbQH)
// bot.callbackQuery(TEST_CONNECTION, testConnectionCbQH)
// bot.callbackQuery(SELECT_DEFAULT_ASSET_ACCOUNT, selectDefaultAssetAccountCbQH)
// bot.callbackQuery(SWITCH_LANGUAGE, switchLanguageCbQH)
// // TODO Pass account id rather than account name in callback query
// bot.callbackQuery(/^!defaultAccount=(.+)$/, defaultAccountCbQH)
// bot.callbackQuery(DONE, doneCbQH)
// bot.callbackQuery(CANCEL, cancelCbQH)


// Local routes and handlers
// router.route('IDLE', ( _, next ) => next())
// router.route(Route.FIREFLY_URL, fireflyUrlRouteHandler)
// router.route(Route.FIREFLY_ACCESS_TOKEN, fireflyAccessTokenRouteHandler)
// router.otherwise(ctx => ctx.reply('otherwise'))
// bot.use(router)

export default bot

function settingsText(ctx: MyContext) {
  const {
    fireflyUrl,
    fireflyAccessToken,
    defaultSourceAccount,
    language
  } = ctx.session.userSettings

  // Grab only first 4 and last 4 chars of the token
  const accessToken = fireflyAccessToken?.replace(/(.{4})(.*?)(.{4})$/, '$1...$3')

  return ctx.i18n.t('settings.whatDoYouWantToChange', {
    fireflyUrl,
    accessToken,
    defaultSourceAccount,
    language: getLanguageIcon(language)
  })
}

function settingsInlineKeyboard(ctx: MyContext) {
  const inlineKeyboard = new InlineKeyboard()
    .text(ctx.i18n.t('labels.FIREFLY_URL_BUTTON'), INPUT_FIREFLY_URL).row()
    .text(ctx.i18n.t('labels.FIREFLY_ACCESS_TOKEN_BUTTON'), INPUT_FIREFLY_ACCESS_TOKEN).row()
    .text(ctx.i18n.t('labels.TEST_CONNECTION'), TEST_CONNECTION).row()
    .text(ctx.i18n.t('labels.DEFAULT_ASSET_ACCOUNT_BUTTON'), SELECT_DEFAULT_ASSET_ACCOUNT).row()
    .text(ctx.i18n.t('labels.SWITCH_TO_RUSSIAN'), 'SWITCH_LANGUAGE=ru').row()
    .text(ctx.i18n.t('labels.SWITCH_TO_ENGLISH'), 'SWITCH_LANGUAGE=en').row()
    .text(ctx.i18n.t('labels.SWITCH_TO_ITALIAN'), 'SWITCH_LANGUAGE=it').row()
    .text(ctx.i18n.t('labels.DONE'), DONE)

  return {
    parse_mode: 'Markdown' as ParseMode,
    reply_markup: inlineKeyboard
  }
}

function settingsCommandHandler(ctx: MyContext) {
  const log = rootLog.extend('settingsCommandHandler')
  log('Entered the settingsCommandHandler...')
  return ctx.reply(
    settingsText(ctx),
    { reply_markup: settingsMenu }
  )
}

async function doneCbQH(ctx: MyContext) {
  ctx.session.step = 'IDLE'
  return ctx.deleteMessage()
}

async function fireflyAccessTokenRouteHandler(ctx: MyContext) {
  const log = rootLog.extend('fireflyAccessTokenRouteHandler')
  log('Entered fireflyAccessTokenRouteHandler...')
  try {
    log('ctx.msg: %O', ctx.msg)
    const text = ctx.msg!.text as string
    log('User entered text: %s', text)
    log('ctx.session: %O', ctx.session)
    log('text.length: %O', text.length)

    if (text.length < 500) {
      return ctx.reply(ctx.i18n.t('settings.badAccessToken'), {
        reply_markup: new InlineKeyboard().text(ctx.i18n.t('labels.CANCEL'), CANCEL)
      })
    }

    ctx.session.userSettings.fireflyAccessToken = text
    ctx.session.step = 'IDLE'

    return ctx.reply(
      settingsText(ctx),
      settingsInlineKeyboard(ctx)
    )
  } catch (err: any) {
    return handleCallbackQueryError(err, ctx)
  }
}
async function fireflyUrlRouteHandler(ctx: MyContext) {
  const log = rootLog.extend('fireflyUrlRouteHandler')
  log('Entered fireflyUrlRouteHandler...')
  try {
    log('ctx.msg: %O', ctx.msg)
    const text = ctx.msg!.text as string
    log('User entered text: %s', text)
    log('ctx.session: %O', ctx.session)
    const r = new RegExp(/^(http|https):\/\/[^ "]+$/i)
    const valid = r.test(text)
    log('URL is valid: %s', valid)

    if (!valid) {
      return ctx.reply(ctx.i18n.t('settings.badUrl'), {
        reply_markup: new InlineKeyboard().text(ctx.i18n.t('labels.CANCEL'), CANCEL)
      })
    }

    ctx.session.userSettings.fireflyUrl = text
    ctx.session.userSettings.fireflyApiUrl = text
    ctx.session.step = 'IDLE'

    return ctx.reply(
      settingsText(ctx),
      settingsInlineKeyboard(ctx)
    )

  } catch (err: any) {
    log('Error occurred: %O', err)
  }
}

async function inputFireflyUrlCbQH(ctx: MyContext) {
  const log = rootLog.extend('inputFireflyUrlCbQH')
  log(`Entered the ${INPUT_FIREFLY_URL} action handler`)

  try {
    ctx.session.step = Route.FIREFLY_URL

    await ctx.editMessageText(ctx.i18n.t('settings.inputFireflyUrl'), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text(ctx.i18n.t('labels.CANCEL'), CANCEL)
    })
  } catch (err: any) {
    log('Error occurred: %O', err)
  }
}

async function inputFireflyAccessTokenCbQH(ctx: MyContext) {
  const log = rootLog.extend('inputFireflyAccessTokenCbQH')
  log(`Entered the ${INPUT_FIREFLY_ACCESS_TOKEN} action handler`)
  try {
    ctx.session.step = Route.FIREFLY_ACCESS_TOKEN
    return ctx.editMessageText(ctx.i18n.t('settings.inputFireflyAccessToken'), {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text(ctx.i18n.t('labels.CANCEL'), CANCEL)
    })
  } catch (err: any) {
    log('Error occurred: %O', err)
  }
}

async function selectDefaultAssetAccountCbQH(ctx: MyContext) {
  const log = rootLog.extend('selectDefaultAssetAccountCbQH')
  log(`Entered the ${SELECT_DEFAULT_ASSET_ACCOUNT} callback query handler`)
  try {
    const userSettings = ctx.session.userSettings
    const { fireflyUrl, fireflyAccessToken } = userSettings

    if (!fireflyUrl) {
      return ctx.answerCallbackQuery({
        text: ctx.i18n.t('settings.specifySmthFirst', {
          smth: ctx.i18n.t('labels.FIREFLY_URL_BUTTON')
        }),
        show_alert: true
      })
    }

    if (!fireflyAccessToken) {
      return ctx.answerCallbackQuery({
        text: ctx.i18n.t('settings.specifySmthFirst', {
          smth: ctx.i18n.t('labels.FIREFLY_ACCESS_TOKEN_BUTTON')
        }),
        show_alert: true
      })
    }

    const accounts: AccountRead[] = (await firefly(userSettings).Accounts.listAccount(
        1, dayjs().format('YYYY-MM-DD'), AccountTypeFilter.Asset)).data.data
    log('accounts: %O', accounts)

    if (!accounts.length) {
      const kb = new InlineKeyboard()
        .url(ctx.i18n.t('labels.OPEN_ASSET_ACCOUNTS_IN_BROWSER'), `${fireflyUrl}/accounts/asset`).row()

      return ctx.reply(ctx.i18n.t('common.noDefaultSourceAccountExist'), {
        reply_markup: kb
      })
    }

    const accKeyboard = new InlineKeyboard()
    accounts
      .reverse() // we want top accounts be closer to the bottom of the screen
      .forEach((acc: AccountRead) => {
        return accKeyboard.text(
          `${acc.attributes.name} ${acc.attributes.currency_symbol}${acc.attributes.current_balance}`,
          `!defaultAccount=${acc.id}`
        ).row()
      })
    accKeyboard.text(ctx.i18n.t('labels.CANCEL'), CANCEL)
    log('accKeyboard: %O', accKeyboard)

    return ctx.editMessageText(ctx.i18n.t('settings.selectDefaultAssetAccount'), {
      reply_markup: accKeyboard
    })
  } catch (err: any) {
    return handleCallbackQueryError(err, ctx)
  }
}

async function defaultAccountCbQH(ctx: MyContext) {
  const log = rootLog.extend('defaultAccountCbQH')
  log(`Entered the ${SELECT_DEFAULT_ASSET_ACCOUNT} query handler`)
  try {
    log('ctx: %O', ctx)
    const accountId = ctx.match![1]
    log('accountId: %s', accountId)

    const userSettings = ctx.session.userSettings

    const account = (await firefly(userSettings).Accounts.getAccount(accountId)).data.data
    log('account: %O', account)

    userSettings.defaultSourceAccount = {
      id: accountId.toString(),
      name: account.attributes.name,
      type: account.attributes.type
    }

    await ctx.answerCallbackQuery({ text: ctx.i18n.t('settings.defaultAssetAccountSet') })

    return ctx.editMessageText(
      settingsText(ctx),
      settingsInlineKeyboard(ctx)
    )
  } catch (err: any) {
    log('Error occurred: %O', err)
  }
}

async function cancelCbQH(ctx: MyContext) {
  const log = rootLog.extend('cancelCbQH')
  try {
    log('Cancelling...: ')

    ctx.session.step = 'IDLE'

    await ctx.deleteMessage()
    return ctx.reply(
      settingsText(ctx),
      settingsInlineKeyboard(ctx)
    )
  } catch (err: any) {
    return handleCallbackQueryError(err, ctx)
  }
}

async function testConnectionCbQH(ctx: MyContext) {
  const log = rootLog.extend('testConnectionCbQH')
  log('Entered testConnectionCbQH action handler')
  log('ctx: %O', ctx)
  try {
    const userSettings = ctx.session.userSettings
    const { fireflyUrl, fireflyAccessToken } = userSettings

    if (!fireflyUrl) {
      return ctx.answerCallbackQuery({
        text: ctx.i18n.t('settings.specifySmthFirst', {
          smth: ctx.i18n.t('labels.FIREFLY_URL_BUTTON')
        }),
        show_alert: true
      })
    }

    if (!fireflyAccessToken) {
      return ctx.answerCallbackQuery({
        text: ctx.i18n.t('settings.specifySmthFirst', {
          smth: ctx.i18n.t('labels.FIREFLY_ACCESS_TOKEN_BUTTON')
        }),
        show_alert: true
      })
    }

    const userInfo = (await firefly(userSettings).About.getCurrentUser()).data.data
    log('Firefly user info: %O', userInfo)

    if (!userInfo) return ctx.answerCallbackQuery({
      text: ctx.i18n.t('settings.connectionFailed'),
      show_alert: true
    })

    return ctx.answerCallbackQuery({
      text: ctx.i18n.t('settings.connectionSuccess', { email: userInfo.attributes.email }),
      show_alert: true
    })

  } catch (err: any) {
    return handleCallbackQueryError(err, ctx)
  }
}

async function switchLanguageToEn(ctx: MyContext) {
  ctx.i18n.locale('en')
  dayjs.locale('en')
  ctx.session.userSettings.language = 'en'
  ctx.menu.update();
  ctx.editMessageText(ctx.i18n.t('settings.selectBotLang'))
}
async function switchLanguageToIt(ctx: MyContext) {
  ctx.i18n.locale('it')
  dayjs.locale('it')
  ctx.session.userSettings.language = 'it'
  ctx.menu.update();
  ctx.editMessageText(ctx.i18n.t('settings.selectBotLang'))
}
async function switchLanguageToRu(ctx: MyContext) {
  ctx.i18n.locale('ru')
  dayjs.locale('ru')
  ctx.session.userSettings.language = 'ru'
  ctx.menu.update();
  ctx.editMessageText(ctx.i18n.t('settings.selectBotLang'))
}

async function switchLanguageCbQH(ctx: MyContext) {
  const log = rootLog.extend('switchLanguageCbQH')
  log(`Entered the switch language query handler`)
  try {
    log('ctx: %O', ctx)
    const language = ctx.match![1]
    log('language: %O', language)

    ctx.i18n.locale(language)
    dayjs.locale(language)
    ctx.session.userSettings.language = language

    // const welcomeMessage = generateWelcomeMessage(ctx)

    // ctx.reply(welcomeMessage, {
    //   parse_mode: 'Markdown',
    //   reply_markup: {
    //     keyboard: createMainKeyboard(ctx).build(),
    //     resize_keyboard: true
    //   }
    // })

    // return ctx.editMessageText(
    //   settingsText(ctx),
    //   settingsInlineKeyboard(ctx)
    // )
  } catch (err: any) {
    log('Error occurred: %O', err)
  }
}
