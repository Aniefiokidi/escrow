from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_POST, require_http_methods
from django.conf import settings
import os
from apps.transactions.models import Transaction
from apps.accounts.decorators import role_required
from .models import Dispute
from .services import raise_dispute, resolve_dispute


@login_required
@require_http_methods(['GET', 'POST'])
def raise_dispute_view(request, uuid):
    txn = get_object_or_404(Transaction, transaction_id=uuid)
    user = request.user
    if user not in (txn.buyer, txn.seller):
        messages.error(request, "Only the buyer or seller can raise a dispute.")
        return redirect('transactions:detail', uuid=uuid)

    if request.method == 'POST':
        reason = request.POST.get('reason', '').strip()
        evidence = request.FILES.get('evidence_file')

        if not reason:
            messages.error(request, "Please provide a reason for the dispute.")
            return render(request, 'disputes/raise.html', {'txn': txn})

        if evidence:
            ext = os.path.splitext(evidence.name)[1].lower()
            if ext not in settings.ALLOWED_EVIDENCE_EXTENSIONS:
                messages.error(request, "Evidence must be PDF, JPG, or PNG.")
                return render(request, 'disputes/raise.html', {'txn': txn})
            if evidence.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
                messages.error(request, "Evidence file must be under 5MB.")
                return render(request, 'disputes/raise.html', {'txn': txn})

        try:
            dispute = raise_dispute(txn, raised_by=user, reason=reason, evidence_file=evidence)
            messages.success(request, f"Dispute raised. Reference: {dispute.dispute_id}. Admin will resolve within 72 hours.")
            return redirect('disputes:detail', uuid=dispute.dispute_id)
        except (ValueError, PermissionError) as e:
            messages.error(request, str(e))

    return render(request, 'disputes/raise.html', {'txn': txn})


@login_required
def dispute_detail(request, uuid):
    dispute = get_object_or_404(Dispute, dispute_id=uuid)
    txn = dispute.transaction
    user = request.user
    if not (user in (txn.buyer, txn.seller) or user.role == 'ADMIN' or user.is_superuser):
        messages.error(request, "Access denied.")
        return redirect('transactions:list')
    return render(request, 'disputes/detail.html', {'dispute': dispute, 'txn': txn})


@login_required
@role_required('ADMIN')
@require_POST
def resolve_dispute_view(request, uuid):
    dispute = get_object_or_404(Dispute, dispute_id=uuid)
    resolution = request.POST.get('resolution')
    notes = request.POST.get('notes', '').strip()

    valid = [Dispute.Resolution.RELEASE, Dispute.Resolution.REFUND, Dispute.Resolution.PARTIAL]
    if resolution not in valid:
        messages.error(request, "Invalid resolution option.")
        return redirect('disputes:detail', uuid=uuid)

    try:
        resolve_dispute(dispute, admin=request.user, resolution=resolution, notes=notes)
        messages.success(request, f"Dispute resolved: {resolution}.")
    except (ValueError, PermissionError) as e:
        messages.error(request, str(e))
    return redirect('disputes:detail', uuid=uuid)

