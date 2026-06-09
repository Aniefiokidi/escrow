from django.urls import path
from . import views

app_name = 'transactions'

urlpatterns = [
    path('', views.list_transactions, name='list'),
    path('create/', views.create, name='create'),
    path('<uuid:uuid>/', views.detail, name='detail'),
    path('<uuid:uuid>/deliver/', views.mark_delivered, name='mark_delivered'),
    path('<uuid:uuid>/confirm-receipt/', views.confirm_receipt, name='confirm_receipt'),
    path('<uuid:uuid>/cancel/', views.cancel, name='cancel'),
]
