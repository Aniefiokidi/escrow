import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_ESCROW = 'IN_ESCROW', 'In Escrow'
        DELIVERED = 'DELIVERED', 'Delivered'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        COMPLETED = 'COMPLETED', 'Completed'
        DISPUTED = 'DISPUTED', 'Disputed'
        REFUNDED = 'REFUNDED', 'Refunded'
        CANCELLED = 'CANCELLED', 'Cancelled'

    VALID_TRANSITIONS = {
        Status.PENDING: [Status.IN_ESCROW, Status.CANCELLED],
        Status.IN_ESCROW: [Status.DELIVERED, Status.DISPUTED, Status.CANCELLED],
        Status.DELIVERED: [Status.CONFIRMED, Status.DISPUTED],
        Status.CONFIRMED: [Status.COMPLETED, Status.DISPUTED],
        Status.COMPLETED: [],
        Status.DISPUTED: [Status.COMPLETED, Status.REFUNDED],
        Status.REFUNDED: [],
        Status.CANCELLED: [],
    }

    transaction_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    reference = models.CharField(max_length=20, unique=True, blank=True)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='purchases',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='sales',
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default='NGN')
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    delivery_deadline = models.DateTimeField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} — {self.title}"

    def save(self, *args, **kwargs):
        if not self.reference:
            year = timezone.now().year
            last = Transaction.objects.filter(
                reference__startswith=f'ESC-{year}-'
            ).count()
            self.reference = f'ESC-{year}-{last + 1:05d}'
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status):
        return new_status in self.VALID_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status):
        if not self.can_transition_to(new_status):
            raise ValueError(f"Cannot transition from {self.status} to {new_status}")
        self.status = new_status
        if new_status == self.Status.CONFIRMED:
            self.confirmed_at = timezone.now()
        if new_status == self.Status.COMPLETED:
            self.completed_at = timezone.now()
        self.save()

    @property
    def status_index(self):
        steps = ['PENDING', 'IN_ESCROW', 'DELIVERED', 'CONFIRMED', 'COMPLETED']
        return steps.index(self.status) if self.status in steps else -1

