from django import forms
from django.utils import timezone


class CreateTransactionForm(forms.Form):
    seller_email = forms.EmailField(
        label='Seller Email',
        widget=forms.EmailInput(attrs={'placeholder': 'seller@example.com'}),
    )
    title = forms.CharField(
        max_length=255,
        widget=forms.TextInput(attrs={'placeholder': 'e.g. Web Design Project'}),
    )
    description = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4, 'placeholder': 'Describe what is being bought/sold...'}),
    )
    amount = forms.DecimalField(
        max_digits=14,
        decimal_places=2,
        min_value=1,
        widget=forms.NumberInput(attrs={'placeholder': '50000.00', 'step': '0.01'}),
        label='Amount (NGN)',
    )
    delivery_deadline = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        label='Delivery Deadline',
    )

    def clean_delivery_deadline(self):
        deadline = self.cleaned_data['delivery_deadline']
        if deadline <= timezone.now():
            raise forms.ValidationError("Delivery deadline must be in the future.")
        return deadline
