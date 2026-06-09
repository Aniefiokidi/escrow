from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.db.models import Q
from .models import Transaction
from .forms import CreateTransactionForm
from .services import create_transaction, confirm_delivery, buyer_confirm_receipt, cancel_transaction
from apps.accounts.decorators import role_required
from apps.escrow.services import initiate_escrow


@login_required
@role_required('BUYER')
def create(request):
    form = CreateTransactionForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        try:
            txn = create_transaction(
                buyer=request.user,
                seller_email=form.cleaned_data['seller_email'],
                title=form.cleaned_data['title'],
                description=form.cleaned_data['description'],
                amount=form.cleaned_data['amount'],
                delivery_deadline=form.cleaned_data['delivery_deadline'],
            )
            initiate_escrow(txn, performed_by=request.user)
            messages.success(request, f"Transaction {txn.reference} created and funds placed in escrow.")
            return redirect('transactions:detail', uuid=txn.transaction_id)
        except (ValueError, PermissionError) as e:
            messages.error(request, str(e))
    return render(request, 'transactions/create.html', {'form': form})


@login_required
def list_transactions(request):
    user = request.user
    if user.role == 'ADMIN' or user.is_superuser:
        qs = Transaction.objects.all()
    else:
        qs = Transaction.objects.filter(Q(buyer=user) | Q(seller=user))

    status_filter = request.GET.get('status')
    if status_filter:
        qs = qs.filter(status=status_filter)

    search = request.GET.get('q')
    if search:
        qs = qs.filter(Q(reference__icontains=search) | Q(title__icontains=search))

    return render(request, 'transactions/list.html', {
        'transactions': qs.select_related('buyer', 'seller'),
        'status_choices': Transaction.Status.choices,
        'current_status': status_filter,
        'search': search,
    })


@login_required
def detail(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    user = request.user
    if not (user == txn.buyer or user == txn.seller or user.role == 'ADMIN' or user.is_superuser):
        messages.error(request, "You do not have permission to view this transaction.")
        return redirect('transactions:list')

    escrow = getattr(txn, 'escrow_account', None)
    disputes = txn.disputes.all()
    logs = escrow.logs.all() if escrow else []
    return render(request, 'transactions/detail.html', {
        'txn': txn,
        'escrow': escrow,
        'disputes': disputes,
        'logs': logs,
        'steps': ['PENDING', 'IN_ESCROW', 'DELIVERED', 'CONFIRMED', 'COMPLETED'],
    })


@login_required
@require_POST
def mark_delivered(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    if request.user != txn.seller:
        messages.error(request, "Only the seller can mark a transaction as delivered.")
        return redirect('transactions:detail', uuid=uuid)
    try:
        confirm_delivery(txn, buyer=txn.buyer)
        messages.success(request, "Transaction marked as delivered. Awaiting buyer confirmation.")
    except (ValueError, PermissionError) as e:
        messages.error(request, str(e))
    return redirect('transactions:detail', uuid=uuid)


@login_required
@require_POST
def confirm_receipt(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    try:
        buyer_confirm_receipt(txn, buyer=request.user)
        messages.success(request, "Delivery confirmed. Funds will be released in 48 hours if no dispute is raised.")
    except (ValueError, PermissionError) as e:
        messages.error(request, str(e))
    return redirect('transactions:detail', uuid=uuid)


@login_required
@require_POST
def cancel(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    try:
        cancel_transaction(txn, user=request.user)
        messages.success(request, f"Transaction {txn.reference} cancelled.")
    except (ValueError, PermissionError) as e:
        messages.error(request, str(e))
    return redirect('transactions:detail', uuid=uuid)

