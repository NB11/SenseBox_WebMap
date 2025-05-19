Zurich SenseBox Map
====================

This project presents an interactive web application for visualizing environmental sensor data collected with a SenseBox Mini in Zurich, Switzerland. The goal is to explore and validate Volunteered Geographic Information (VGI) using additional open datasets, inspired by platforms like OpenSenseMap.

Project Overview
----------------
- Course: Advanced GIS FS25, ETH Zürich  
- Theme: Visual comparison of mobile environmental sensing data with fixed station reference values  
- Area: Höngg and Wipkingen, Zurich  
- Sensors: Temperature, Humidity, PM1.0, PM2.5, PM4.0, PM10.0  
- Reference Data: City of Zurich open meteorological datasets (10:00–11:00 AM, May 2)

Web Application Features
------------------------
- Toggle visibility of SenseBox and reference layers  
- Attribute selection for rendering and legend updates (temperature, humidity, particulates)  
- Interactive custom popup comparing sensor values with reference  
  

Technologies
------------
- HTML5, CSS3, JavaScript  
- ArcGIS JavaScript API 4.x  

File Structure
--------------
web_map.html           # Main web app  
style.css              # Styling rules and layout  
script.js              # App logic, rendering, UI interactions  
Data/                  # Contains SenseBox GeoJSON, CSV, reference GeoJSON  

License
-------
All original content (code, design, structure) is dedicated to the public domain under CC0 1.0 Universal:  
https://creativecommons.org/publicdomain/zero/1.0/

External datasets follow their respective licenses (e.g., City of Zurich Open Data: https://data.stadt-zuerich.ch/)

About Us
--------
This project was developed by Jian, Leo, Raul, and Noe for the Advanced GIS course at ETH Zürich.  
Data was collected via mobile SenseBox sensors mounted on a bike during a field survey.
