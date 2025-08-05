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
    const closeBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('eventModal');

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
        eventClick: function (info) {
            // Build event content with Tailwind + dark mode support
            const eventModal = document.getElementById('eventModal');
            const detailsDiv = document.getElementById('eventDetails');
            detailsDiv.innerHTML = `
                <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-white">${info.event.title}</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Location:</strong> ${info.event.extendedProps.location}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Details:</strong> ${info.event.extendedProps.details}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Start:</strong> ${info.event.start.toLocaleString()}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>End:</strong> ${info.event.end?.toLocaleString() ?? 'N/A'}</p>
            `;

            // Show the modal
            eventModal.classList.remove('hidden');
        }
    });

    calendar.render();

    // Close button functionality
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

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
