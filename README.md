# Splatview
This project aims to make a fast and optimized viewer for pointcloud (.ply) and eventually splat (.splat) files. 

First the file is transformed into a json format (there is probably a better way to store this data) with the python program getData.py from a .ply file. This can be done by draggin the file into the website window. 

The backend is a flask backend which has to be run in the background. 

The visualization is implemented with WebGL, currently using a really simple color and position shaders and all the matrix multiplications are done using the fast gl-matrix library.

Currently the visualization is quite slow at a higher number of points (tried with 6 million points), however no optimization has been done yet.
