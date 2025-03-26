mapboxgl.accessToken = 'pk.eyJ1IjoiY3MtbW8iLCJhIjoiY203ZWRiYWtzMGRwcTJqbzR3emdjajZkcSJ9.dWLdOuRijgHLqQMD6YLtuw';

document.addEventListener('DOMContentLoaded', function() {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.5795, 39.8283], // Center of the US
        zoom: 4
    });

    let markers = [];

    function updateMap(data) {
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

        // Add new markers
        Object.keys(groupedData).forEach(key => {
            const [city, state] = key.split(', ');
            const observations = groupedData[key];
            const { lat, lng } = observations[0]; // Assuming all observations in the same city have the same lat/lng

            if (lat && lng) {
                const color = getColor(observations.length);
                const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setText(`${city}, ${state}\nCars: ${observations.length}`);
                const marker = new mapboxgl.Marker({ color }) // Color based on number of cars
                    .setLngLat([parseFloat(lng), parseFloat(lat)])
                    .addTo(map);

                marker.getElement().addEventListener('mouseenter', () => {
                    popup.addTo(map);
                    popup.setLngLat(marker.getLngLat());
                });

                marker.getElement().addEventListener('mouseleave', () => {
                    popup.remove();
                });

                marker.getElement().addEventListener('click', () => {
                    displayResults(observations);
                });

                markers.push(marker);
            }
        });
    }

    document.addEventListener('filteredData', function(event) {
        updateMap(event.detail);
    });

    // Initial load
    Papa.parse('ds_geo.csv', {
        download: true,
        header: true,
        complete: function(results) {
            updateMap(results.data);
        }
    });
});

function getColor(count) {
    if (count > 20) return 'red';
    if (count > 10) return 'orange';
    if (count > 5) return 'yellow';
    return 'green';
}

function displayResults(observations) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>City</th>
                    <th>State</th>
                </tr>
            </thead>
            <tbody>
                ${observations.map(car => `
                    <tr>
                        <td>${car.Make}</td>
                        <td>${car.Model}</td>
                        <td>${car.Year}</td>
                        <td>${car.Film_City}</td>
                        <td>${car.Film_State}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}