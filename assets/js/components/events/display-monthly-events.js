import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { debounceTime, distinctUntilChanged, fromEvent, map } from "rxjs";

document.addEventListener("alpine:init", () => {
    Alpine.data("calendarData", () => {
        return {
            createEvent() {
                window.location.href="/events/create"
            }
        }
    })
})

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const isMobile = window.innerWidth < 640;

    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin, listPlugin],
        initialView: isMobile ? 'listWeek' : 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: isMobile ? 'listWeek,dayGridMonth' : 'dayGridMonth',
        },
        events: function(info, successCallback, failureCallback) {
            fetch(`/events/calendar/range?start=${info.start.toISOString()}&end=${info.end.toISOString()}`)
                .then(response => response.json())
                .then(data => successCallback(data.events))
                .catch(error => failureCallback(error));
        },
        eventClick(info) {
            const modal = document.getElementById('eventModal');
            const detailsDiv = document.getElementById('eventDetails');

            detailsDiv.innerHTML = `
                <h3 class="text-lg font-bold mb-2">${info.event.title}</h3>
                <p class="mb-2"><strong>Date:</strong> ${info.event.start.toLocaleDateString()}</p>
                <p class="mb-2"><strong>Location:</strong> ${info.event.extendedProps.location}</p>
                <p class="mb-2"><strong>Duration:</strong> ${info.event.extendedProps.duration} minutes</p>
                <p class="mb-4"><strong>Details:</strong> ${info.event.extendedProps.details}</p>
                <button onclick="document.getElementById('eventModal').classList.add('hidden')"
                        class="bg-blue-600 text-white px-4 py-2 rounded">
                    Close
                </button>
            `;
            modal.classList.remove('hidden');
        },
    });

    calendar.render();

    // RxJS: Responsive view switcher with debounce
    fromEvent(window, 'resize')
        .pipe(
            debounceTime(400),
            map(() => window.innerWidth < 640 ? 'listWeek' : 'dayGridMonth'),
            distinctUntilChanged()
        )
        .subscribe((newView) => {
            if (calendar.view.type !== newView) {
                calendar.changeView(newView);
            }
        });
});
