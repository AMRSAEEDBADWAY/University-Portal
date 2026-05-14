// GPA Line Chart
const ctx = document.getElementById('gpaChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'],
        datasets: [{
            label: 'GPA',
            data: [3.4, 3.6, 3.8, 3.85],
            borderColor: '#6C5CE7',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(108, 92, 231, 0.1)'
        }]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
});

// Radar Chart
const radarCtx = document.getElementById('radarChart').getContext('2d');
new Chart(radarCtx, {
    type: 'radar',
    data: {
        labels: ['Programming', 'Mathematics', 'Database', 'Logic', 'English', 'Management'],
        datasets: [{
            label: 'Skills',
            data: [95, 80, 90, 85, 75, 70],
            borderColor: '#00CEC9',
            backgroundColor: 'rgba(0, 206, 201, 0.2)'
        }]
    },
    options: {
        scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, angleLines: { color: 'rgba(255,255,255,0.1)' } } }
    }
});
