from datetime import date

from django.core.management.base import BaseCommand, CommandError

from core.port_movements import archive_port_movements_snapshot


class Command(BaseCommand):
    help = "Obtém e arquiva um snapshot diário dos movimentos portuários dos Portos dos Açores."

    def add_arguments(self, parser):
        parser.add_argument("--port", default="PTPDL", help="Código do porto a arquivar (default: PTPDL).")
        parser.add_argument(
            "--date",
            dest="snapshot_date",
            default=None,
            help="Data do snapshot no formato YYYY-MM-DD. Por omissão usa a data atual.",
        )

    def handle(self, *args, **options):
        snapshot_date = options.get("snapshot_date")
        parsed_date = None

        if snapshot_date:
            try:
                parsed_date = date.fromisoformat(snapshot_date)
            except ValueError as exc:
                raise CommandError("A data deve estar no formato YYYY-MM-DD.") from exc

        payload = archive_port_movements_snapshot(
            port_code=options["port"].upper(),
            snapshot_date=parsed_date,
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Snapshot arquivado com sucesso para "
                f"{payload['port']['name']} ({payload.get('snapshot_date')})."
            )
        )