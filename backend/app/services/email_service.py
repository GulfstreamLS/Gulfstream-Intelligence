import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

# (filename, content, content_type)
Attachment = tuple[str, bytes, str]

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD
FROM_NAME = "Gulfstream Intelligence"
FROM_ADDR = SMTP_USER


def _send(
    to: str,
    subject: str,
    html: str,
    reply_to: str | None = None,
    attachments: list[Attachment] | None = None,
) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be configured to send email.")

    body = MIMEMultipart("alternative")
    body.attach(MIMEText(html, "html"))

    if attachments:
        msg: MIMEMultipart = MIMEMultipart("mixed")
        msg.attach(body)
        for filename, content, content_type in attachments:
            maintype, _, subtype = content_type.partition("/")
            part = MIMEBase(maintype or "application", subtype or "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", "attachment", filename=filename)
            msg.attach(part)
    else:
        msg = body

    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_ADDR}>"
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_ADDR, [to], msg.as_string())
    logger.info("email_sent", to=to, subject=subject)


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


def send_password_reset_email(to: str, reset_url: str) -> None:
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      We received a request to reset your Gulfstream Intelligence password.
    </p>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;">
      Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
    </p>
    <a href="{reset_url}"
       style="display:inline-block;background:#1a237e;color:#ffffff;text-decoration:none;
              padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">
      Reset Password
    </a>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
      If you did not request a password reset, you can safely ignore this email.
    </p>"""
    _send(to, "Reset your Gulfstream Intelligence password", _base_template(body))


def send_critical_gap_alert(to: str, org_name: str, actor: str, critical_count: int, context: str) -> None:
    safe_org = escape(org_name)
    safe_actor = escape(actor)
    safe_context = escape(context)
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      <strong>{safe_actor}</strong> completed an analysis for <strong>{safe_org}</strong>
      with <strong>{critical_count}</strong> critical gap{"s" if critical_count != 1 else ""}.
    </p>
    <p style="color:#64748b;font-size:14px;margin:0;">
      Review the assessment context: <strong>{safe_context}</strong>
    </p>"""
    _send(to, "Critical regulatory gaps detected", _base_template(body))


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


def send_support_request(
    name: str,
    email: str,
    subject: str,
    message: str,
    attachments: list[Attachment] | None = None,
) -> None:
    safe_name = escape(name)
    safe_email = escape(email)
    safe_subject = escape(subject)
    safe_message = escape(message)
    attachment_row = ""
    if attachments:
        names = ", ".join(escape(f[0]) for f in attachments)
        attachment_row = (
            f'<tr><td style="padding:8px 0;font-weight:bold;">Attachments:</td>'
            f"<td>{names}</td></tr>"
        )
    body = f"""
    <p style="color:#334155;font-size:16px;margin:0 0 16px;">
      New support request from a Gulfstream Intelligence user.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
      <tr><td style="padding:8px 0;font-weight:bold;width:120px;">Name:</td><td>{safe_name}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td>{safe_email}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Subject:</td><td>{safe_subject}</td></tr>
      {attachment_row}
      <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top;">Message:</td>
          <td style="white-space:pre-wrap;">{safe_message}</td></tr>
    </table>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
      Reply directly to this email to respond to the user.
    </p>"""
    _send(
        settings.SUPPORT_EMAIL,
        f"[Support] {safe_subject}",
        _base_template(body),
        reply_to=email,
        attachments=attachments,
    )
