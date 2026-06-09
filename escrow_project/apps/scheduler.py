import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.conf import settings

logger = logging.getLogger(__name__)

_scheduler = None


def _job_auto_release():
    try:
        from apps.transactions.services import auto_release_check
        released = auto_release_check()
        if released:
            logger.info("[scheduler] Auto-released: %s", ", ".join(released))
    except Exception as exc:
        logger.exception("[scheduler] auto_release error: %s", exc)


def _job_flag_overdue_disputes():
    try:
        from django.utils import timezone
        from apps.disputes.models import Dispute
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail

        User = get_user_model()
        overdue = Dispute.objects.filter(
            status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW],
            resolution_deadline__lt=timezone.now(),
        )
        count = 0
        for dispute in overdue:
            dispute.status = Dispute.Status.OVERDUE
            dispute.save(update_fields=['status'])
            count += 1
            logger.warning(
                "[scheduler] Dispute overdue: %s — %s",
                dispute.dispute_id,
                dispute.transaction.reference,
            )

        if count:
            admins = User.objects.filter(role='ADMIN', is_active=True)
            admin_emails = list(admins.values_list('email', flat=True))
            if admin_emails:
                send_mail(
                    subject=f'[EscrowNG] {count} Overdue Dispute(s) — Immediate Action Required',
                    message=(
                        f'{count} dispute(s) passed their 2-minute resolution window.\n'
                        f'Log in now: http://localhost:8000/dashboard/admin/'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=True,
                )
            logger.warning("[scheduler] Flagged %d overdue dispute(s).", count)
    except Exception as exc:
        logger.exception("[scheduler] flag_overdue error: %s", exc)


def start():
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    _scheduler = BackgroundScheduler(timezone='Africa/Lagos')

    # Release confirmed funds every 30 seconds
    _scheduler.add_job(
        _job_auto_release,
        trigger=IntervalTrigger(seconds=30),
        id='auto_release_funds',
        replace_existing=True,
        max_instances=1,
    )

    # Flag overdue disputes every 30 seconds
    _scheduler.add_job(
        _job_flag_overdue_disputes,
        trigger=IntervalTrigger(seconds=30),
        id='flag_overdue_disputes',
        replace_existing=True,
        max_instances=1,
    )

    _scheduler.start()
    logger.info("[scheduler] Started — auto-release every 30s, overdue-flag every 30s")
