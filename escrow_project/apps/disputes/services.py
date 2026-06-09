from django.utils import timezone
from .models import Dispute
from apps.transactions.models import Transaction


def raise_dispute(transaction, raised_by, reason, evidence_file=None):
    if transaction.status in (Transaction.Status.COMPLETED, Transaction.Status.REFUNDED, Transaction.Status.CANCELLED):
        raise ValueError("Cannot raise a dispute on a closed transaction.")
    if raised_by not in (transaction.buyer, transaction.seller):
        raise PermissionError("Only the buyer or seller can raise a dispute.")

    existing = Dispute.objects.filter(
        transaction=transaction,
        status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
    ).first()
    if existing:
        raise ValueError("An open dispute already exists for this transaction.")

    dispute = Dispute.objects.create(
        transaction=transaction,
        raised_by=raised_by,
        reason=reason,
        evidence_file=evidence_file,
        status=Dispute.Status.OPEN,
    )
    transaction.status = Transaction.Status.DISPUTED
    transaction.save(update_fields=['status', 'updated_at'])

    from apps.notifications.services import notify_dispute_raised
    notify_dispute_raised(transaction, dispute)
    return dispute


def resolve_dispute(dispute, admin, resolution, notes=''):
    from apps.escrow.services import release_funds, refund_buyer, partial_release
    if dispute.status == Dispute.Status.RESOLVED:
        raise ValueError("This dispute is already resolved.")

    dispute.resolution = resolution
    dispute.resolution_notes = notes
    dispute.status = Dispute.Status.RESOLVED
    dispute.resolved_by = admin
    dispute.resolved_at = timezone.now()
    dispute.save()

    transaction = dispute.transaction
    if resolution == Dispute.Resolution.RELEASE:
        release_funds(transaction, performed_by=admin)
    elif resolution == Dispute.Resolution.REFUND:
        refund_buyer(transaction, performed_by=admin)
    elif resolution == Dispute.Resolution.PARTIAL:
        partial_release(transaction, transaction.amount / 2, performed_by=admin)

    from apps.notifications.services import notify_dispute_resolved
    notify_dispute_resolved(transaction, dispute)
    return dispute
