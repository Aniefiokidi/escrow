from django.urls import path
from . import views

app_name = 'disputes'

urlpatterns = [
    path('raise/<uuid:uuid>/', views.raise_dispute_view, name='raise'),
    path('<uuid:uuid>/', views.dispute_detail, name='detail'),
    path('<uuid:uuid>/resolve/', views.resolve_dispute_view, name='resolve'),
]
