// schedule.js

// Simulated Database Data
const courses = [
    {
        title: "Web Development",
        instructor: "Dr. Ahmed",
        room: "Lab 3",
        day: 0,
        startHour: 9,
        duration: 2,
        color: "#3b82f6"
    },

    {
        title: "Database",
        instructor: "Dr. Sara",
        room: "Hall B",
        day: 1,
        startHour: 11,
        duration: 2,
        color: "#10b981"
    },

    {
        title: "AI",
        instructor: "Dr. Ali",
        room: "Room 204",
        day: 2,
        startHour: 1,
        duration: 2,
        color: "#f59e0b"
    },

    {
        title: "Networks",
        instructor: "Dr. Omar",
        room: "Lab 1",
        day: 3,
        startHour: 10,
        duration: 3,
        color: "#ef4444"
    }
];

const scheduleGrid = document.getElementById("scheduleGrid");

// Draw Courses
function renderCourses() {

    courses.forEach(course => {

        const card = document.createElement("div");
        card.classList.add("course-card");

        // Grid positioning
        const columnWidth = scheduleGrid.offsetWidth / 5;

        const top =
            50 + ((course.startHour - 8) * 100);

        const left =
            course.day * columnWidth;

        const height =
            course.duration * 100;

        card.style.top = `${top}px`;
        card.style.left = `${left}px`;
        card.style.width = `${columnWidth - 10}px`;
        card.style.height = `${height}px`;
        card.style.background = course.color;

        card.innerHTML = `
      <div class="course-title">${course.title}</div>
      <div class="course-time">
        ${course.startHour}:00
      </div>
    `;

        // Click Event
        card.addEventListener("click", () => {
            showPopup(course);
        });

        scheduleGrid.appendChild(card);
    });

}

// Popup Logic
const popup = document.getElementById("popup");

function showPopup(course) {

    document.getElementById("popupTitle").textContent =
        course.title;

    document.getElementById("popupInstructor").textContent =
        `Instructor: ${course.instructor}`;

    document.getElementById("popupRoom").textContent =
        `Room: ${course.room}`;

    document.getElementById("popupTime").textContent =
        `Starts at: ${course.startHour}:00`;

    popup.classList.remove("hidden");
}

document.getElementById("closeBtn")
    .addEventListener("click", () => {
        popup.classList.add("hidden");
    });

// Mobile Toggle
const toggleBtn =
    document.getElementById("toggleViewBtn");

toggleBtn.addEventListener("click", () => {

    scheduleGrid.classList.toggle("daily-view");

    if (scheduleGrid.classList.contains("daily-view")) {
        toggleBtn.textContent =
            "Switch To Weekly View";
    } else {
        toggleBtn.textContent =
            "Switch To Daily View";
    }

});

// Render on load
renderCourses();

// Responsive Fix
window.addEventListener("resize", () => {

    document
        .querySelectorAll(".course-card")
        .forEach(card => card.remove());

    renderCourses();

});