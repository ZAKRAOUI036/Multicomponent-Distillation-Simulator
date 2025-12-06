# app.py
from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import json

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-123')
app.config['STATIC_FOLDER'] = 'static'

# Route principale
@app.route('/')
def index():
    return render_template('index.html')

# Routes pour les fichiers statiques
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# Route pour les assets
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('static/assets', filename)

# API pour les calculs de distillation
@app.route('/api/simulate', methods=['POST'])
def simulate_distillation():
    try:
        data = request.json
        
        # Ici, vous pouvez intégrer vos calculs Python
        # Pour l'instant, retournons des données fictives
        response = {
            'success': True,
            'results': {
                'total_plates': 24,
                'reflux_ratio': 2.5,
                'reboiler_energy': 1500,
                'distillate_flow': 45.3,
                'residue_flow': 54.7,
                'n_min': 12,
                'r_min': 1.8
            },
            'message': 'Simulation réussie'
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors de la simulation'
        }), 500

# Route de santé
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'Distillation Simulator'})

# Route pour les informations
@app.route('/api/info')
def info():
    return jsonify({
        'name': 'Simulateur de Distillation Multicomposants',
        'version': '2.0',
        'author': 'ZAKRAOUI MOHAMED',
        'institution': 'FSTS'
    })

# Gestion des erreurs 404
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)