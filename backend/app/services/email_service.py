import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.environ["SMTP_USER"]
SMTP_PASSWORD = os.environ["SMTP_PASSWORD"]
FROM_NAME = "Gulfstream Intelligence"
FROM_ADDR = SMTP_USER


def _send(to: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_ADDR}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_ADDR, [to], msg.as_string())


def _base_template(body: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:40px 0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;
              padding:40px;border:1px solid #e2e8f0;">
    <h2 style="color:#1a237e;margin:0 0 8px;">Gulfstream Intelligence</h2>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0 24px;">
    {body}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">
      You received this email because you have an account on Gulfstream Intelligence.
    </p>
  </div>
</body>
</html>"""


def send_verification_code(to: str, code: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 20px;">
      Please verify your email address by entering the code below in the app.
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:24px;text-align:center;margin-bottom:20px;">
      <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1a237e;">{code}</span>
    </div>
    <p style="color:#64748b;font-size:14px;margin:0;">
      This code expires in <strong>30 minutes</strong>. If you did not create an account, ignore this email.
    </p>"""
    _send(to, "Verify your Gulfstream Intelligence account", _base_template(body))


def send_invite_email(to: str, org_name: str, inviter_name: str, invite_url: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      <strong>{inviter_name}</strong> has invited you to join <strong>{org_name}</strong> on Gulfstream Intelligence.
    </p>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
      Click the button below to accept the invitation and set up your account.
    </p>
    <a href="{invite_url}"
       style="display:inline-block;background:#1a237e;color:#ffffff;text-decoration:none;
              padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
      Accept Invitation
    </a>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
      This link expires in 7 days. If you were not expecting this invitation, you can safely ignore this email.
    </p>"""
    _send(to, f"You've been invited to join {org_name}", _base_template(body))


def send_trial_started(to: str, plan: str, trial_end: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      Your <strong>7-day free trial</strong> of the <strong>{plan.title()}</strong> plan has started!
    </p>
    <p style="color:#64748b;font-size:14px;margin:0 0 16px;">
      Your trial ends on <strong>{trial_end}</strong>. Enjoy full access to all features during this period.
    </p>
    <p style="color:#64748b;font-size:14px;margin:0;">
      No payment is required now. We'll remind you before your trial ends.
    </p>"""
    _send(to, "Your 7-day free trial has started", _base_template(body))


def send_trial_expiring(to: str, plan: str, pricing_url: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      Your <strong>{plan.title()}</strong> trial expires <strong>tomorrow</strong>.
    </p>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
      To keep access to all your data and features, choose a plan before it expires.
    </p>
    <a href="{pricing_url}"
       style="display:inline-block;background:#1a237e;color:#ffffff;text-decoration:none;
              padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
      View Plans
    </a>"""
    _send(to, "Your trial expires tomorrow", _base_template(body))


def send_trial_expired(to: str, pricing_url: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      Your free trial has ended.
    </p>
    <p style="color:#64748b;font-size:14px;margin:0 0 8px;">
      You can still log in and view your existing data, but new features are paused until you subscribe.
    </p>
    <p style="color:#dc2626;font-size:14px;margin:0 0 24px;">
      <strong>Important:</strong> Your data is safe and preserved. Subscribe to continue using the platform.
    </p>
    <a href="{pricing_url}"
       style="display:inline-block;background:#1a237e;color:#ffffff;text-decoration:none;
              padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
      View Plans
    </a>"""
    _send(to, "Your Gulfstream Intelligence trial has ended", _base_template(body))


def send_contact_sales(name: str, email: str, company: str, message: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      New Enterprise inquiry from the Contact Us form.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
      <tr><td style="padding:8px 0;font-weight:bold;width:120px;">Name:</td><td>{name}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td>{email}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Company:</td><td>{company or "—"}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top;">Message:</td>
          <td style="white-space:pre-wrap;">{message}</td></tr>
    </table>"""
    _send(SMTP_USER, f"Enterprise inquiry from {name}", _base_template(body))
