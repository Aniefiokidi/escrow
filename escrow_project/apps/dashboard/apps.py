import os
from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.dashboard'
    label = 'dashboard'

    def ready(self):
        import sys
        cmd = sys.argv[1] if len(sys.argv) > 1 else ''
        if cmd == 'runserver':
            # Auto-reloader forks a subprocess and sets RUN_MAIN=true there.
            # We only want the scheduler in that subprocess (or when --noreload skips forking).
            if '--noreload' not in sys.argv and os.environ.get('RUN_MAIN') != 'true':
                return
        elif cmd:
            # Any other management command (migrate, seed, etc.) — don't start scheduler.
            return
        # cmd == '' → called from WSGI/ASGI (gunicorn, uvicorn) — always start.
        from apps import scheduler
        scheduler.start()
