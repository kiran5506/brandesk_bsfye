// utils/formatDate.js
function formatTimestamp(timestamp) {
    const date = new Date(timestamp); // Create a Date object from the timestamp
    console.log('date format', date)

    // Check if the date is valid
    if (isNaN(date)) {
        throw new Error('Invalid date format');
    }

    // Get day, month, year, hours, minutes, and period (AM/PM)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12; // Convert 24-hour format to 12-hour
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

    // Format as dd-mm-YYYY h:i a
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
}

module.exports = { formatTimestamp };
