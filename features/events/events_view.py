from datetime import datetime, timedelta
from flask import Blueprint, render_template, request, flash
from features.events import events_repository
from libs.auth.require_auth import require_auth
from libs.auth.team_required import team_required
from libs.context.user_context import get_active_team_id
from libs.logging.logging import logger

events_bp = Blueprint('events', __name__)


@events_bp.route('/calendar', methods=['GET'])
@require_auth
@team_required
def display_calendar():
    return render_template("events/display-monthly-events.html")


@events_bp.route('/calendar/range', methods=['GET'])
@require_auth
@team_required
def get_events_by_range():
    try:
        start_str = request.args.get('start')
        end_str = request.args.get('end')
        start = datetime.fromisoformat(start_str)
        end = datetime.fromisoformat(end_str)

        events = events_repository.get_events_in_range(start, end, get_active_team_id())

        calendar_events = []
        for event in events:
            start_dt = event.date  # assuming event.date is a datetime object
            end_dt = start_dt + timedelta(minutes=event.duration if event.duration else 0)

            calendar_events.append({
                'id': event.id,
                'title': event.name,
                'start': start_dt.isoformat(),  # 'YYYY-MM-DDTHH:MM:SS'
                'end': end_dt.isoformat(),
                'details': event.details,
                'location': event.location
            })

        return {'events': calendar_events}, 200
    except Exception as e:
        logger.error(f"Error fetching calendar events: {e}")
        return {'events': [], 'error': 'Error loading calendar events'}, 500


@events_bp.route('/create', methods=['GET', 'POST'])
@require_auth
@team_required
def create_event():
    if request.method == 'POST':
        try:
            name = request.form['name']
            details = request.form['details']
            location = request.form['location']
            duration = int(request.form['duration'])

            # Expecting a full datetime string from the form (e.g., "2025-08-02 15:30:00")
            datetime_str = request.form['datetime']
            event_datetime = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M')

            events_repository.create_event(
                name, details, event_datetime, location,
                duration, get_active_team_id()
            )

            flash("Event created successfully!")
            return render_template("events/create-event.html", success=True)
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            flash("Error creating event. Please check your input and try again.")
            return render_template("events/create-event.html", error=True)

    return render_template("events/create-event.html")
