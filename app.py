from flask import Flask, jsonify, request
import networkx as nx
import json
from geopy.distance import geodesic
from flask_cors import CORS
import heapq  # For priority queue in A*

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

GRAPHML_PATH = "data/its_walk.graphml"
PLACES_JSON_PATH = "data/places.json"

# Load the graph from the GraphML file
def load_graph():
    return nx.read_graphml(GRAPHML_PATH)

# Load places data from places.json
def load_places():
    with open(PLACES_JSON_PATH, 'r') as f:
        return json.load(f)

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

# Custom A* Algorithm Implementation
def custom_astar(graph, start_node, end_node):
    def heuristic(node1, node2):
        # Haversine distance as heuristic
        coords1 = (float(graph.nodes[node1]['y']), float(graph.nodes[node1]['x']))
        coords2 = (float(graph.nodes[node2]['y']), float(graph.nodes[node2]['x']))
        return geodesic(coords1, coords2).meters

    open_set = []
    heapq.heappush(open_set, (0, start_node))  # Priority queue: (cost, node)
    came_from = {}  # To reconstruct the path
    g_score = {node: float('inf') for node in graph.nodes}
    g_score[start_node] = 0
    f_score = {node: float('inf') for node in graph.nodes}
    f_score[start_node] = heuristic(start_node, end_node)

    while open_set:
        _, current = heapq.heappop(open_set)

        if current == end_node:
            # Reconstruct the path
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start_node)
            return path[::-1]  # Reverse the path

        for neighbor in graph.neighbors(current):
            # Edge weight (assumes a 'weight' attribute exists in the graph)
            weight = graph[current][neighbor].get('weight', 1.0)
            tentative_g_score = g_score[current] + weight

            if tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, end_node)
                heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None  # No path found

# Home route
@app.route('/')
def index():
    return "A* Route Finder Backend"

# Route to find the route between start and end points
@app.route('/find_route', methods=['POST', 'OPTIONS'])
def find_route():
    if request.method == 'OPTIONS':  # Handle preflight requests (OPTIONS method)
        return jsonify({'status': 'OK'}), 200

    try:
        data = request.get_json()  # Parse the incoming JSON data
        if not data or 'start' not in data or 'end' not in data:
            return jsonify({'error': 'Invalid input: missing start or end coordinates'}), 400
        
        start_coords = tuple(data['start'])  # Start coordinates (lat, lon)
        end_coords = tuple(data['end'])      # End coordinates (lat, lon)

        print(f"Start Coordinates: {start_coords}")
        print(f"End Coordinates: {end_coords}")
        
        # Load graph and places data
        graph = load_graph()
        places = load_places()

        # Find the nearest nodes for the start and end coordinates
        start_node = find_nearest_node(graph, start_coords)
        end_node = find_nearest_node(graph, end_coords)

        # If no nodes found for start or end coordinates, return an error
        if not start_node or not end_node:
            return jsonify({'error': 'Start or End point not found in the graph'}), 400

        # Run custom A* algorithm to find the path between the nearest nodes
        route = custom_astar(graph, start_node, end_node)

        # If no route found, return an error
        if not route:
            return jsonify({'error': 'No path found between the points'}), 404

        # Convert route from node IDs to coordinates for the frontend
        route_coords = []
        for node in route:
            node_data = graph.nodes[node]
            route_coords.append((float(node_data['y']), float(node_data['x'])))

        # Return the route coordinates to the frontend
        return jsonify({'route': route_coords})

    except Exception as e:
        print(f"Error: {e}")  # Log the error message to the console
        return jsonify({'error': f'An error occurred during route calculation: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True)
