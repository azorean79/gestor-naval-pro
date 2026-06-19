from django.urls import path
from .views import (
    home, RegisterView, LoginView,
    VesselListView, PortListView, VoyageListView, EventListView, VoyageTrackView,
    RiskZoneListView, DashboardStatsView, PortMovementSnapshotView, PortMovementActivityView, get_analyst_analytics,
    get_all_users, get_audit_logs, delete_user, toggle_user_status, update_user_role,
    get_alerts, update_alert_status, create_alert
)

urlpatterns = [
    path("", home),
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("vessels/", VesselListView.as_view()),
    path("ports/", PortListView.as_view()),
    path("voyages/", VoyageListView.as_view()),
    path("events/", EventListView.as_view()),
    path("voyage-track/<int:voyage_id>/", VoyageTrackView.as_view()),
    path("dashboard/", DashboardStatsView.as_view()),
    path("port-movements/", PortMovementSnapshotView.as_view()),
    path("port-movements/activity/", PortMovementActivityView.as_view()),
    path("risks/", RiskZoneListView.as_view()),
    path("analytics/", get_analyst_analytics),
    
    # Admin Panel
    path("users/", get_all_users), 
    path("audit-logs/", get_audit_logs),
    path("users/<int:user_id>/delete/", delete_user),
    path("users/<int:user_id>/status/", toggle_user_status),
    path("users/<int:user_id>/role/", update_user_role),

    # Alerts System
    path("alerts/", get_alerts),
    path("alerts/create/", create_alert), # ✅ NEW
    path("alerts/<int:alert_id>/status/", update_alert_status),
]