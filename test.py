import osmnx as ox
import networkx as nx
from shapely.geometry import Point
import geopandas as gpd

graph = ox.graph_from_place(
    "Institut Teknologi Sepuluh Nopember, Surabaya, Indonesia",
    network_type="all"

)

ox.save_graphml(graph, filepath="test_graph.graphml")