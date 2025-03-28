mapboxgl.accessToken = 'pk.eyJ1IjoiY3MtbW8iLCJhIjoiY203ZWRiYWtzMGRwcTJqbzR3emdjajZkcSJ9.dWLdOuRijgHLqQMD6YLtuw';

let activePopup = null; // Track the currently active popup
let markers = []; // Store markers globally
let fullData = []; // Store the full dataset globally

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-98.5795, 39.8283], // Center of the US
    zoom: 3
});

// Export the updateMap function
export function updateMap(data) {
    // Remove existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Group data by city and state
    const groupedData = data.reduce((acc, car) => {
        const key = `${car.Film_City}, ${car.Film_State}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(car);
        return acc;
    }, {});

    // Find the maximum count of cars in any city
    const maxCount = Math.max(...Object.values(groupedData).map(group => group.length));

    // Add new markers
    Object.keys(groupedData).forEach(key => {
        const [city, state] = key.split(', ');
        const observations = groupedData[key];
        const { lat, lng } = observations[0]; // Assuming all observations in the same city have the same lat/lng

        if (lat && lng) {
            const color = getColor(observations.length, maxCount); // Use the updated getColor function
            const popup = new mapboxgl.Popup({ 
                offset: 25, 
                closeButton: false, 
                maxWidth: '300px', // Constrain popup width
                anchor: 'top', // Position the popup above the marker
                className: 'custom-popup' // Add a custom class
            }).setHTML(`
                <div class="popup-content">
                    <h4>${city}, ${state}</h4>
                    <p><strong>Cars:</strong> ${observations.length}</p>
                </div>
            `);
            const marker = new mapboxgl.Marker({ color }) // Color based on number of cars
                .setLngLat([parseFloat(lng), parseFloat(lat)])
                .addTo(map);

            marker.getElement().addEventListener('mouseenter', () => {
                popup.addTo(map);
                popup.setLngLat(marker.getLngLat());

                // Dynamically reposition the popup if it is cropped
                adjustPopupPosition(popup, marker.getLngLat());
            });

            marker.getElement().addEventListener('mouseleave', () => {
                popup.remove();
            });

            marker.getElement().addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the map click event from firing

                // Close any previously active popup
                if (activePopup) {
                    activePopup.remove();
                }

                // Set the new active popup
                activePopup = popup;
                popup.addTo(map);

                // Dynamically reposition the popup if it is cropped
                adjustPopupPosition(popup, marker.getLngLat());

                displayResults(city, state, observations);
                map.resize(); // Ensure the map resizes correctly
            });

            markers.push(marker);
        }
    });
}

// Add a click event listener to the map to clear the table when clicking outside a marker
map.on('click', () => {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p style="text-align: center; color: #888;">Click on a point to see details</p>'; // Placeholder message
});

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    Papa.parse('ds_geo.csv', {
        download: true,
        header: true,
        complete: function(results) {
            fullData = results.data; // Store the full dataset
            updateMap(fullData); // Initialize the map with all data
            displayResults(null, null, fullData); // Show all results in the table
        }
    });

    // Add event listener for the Clear button
    document.getElementById('clearButton').addEventListener('click', function() {
        // Clear the active popup
        if (activePopup) {
            activePopup.remove();
            activePopup = null; // Reset the active popup reference
        }

        // Reset the dropdowns to "All"
        document.getElementById('make').value = "All";
        document.getElementById('model').value = "All";
        document.getElementById('year').value = "All";

        // Reset the table to show all results
        displayResults(null, null, fullData); // Use the full dataset

        // Reset the map to show all markers
        updateMap(fullData); // Use the full dataset
    });
});

function getColor(count, maxCount) {
    // Create a logarithmic scale for better distribution of colors
    const logScale = d3.scaleLog()
        .domain([1, maxCount]) // Input range: 1 to maxCount
        .range([0, 1]); // Output range: 0 to 1 (for interpolation)

    // Use a continuous color scale with Tableau colors
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu) // Replace with a Tableau-like gradient
        .domain([0, 1]); // Input range for normalized values

    return colorScale(logScale(count)); // Map the normalized count to a color
}

export function displayResults(city = null, state = null, observations) {
    const resultsContainer = document.getElementById('results');
    const count = observations.length; // Get the number of observations

    resultsContainer.innerHTML = `
        ${city && state 
            ? `<h3>${city}, ${state} (${count})</h3>` 
            : `<h3>All Results (${count})</h3>`}
        <table>
            <thead>
                <tr>
                    <th>Year</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Styling</th>
                    <th>Acceleration</th>
                    <th>Handling</th>
                    <th>Fun Factor</th>
                    <th>Cool Factor</th>
                    <th>Total Weekend</th>
                    <th>Features</th>
                    <th>Comfort</th>
                    <th>Quality</th>
                    <th>Practicality</th>
                    <th>Value</th>
                    <th class="highlight-column">Total Daily</th>
                    <th class="highlight-column">DougScore</th>
                </tr>
            </thead>
            <tbody>
                ${observations.map(car => `
                    <tr>
                        <td>${car.Year}</td>
                        <td>${car.Make}</td>
                        <td>${car.Model}</td>
                        <td>${car.Styling}</td>
                        <td>${car.Acceleration}</td>
                        <td>${car.Handling}</td>
                        <td>${car['Fun Factor']}</td>
                        <td>${car['Cool Factor']}</td>
                        <td class="wknd-column">${car.Total_Weekend}</td>
                        <td>${car.Features}</td>
                        <td>${car.Comfort}</td>
                        <td>${car.Quality}</td>
                        <td>${car.Practicality}</td>
                        <td>${car.Value}</td>
                        <td class="daily-column">${car.Total_Daily}</td>
                        <td class="ds-column">${car.Total_Overall}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function adjustPopupPosition(popup, lngLat) {
    const mapBounds = map.getCanvas().getBoundingClientRect(); // Get the map's boundaries
    const popupElement = popup.getElement(); // Get the popup's DOM element
    const popupBounds = popupElement.getBoundingClientRect(); // Get the popup's boundaries

    let offsetX = 0;
    let offsetY = 0;

    // Check if the popup is cropped on the left
    if (popupBounds.left < mapBounds.left) {
        offsetX = mapBounds.left - popupBounds.left + 10; // Add padding
    }

    // Check if the popup is cropped on the right
    if (popupBounds.right > mapBounds.right) {
        offsetX = mapBounds.right - popupBounds.right - 10; // Add padding
    }

    // Check if the popup is cropped on the top
    if (popupBounds.top < mapBounds.top) {
        offsetY = mapBounds.top - popupBounds.top + 10; // Add padding
    }

    // Check if the popup is cropped on the bottom
    if (popupBounds.bottom > mapBounds.bottom) {
        offsetY = mapBounds.bottom - popupBounds.bottom - 10; // Add padding
    }

    // Apply the offset to reposition the popup
    popup.setOffset([offsetX, offsetY]);
}