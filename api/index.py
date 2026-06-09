import os
import sys
from pathlib import Path

# Put the Django project on the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'escrow_project'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'escrow_project.settings')

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
