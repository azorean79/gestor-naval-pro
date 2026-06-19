import json
import re
from collections import Counter
from datetime import timedelta
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.utils import timezone

PORTOS_DOS_ACORES_MOVEMENTS_URL = "https://portosdosacores.pt/movimento-portuario/"
PORTOS_DOS_ACORES_TIMEOUT_SECONDS = 20
DEFAULT_PORT_CODE = "PTPDL"
DEFAULT_PORT_MOVEMENT_LIMIT = 6
PORT_LABELS = {
    "PTPDL": "Ponta Delgada - São Miguel",
}
PORT_TABLES = (
    {
        "key": "expected_arrivals",
        "label": "Previsão de chegadas",
        "css_class": "table_previsaodechegadas",
        "time_in_key": "eta",
        "time_out_key": "etd",
    },
    {
        "key": "in_port",
        "label": "Navios em porto",
        "css_class": "table_naviosemporto",
        "time_in_key": "ata",
        "time_out_key": "etd",
    },
    {
        "key": "expected_departures",
        "label": "Previsão de partidas",
        "css_class": "table_previsaodepartidas",
        "time_in_key": "ata",
        "time_out_key": "etd",
    },
    {
        "key": "history",
        "label": "Histórico",
        "css_class": "table_historico",
        "time_in_key": "ata",
        "time_out_key": "atd",
    },
)

Movement = dict[str, Any]
MovementsByTable = dict[str, list[Movement]]
Payload = dict[str, Any]


def _matches_css_class(target_class: str):
    def matcher(class_name: str | None) -> bool:
        return bool(class_name and target_class in class_name)

    return matcher


def normalize_port_text(value: Any) -> str:
    return " ".join(str(value or "").split())



def safe_int(value: Any) -> int:
    normalized = normalize_port_text(value)
    if not normalized or normalized.upper() == "ND":
        return 0

    digits_only = re.sub(r"[^\d-]", "", normalized)
    if not digits_only:
        return 0

    try:
        return int(digits_only)
    except ValueError:
        return 0



def parse_port_table(table: Any, table_meta: dict[str, str]) -> list[Movement]:
    if not table:
        return []

    rows: list[Movement] = []
    all_rows: list[Any] = table.find_all("tr")
    if not all_rows:
        return rows

    for row in all_rows[1:]:
        cells: list[Any] = row.find_all("td")
        if len(cells) < 11:
            continue

        values = [normalize_port_text(cell.get_text(" ", strip=True)) for cell in cells[:11]]
        rows.append(
            {
                "scale": values[0],
                "contramarca": values[1],
                "imo": values[2],
                "vessel_name": values[3],
                "vessel_type": values[4],
                "passengers": safe_int(values[5]),
                "crew": safe_int(values[6]),
                "origin": values[7],
                "destination": values[8],
                table_meta["time_in_key"]: values[9],
                table_meta["time_out_key"]: values[10],
                "movement_type": table_meta["key"],
            }
        )

    return rows



def summarize_port_movements(movements_by_table: MovementsByTable) -> dict[str, Any]:
    expected_arrivals: list[Movement] = movements_by_table.get("expected_arrivals", [])
    in_port: list[Movement] = movements_by_table.get("in_port", [])
    expected_departures: list[Movement] = movements_by_table.get("expected_departures", [])
    history: list[Movement] = movements_by_table.get("history", [])
    active_movements: list[Movement] = expected_arrivals + in_port + expected_departures
    vessel_type_counter = Counter(
        movement.get("vessel_type") or "Não identificado" for movement in active_movements
    )

    return {
        "expected_arrivals_count": len(expected_arrivals),
        "in_port_count": len(in_port),
        "expected_departures_count": len(expected_departures),
        "history_count": len(history),
        "total_passengers_expected": sum(item.get("passengers", 0) for item in active_movements),
        "total_crew_expected": sum(item.get("crew", 0) for item in active_movements),
        "top_vessel_types": [
            {"type": vessel_type, "count": count}
            for vessel_type, count in vessel_type_counter.most_common(3)
        ],
        "next_arrival": expected_arrivals[0] if expected_arrivals else None,
        "next_departure": expected_departures[0] if expected_departures else None,
    }



def get_archive_root() -> Path:
    configured_root = getattr(settings, "PORT_MOVEMENTS_ARCHIVE_DIR", "")
    if configured_root:
        return Path(configured_root)
    return Path(settings.BASE_DIR) / "data" / "port_movements"



def get_port_archive_dir(port_code: str = DEFAULT_PORT_CODE) -> Path:
    archive_dir = get_archive_root() / port_code.upper()
    archive_dir.mkdir(parents=True, exist_ok=True)
    return archive_dir



def get_snapshot_path(snapshot_date: Any, port_code: str = DEFAULT_PORT_CODE) -> Path:
    if hasattr(snapshot_date, "strftime"):
        date_str = snapshot_date.strftime("%Y-%m-%d")
    else:
        date_str = str(snapshot_date)
    return get_port_archive_dir(port_code=port_code) / f"{date_str}.json"



def trim_movements(movements_by_table: MovementsByTable, limit: int | None) -> MovementsByTable:
    return {
        key: values[:limit] if limit is not None else values
        for key, values in movements_by_table.items()
    }



