from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Transaction

User = get_user_model()


def create_transaction(buyer, seller_email, title, description, amount, delivery_deadline):
    try:
        seller = User.objects.get(email=seller_email, is_active=True)
    except User.DoesNotExist:
        raise ValueError(f"No active user with email {seller_email} found.")
    if seller == buyer:
        raise ValueError("Buyer and seller cannot be the same user.")
    if seller.role not in ('SELLER', 'ADMIN'):
        raise ValueError("The specified user is not registered as a seller.")

    transaction = Transaction.objects.create(
        buyer=buyer,
        seller=seller,
        title=title,
        description=description,
        amount=amount,
        currency='NGN',
        status=Transaction.Status.PENDING,
        delivery_deadline=delivery_deadline,
    )
    from apps.notifications.services import notify_transaction_created
    notify_transaction_created(transaction)
    return transaction


def confirm_delivery(transaction, buyer):
    if transaction.buyer != buyer:
        raise PermissionError("Only the buyer can confirm delivery.")
    if transaction.status != Transaction.Status.IN_ESCROW:
        raise ValueError(f"Cannot confirm delivery for a transaction in '{transaction.status}' status.")
    transaction.transition_to(Transaction.Status.DELIVERED)
    from apps.notifications.services import notify_delivered
    notify_delivered(transaction)
    return transaction


def buyer_confirm_receipt(transaction, buyer):
    if transaction.buyer != buyer:
        raise PermissionError("Only the buyer can confirm receipt.")
    if transaction.status != Transaction.Status.DELIVERED:
        raise ValueError(f"Cannot confirm receipt for a transaction in '{transaction.status}' status.")
    transaction.transition_to(Transaction.Status.CONFIRMED)
    from apps.notifications.services import notify_delivery_confirmed
    notify_delivery_confirmed(transaction)
    return transaction


def cancel_transaction(transaction, user):
    if transaction.status != Transaction.Status.PENDING:
        raise ValueError("Only PENDING transactions can be cancelled.")
    if user not in (transaction.buyer, transaction.seller) and not user.is_staff:
        raise PermissionError("You are not authorised to cancel this transaction.")
    transaction.transition_to(Transaction.Status.CANCELLED)
    return transaction


def auto_release_check():
    from apps.escrow.services import release_funds
    from apps.disputes.models import Dispute
    cutoff = timezone.now() - timezone.timedelta(minutes=1)
    eligible = Transaction.objects.filter(
        status=Transaction.Status.CONFIRMED,
        confirmed_at__lte=cutoff,
    ).exclude(
        disputes__status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
    )
    released = []
    for txn in eligible:
        try:
            system_user = User.objects.filter(is_superuser=True).first()
            release_funds(txn, performed_by=system_user)
            released.append(txn.reference)
        except Exception as e:
            pass
    return released
