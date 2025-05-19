
/**
 * Zurich SenseBox Map – Interactive Web App (script.js)
 * -----------------------------------------------------
 * Main Functional Components:
 * 
 * 1. getRenderer(field, symbolStyle)
 *    - Returns a custom renderer based on the selected attribute (e.g., Temperature, PM2.5).
 *    - Defines color ramps for visualizing value ranges and supports "circle" or "square" symbols.
 * 
 * 2. updateLegend(field, stops)
 *    - Updates the visual legend based on the selected attribute and its renderer stops.
 *    - Dynamically reflects the color gradient and unit labels.
 * 
 * 3. loadExtraReferenceLayer(filename, attribute)
 *    - Loads and displays an additional GeoJSON reference layer based on user selection.
 *    - Supports switching reference datasets dynamically.
 * 
 * 4. showCustomWidget(graphic)
 *    - Generates a custom popup comparing the clicked SenseBox value with the reference value.
 *    - Includes unit conversion and difference calculation.
 * 
 * 5. Event Listeners
 *    - Layer toggles: Enable/disable visibility of SenseBox and reference layers.
 *    - Attribute dropdown: Changes the active visualization parameter and updates legend/renderers.
 *    - Reference dataset dropdown: Loads a different comparison dataset (GeoJSON).
 *    - Map click: Shows custom popup with value comparisons.
 *    - Pointer move: Highlights features under the cursor.
 *    - Footer navigation: Displays info/about/legal panels.
 * 
 * 6. Map Initialization
 *    - Creates a MapView centered on Zurich with zoom and extent constraints.
 *    - Adds both hosted (FeatureLayer) and local (GeoJSONLayer) datasets.
 *    - Initializes renderers, legend, and popups on load.
 */


require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/GeoJSONLayer"      
], (Map, MapView, FeatureLayer, GeoJSONLayer) => {

function getRenderer(field, symbolStyle = "circle") {
  const ramps = {
    Temperature: [
      { value: 22, color: "#ffffcc" },
      { value: 24, color: "#fed976" },
      { value: 26, color: "#fd8d3c" },
      { value: 28, color: "#f03b20" },
      { value: 30, color: "#bd0026" }
    ],
    Humidity: [
      { value: 35, color: "#deebf7" },
      { value: 45, color: "#9ecae1" },
      { value: 55, color: "#6baed6" },
      { value: 65, color: "#3182bd" },
      { value: 75, color: "#08519c" }
    ],
    PM1_0: [
      { value: 2, color: "#ffffcc" },
      { value: 4, color: "#c2e699" },
      { value: 6, color: "#78c679" },
      { value: 9, color: "#31a354" },
      { value: 12, color: "#006837" }
    ],
    PM2_5: [
      { value: 2, color: "#ffffcc" },
      { value: 6, color: "#a1dab4" },
      { value: 10, color: "#41b6c4" },
      { value: 15, color: "#225ea8" }
    ],
    PM4_0: [
      { value: 2, color: "#f7fcb9" },
      { value: 6, color: "#addd8e" },
      { value: 10, color: "#41ab5d" },
      { value: 15, color: "#006837" }
    ],
    PM10_0: [
      { value: 2, color: "#fee5d9" },
      { value: 8, color: "#fcae91" },
      { value: 14, color: "#fb6a4a" },
      { value: 20, color: "#cb181d" }
    ]
  };

  return {
    type: "simple",
    field: field,
    symbol: {
      type: "simple-marker",
      style: symbolStyle,
      size: symbolStyle === "square" ? 12 : 8, // default size
      color: "gray",
      outline: {
        width: 0.5,
        color: "black"
      }
    },
    visualVariables: [
      {
        type: "color",
        field: field,
        stops: ramps[field]
      }
    ] // ✅ size variable removed
  };
}

  
  

  function updateLegend(field, stops) {
    const legendStops = document.getElementById("legendStops");

    const units = {
      Temperature: "°C",
      Humidity: "%",
      PM1_0: "µg/m³",
      PM2_5: "µg/m³",
      PM4_0: "µg/m³",
      PM10_0: "µg/m³"
    };

    legendStops.innerHTML = "";

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i].value;
      const to = stops[i + 1].value;
      const color = stops[i].color;

      const item = document.createElement("div");
      item.className = "legend-stop";

      const colorBox = document.createElement("div");
      colorBox.className = "legend-color-box";
      colorBox.style.backgroundColor = color;

      const label = document.createElement("span");
      label.textContent = `${from}–${to - 1} ${units[field] || ""}`;

      item.appendChild(colorBox);
      item.appendChild(label);
      legendStops.appendChild(item);
    }
  }

  let lastPopupGeometry = null;  
  let hoveredObjectId = null;


