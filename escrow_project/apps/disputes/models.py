import uuid
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        RESOLVED = 'RESOLVED', 'Resolved'
        OVERDUE = 'OVERDUE', 'Overdue'

    class Resolution(models.TextChoices):
        RELEASE = 'RELEASE', 'Release to Seller'
        REFUND = 'REFUND', 'Refund to Buyer'
        PARTIAL = 'PARTIAL', 'Partial Release'

    dispute_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.PROTECT,
        related_name='disputes',
    )
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='raised_disputes',
    )
    reason = models.TextField()
    evidence_file = models.FileField(upload_to='evidence/', blank=True, null=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    resolution = models.CharField(max_length=10, choices=Resolution.choices, blank=True)
    resolution_notes = models.TextField(blank=True)
    raised_at = models.DateTimeField(auto_now_add=True)
    resolution_deadline = models.DateTimeField(blank=True, null=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes',
    )

    class Meta:
        ordering = ['-raised_at']

    def save(self, *args, **kwargs):
        if not self.resolution_deadline and not self.pk:
            self.resolution_deadline = timezone.now() + timedelta(minutes=2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dispute {self.dispute_id} — {self.status}"

    @property
    def hours_remaining(self):
        if self.resolution_deadline:
            delta = self.resolution_deadline - timezone.now()
            return max(0, delta.total_seconds() / 60)  # minutes for demo
        return 0

    @property
    def is_overdue(self):
        return self.resolution_deadline and timezone.now() > self.resolution_deadline and self.status not in [self.Status.RESOLVED]

