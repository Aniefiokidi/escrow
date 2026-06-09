from django.contrib import admin
from .models import EscrowAccount, EscrowLog


class EscrowLogInline(admin.TabularInline):
    model = EscrowLog
    extra = 0
    readonly_fields = ('action', 'performed_by', 'timestamp', 'notes')


@admin.register(EscrowAccount)
class EscrowAccountAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'held_amount', 'currency', 'release_status', 'held_at')
    list_filter = ('release_status', 'currency')
    inlines = [EscrowLogInline]
    readonly_fields = ('held_at',)


@admin.register(EscrowLog)
class EscrowLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'escrow_account', 'performed_by', 'timestamp')
    readonly_fields = ('timestamp',)
