from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser


class RegisterForm(UserCreationForm):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'your@email.com'}))
    full_name = forms.CharField(max_length=255, widget=forms.TextInput(attrs={'placeholder': 'Full Name'}))
    phone_number = forms.CharField(max_length=20, required=False, widget=forms.TextInput(attrs={'placeholder': '+234...'}))
    role = forms.ChoiceField(choices=[
        (CustomUser.Role.BUYER, 'Buyer — I want to pay for goods/services'),
        (CustomUser.Role.SELLER, 'Seller — I want to receive payments'),
    ])

    class Meta:
        model = CustomUser
        fields = ('email', 'full_name', 'phone_number', 'role', 'password1', 'password2')

    def clean_email(self):
        email = self.cleaned_data['email'].lower()
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email


class LoginForm(AuthenticationForm):
    username = forms.EmailField(
        label='Email',
        widget=forms.EmailInput(attrs={'placeholder': 'your@email.com', 'autofocus': True}),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password'].widget.attrs['placeholder'] = 'Password'


class MFAVerifyForm(forms.Form):
    token = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'placeholder': '000000',
            'class': 'otp-input',
            'autocomplete': 'one-time-code',
            'inputmode': 'numeric',
            'pattern': '[0-9]{6}',
        }),
        label='6-Digit Code',
    )


class ProfileForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ('full_name', 'phone_number', 'profile_picture')
        widgets = {
            'full_name': forms.TextInput(attrs={'placeholder': 'Your full name'}),
            'phone_number': forms.TextInput(attrs={'placeholder': '+234 xxx xxx xxxx'}),
        }