const senseboxLayer = new FeatureLayer({
  url: "https://services-eu1.arcgis.com/DmEtBMiyE68OImsA/arcgis/rest/services/sensebox_with_differences/FeatureServer",
  id: "sensebox", 
  outFields: ["*"], 
  minScale: 0,
  maxScale: 0,
  renderer: getRenderer("Temperature", "circle")
});
  

  const confirmationLayer = new GeoJSONLayer({
    url: "./Data/zh_confirmation_data.geojson",
    id: "confirmation",
    title: "Reference Data",
    definitionExpression: "Hour = 10",
    renderer: getRenderer("Temperature", "square")
  });
  
  const map = new Map({
    basemap: "topo-vector",
    layers: [senseboxLayer, confirmationLayer]
  });

// Optional additional reference layer
let extraReferenceLayer = null;

function loadExtraReferenceLayer(filename, attribute) {
  if (extraReferenceLayer) {
    map.remove(extraReferenceLayer);
  }

  extraReferenceLayer = new GeoJSONLayer({
    url: `./Data/${filename}`,
    title: "Additional Reference Dataset",
    definitionExpression: "Hour = 10",
    renderer: getRenderer(attribute, "square")
  });

  map.add(extraReferenceLayer);
}


  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [8.532, 47.392],
    zoom: 15,
    constraints: {
      minZoom: 13,
      maxZoom: 17,
      geometry: {
        type: "extent",
        xmin: 8.482,
        xmax: 8.582,
        ymin: 47.382,
        ymax: 47.422,
        spatialReference: { wkid: 4326 }
      }
    }
  });

  view.watch("stationary", () => {
  if (lastPopupGeometry) {
    const popup = document.getElementById("customPopup");
    const screenCoords = view.toScreen(lastPopupGeometry);
    popup.style.left = `${screenCoords.x + 20}px`;
    popup.style.top = `${screenCoords.y - 40}px`;
  }
});

function showCustomWidget(graphic) {
  const attr = graphic.attributes;
  const field = document.getElementById("attributeSelect").value.trim();

  console.log("All attributes as JSON:", JSON.stringify(attr, null, 2));

  const units = {
    Temperature: "°C",
    Humidity: "%",
    PM1_0: "µg/m³",
    PM2_5: "µg/m³",
    PM4_0: "µg/m³",
    PM10_0: "µg/m³"
  };

  const unit = units[field] || "";

  const value = attr[field] != null ? attr[field] : "n/a";
  const refRaw = attr["ref_" + field];
  const diffRaw = attr["diff_" + field];

  console.log("All attribute keys:", Object.keys(attr));

  const refValue = refRaw != null ? refRaw : "n/a";
  const diffValue = diffRaw != null ? diffRaw : "n/a";

  const popup = document.getElementById("customPopup");
  popup.innerHTML = `
    <div><strong>${field} comparison</strong></div>
    <div><strong>SenseBox:</strong> ${value} ${unit}</div>
    <div><strong>Reference:</strong> ${refValue} ${unit}</div>
    <div><strong>Difference:</strong> <span style="color: #051d64;">${diffValue} ${unit}</span></div>
  `;
  popup.style.display = "block";
}





  
  
view.on("click", async (event) => {
  const hit = await view.hitTest(event);
  const graphic = hit.results.find(r =>
    r.graphic?.layer?.id === "sensebox"
  )?.graphic;

  hit.results.forEach(r => {
  console.log("▶ Hit layer:", r.graphic?.layer?.id, "| Keys:", Object.keys(r.graphic?.attributes || {}));
});

if (!graphic) {
  console.log("No graphic hit");
  customPopup.innerHTML = "";  // hide text if empty click
  customPopup.style.display = "none";
  return;
}

  console.log("Clicked on:", graphic.attributes);  // check this appears
  showCustomWidget(graphic);

});

const customPopup = document.getElementById("customPopup");
customPopup.innerHTML = `
  <b>Welcome!</b><br>
  Feel free to click on any point to see the difference to the reference dataset.
`;
customPopup.style.display = "block";

  

let highlightHandle = null;

