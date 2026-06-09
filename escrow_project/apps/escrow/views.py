from django.shortcuts import redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_POST
from apps.transactions.models import Transaction
from apps.accounts.decorators import role_required
from .services import release_funds, refund_buyer


@login_required
@role_required('ADMIN')
@require_POST
def manual_release(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    try:
        release_funds(txn, performed_by=request.user)
        messages.success(request, f"Funds released for {txn.reference}.")
    except Exception as e:
        messages.error(request, str(e))
    return redirect('transactions:detail', uuid=uuid)


@login_required
@role_required('ADMIN')
@require_POST
def manual_refund(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    try:
        refund_buyer(txn, performed_by=request.user)
        messages.success(request, f"Refund issued for {txn.reference}.")
    except Exception as e:
        messages.error(request, str(e))
    return redirect('transactions:detail', uuid=uuid)

