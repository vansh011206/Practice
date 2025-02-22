// Declare chart instances
let historicalChartInstance = null;
let pieChartInstance = null;

// Popup elements
const popup = document.getElementById("popup");
const popupText = document.getElementById("popup-text");
const closePopupButton = document.getElementById("close-popup");

closePopupButton.addEventListener("click", () => {
  popup.style.display = "none";
});

function showPopupMessage(message) {
  popupText.textContent = message;
  popup.style.display = "flex";
}

async function fetchPandemicData(pandemic, country = "global") {
  try {
    const url =
      pandemic === "covid19"
        ? `https://disease.sh/v3/covid-19/${
            country === "global" ? "all" : `countries/${country}`
          }`
        : `https://api.mockpandemics.com/${pandemic}/${country}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    const countryName = document.getElementById("country-name");
    const countryFlag = document.getElementById("country-flag");
    const activeCases = document.getElementById("active-cases");
    const recoveredCases = document.getElementById("recovered");
    const deathsCases = document.getElementById("deaths");
    const vaccinated = document.getElementById("vaccinated");

    // Update DOM elements
    activeCases.innerHTML = `${data.active.toLocaleString()}`;
    recoveredCases.innerHTML = `${data.recovered.toLocaleString()}`;
    deathsCases.innerHTML = `${data.deaths.toLocaleString()}`;
    vaccinated.innerHTML = `${data.tests.toLocaleString()}`;
    countryName.innerHTML = `COVID-19 data for ${country}`;
    countryFlag.innerHTML = `<img src="${data.countryInfo.flag}" />`;

    // Update the pie chart dynamically
    renderPieChart(data.active, data.recovered, data.deaths, data.tests);

    // Highlight country on map
    if (country !== "global") {
      highlightCountry(country);
    }
  } catch (error) {
    console.error("Error fetching pandemic data:", error.message);
  }
}

// Initialize the map globally
let map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

async function fetchGeoJSON() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
    );
    if (!response.ok) throw new Error("Failed to fetch GeoJSON data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching GeoJSON:", error.message);
  }
}

async function highlightCountry(selectedCountry) {
  const geoData = await fetchGeoJSON();
  if (!geoData) return;

  // Remove previous layers
  map.eachLayer((layer) => {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });

  const filteredData = {
    type: "FeatureCollection",
    features: geoData.features.filter(
      (feature) =>
        feature.properties.name.toLowerCase() === selectedCountry.toLowerCase()
    ),
  };

  L.geoJSON(filteredData, {
    style: {
      color: "#FF5733",
      weight: 2,
      fillOpacity: 0.4,
    },
  }).addTo(map);

  if (filteredData.features.length > 0) {
    const bounds = L.geoJSON(filteredData).getBounds();
    map.fitBounds(bounds);
  } else {
    showPopupMessage("Country not found in the GeoJSON data.");
  }
}

async function fetchHistoricalData(country = "global") {
  try {
    const url =
      country === "global"
        ? "https://disease.sh/v3/covid-19/historical/all?lastdays=900"
        : `https://disease.sh/v3/covid-19/historical/${country}?lastdays=900`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    const timeline = country === "global" ? data : data.timeline;

    if (!timeline || !timeline.cases) throw new Error("Missing data");

    const dates = Object.keys(timeline.cases);
    const cases = Object.values(timeline.cases);
    const deaths = Object.values(timeline.deaths);
    const recovered = Object.values(timeline.recovered);

    renderChart(dates, cases, deaths, recovered, country);
  } catch (error) {
    console.error("Error fetching historical data:", error.message);
  }
}

function renderChart(dates, cases, deaths, recovered, country) {
  const ctx = document.getElementById("infectionRateChart").getContext("2d");

  if (historicalChartInstance) {
    historicalChartInstance.destroy();
  }

  historicalChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        { label: "Cases", data: cases, borderColor: "blue", fill: false },
        { label: "Deaths", data: deaths, borderColor: "red", fill: false },
        {
          label: "Recovered",
          data: recovered,
          borderColor: "green",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `COVID-19 Historical Data for ${country}`,
        },
      },
    },
  });
}

function renderPieChart(active, recovered, deaths, vaccinated) {
  const ctx = document
    .getElementById("resourceAvailabilityChart")
    .getContext("2d");

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Active Cases", "Recovered", "Deaths", "Vaccinated"],
      datasets: [
        {
          data: [active, recovered, deaths, vaccinated],
          backgroundColor: ["pink", "green", "red", "purple"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "COVID-19 Distribution",
        },
      },
    },
  });
}

async function populateCountryDropdown() {
  try {
    const response = await fetch("https://disease.sh/v3/covid-19/countries");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const countries = await response.json();
    const select = document.getElementById("country-select");
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.country;
      option.textContent = country.country;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating country dropdown:", error.message);
  }
}

document
  .getElementById("country-select")
  .addEventListener("change", (event) => {
    const selectedCountry = event.target.value;
    fetchPandemicData("covid19", selectedCountry);
    fetchHistoricalData(selectedCountry);
  });

window.onload = async () => {
  await populateCountryDropdown();
  fetchPandemicData("covid19","india"); // Fetch global data on page load

};
