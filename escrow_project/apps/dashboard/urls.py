from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.index, name='index'),
    path('buyer/', views.buyer_dashboard, name='buyer'),
    path('seller/', views.seller_dashboard, name='seller'),
    path('admin/', views.admin_dashboard, name='admin'),
]
