import { updateMap, displayResults } from './map.js';

document.addEventListener('DOMContentLoaded', function() {
    Papa.parse('ds_geo.csv', {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
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
                document.getElementById('make').value = "All";
                document.getElementById('model').value = "All";
                document.getElementById('year').value = "All";
                displayResults(null, null, data); // Reset the table to show all results
            });
        }
    });
});

function filterAndDispatch(data) {
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value;

    const filteredData = data.filter(car => {
        return (make === "All" || car.Make === make) &&
               (model === "All" || car.Model === model) &&
               (year === "All" || car.Year === year);
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