view.whenLayerView(senseboxLayer).then((layerView) => {
  view.on("pointer-move", async (event) => {
    const hit = await view.hitTest(event);
    const graphic = hit.results.find(r => r.graphic?.layer?.id === "sensebox")?.graphic;

    if (highlightHandle) {
      highlightHandle.remove();
      highlightHandle = null;
    }

    if (graphic) {
      highlightHandle = layerView.highlight(graphic);
    }
  });
});


 
  

  document.getElementById("senseboxLayerToggle").addEventListener("change", (e) => {
    senseboxLayer.visible = e.target.checked;
  });
  
  document.getElementById("referenceLayerToggle").addEventListener("change", (e) => {
    confirmationLayer.visible = e.target.checked;
  });
  
  document.getElementById("attributeSelect").addEventListener("change", (e) => {
    const selectedField = e.target.value;
  
    // Apply same renderer logic with different symbol styles
    senseboxLayer.renderer = getRenderer(selectedField, "circle");
    confirmationLayer.renderer = getRenderer(selectedField, "square");
  
    // Update legend using stops from sensebox renderer (they are shared)
    updateLegend(selectedField, getRenderer(selectedField).visualVariables[0].stops);
  });
  
  document.getElementById("referenceDatasetSelect").addEventListener("change", (e) => {
  const selectedFile = e.target.value;
  const selectedAttribute = document.getElementById("attributeSelect").value;

  loadExtraReferenceLayer(selectedFile, selectedAttribute);
});

  
  

  updateLegend("Temperature", getRenderer("Temperature").visualVariables[0].stops);

  const footerLinks = document.querySelectorAll("#footerLinks a");
  const infoPanel = document.getElementById("infoPanel");
  const viewDiv = document.getElementById("viewDiv");
  const infoTitle = document.getElementById("infoTitle");
  const infoContent = document.getElementById("infoContent");
  const legend = document.getElementById("dynamicLegend");
  const collapseBtn = document.getElementById("collapsePanel");

  const contentMap = {
about: {
  title: "About Us",
title: "About Us",
text: `
<div class="infoFlexContainer">
  <div class="infoText">
    <p>Hi there!</p>
    <p>We are Jian, Leo, Raul, and Noe from the Advanced GIS course at ETH Zürich. This website is part of our group project, where we built an interactive map to visualize environmental sensor data collected using a <a href="https://sensebox.de/de/products-mini.html" target="_blank">SenseBox Mini</a>.</p>
    <p>To gather the data, we cycled through the neighbourhoods of Höngg and Wipkingen in Zurich with the SenseBox mounted to a backpack (See picture on the right). Measurements were recorded every 5 seconds after a GPS fix was established. Since the bike was in motion, wind and terrain likely influenced the readings. We ended up with more data in uphill areas because it simply took longer to climb!</p>
    <p>We combined these measurements with official public datasets to validate the results and provide additional context.</p>
    <p>Hope you find it interesting!</p>
  </div>
  <div class="infoImage">
    <img src="./Data/IMG_5526.jpg" alt="SenseBox on bike" />
  </div>
</div>
`

},
source: {
title: "Data",
text: `
<p>This project uses environmental sensor data collected with a SenseBox Mini mounted to a backpack while riding a bike. Measurements include temperature, humidity, and air quality, recorded every 5 seconds after a GPS satellite fix. The SenseBox Mini recorded temperature, humidity, and particulate matter (PM1.0, PM2.5, PM4.0, PM10.0) concentrations. The data was gathered on the 2nd of May from 10:00 to 11:00 AM.</p>
<p>
  Download our dataset:
  <a href="./Data/sensebox_with_differences.geojson" download="sensebox_data_hoengg.geojson">GeoJSON</a> |
  <a href="./Data/sensebox_with_differences_FILLED.csv" download="sensebox_data_hoengg.csv">CSV</a>
</p>

<p>Reference Data Sources:</p>
<ul>
  <li><a href="https://data.stadt-zuerich.ch/dataset/ugz_meteodaten_stundenmittelwerte" target="_blank"> Stündlich aktualisierte Meteodaten, seit 1992</a> – City of Zurich Open Data</li>
</ul>
`

},
contact: {
  title: "Legal Notice",
  text: `All content on this website, including visualizations, code, and data (excluding third-party data), is dedicated to the public domain under the <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener noreferrer">Creative Commons CC0 1.0 Universal Public Domain Dedication</a>. You are free to copy, modify, distribute, and use the materials, even for commercial purposes, without asking for permission. Please note that external datasets used in this application may be subject to their own licenses.`
}


  };

  footerLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.getAttribute("data-section");
      const content = contentMap[section];

      if (content) {
        infoTitle.textContent = content.title;
        infoContent.innerHTML = content.text;
        viewDiv.classList.add("half-size");
        infoPanel.classList.add("show");
        legend.classList.add("move-up");
        collapseBtn.classList.add("rotated");
      }
    });
  });

  collapseBtn.addEventListener("click", () => {
    viewDiv.classList.remove("half-size");
    infoPanel.classList.remove("show");
    legend.classList.remove("move-up");
    collapseBtn.classList.remove("rotated");
  });

  const initialPopup = document.getElementById("customPopup");
  initialPopup.innerHTML = `
    <b>Welcome!</b><br>
    Feel free to click on any point to see the difference to the reference dataset.
  `;
  initialPopup.style.display = "block";



});
