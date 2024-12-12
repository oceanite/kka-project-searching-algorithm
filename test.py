from geopy.distance import geodesic
import networkx as nx

GRAPHML_PATH = "data/its_walk.graphml"

def load_graph():
    return nx.read_graphml(GRAPHML_PATH)

# Function to find the nearest node to a given latitude and longitude
def find_nearest_node(graph, target_coords):
    min_distance = float('inf')
    nearest_node = None
    for node, data in graph.nodes(data=True):
        node_coords = (data['y'], data['x'])
        distance = geodesic(target_coords, node_coords).meters
        if distance < min_distance:
            min_distance = distance
            nearest_node = node
    return nearest_node

# A* Algorithm to find the shortest path from start to end
def run_astar(graph, start_node, end_node):
    try:
        # NetworkX A* algorithm, you can define the edge weight in the 'weight' attribute
        path = nx.astar_path(graph, start_node, end_node, weight='weight')
        return path
    except nx.NetworkXNoPath:
        return None  # If no path exists

start_coords = [-7.2819, 112.7945]  # Start coordinates (lat, lon)
end_coords = [-7.2821, 112.7956]    # End coordinates (lat, lon)

print(f"Start Coordinates: {start_coords}")
print(f"End Coordinates: {end_coords}")

# Load graph and places data
graph = load_graph()
#for node, data in graph.nodes(data=True):
#    print(f"Node {node}: {data}")

# Find the nearest nodes for the start and end coordinates
start_node = find_nearest_node(graph, start_coords)
end_node = find_nearest_node(graph, end_coords)


# Run A* algorithm to find the path between the nearest nodes
route = run_astar(graph, start_node, end_node)

# Convert route from node IDs to coordinates for the frontend
route_coords = []
for node in route:
    node_data = graph.nodes[node]
    route_coords.append((node_data['y'], node_data['x']))

print(route_coords)
