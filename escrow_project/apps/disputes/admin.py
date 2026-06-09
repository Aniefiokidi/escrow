from django.contrib import admin
from .models import Dispute


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ('dispute_id', 'transaction', 'raised_by', 'status', 'raised_at', 'resolution_deadline')
    list_filter = ('status', 'resolution')
    search_fields = ('transaction__reference', 'raised_by__email')
    readonly_fields = ('dispute_id', 'raised_at', 'resolution_deadline')
