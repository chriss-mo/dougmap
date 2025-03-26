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
        }
    });
});

function filterAndDispatch(data) {
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value;

    console.log('Selected Make:', make);
    console.log('Selected Model:', model);
    console.log('Selected Year:', year);

    const filteredData = data.filter(car => {
        const carYear = parseInt(car.Year);
        const [startYear, endYear] = year === "All" ? [0, Infinity] : year.split('-').map(y => parseInt(y));

        console.log('Car Year:', carYear);
        console.log('Start Year:', startYear, 'End Year:', endYear);

        return (make === "All" || car.Make === make) &&
               (model === "All" || car.Model === model) &&
               (year === "All" || (carYear >= startYear && carYear <= endYear));
    });

    console.log('Filtered Data:', filteredData);

    const event = new CustomEvent('filteredData', { detail: filteredData });
    document.dispatchEvent(event);
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
    options.forEach(option => {
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