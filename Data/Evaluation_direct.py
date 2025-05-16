import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import json


def find_closest(row, ref_points):
    nearest_geom = ref_points.geometry.loc[ref_points.geometry.distance(row.geometry).idxmin()]
    closest_row = ref_points[ref_points.geometry == nearest_geom].iloc[0]
    return pd.Series({
        "ref_Temperature": closest_row.get("Temperature", None),
        "ref_Humidity": closest_row.get("Humidity", None),
        "ref_PM1_0": closest_row.get("PM1_0", None),
        "ref_PM2_5": closest_row.get("PM2_5", None),
        "ref_PM4_0": closest_row.get("PM4_0", None),
        "ref_PM10_0": closest_row.get("PM10_0", None),
    })


def main():
    # --- Load SenseBox data ---
    sensebox_df = pd.read_csv("DATA.TXT", sep=";")
    sensebox_df["geometry"] = sensebox_df.apply(lambda row: Point(row["Longitude"], row["Latitude"]), axis=1)
    sensebox_gdf = gpd.GeoDataFrame(sensebox_df, geometry="geometry", crs="EPSG:4326")

    # --- Load reference data ---
    csv_meteo = "ugz_ogd_meteo_h1_2025.csv"
    csv_air = "ugz_ogd_air_h1_2025.csv"
    json_path = "uzg_ogd_metadaten.json"
    selected_date = "2025-05-02"

    meteo = pd.read_csv(csv_meteo)
    meteo["Datum"] = pd.to_datetime(meteo["Datum"])
    meteo_filtered = meteo[meteo["Datum"].dt.date == pd.to_datetime(selected_date).date()].copy()
    meteo_filtered["Hour"] = meteo_filtered["Datum"].dt.hour

    air = pd.read_csv(csv_air)
    air["Datum"] = pd.to_datetime(air["Datum"])
    air_filtered = air[air["Datum"].dt.date == pd.to_datetime(selected_date).date()].copy()
    air_filtered["Hour"] = air_filtered["Datum"].dt.hour

    combined = pd.concat([meteo_filtered, air_filtered], ignore_index=True)
    hourly_avg = (
        combined.groupby(["Standort", "Parameter", "Hour"])["Wert"]
        .mean()
        .reset_index()
        .pivot(index=["Standort", "Hour"], columns="Parameter", values="Wert")
        .reset_index()
    )

    with open(json_path, "r", encoding="utf-8") as f:
        stations = json.load(f)

    stations_df = pd.DataFrame(stations["Standorte"]).rename(columns={
        "Koordinaten_WGS84_lat": "Lat",
        "Koordinaten_WGS84_lng": "Lng",
        "Höhe [M.ü.M.]": "Höhe"
    })

    ref_gdf = hourly_avg.merge(stations_df, left_on="Standort", right_on="ID", how="left")
    ref_gdf["geometry"] = ref_gdf.apply(lambda row: Point(row["Lng"], row["Lat"]), axis=1)
    ref_gdf = gpd.GeoDataFrame(ref_gdf, geometry="geometry", crs="EPSG:4326")

    ref_gdf = ref_gdf[ref_gdf["Hour"] == 10].copy()
    ref_gdf = ref_gdf.rename(columns={
        "T": "Temperature",
        "Hr": "Humidity",
        "PM2.5": "PM2_5",
        "PM10": "PM10_0",
        "PM1": "PM1_0",
        "PM4": "PM4_0"
    })

    # --- Match and calculate differences ---
    nearest_refs = sensebox_gdf.apply(find_closest, axis=1, ref_points=ref_gdf)
    sensebox_gdf = pd.concat([sensebox_gdf, nearest_refs], axis=1)

    for var in ["Temperature", "Humidity", "PM1_0", "PM2_5", "PM4_0", "PM10_0"]:
        sensebox_gdf[f"diff_{var}"] = sensebox_gdf[var] - sensebox_gdf[f"ref_{var}"]

    # --- Save result ---
    sensebox_gdf.to_file("sensebox_with_differences.geojson", driver="GeoJSON")
    print("✅ GeoJSON saved as 'sensebox_with_differences.geojson'")


if __name__ == "__main__":
    main()
