// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  const startSearchInput = document.getElementById("startSearch");
  const startResultsContainer = document.getElementById("startResults");

  const endSearchInput = document.getElementById("endSearch");
  const endResultsContainer = document.getElementById("endResults");

  let places = []; // To store all places loaded from places.json

  // Load places from places.json
  async function loadPlaces() {
    try {
      const response = await fetch("/static/js/places.json");
      if (!response.ok) {
        throw new Error(`Error fetching places.json: ${response.status}`);
      }
      const data = await response.json();
      console.log("Loaded places:", data);
      places = data.places; // Save places for later use
    } catch (error) {
      console.error("Failed to load places:", error);
    }
  }

  // Display autocomplete suggestions
  function showSuggestions(inputElement, resultsContainer, query) {
    resultsContainer.innerHTML = ""; // Clear existing suggestions

    if (query.trim() === "") return; // If query is empty, don't show anything

    const filteredPlaces = places.filter((place) =>
      place.name.toLowerCase().includes(query.toLowerCase())
    );

    // Populate the suggestions container
    filteredPlaces.forEach((place) => {
      const suggestionItem = document.createElement("div");
      suggestionItem.classList.add("suggestion-item");
      suggestionItem.innerText = place.name;
      suggestionItem.dataset.coordinates = JSON.stringify(place.coordinates);

      // Add click event to fill input and hide suggestions
      suggestionItem.addEventListener("click", () => {
        inputElement.value = place.name; // Set the input value
        inputElement.dataset.coordinates = suggestionItem.dataset.coordinates; // Store coordinates in the input
        resultsContainer.innerHTML = ""; // Clear suggestions
      });

      resultsContainer.appendChild(suggestionItem);
    });
  }

  // Add event listeners to the start and end search inputs
  startSearchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    showSuggestions(startSearchInput, startResultsContainer, query);
  });

  endSearchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    showSuggestions(endSearchInput, endResultsContainer, query);
  });

  // Initialize the map and set a default view
  const map = L.map("map").setView([-7.2819, 112.7945], 16); // Default: Main Gate coordinates

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  // Store markers for start and end points
  let startMarker = null;
  let endMarker = null;
  let routeLayer = null;

  // Function to add or update markers on the map
  function addMarkers(startCoords, endCoords) {
    // Clear existing route if present
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }

    // Add or update the start marker
    if (startMarker) {
      startMarker.setLatLng(startCoords);
    } else {
      startMarker = L.marker(startCoords)
        .addTo(map)
        .bindPopup("Start Point")
        .openPopup();
    }

    // Add or update the end marker
    if (endMarker) {
      endMarker.setLatLng(endCoords);
    } else {
      endMarker = L.marker(endCoords)
        .addTo(map)
        .bindPopup("End Point")
        .openPopup();
    }

    // Adjust the map view to fit both markers
    map.fitBounds([startCoords, endCoords]);
  }

  // Handle the "Find Route" button click
  document
    .getElementById("findRouteBtn")
    .addEventListener("click", async () => {
      const startCoords = JSON.parse(
        startSearchInput.dataset.coordinates || null
      );
      const endCoords = JSON.parse(endSearchInput.dataset.coordinates || null);

      if (!startCoords || !endCoords) {
        alert("Please select both start and end points from the suggestions.");
        return;
      }

      console.log("Start coordinates:", startCoords);
      console.log("End coordinates:", endCoords);

      const routeData = { start: startCoords, end: endCoords };

      try {
        const routeResponse = await fetch("http://127.0.0.1:5000/find_route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(routeData),
        });

        if (!routeResponse.ok) {
          alert("Error fetching the route from the server.");
          return;
        }

        const routeDataResponse = await routeResponse.json();
        console.log("Route received:", routeDataResponse);

        // Add or update markers on the map
        addMarkers(startCoords, endCoords);

        // Draw the route on the map if it's valid
        if (routeDataResponse.route) {
          const latlngs = routeDataResponse.route.map((coord) => [
            coord[0],
            coord[1],
          ]);
          routeLayer = L.polyline(latlngs, { color: "blue" }).addTo(map);
        } else {
          alert("No route found.");
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        alert("An error occurred while fetching the route.");
      }
    });

  // Load the places data when the page is ready
  loadPlaces();
});
