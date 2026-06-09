import pyotp
import qrcode
import qrcode.image.svg
import io
import base64
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from .forms import RegisterForm, LoginForm, MFAVerifyForm, ProfileForm
from .models import CustomUser


@require_http_methods(['GET', 'POST'])
def register(request):
    if request.user.is_authenticated:
        return redirect('dashboard:index')
    form = RegisterForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save(commit=False)
        user.is_verified = True
        user.save()
        messages.success(request, "Account created! Please log in.")
        return redirect('accounts:login')
    return render(request, 'accounts/register.html', {'form': form})


@require_http_methods(['GET', 'POST'])
def user_login(request):
    if request.user.is_authenticated:
        return redirect('dashboard:index')
    form = LoginForm(request, data=request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.get_user()
        if user.mfa_enabled:
            request.session['mfa_user_id'] = user.pk
            return redirect('accounts:mfa_verify')
        login(request, user)
        return redirect('dashboard:index')
    return render(request, 'accounts/login.html', {'form': form})


@require_http_methods(['GET', 'POST'])
def mfa_verify(request):
    user_id = request.session.get('mfa_user_id')
    if not user_id:
        return redirect('accounts:login')
    try:
        user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return redirect('accounts:login')

    form = MFAVerifyForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        token = form.cleaned_data['token']
        totp = pyotp.TOTP(user.mfa_secret)
        if totp.verify(token):
            del request.session['mfa_user_id']
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return redirect('dashboard:index')
        messages.error(request, "Invalid code. Please try again.")
    return render(request, 'accounts/mfa_verify.html', {'form': form})


@login_required
@require_http_methods(['GET', 'POST'])
def mfa_setup(request):
    user = request.user
    if not user.mfa_secret:
        user.mfa_secret = pyotp.random_base32()
        user.save(update_fields=['mfa_secret'])

    totp = pyotp.TOTP(user.mfa_secret)
    otp_uri = totp.provisioning_uri(name=user.email, issuer_name='EscrowNG')

    img = qrcode.make(otp_uri)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    if request.method == 'POST':
        token = request.POST.get('token', '')
        if totp.verify(token):
            user.mfa_enabled = True
            user.save(update_fields=['mfa_enabled'])
            messages.success(request, "MFA enabled successfully!")
            return redirect('accounts:profile')
        messages.error(request, "Invalid code. Scan the QR code and try again.")

    return render(request, 'accounts/mfa_setup.html', {'qr_b64': qr_b64, 'secret': user.mfa_secret})


@login_required
@require_http_methods(['GET', 'POST'])
def profile(request):
    form = ProfileForm(request.POST or None, request.FILES or None, instance=request.user)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, "Profile updated.")
        return redirect('accounts:profile')
    return render(request, 'accounts/profile.html', {'form': form})


@login_required
def user_logout(request):
    logout(request)
    return redirect('accounts:login')

