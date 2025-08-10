import {Calendar} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {debounceTime, distinctUntilChanged, fromEvent, map} from "rxjs";

document.addEventListener("alpine:init", () => {
    Alpine.data("calendarData", () => {
        return {
            createEvent() {
                window.location.href = "/events/create";
            }
        }
    })
});

document.addEventListener("DOMContentLoaded", function () {
    const calendarEl = document.getElementById("calendar");
    const isMobile = window.innerWidth < 640;
    const closeBtn = document.getElementById("closeModalBtn");
    const modal = document.getElementById("eventModal");
    const detailsDiv = document.getElementById("eventDetails");

    let selectedEventId = null;

    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin, listPlugin],
        initialView: isMobile ? "listWeek" : "dayGridMonth",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: isMobile ? "listWeek,dayGridMonth" : "dayGridMonth",
        },
        events: function (info, successCallback, failureCallback) {
            fetch(`/events/calendar/range?start=${info.start.toISOString()}&end=${info.end.toISOString()}`)
                .then(response => response.json())
                .then(data => successCallback(data.events))
                .catch(error => failureCallback(error));
        },
        eventClick: function (info) {
            selectedEventId = info.event.id;

            // Build event content
            detailsDiv.innerHTML = `
                <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-white">${info.event.title}</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Location:</strong> ${info.event.extendedProps.location}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Details:</strong> ${info.event.extendedProps.details}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Start:</strong> ${info.event.start.toLocaleString()}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>End:</strong> ${info.event.end?.toLocaleString() ?? "N/A"}</p>
            `;

            // Attach the delete handler if the button exists
            const deleteBtn = document.getElementById("deleteEventBtn");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation(); // prevent modal click handlers from firing
                    e.preventDefault();  // just in case
                    if (!confirm("Are you sure you want to delete this event?")) {
                        return;
                    }

                    const csrfTokenInput = document.querySelector('input[name="csrf_token"]');
                    const csrfToken = csrfTokenInput ? csrfTokenInput.value : "";

                    try {
                        const res = await fetch(`/events/${selectedEventId}`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded",
                            },
                            body: `csrf_token=${encodeURIComponent(csrfToken)}`,
                        });

                        if (res.ok) {
                            modal.remove();
                            calendar.refetchEvents();
                        } else {
                            console.error("Failed to delete event:", await res.text());
                        }
                    } catch (err) {
                        console.error("Error deleting event:", err);
                    }
                });
            }

            modal.classList.remove("hidden");
        }
    });

    calendar.render();

    // Close button
    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // RxJS responsive view switch
    fromEvent(window, "resize")
        .pipe(
            debounceTime(400),
            map(() => window.innerWidth < 640 ? "listWeek" : "dayGridMonth"),
            distinctUntilChanged()
        )
        .subscribe((newView) => {
            if (calendar.view.type !== newView) {
                calendar.changeView(newView);
            }
        });
});
