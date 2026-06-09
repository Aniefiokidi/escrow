from django.core.management.base import BaseCommand
from apps.transactions.services import auto_release_check


class Command(BaseCommand):
    help = 'Release funds for CONFIRMED transactions where 48h has passed with no dispute.'

    def handle(self, *args, **options):
        released = auto_release_check()
        if released:
            for ref in released:
                self.stdout.write(self.style.SUCCESS(f'Released: {ref}'))
            self.stdout.write(self.style.SUCCESS(f'{len(released)} transaction(s) auto-released.'))
        else:
            self.stdout.write('No transactions eligible for auto-release.')
