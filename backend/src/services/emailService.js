import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'GolfGives <noreply@golfgives.com>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('Email send error:', err.message)
  }
}

export async function sendWelcomeEmail(email, name) {
  await sendMail({
    to: email,
    subject: 'Welcome to GolfGives! ⛳',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080d18;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:#22c55e;margin-bottom:8px">Welcome, ${name}! 🏌️</h1>
        <p style="color:#9ca3af">You've joined GolfGives — where golf meets giving.</p>
        <p style="color:#9ca3af">Log your first Stableford score and get entered into this month's prize draw.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="display:inline-block;margin-top:24px;background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">
          Go to Dashboard →
        </a>
        <p style="color:#4b5563;font-size:12px;margin-top:32px">GolfGives · Play. Win. Give.</p>
      </div>
    `,
  })
}

export async function sendSubscriptionConfirmedEmail(email, name) {
  await sendMail({
    to: email,
    subject: 'Subscription confirmed — You\'re in the draw! 🏆',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080d18;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:#f59e0b;margin-bottom:8px">You're subscribed! 🎉</h1>
        <p style="color:#9ca3af">Hi ${name}, your GolfGives subscription is now active.</p>
        <ul style="color:#9ca3af;line-height:2">
          <li>✅ You'll be entered into this month's prize draw</li>
          <li>⛳ Log up to 5 Stableford scores per month</li>
          <li>💚 Your charity donation is now active</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/scores"
           style="display:inline-block;margin-top:24px;background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">
          Log your first score →
        </a>
      </div>
    `,
  })
}

export async function sendDrawResultEmail(email, name, result) {
  const isWinner = result.prize_amount > 0
  await sendMail({
    to: email,
    subject: isWinner ? `🏆 You won £${result.prize_amount}!` : 'This month\'s draw results',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080d18;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:${isWinner ? '#f59e0b' : '#22c55e'};margin-bottom:8px">
          ${isWinner ? `🎉 Congratulations, ${name}!` : `Draw Results, ${name}`}
        </h1>
        ${isWinner
          ? `<p style="color:#9ca3af">You matched ${result.match_count} numbers and won <strong style="color:#f59e0b">£${result.prize_amount}</strong>!</p>
             <p style="color:#9ca3af">Our team will verify your win and process payment within 5 business days.</p>`
          : `<p style="color:#9ca3af">You didn't win this month — but keep playing! Your scores carry over to improve your chances.</p>`
        }
        <p style="color:#6b7280;font-size:13px">Winning numbers: ${result.winning_numbers?.join(', ')}</p>
        <p style="color:#6b7280;font-size:13px">Your numbers: ${result.entry_numbers?.join(', ')}</p>
        <a href="${process.env.FRONTEND_URL}/draw"
           style="display:inline-block;margin-top:24px;background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600">
          View draw results →
        </a>
      </div>
    `,
  })
}

export async function sendWinnerVerifiedEmail(email, name, amount) {
  await sendMail({
    to: email,
    subject: `✅ Your prize of £${amount} has been verified!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080d18;color:#fff;padding:40px;border-radius:16px">
        <h1 style="color:#22c55e">Prize Verified! 🎊</h1>
        <p style="color:#9ca3af">Hi ${name},</p>
        <p style="color:#9ca3af">Your prize of <strong style="color:#f59e0b">£${amount}</strong> has been verified by our team.</p>
        <p style="color:#9ca3af">Payment will be processed to your registered account within 3-5 business days.</p>
        <p style="color:#4b5563;font-size:12px;margin-top:32px">GolfGives · Play. Win. Give.</p>
      </div>
    `,
  })
}
