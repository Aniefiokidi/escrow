from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Notification


def notify(recipient, title, message, transaction=None, channel=Notification.Channel.BOTH):
    Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        channel=channel,
        related_transaction=transaction,
    )
    if channel in (Notification.Channel.EMAIL, Notification.Channel.BOTH):
        try:
            send_mail(
                subject=title,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=True,
            )
        except Exception:
            pass


def notify_transaction_created(transaction):
    notify(
        transaction.seller,
        f'New Escrow Request: {transaction.reference}',
        f'{transaction.buyer.full_name} has initiated an escrow transaction "{transaction.title}" '
        f'for ₦{transaction.amount:,.2f}. Please log in to accept or decline.',
        transaction=transaction,
    )
    notify(
        transaction.buyer,
        f'Transaction {transaction.reference} Created',
        f'Your escrow transaction "{transaction.title}" for ₦{transaction.amount:,.2f} has been created. '
        f'Awaiting seller confirmation.',
        transaction=transaction,
    )


def notify_funds_in_escrow(transaction):
    for user in (transaction.buyer, transaction.seller):
        notify(
            user,
            f'Funds Secured in Escrow — {transaction.reference}',
            f'₦{transaction.amount:,.2f} is now held in escrow for "{transaction.title}". '
            f'Seller may now begin work.',
            transaction=transaction,
        )


def notify_delivered(transaction):
    notify(
        transaction.buyer,
        f'Delivery Marked — {transaction.reference}',
        f'The seller has marked "{transaction.title}" as delivered. '
        f'Please confirm delivery or raise a dispute within the deadline.',
        transaction=transaction,
    )


def notify_delivery_confirmed(transaction):
    notify(
        transaction.seller,
        f'Delivery Confirmed — {transaction.reference}',
        f'The buyer has confirmed delivery for "{transaction.title}". '
        f'Funds will be released automatically in 48 hours if no dispute is raised.',
        transaction=transaction,
    )


def notify_dispute_raised(transaction, dispute):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    admins = User.objects.filter(role='ADMIN', is_active=True)
    other_party = transaction.seller if dispute.raised_by == transaction.buyer else transaction.buyer
    notify(
        other_party,
        f'Dispute Raised — {transaction.reference}',
        f'A dispute has been raised on transaction "{transaction.title}". '
        f'An admin will review and resolve within 72 hours.',
        transaction=transaction,
    )
    for admin in admins:
        notify(
            admin,
            f'[URGENT] New Dispute — {transaction.reference}',
            f'Dispute raised by {dispute.raised_by.email} on transaction "{transaction.title}". '
            f'Resolution deadline: {dispute.resolution_deadline.strftime("%Y-%m-%d %H:%M UTC")}.',
            transaction=transaction,
        )


def notify_dispute_resolved(transaction, dispute):
    for user in (transaction.buyer, transaction.seller):
        notify(
            user,
            f'Dispute Resolved — {transaction.reference}',
            f'The dispute on "{transaction.title}" has been resolved. '
            f'Decision: {dispute.get_resolution_display()}. '
            f'Notes: {dispute.resolution_notes}',
            transaction=transaction,
        )


def notify_funds_released(transaction):
    notify(
        transaction.seller,
        f'Funds Released — {transaction.reference}',
        f'₦{transaction.amount:,.2f} from transaction "{transaction.title}" has been released to you.',
        transaction=transaction,
    )
    notify(
        transaction.buyer,
        f'Transaction Complete — {transaction.reference}',
        f'Transaction "{transaction.title}" is now complete. Funds have been released to the seller.',
        transaction=transaction,
    )


def notify_refund_issued(transaction):
    notify(
        transaction.buyer,
        f'Refund Issued — {transaction.reference}',
        f'₦{transaction.amount:,.2f} from transaction "{transaction.title}" has been refunded to you.',
        transaction=transaction,
    )
    notify(
        transaction.seller,
        f'Transaction Refunded — {transaction.reference}',
        f'The escrow funds for "{transaction.title}" have been refunded to the buyer.',
        transaction=transaction,
    )
