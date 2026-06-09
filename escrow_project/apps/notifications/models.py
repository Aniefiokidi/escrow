from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Channel(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        IN_APP = 'IN_APP', 'In-App'
        BOTH = 'BOTH', 'Both'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    channel = models.CharField(max_length=10, choices=Channel.choices, default=Channel.BOTH)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    related_transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"[{self.channel}] {self.title} → {self.recipient.email}"


class NotificationTemplate(models.Model):
    class EventType(models.TextChoices):
        TRANSACTION_CREATED = 'TRANSACTION_CREATED', 'Transaction Created'
        FUNDS_DEPOSITED = 'FUNDS_DEPOSITED', 'Funds Deposited'
        DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED', 'Delivery Confirmed'
        DISPUTE_RAISED = 'DISPUTE_RAISED', 'Dispute Raised'
        DISPUTE_RESOLVED = 'DISPUTE_RESOLVED', 'Dispute Resolved'
        FUNDS_RELEASED = 'FUNDS_RELEASED', 'Funds Released'
        REFUND_ISSUED = 'REFUND_ISSUED', 'Refund Issued'

    event_type = models.CharField(max_length=30, choices=EventType.choices, unique=True)
    subject_template = models.CharField(max_length=255)
    body_template = models.TextField()

    def __str__(self):
        return f"Template: {self.event_type}"

