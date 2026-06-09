from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.conf import settings
from apps.disputes.models import Dispute

User = get_user_model()


class Command(BaseCommand):
    help = 'Flag disputes that have passed their resolution deadline and alert admins.'

    def handle(self, *args, **options):
        overdue = Dispute.objects.filter(
            status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW],
            resolution_deadline__lt=timezone.now(),
        )
        count = 0
        for dispute in overdue:
            dispute.status = Dispute.Status.OVERDUE
            dispute.save(update_fields=['status'])
            count += 1
            self.stdout.write(self.style.WARNING(
                f'Overdue: {dispute.dispute_id} — {dispute.transaction.reference}'
            ))

        admins = User.objects.filter(role='ADMIN', is_active=True)
        if count and admins.exists():
            admin_emails = list(admins.values_list('email', flat=True))
            send_mail(
                subject=f'[EscrowNG] {count} Overdue Dispute(s) Require Immediate Action',
                message=(
                    f'{count} dispute(s) have passed their 72-hour resolution deadline.\n'
                    f'Please log in to the admin panel immediately to resolve them.\n\n'
                    f'Login: http://localhost:8000/admin/'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True,
            )
            self.stdout.write(self.style.SUCCESS(f'Admin alert sent to: {", ".join(admin_emails)}'))

        self.stdout.write(f'Total flagged: {count}')
