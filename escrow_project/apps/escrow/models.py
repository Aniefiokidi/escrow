from django.db import models
from django.conf import settings


class EscrowAccount(models.Model):
    class ReleaseStatus(models.TextChoices):
        HOLDING = 'HOLDING', 'Holding'
        RELEASED = 'RELEASED', 'Released'
        REFUNDED = 'REFUNDED', 'Refunded'
        PARTIAL = 'PARTIAL', 'Partial Release'

    transaction = models.OneToOneField(
        'transactions.Transaction',
        on_delete=models.PROTECT,
        related_name='escrow_account',
    )
    held_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='NGN')
    release_status = models.CharField(
        max_length=10, choices=ReleaseStatus.choices, default=ReleaseStatus.HOLDING
    )
    held_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Escrow for {self.transaction.reference} — {self.release_status}"


class EscrowLog(models.Model):
    escrow_account = models.ForeignKey(
        EscrowAccount, on_delete=models.PROTECT, related_name='logs'
    )
    action = models.CharField(max_length=100)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='escrow_actions',
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.action} by {self.performed_by.email} at {self.timestamp}"

