document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tableBody = document.querySelector('tbody');
    const rows = tableBody ? Array.from(tableBody.querySelectorAll('tr')) : [];

    if (searchInput && rows.length > 0) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
