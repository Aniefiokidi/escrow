from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed demo users and sample transactions for testing.'

    def handle(self, *args, **options):
        from apps.transactions.models import Transaction
        from apps.escrow.models import EscrowAccount, EscrowLog
        from apps.disputes.models import Dispute

        self.stdout.write('Creating demo users...')

        admin, _ = User.objects.get_or_create(
            email='admin@escrow.ng',
            defaults={
                'full_name': 'System Admin',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
            }
        )
        if _:
            admin.set_password('Admin@123456')
            admin.save()
            self.stdout.write(self.style.SUCCESS('  admin@escrow.ng / Admin@123456'))

        buyers = []
        for i, (name, email) in enumerate([
            ('Chidi Okeke', 'buyer1@escrow.ng'),
            ('Amaka Nwosu', 'buyer2@escrow.ng'),
        ]):
            u, created = User.objects.get_or_create(
                email=email,
                defaults={'full_name': name, 'role': 'BUYER', 'is_verified': True}
            )
            if created:
                u.set_password('Buyer@123456')
                u.save()
                self.stdout.write(self.style.SUCCESS(f'  {email} / Buyer@123456'))
            buyers.append(u)

        sellers = []
        for name, email in [
            ('Emeka Obi', 'seller1@escrow.ng'),
            ('Ngozi Adeyemi', 'seller2@escrow.ng'),
        ]:
            u, created = User.objects.get_or_create(
                email=email,
                defaults={'full_name': name, 'role': 'SELLER', 'is_verified': True}
            )
            if created:
                u.set_password('Seller@123456')
                u.save()
                self.stdout.write(self.style.SUCCESS(f'  {email} / Seller@123456'))
            sellers.append(u)

        self.stdout.write('Creating sample transactions...')

        samples = [
            {
                'buyer': buyers[0], 'seller': sellers[0],
                'title': 'Logo Design Project',
                'description': 'Complete brand identity design including logo, business card, and letterhead.',
                'amount': Decimal('45000.00'),
                'status': Transaction.Status.COMPLETED,
                'delivery_deadline': timezone.now() - timedelta(days=2),
            },
            {
                'buyer': buyers[0], 'seller': sellers[1],
                'title': 'E-commerce Website Development',
                'description': 'Full-stack e-commerce site with payment integration.',
                'amount': Decimal('250000.00'),
                'status': Transaction.Status.IN_ESCROW,
                'delivery_deadline': timezone.now() + timedelta(days=14),
            },
            {
                'buyer': buyers[1], 'seller': sellers[0],
                'title': 'Social Media Management (3 months)',
                'description': 'Complete social media management for Instagram, Twitter, and Facebook.',
                'amount': Decimal('75000.00'),
                'status': Transaction.Status.DELIVERED,
                'delivery_deadline': timezone.now() + timedelta(days=1),
            },
            {
                'buyer': buyers[1], 'seller': sellers[1],
                'title': 'Mobile App UI Design',
                'description': 'UI/UX design for a fintech mobile application.',
                'amount': Decimal('120000.00'),
                'status': Transaction.Status.DISPUTED,
                'delivery_deadline': timezone.now() + timedelta(days=7),
            },
            {
                'buyer': buyers[0], 'seller': sellers[1],
                'title': 'Content Writing Package',
                'description': '20 SEO-optimised blog articles for a tech blog.',
                'amount': Decimal('30000.00'),
                'status': Transaction.Status.PENDING,
                'delivery_deadline': timezone.now() + timedelta(days=21),
            },
        ]

        for data in samples:
            txn, created = Transaction.objects.get_or_create(
                title=data['title'],
                buyer=data['buyer'],
                defaults={
                    'seller': data['seller'],
                    'description': data['description'],
                    'amount': data['amount'],
                    'currency': 'NGN',
                    'status': data['status'],
                    'delivery_deadline': data['delivery_deadline'],
                }
            )
            if created:
                self.stdout.write(f'  Created: {txn.reference} — {txn.title} [{txn.status}]')

                if data['status'] != Transaction.Status.PENDING:
                    EscrowAccount.objects.get_or_create(
                        transaction=txn,
                        defaults={
                            'held_amount': txn.amount,
                            'currency': 'NGN',
                            'release_status': (
                                EscrowAccount.ReleaseStatus.RELEASED
                                if data['status'] == Transaction.Status.COMPLETED
                                else EscrowAccount.ReleaseStatus.HOLDING
                            ),
                        }
                    )

                if data['status'] == Transaction.Status.DISPUTED:
                    Dispute.objects.get_or_create(
                        transaction=txn,
                        defaults={
                            'raised_by': data['buyer'],
                            'reason': 'The delivered work does not match the agreed specifications.',
                            'status': Dispute.Status.OPEN,
                        }
                    )

        self.stdout.write(self.style.SUCCESS('\nDemo data seeded successfully!'))
        self.stdout.write('\nDemo credentials:')
        self.stdout.write('  Admin:  admin@escrow.ng / Admin@123456')
        self.stdout.write('  Buyer1: buyer1@escrow.ng / Buyer@123456')
        self.stdout.write('  Buyer2: buyer2@escrow.ng / Buyer@123456')
        self.stdout.write('  Seller1: seller1@escrow.ng / Seller@123456')
        self.stdout.write('  Seller2: seller2@escrow.ng / Seller@123456')
