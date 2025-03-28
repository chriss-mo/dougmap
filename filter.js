import { updateMap, displayResults } from './map.js';

document.addEventListener('DOMContentLoaded', function() {
    Papa.parse('ds_geo.csv', {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data.map(car => {
                // Cast specific columns as integers
                car.Styling = parseInt(car.Styling, 10) || 0;
                car.Acceleration = parseInt(car.Acceleration, 10) || 0;
                car.Handling = parseInt(car.Handling, 10) || 0;
                car['Fun Factor'] = parseInt(car['Fun Factor'], 10) || 0;
                car['Cool Factor'] = parseInt(car['Cool Factor'], 10) || 0;
                car.Total_Weekend = parseInt(car.Total_Weekend, 10) || 0;
                car.Features = parseInt(car.Features, 10) || 0;
                car.Comfort = parseInt(car.Comfort, 10) || 0;
                car.Quality = parseInt(car.Quality, 10) || 0;
                car.Practicality = parseInt(car.Practicality, 10) || 0;
                car.Value = parseInt(car.Value, 10) || 0;
                car.Total_Daily = parseInt(car.Total_Daily, 10) || 0;
                car.Total_Overall = parseInt(car.Total_Overall, 10) || 0;
                return car;
            });

            const makes = ["All", ...new Set(data.map(car => car.Make))];
            const modelsByMake = getModelsByMake(data);
            const years = ["All", ...generateYearRanges(1980, 2025)];

            populateDropdown('make', makes);
            populateDropdown('model', ["All"]);
            populateDropdown('year', years);

            // Show the full table by default
            displayResults(null, null, data);

            document.getElementById('make').addEventListener('change', function() {
                const selectedMake = this.value;
                const models = selectedMake === "All" ? ["All"] : ["All", ...modelsByMake[selectedMake] || []];
                populateDropdown('model', models, true);
                filterAndDispatch(data);
            });

            document.getElementById('model').addEventListener('change', function() {
                filterAndDispatch(data);
            });

            document.getElementById('year').addEventListener('change', function() {
                filterAndDispatch(data);
            });

            // Add event listener for the Clear button
            document.getElementById('clearButton').addEventListener('click', function() {
                clearFilters(data);
            });
        }
    });
});

function filterAndDispatch(data) {
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const yearRange = document.getElementById('year').value;

    const filteredData = data.filter(car => {
        const carYear = parseInt(car.Year, 10); // Convert car's year to an integer

        // Parse the selected year range
        let yearMatch = true;
        if (yearRange !== "All") {
            const [startYear, endYear] = yearRange.split('-').map(Number); // Extract start and end years
            yearMatch = carYear >= startYear && carYear <= endYear; // Check if car's year is within the range
        }

        return (make === "All" || car.Make === make) &&
               (model === "All" || car.Model === model) &&
               yearMatch; // Include the year match condition
    });

    updateMap(filteredData);
    displayResults(null, null, filteredData);
}

function getModelsByMake(data) {
    const modelsByMake = {};
    data.forEach(car => {
        if (!modelsByMake[car.Make]) {
            modelsByMake[car.Make] = [];
        }
        if (!modelsByMake[car.Make].includes(car.Model)) {
            modelsByMake[car.Make].push(car.Model);
        }
    });
    return modelsByMake;
}

function populateDropdown(id, options, clear = false) {
    const select = document.getElementById(id);
    if (clear) {
        select.innerHTML = '';
    }

    const sortedOptions = options.filter(option => option !== "All").sort();
    if (options.includes("All")) {
        sortedOptions.unshift("All");
    }

    sortedOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

function generateYearRanges(startYear, endYear) {
    const ranges = [];
    for (let year = startYear; year <= endYear; year += 10) {
        ranges.push(`${year}-${year + 9}`);
    }
    return ranges;
}

function clearFilters(data) {
    // Reset all dropdowns to "All"
    document.getElementById('make').value = "All";
    document.getElementById('model').value = "All";
    document.getElementById('year').value = "All";

    // Trigger the filtering logic with all filters reset
    filterAndDispatch(data);
}