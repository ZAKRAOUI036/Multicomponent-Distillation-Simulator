// visualization.js - Version corrigée

class DistillationVisualizer {
    constructor(compoundNames) {
        this.compoundNames = compoundNames;
        this.colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#8AC926', '#1982C4'
        ];
        this.chart = null;
        this.chartInstance = null; // Pour stocker l'instance Chart.js
    }

    // Méthode pour détruire proprement le graphique
    destroyChart() {
        if (this.chartInstance) {
            try {
                this.chartInstance.destroy();
                this.chartInstance = null;
            } catch (error) {
                console.warn('Error destroying chart:', error);
            }
        }
        
        // Nettoyer aussi l'instance Plotly si elle existe
        const plotlyContainer = document.getElementById('plotly-chart');
        if (plotlyContainer) {
            plotlyContainer.style.display = 'none';
            plotlyContainer.innerHTML = '';
        }
    }

    // Méthode pour créer le canvas si nécessaire
    ensureCanvas() {
        let canvas = document.getElementById('main-chart');
        if (!canvas) {
            // Créer le canvas si absent
            const container = document.querySelector('.chart-container');
            if (container) {
                container.innerHTML = '<canvas id="main-chart"></canvas>';
                canvas = document.getElementById('main-chart');
            }
        }
        return canvas;
    }

    createCompositionChart(stages, x_profiles, y_profiles, feed_stage) {
        // Détruire l'ancien graphique
        this.destroyChart();
        
        // Créer ou récupérer le canvas
        const canvas = this.ensureCanvas();
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Vérifier que les données existent
        if (!x_profiles || x_profiles.length === 0) {
            console.error('No composition data');
            this.showEmptyChart('Aucune donnée de composition disponible');
            return;
        }

        const datasets = [];
        const nComp = Math.min(this.compoundNames.length, x_profiles[0].length);
        
        // Profils liquides
        for (let i = 0; i < nComp; i++) {
            const data = x_profiles.map((x, idx) => {
                const xVal = x[i] || 0;
                const yVal = stages[idx] || idx + 1;
                return { x: Math.max(0, Math.min(xVal, 1)), y: yVal };
            });
            
            datasets.push({
                label: `${this.compoundNames[i]} (x)`,
                data: data,
                borderColor: this.colors[i % this.colors.length],
                backgroundColor: this.colors[i % this.colors.length] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 6
            });
        }

        // Ligne du plateau d'alimentation
        if (feed_stage && stages.length > 0) {
            datasets.push({
                label: 'Plateau alimentation',
                data: [
                    {x: 0, y: feed_stage},
                    {x: 1, y: feed_stage}
                ],
                borderColor: '#000',
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0
            });
        }

        try {
            this.chartInstance = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Fraction molaire liquide',
                                font: { size: 14, weight: 'bold' }
                            },
                            min: 0,
                            max: 1,
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(2);
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Numéro de plateau',
                                font: { size: 14, weight: 'bold' }
                            },
                            reverse: true,
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Profils de Composition dans la Colonne',
                            font: { size: 16, weight: 'bold' },
                            padding: { top: 10, bottom: 30 }
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.x;
                                    return `${label}: ${value.toFixed(3)}`;
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating composition chart:', error);
            this.showEmptyChart('Erreur lors de la création du graphique');
        }
    }

    createTemperatureChart(stages, temperatures, feed_stage) {
        // Détruire l'ancien graphique
        this.destroyChart();
        
        // Créer ou récupérer le canvas
        const canvas = this.ensureCanvas();
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Vérifier les données
        if (!temperatures || temperatures.length === 0) {
            console.error('No temperature data');
            this.showEmptyChart('Aucune donnée de température disponible');
            return;
        }

        try {
            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: stages,
                    datasets: [{
                        label: 'Température (°C)',
                        data: temperatures.map(t => {
                            const tempC = t - 273.15;
                            return isFinite(tempC) ? tempC : 0;
                        }),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#FF6384',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Numéro de plateau',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Température (°C)',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Profil de Température dans la Colonne',
                            font: { size: 16, weight: 'bold' },
                            padding: { top: 10, bottom: 30 }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Température: ${context.parsed.y.toFixed(1)}°C`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating temperature chart:', error);
            this.showEmptyChart('Erreur lors de la création du graphique');
        }
    }

    createShortcutChart(results) {
        // Détruire l'ancien graphique
        this.destroyChart();
        
        // Créer ou récupérer le canvas
        const canvas = this.ensureCanvas();
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Vérifier les données nécessaires
        if (!results || !results.R_min || results.R_min <= 0) {
            console.error('Invalid results for shortcut chart');
            this.showEmptyChart('Données insuffisantes pour le diagramme de Gilliland');
            return;
        }

        // Générer la courbe de Gilliland
        const R_factors = Array.from({length: 30}, (_, i) => 1.0 + i * 0.1);
        const N_values = [];
        
        for (let factor of R_factors) {
            try {
                const R = factor * results.R_min;
                const X = (R - results.R_min) / (R + 1);
                const X_clamped = Math.max(0.001, Math.min(X, 0.999));
                
                const exponent = (1 + 54.4 * X_clamped) * (X_clamped - 1) / 
                               ((11 + 117.2 * X_clamped) * Math.sqrt(X_clamped));
                const Y = 1 - Math.exp(exponent);
                const Y_clamped = Math.max(0.01, Math.min(Y, 0.99));
                
                const N = results.N_min + Y_clamped / (1 - Y_clamped);
                N_values.push(N);
            } catch (error) {
                N_values.push(results.N_min || 5);
            }
        }

        try {
            this.chartInstance = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Courbe de Gilliland',
                        data: R_factors.map((rf, i) => ({x: rf, y: N_values[i]})),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                    }, {
                        label: 'Point opératoire',
                        data: results.R && results.N_theoretical ? 
                            [{x: results.R / results.R_min, y: results.N_theoretical}] : 
                            [],
                        backgroundColor: '#FF6384',
                        borderColor: '#FF6384',
                        borderWidth: 3,
                        pointRadius: 10,
                        pointHoverRadius: 15,
                        pointStyle: 'rectRot'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'R / R_min',
                                font: { size: 14, weight: 'bold' }
                            },
                            min: 1.0,
                            max: 4.0,
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Nombre de plateaux théoriques',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: { 
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            },
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Corrélation de Gilliland',
                            font: { size: 16, weight: 'bold' },
                            padding: { top: 10, bottom: 30 }
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    if (context.datasetIndex === 0) {
                                        return `Courbe: R/R_min = ${context.parsed.x.toFixed(2)}, N = ${context.parsed.y.toFixed(1)}`;
                                    } else {
                                        return `Point opératoire: R/R_min = ${context.parsed.x.toFixed(2)}, N = ${context.parsed.y.toFixed(1)}`;
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating shortcut chart:', error);
            this.showEmptyChart('Erreur lors de la création du graphique');
        }
    }

    createColumnDiagram(results, compoundNames) {
        // Détruire l'ancien graphique
        this.destroyChart();
        
        // Créer ou récupérer le canvas
        const canvas = this.ensureCanvas();
        if (!canvas) {
            console.error('Canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Vérifier les données
        if (!results || !results.N_real || results.N_real <= 0) {
            console.error('Invalid results for column diagram');
            this.showEmptyChart('Données insuffisantes pour le schéma de colonne');
            return;
        }

        const stages = Array.from({length: results.N_real}, (_, i) => i + 1);
        const sectionColors = [];
        
        for (let i = 0; i < results.N_real; i++) {
            if (i < (results.feed_stage - 1)) {
                sectionColors.push('#4CAF50'); // Rectification
            } else if (i === (results.feed_stage - 1)) {
                sectionColors.push('#2196F3'); // Plateau alimentation
            } else {
                sectionColors.push('#FF9800'); // Épuisement
            }
        }

        try {
            this.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: stages,
                    datasets: [{
                        label: 'Colonne de distillation',
                        data: stages.map(() => 1),
                        backgroundColor: sectionColors,
                        borderColor: '#333',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    scales: {
                        x: {
                            display: false,
                            max: 1.2
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Plateaux',
                                font: { size: 14, weight: 'bold' }
                            },
                            reverse: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                callback: function(value) {
                                    if (value === results.feed_stage) {
                                        return `⚫ ${value} (alim)`;
                                    }
                                    return value;
                                }
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Schéma de la Colonne',
                            font: { size: 16, weight: 'bold' },
                            padding: { top: 10, bottom: 30 }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const stage = context.label;
                                    let section = '';
                                    if (stage < results.feed_stage) {
                                        section = 'Section rectification';
                                    } else if (stage == results.feed_stage) {
                                        section = 'Plateau alimentation';
                                    } else {
                                        section = 'Section épuisement';
                                    }
                                    return `${section} - Plateau ${stage}`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating column diagram:', error);
            this.showEmptyChart('Erreur lors de la création du graphique');
        }
    }

    // Méthode pour afficher un message vide
    showEmptyChart(message) {
        this.destroyChart();
        
        const canvas = this.ensureCanvas();
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Afficher un message
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    // Méthode pour exporter le graphique
    exportChart() {
        if (!this.chartInstance) {
            this.showNotification('Aucun graphique à exporter', 'warning');
            return;
        }
        
        try {
            const link = document.createElement('a');
            link.download = `distillation_chart_${new Date().toISOString().slice(0,10)}.png`;
            link.href = this.chartInstance.toBase64Image();
            link.click();
            this.showNotification('Graphique exporté avec succès', 'success');
        } catch (error) {
            console.error('Error exporting chart:', error);
            this.showNotification('Erreur lors de l\'export du graphique', 'error');
        }
    }

    // Mettre à jour les informations du graphique
    updateChartInfo(chartType) {
        const info = {
            'composition': 'Profils de composition liquide dans la colonne',
            'temperature': 'Profil de température le long des plateaux',
            'shortcut': 'Courbe de Gilliland montrant la relation reflux/nombre de plateaux',
            'column': 'Schéma de la colonne avec sections de rectification et épuisement',
            'parametric': 'Étude paramétrique de l\'effet des variables opératoires'
        };
        
        const infoElement = document.getElementById('chart-info');
        if (infoElement) {
            infoElement.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${info[chartType] || 'Sélectionnez un type de graphique'}</span>
            `;
        }
        
        // Mettre à jour la légende
        this.updateChartLegend(chartType);
    }

    updateChartLegend(chartType) {
        const legendElement = document.getElementById('chart-legend');
        if (!legendElement) return;
        
        if (chartType === 'composition' && this.compoundNames.length > 0) {
            legendElement.innerHTML = `
                <div class="legend-title">Légende:</div>
                ${this.compoundNames.map((name, i) => `
                    <div class="legend-item">
                        <span class="legend-color" style="background: ${this.colors[i % this.colors.length]}"></span>
                        <span class="legend-text">${name}</span>
                    </div>
                `).join('')}
            `;
            legendElement.style.display = 'flex';
        } else {
            legendElement.style.display = 'none';
        }
    }

    // Méthode pour créer un graphique avec Plotly (alternative)
    createPlotlyCompositionChart(stages, x_profiles, y_profiles, feed_stage) {
        this.destroyChart();
        
        const container = document.getElementById('plotly-chart');
        if (!container) {
            console.error('Plotly container not found');
            return;
        }
        
        container.style.display = 'block';
        const mainCanvas = document.getElementById('main-chart');
        if (mainCanvas) {
            mainCanvas.style.display = 'none';
        }
        
        try {
            const traces = [];
            const nComp = Math.min(this.compoundNames.length, x_profiles[0].length);
            
            // Profils liquides
            for (let i = 0; i < nComp; i++) {
                traces.push({
                    x: x_profiles.map(x => x[i] || 0),
                    y: stages,
                    mode: 'lines+markers',
                    name: `${this.compoundNames[i]} (x)`,
                    line: {
                        color: this.colors[i % this.colors.length],
                        width: 2
                    },
                    marker: {
                        size: 6,
                        symbol: 'circle'
                    }
                });
            }
            
            // Ligne du plateau d'alimentation
            if (feed_stage) {
                traces.push({
                    x: [0, 1],
                    y: [feed_stage, feed_stage],
                    mode: 'lines',
                    name: 'Plateau alimentation',
                    line: {
                        color: '#000',
                        width: 2,
                        dash: 'dash'
                    },
                    showlegend: true
                });
            }
            
            const layout = {
                title: 'Profils de Composition (Interactif)',
                xaxis: {
                    title: 'Fraction molaire liquide',
                    range: [0, 1],
                    gridcolor: 'rgba(0,0,0,0.1)'
                },
                yaxis: {
                    title: 'Numéro de plateau',
                    autorange: 'reversed',
                    gridcolor: 'rgba(0,0,0,0.1)'
                },
                height: 500,
                hovermode: 'closest',
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: -0.2
                },
                plot_bgcolor: 'rgba(240,240,240,0.8)',
                paper_bgcolor: 'white'
            };
            
            Plotly.newPlot(container, traces, layout);
            
        } catch (error) {
            console.error('Error creating Plotly chart:', error);
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 100px;">Erreur lors de la création du graphique interactif</p>';
        }
    }

    // Helper pour les notifications (à adapter selon votre implémentation)
    showNotification(message, type = 'info') {
        // À adapter selon votre système de notification
        console.log(`${type.toUpperCase()}: ${message}`);
    }
    // Dans visualization.js, ajoutez cette méthode dans la classe DistillationVisualizer

forceDestroyChart() {
    // Détruire le graphique Chart.js
    if (this.chartInstance) {
        try {
            this.chartInstance.destroy();
        } catch (error) {
            // Ignorer les erreurs de destruction
        }
        this.chartInstance = null;
    }
    
    // Nettoyer le canvas
    const canvas = document.getElementById('main-chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Cacher Plotly
    const plotlyContainer = document.getElementById('plotly-chart');
    if (plotlyContainer) {
        plotlyContainer.style.display = 'none';
        plotlyContainer.innerHTML = '';
    }
}
}