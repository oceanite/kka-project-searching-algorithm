// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  const startSelect = document.getElementById("start");
  const endSelect = document.getElementById("end");

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

  // Populate the dropdowns with places from places.json
  async function populateDropdowns() {
    try {
      const response = await fetch("/static/js/places.json");
      if (!response.ok) {
        throw new Error(`Error fetching places.json: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded places:", data);

      data.places.forEach((place) => {
        // Create options for the Start dropdown
        const startOption = document.createElement("option");
        startOption.value = JSON.stringify(place.coordinates); // Store coordinates as a string
        startOption.innerText = place.name;
        startSelect.appendChild(startOption);

        // Create options for the End dropdown
        const endOption = document.createElement("option");
        endOption.value = JSON.stringify(place.coordinates); // Store coordinates as a string
        endOption.innerText = place.name;
        endSelect.appendChild(endOption);
      });

      console.log("Dropdowns populated successfully.");
    } catch (error) {
      console.error("Failed to populate dropdowns:", error);
    }
  }

  // Handle the "Find Route" button click
  document
    .getElementById("findRouteBtn")
    .addEventListener("click", async () => {
      const startSelect = document.getElementById("start");
      const endSelect = document.getElementById("end");

      // Get the selected coordinates from the dropdown menus
      const startCoords = JSON.parse(startSelect.value);
      const endCoords = JSON.parse(endSelect.value);
      console.log("start coordinate : " + startCoords);
      console.log("end coordinate : " + endCoords);
      // Construct the routeData object
      const routeData = {
        start: startCoords,
        end: endCoords,
      };

      try {
        // Send coordinates to the backend for route calculation
        const routeResponse = await fetch("http://127.0.0.1:5000/find_route", {
          // Corrected URL
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(routeData),
        });

        // Check if the response is OK (status 200)
        if (!routeResponse.ok) {
          console.error("HTTP error:", routeResponse.status);
          alert("Error fetching the route from the server.");
          return;
        } else {
          console.log("success fetching the route");
        }

        // Parse the response as JSON
        const routeDataResponse = await routeResponse.json();
        console.log("Route received:", routeDataResponse);

        // Add or update markers on the map
        addMarkers(startCoords, endCoords);

        // Draw the route on the map if it's valid
        if (routeDataResponse.route) {
          let latlngs = routeDataResponse.route.map((coord) => [
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

  // Populate the dropdowns on page load
  populateDropdowns();
});
