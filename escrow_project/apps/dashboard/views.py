from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Sum, Count
from apps.transactions.models import Transaction
from apps.disputes.models import Dispute
from apps.notifications.models import Notification


@login_required
def index(request):
    user = request.user
    if user.is_superuser or user.role == 'ADMIN':
        return redirect('dashboard:admin')
    if user.role == 'SELLER':
        return redirect('dashboard:seller')
    return redirect('dashboard:buyer')


@login_required
def buyer_dashboard(request):
    user = request.user
    transactions = Transaction.objects.filter(buyer=user).select_related('seller')
    pending = transactions.filter(status=Transaction.Status.PENDING).count()
    in_escrow = transactions.filter(status=Transaction.Status.IN_ESCROW).count()
    completed = transactions.filter(status=Transaction.Status.COMPLETED).count()
    pending_confirm = transactions.filter(status=Transaction.Status.DELIVERED)
    return render(request, 'dashboard/buyer.html', {
        'transactions': transactions[:10],
        'pending': pending,
        'in_escrow': in_escrow,
        'completed': completed,
        'pending_confirm': pending_confirm,
    })


@login_required
def seller_dashboard(request):
    user = request.user
    transactions = Transaction.objects.filter(seller=user).select_related('buyer')
    pending = transactions.filter(status=Transaction.Status.PENDING).count()
    in_escrow = transactions.filter(status=Transaction.Status.IN_ESCROW).count()
    completed = transactions.filter(status=Transaction.Status.COMPLETED).count()
    total_earned = transactions.filter(
        status=Transaction.Status.COMPLETED
    ).aggregate(total=Sum('amount'))['total'] or 0
    return render(request, 'dashboard/seller.html', {
        'transactions': transactions[:10],
        'pending': pending,
        'in_escrow': in_escrow,
        'completed': completed,
        'total_earned': total_earned,
    })


@login_required
def admin_dashboard(request):
    if not (request.user.is_superuser or request.user.role == 'ADMIN'):
        return redirect('dashboard:index')
    from django.contrib.auth import get_user_model
    User = get_user_model()

    total_transactions = Transaction.objects.count()
    total_in_escrow = Transaction.objects.filter(
        status=Transaction.Status.IN_ESCROW
    ).aggregate(total=Sum('amount'))['total'] or 0
    open_disputes = Dispute.objects.filter(
        status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
    ).count()
    total_users = User.objects.filter(is_active=True).count()

    recent_transactions = Transaction.objects.select_related('buyer', 'seller').order_by('-created_at')[:20]
    disputes = Dispute.objects.select_related('transaction', 'raised_by').filter(
        status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
    ).order_by('resolution_deadline')

    status_filter = request.GET.get('status')
    search = request.GET.get('q')
    if status_filter:
        recent_transactions = Transaction.objects.filter(status=status_filter).select_related('buyer', 'seller')[:20]
    if search:
        recent_transactions = Transaction.objects.filter(
            Q(reference__icontains=search) | Q(title__icontains=search) |
            Q(buyer__email__icontains=search) | Q(seller__email__icontains=search)
        ).select_related('buyer', 'seller')[:20]

    return render(request, 'dashboard/admin.html', {
        'total_transactions': total_transactions,
        'total_in_escrow': total_in_escrow,
        'open_disputes': open_disputes,
        'total_users': total_users,
        'recent_transactions': recent_transactions,
        'disputes': disputes,
        'status_choices': Transaction.Status.choices,
        'current_status': status_filter,
        'search': search,
    })

