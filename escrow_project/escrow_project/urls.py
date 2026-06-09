from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('dashboard/', include('apps.dashboard.urls', namespace='dashboard')),
    path('transactions/', include('apps.transactions.urls', namespace='transactions')),
    path('escrow/', include('apps.escrow.urls', namespace='escrow')),
    path('disputes/', include('apps.disputes.urls', namespace='disputes')),
    path('notifications/', include('apps.notifications.urls', namespace='notifications')),
    path('', lambda request: redirect('dashboard:index'), name='home'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
