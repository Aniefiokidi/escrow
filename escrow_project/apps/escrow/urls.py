from django.urls import path
from . import views

app_name = 'escrow'

urlpatterns = [
    path('<uuid:uuid>/release/', views.manual_release, name='release'),
    path('<uuid:uuid>/refund/', views.manual_refund, name='refund'),
]
