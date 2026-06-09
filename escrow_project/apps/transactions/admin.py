from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference', 'title', 'buyer', 'seller', 'amount', 'status', 'created_at')
    list_filter = ('status', 'currency')
    search_fields = ('reference', 'title', 'buyer__email', 'seller__email')
    ordering = ('-created_at',)
    readonly_fields = ('transaction_id', 'reference', 'created_at', 'updated_at')
