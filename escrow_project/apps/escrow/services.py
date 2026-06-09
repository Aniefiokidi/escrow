from django.utils import timezone
from .models import EscrowAccount, EscrowLog
from apps.transactions.models import Transaction


def _log(escrow_account, action, performed_by, notes=''):
    EscrowLog.objects.create(
        escrow_account=escrow_account,
        action=action,
        performed_by=performed_by,
        notes=notes,
    )


def initiate_escrow(transaction, performed_by):
    escrow = EscrowAccount.objects.create(
        transaction=transaction,
        held_amount=transaction.amount,
        currency=transaction.currency,
        release_status=EscrowAccount.ReleaseStatus.HOLDING,
    )
    _log(escrow, 'ESCROW_INITIATED', performed_by,
         f'₦{transaction.amount:,.2f} placed in escrow for {transaction.reference}')
    transaction.transition_to(Transaction.Status.IN_ESCROW)
    from apps.notifications.services import notify_funds_in_escrow
    notify_funds_in_escrow(transaction)
    return escrow


def release_funds(transaction, performed_by):
    escrow = transaction.escrow_account
    escrow.release_status = EscrowAccount.ReleaseStatus.RELEASED
    escrow.released_at = timezone.now()
    escrow.save()
    _log(escrow, 'FUNDS_RELEASED', performed_by,
         f'Full amount ₦{escrow.held_amount:,.2f} released to seller')
    transaction.transition_to(Transaction.Status.COMPLETED)
    from apps.notifications.services import notify_funds_released
    notify_funds_released(transaction)
    return escrow


def refund_buyer(transaction, performed_by):
    escrow = transaction.escrow_account
    escrow.release_status = EscrowAccount.ReleaseStatus.REFUNDED
    escrow.released_at = timezone.now()
    escrow.save()
    _log(escrow, 'REFUND_ISSUED', performed_by,
         f'Full amount ₦{escrow.held_amount:,.2f} refunded to buyer')
    transaction.transition_to(Transaction.Status.REFUNDED)
    from apps.notifications.services import notify_refund_issued
    notify_refund_issued(transaction)
    return escrow


def partial_release(transaction, release_amount, performed_by):
    escrow = transaction.escrow_account
    remainder = escrow.held_amount - release_amount
    escrow.release_status = EscrowAccount.ReleaseStatus.PARTIAL
    escrow.released_at = timezone.now()
    escrow.save()
    _log(escrow, 'PARTIAL_RELEASE', performed_by,
         f'₦{release_amount:,.2f} released to seller; ₦{remainder:,.2f} refunded to buyer')
    transaction.transition_to(Transaction.Status.COMPLETED)
    from apps.notifications.services import notify_funds_released, notify_refund_issued
    notify_funds_released(transaction)
    return escrow