def fetch_live_port_movements_payload(port_code: str = DEFAULT_PORT_CODE) -> Payload:
    response = requests.get(
        PORTOS_DOS_ACORES_MOVEMENTS_URL,
        timeout=PORTOS_DOS_ACORES_TIMEOUT_SECONDS,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
        },
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    movements: MovementsByTable = {}
    for table_meta in PORT_TABLES:
        table = soup.find("table", class_=_matches_css_class(table_meta["css_class"]))
        movements[table_meta["key"]] = parse_port_table(table, table_meta)

    return {
        "port": {
            "code": port_code.upper(),
            "name": PORT_LABELS.get(port_code.upper(), port_code.upper()),
        },
        "source": PORTOS_DOS_ACORES_MOVEMENTS_URL,
        "fetched_at": timezone.now().isoformat(),
        "summary": summarize_port_movements(movements),
        "movements": movements,
    }



def archive_port_movements_snapshot(port_code: str = DEFAULT_PORT_CODE, snapshot_date: Any = None) -> Payload:
    snapshot_date = snapshot_date or timezone.localdate()
    payload = fetch_live_port_movements_payload(port_code=port_code)
    payload["snapshot_date"] = snapshot_date.isoformat() if hasattr(snapshot_date, "isoformat") else str(snapshot_date)
    payload["archived_at"] = timezone.now().isoformat()

    snapshot_path = get_snapshot_path(snapshot_date, port_code=port_code)
    snapshot_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def archive_existing_payload(payload: Payload, port_code: str = DEFAULT_PORT_CODE, snapshot_date: Any = None) -> Payload:
    snapshot_date = snapshot_date or timezone.localdate()
    payload_to_store: Payload = {
        **payload,
        "port": payload.get(
            "port",
            {
                "code": port_code.upper(),
                "name": PORT_LABELS.get(port_code.upper(), port_code.upper()),
            },
        ),
        "snapshot_date": snapshot_date.isoformat() if hasattr(snapshot_date, "isoformat") else str(snapshot_date),
        "archived_at": timezone.now().isoformat(),
    }
    snapshot_path = get_snapshot_path(snapshot_date, port_code=port_code)
    snapshot_path.write_text(json.dumps(payload_to_store, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload_to_store



def load_port_movements_snapshot(snapshot_date: Any, port_code: str = DEFAULT_PORT_CODE) -> Payload | None:
    snapshot_path = get_snapshot_path(snapshot_date, port_code=port_code)
    if not snapshot_path.exists():
        return None
    return json.loads(snapshot_path.read_text(encoding="utf-8"))



def list_available_snapshot_dates(port_code: str = DEFAULT_PORT_CODE) -> list[str]:
    archive_dir = get_port_archive_dir(port_code=port_code)
    return sorted(path.stem for path in archive_dir.glob("*.json"))



def get_latest_archived_snapshot(port_code: str = DEFAULT_PORT_CODE) -> Payload | None:
    available_dates = list_available_snapshot_dates(port_code=port_code)
    if not available_dates:
        return None
    return load_port_movements_snapshot(available_dates[-1], port_code=port_code)



def build_port_movements_response(
    port_code: str = DEFAULT_PORT_CODE,
    limit: int = DEFAULT_PORT_MOVEMENT_LIMIT,
    snapshot_date: Any = None,
    live: bool = False,
    archive: bool = False,
) -> Payload | None:
    if snapshot_date:
        payload = load_port_movements_snapshot(snapshot_date, port_code=port_code)
        if not payload:
            return None
    elif live:
        payload = fetch_live_port_movements_payload(port_code=port_code)
        if archive:
            payload = archive_existing_payload(payload, port_code=port_code)
    else:
        payload = get_latest_archived_snapshot(port_code=port_code)
        if not payload:
            payload = fetch_live_port_movements_payload(port_code=port_code)

    movements = payload.get("movements", {})
    cloned_payload: Payload = {
        **payload,
        "available_dates": list_available_snapshot_dates(port_code=port_code),
        "movements": trim_movements(movements, limit),
    }
    return cloned_payload


def build_recent_activity_series(
    port_code: str = DEFAULT_PORT_CODE,
    days: int = 7,
    live: bool = False,
    archive: bool = False,
) -> dict[str, Any]:
    days = max(1, min(days, 31))
    today = timezone.localdate()
    live_payload: Payload | None = None

    if live:
        live_payload = fetch_live_port_movements_payload(port_code=port_code)
        if archive:
            live_payload = archive_existing_payload(live_payload, port_code=port_code, snapshot_date=today)

    labels: list[str] = []
    activity_counts: list[int] = []
    arrivals_counts: list[int] = []
    in_port_counts: list[int] = []
    departures_counts: list[int] = []
    dates: list[str] = []

    for offset in range(days - 1, -1, -1):
        current_date = today - timedelta(days=offset)
        payload = live_payload if (live_payload and current_date == today) else load_port_movements_snapshot(current_date, port_code=port_code)
        summary: dict[str, Any] = dict(payload.get("summary", {})) if payload else {}

        arrivals = int(summary.get("expected_arrivals_count", 0) or 0)
        in_port = int(summary.get("in_port_count", 0) or 0)
        departures = int(summary.get("expected_departures_count", 0) or 0)

        labels.append(current_date.strftime("%a"))
        dates.append(current_date.isoformat())
        arrivals_counts.append(arrivals)
        in_port_counts.append(in_port)
        departures_counts.append(departures)
        activity_counts.append(arrivals + in_port + departures)

    return {
        "port": {
            "code": port_code.upper(),
            "name": PORT_LABELS.get(port_code.upper(), port_code.upper()),
        },
        "days": days,
        "dates": dates,
        "labels": labels,
        "series": {
            "activity": activity_counts,
            "arrivals": arrivals_counts,
            "in_port": in_port_counts,
            "departures": departures_counts,
        },
        "available_dates": list_available_snapshot_dates(port_code=port_code),
        "generated_at": timezone.now().isoformat(),
    }
