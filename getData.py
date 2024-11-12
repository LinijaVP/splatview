from flask import Flask, request, jsonify
from flask_cors import CORS
from plyfile import PlyData
import os
import tempfile

app = Flask(__name__)
CORS(app) 

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "No file uploaded", 400

    file = request.files['file']
    if not file.filename.endswith('.ply'):
        return "Invalid file type", 400

    
    try:
        # Save the file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ply") as temp_file:
            file.save(temp_file.name)
            temp_file_path = temp_file.name
                
        # Read ply file
        plydata = PlyData.read(temp_file_path, mmap=False)
        positions = []
        colors = []
        
        # Scale it to [-1,1] for WebGl
        plydata.elements[0].data["x"] -= (max(plydata.elements[0].data["x"]) +min(plydata.elements[0].data["x"])) / 2
        plydata.elements[0].data["y"] -= (max(plydata.elements[0].data["y"]) +min(plydata.elements[0].data["y"])) / 2
        plydata.elements[0].data["z"] -= (max(plydata.elements[0].data["z"]) +min(plydata.elements[0].data["z"])) / 2

        scale = max(max(plydata.elements[0].data["x"]) -min(plydata.elements[0].data["x"]), max(plydata.elements[0].data["y"]) -min(plydata.elements[0].data["y"]), max(plydata.elements[0].data["z"]) -min(plydata.elements[0].data["z"])) /2
        plydata.elements[0].data["x"] /= scale
        plydata.elements[0].data["y"] /= scale
        plydata.elements[0].data["z"] /= scale
        

        # Extract positions and colors
        for v in plydata.elements[0].data:
            positions.extend([float(v['x']), float(v['y']), float(v['z'])]) 
            colors.extend([float(v['red']/255), float(v['green']/255), float(v['blue']/255)]) 
            
    
    except Exception as e:
        # Clean up the temporary file in case of an error
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        return jsonify({"error": str(e)}), 500    
    
    finally:
        file.close()
        os.remove(temp_file_path)
        return jsonify({"position": positions, "color": colors})

    


if __name__ == "__main__":
    os.makedirs("temp", exist_ok=True)
    app.run(host="0.0.0.0", port=5000)
