import {createTransport} from 'nodemailer'
import handlebars from 'handlebars'
import mjml from 'mjml'
import {PRIVATE_VARS} from '@/vars.private'
import {htmlToText} from 'html-to-text'
import debug from 'debug'

const log = debug('app:email')

import mjmlLayout from '../email-templates/app-mailer.layout.mjml?raw'
import mjmlConfirmationInstructions from '../email-templates/confirmation-instructions.mjml?raw'
import mjmlEmailMagicLink from '../email-templates/email-magic-link.mjml?raw'
import mjmlNewEmailInstructions from '../email-templates/new-email-instructions.mjml?raw'
import mjmlResetPasswordInstructions from '../email-templates/reset-password-instructions.mjml?raw'
import mjmlPasswordChanged from '../email-templates/password-changed.mjml?raw'
import {STRINGS} from '@/strings'

function safeMjml2html(mjmlTemplate: string, options = {}) {
  let output: ReturnType<typeof mjml> = {
    html: '',
    json: {
      tagName: '',
      attributes: {}
    },
    errors: []
  }
  try {
    output = mjml(mjmlTemplate, {
      // eslint-disable-next-line no-undefined
      filePath: undefined,
      useMjmlConfigOptions: false, // Prevent reading default config file
      // eslint-disable-next-line no-undefined
      mjmlConfigPath: undefined, // Explicitly avoid config file lookup
      // eslint-disable-next-line no-undefined
      skeleton: undefined, // Explicitly avoid skeleton file lookup
      validationLevel: 'strict',
      ...options
    })
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as {code: unknown}).code === 'string' &&
      (err as {path?: unknown}).path &&
      typeof (err as {path?: unknown}).path === 'string' &&
      (err as {code: unknown; path: string}).path.includes('.mjmlconfig')
    ) {
      log('MJML Config file not found error silently ignored')
      // Silently ignore config file not found
      return output
    }
    throw err
  }
  return output
}

const emailTemplates = {
  'new-email-instructions': mjmlNewEmailInstructions,
  'reset-password-instructions': mjmlResetPasswordInstructions,
  'password-changed': mjmlPasswordChanged,
  'email-magic-link': mjmlEmailMagicLink,
  'confirmation-instructions': mjmlConfirmationInstructions
}

export type EmailTemplatesType = keyof typeof emailTemplates
export type EmailContextType = Record<string, string>

log(`SMTP - ${PRIVATE_VARS.SMTP_ADDRESS}:${PRIVATE_VARS.SMTP_PORT}`)
log(`SMTP Secure TLS Required - ${PRIVATE_VARS.SMTP_SECURE_TLS}`)

// Local development transporter

function compileTemplate(templateString: string, context: Record<string, string>) {
  // 1. Combine layout with content
  const template = handlebars.compile(mjmlLayout)
  const combinedMjml = template({
    ...context,
    public_brand_name: STRINGS.BRAND_NAME,
    content_for_layout: templateString
  })

  // 2. Convert MJML to HTML
  const {html, errors} = safeMjml2html(combinedMjml)

  if (errors.length > 0) {
    throw new Error(`MJML errors: ${errors.map((e) => e.formattedMessage).join('\n')}`)
  }

  // 3. Compile final HTML with Handlebars
  const htmlTemplate = handlebars.compile(html)
  return htmlTemplate({
    ...context,
    public_brand_name: STRINGS.BRAND_NAME,
    content_for_layout: templateString
  })
}

export async function sendEmail(
  to: string,
  subject: string,
  template: EmailTemplatesType,
  context: EmailContextType
) {
  const html = compileTemplate(emailTemplates[template], context)

  const text = htmlToText(html, {
    wordwrap: 130, // optional, how many chars per line
    // don't wrap links in [  ]
    selectors: [
      {
        selector: 'a',
        options: {
          linkBrackets: false,
          // If the visible link text is identical to the href,
          // don't re-append the href.
          // e.g. "http://example.com (http://example.com)" becomes just "http://example.com"
          hideLinkHrefIfSameAsText: true,
          // If your link references the same page (like an anchor #some-id),
          // you can hide or format differently
          noAnchorUrl: true
        }
      }
    ]
  })

  const transporter = createTransport({
    host: PRIVATE_VARS.SMTP_ADDRESS,
    port: PRIVATE_VARS.SMTP_PORT,
    secure: PRIVATE_VARS.SMTP_SECURE_TLS,
    requireTLS: PRIVATE_VARS.SMTP_SECURE_TLS,
    ...(PRIVATE_VARS.SMTP_SECURE_TLS
      ? {
          auth: {
            user: PRIVATE_VARS.SMTP_USERNAME,
            pass: PRIVATE_VARS.SMTP_PASSWORD
          }
        }
      : {}),
    tls: PRIVATE_VARS.SMTP_SECURE_TLS
      ? {}
      : {
          // Local development (MailDev) TLS options
          rejectUnauthorized: false
        }
  })

  log(`FROM EMAIL ESCAPE: (${PRIVATE_VARS.SMTP_FROM_EMAIL})`)

  return transporter.sendMail({
    from: PRIVATE_VARS.SMTP_FROM_EMAIL,
    replyTo: PRIVATE_VARS.SMTP_REPLY_TO_EMAIL,
    to,
    subject,
    html,
    text
  })
}
