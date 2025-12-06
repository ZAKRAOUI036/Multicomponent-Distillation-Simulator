// app.js - Application principale

class DistillationApp {
    constructor() {
        this.compoundSearch = new CompoundSearch();
        this.selectedCompounds = [];
        this.compounds = [];
        this.thermo = null;
        this.distillation = null;
        this.visualizer = null;
        this.results = null;
        this.profiles = null;
        
        // Indices des composés clés
        this.LK_idx = 0;
        this.HK_idx = 1;
    }
    
    initializeApp() {
        console.log('Initialisation du simulateur de distillation...');
        
        // Initialiser le visualiseur avec des noms par défaut
        this.visualizer = new DistillationVisualizer(['Composé 1', 'Composé 2', 'Composé 3']);
        
        // Créer l'interface de recherche
        this.createSearchInterface();
        
        // Configurer les événements
        this.setupEventListeners();
        
        // Charger l'exemple BTX par défaut
        this.loadExample('btx');
        
        // Mettre à jour le statut
        this.updateSimulationStatus('Prêt', 'success');
        
        console.log('Application initialisée avec succès');
    }
    
    createSearchInterface() {
        const container = document.getElementById('compound-search-container');
        if (!container) {
            console.error('Container de recherche non trouvé');
            return;
        }
        
        container.innerHTML = `
            <div class="compound-search-box">
                <div class="search-input-group">
                    <i class="fas fa-search"></i>
                    <input type="text" id="compound-search-input" 
                           placeholder="Rechercher un composé (benzene, toluene, acetone...)">
                    <button class="btn-search" onclick="window.app.searchCompounds()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                <div class="search-results" id="search-results"></div>
            </div>
            
            <div class="selected-compounds-container">
                <h4><i class="fas fa-check-circle"></i> Composés sélectionnés</h4>
                <div class="selected-compounds-list" id="selected-compounds-list">
                    <p class="empty-message">Aucun composé sélectionné</p>
                </div>
                <div class="selection-controls">
                    <button class="btn btn-sm" onclick="window.app.clearSelection()">
                        <i class="fas fa-trash"></i> Tout effacer
                    </button>
                    <button class="btn btn-sm" onclick="window.app.loadExample('btx')">
                        <i class="fas fa-flask"></i> Exemple BTX
                    </button>
                    <button class="btn btn-sm" onclick="window.app.loadExample('alcohols')">
                        <i class="fas fa-wine-bottle"></i> Exemple alcools
                    </button>
                </div>
            </div>
        `;
        
        // Recherche en temps réel
        const searchInput = document.getElementById('compound-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchCompounds(e.target.value);
            });
        }
        
        // Initialiser les sliders
        this.setupSliders();
    }
    
    setupSliders() {
        // Mettre à jour les valeurs des sliders en temps réel
        const sliders = [
            { id: 'recovery-lk', valueId: 'recovery-lk-value' },
            { id: 'recovery-hk', valueId: 'recovery-hk-value' },
            { id: 'reflux-factor', valueId: 'reflux-factor-value' },
            { id: 'efficiency', valueId: 'efficiency-value' },
            { id: 'feed-quality', valueId: 'feed-quality-value' }
        ];
        
        sliders.forEach(sliderConfig => {
            const slider = document.getElementById(sliderConfig.id);
            const valueDisplay = document.getElementById(sliderConfig.valueId);
            
            if (slider && valueDisplay) {
                // Valeur initiale
                this.updateSliderValue(slider, valueDisplay);
                
                // Mise à jour en temps réel
                slider.addEventListener('input', () => {
                    this.updateSliderValue(slider, valueDisplay);
                });
            }
        });
    }
    
    updateSliderValue(slider, display) {
        let value = parseFloat(slider.value);
        
        if (slider.id === 'feed-quality') {
            let qualityText;
            if (value === 0) qualityText = 'vapeur saturée';
            else if (value === 1) qualityText = 'liquide saturé';
            else if (value < 0) qualityText = 'vapeur sous-refroidie';
            else if (value > 1) qualityText = 'liquide sous-refroidi';
            else qualityText = 'mélange biphasique';
            
            display.innerHTML = `${value.toFixed(2)} <small>(${qualityText})</small>`;
        } else if (slider.id === 'efficiency') {
            display.textContent = `${Math.round(value)}%`;
        } else {
            display.textContent = value.toFixed(2);
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                
                // Mettre à jour l'onglet actif
                document.querySelectorAll('.nav-menu a').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Sélection de graphique
        const chartSelect = document.getElementById('chart-select');
        if (chartSelect) {
            chartSelect.addEventListener('change', () => this.changeChart());
        }
        
        // Tabs d'analyse
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.textContent.toLowerCase().replace(/[^a-z]/g, '');
                this.openTab(tabName);
            });
        });
    }
    
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    searchCompounds(query = null) {
        if (!query) {
            const input = document.getElementById('compound-search-input');
            query = input ? input.value : '';
        }
        
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        if (!query.trim()) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        const results = this.compoundSearch.search(query);
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>Aucun composé trouvé pour "${query}"</p>
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = `
            <div class="results-header">
                <span>${results.length} composé(s) trouvé(s)</span>
            </div>
            <div class="results-list">
                ${results.map(compound => `
                    <div class="result-item" onclick="window.app.addCompound('${compound.id}')">
                        <div class="compound-info">
                            <span class="compound-name">${compound.name}</span>
                            <span class="compound-formula">${compound.formula}</span>
                        </div>
                        <div class="compound-actions">
                            ${this.selectedCompounds.includes(compound.id) ? 
                                '<i class="fas fa-check-circle selected"></i>' : 
                                '<i class="fas fa-plus"></i>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async addCompound(compoundId) {
        // Vérifier si déjà sélectionné
        if (this.selectedCompounds.includes(compoundId)) {
            this.showNotification(`${this.compoundSearch.compoundNames[compoundId]} est déjà sélectionné`, 'info');
            return;
        }
        
        // Limiter à 3 composés
        if (this.selectedCompounds.length >= 3) {
            this.showNotification('Maximum 3 composés pour la distillation ternaire', 'warning');
            return;
        }
        
        try {
            // Créer et charger le composé
            const compound = new ThermodynamicCompound(compoundId);
            this.compounds.push(compound);
            this.selectedCompounds.push(compoundId);
            
            // Mettre à jour l'interface
            this.updateSelectedCompoundsList();
            this.updateCompositionInputs();
            
            // Identifier les composés clés
            this.identifyKeyComponents();
            
            this.showNotification(`${compound.displayName} ajouté`, 'success');
            
            // Effacer les résultats de recherche
            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer) resultsContainer.innerHTML = '';
            
            const searchInput = document.getElementById('compound-search-input');
            if (searchInput) searchInput.value = '';
            
        } catch (error) {
            console.error('Erreur ajout composé:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error');
        }
    }
    
    removeCompound(compoundId) {
        const index = this.selectedCompounds.indexOf(compoundId);
        if (index !== -1) {
            this.selectedCompounds.splice(index, 1);
            this.compounds.splice(index, 1);
            
            this.updateSelectedCompoundsList();
            this.updateCompositionInputs();
            
            if (this.selectedCompounds.length > 0) {
                this.identifyKeyComponents();
            }
            
            this.showNotification('Composé retiré', 'info');
        }
    }
    
    updateSelectedCompoundsList() {
        const container = document.getElementById('selected-compounds-list');
        if (!container) return;
        
        if (this.selectedCompounds.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun composé sélectionné</p>';
            return;
        }
        
        container.innerHTML = this.selectedCompounds.map((id, index) => {
            const compound = this.compounds[index];
            return `
                <div class="selected-compound-card">
                    <div class="compound-header">
                        <span class="compound-index">${index + 1}</span>
                        <span class="compound-name">${compound.displayName}</span>
                        <span class="compound-formula">${compound.getFormula()}</span>
                        <button class="btn-remove" onclick="window.app.removeCompound('${id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="compound-properties">
                        <span class="property">
                            <i class="fas fa-thermometer-half"></i>
                            T<sub>éb</sub>: ${(compound.getTb() - 273.15).toFixed(1)}°C
                        </span>
                        <span class="property">
                            <i class="fas fa-weight"></i>
                            MM: ${compound.getMW().toFixed(2)} g/mol
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateCompositionInputs() {
        const container = document.getElementById('composition-inputs');
        if (!container) return;
        
        if (this.selectedCompounds.length === 0) {
            container.innerHTML = `
                <p class="placeholder-text">
                    Sélectionnez d'abord des composés pour définir la composition
                </p>
            `;
            return;
        }
        
        const equalPercent = (100 / this.selectedCompounds.length).toFixed(1);
        
        container.innerHTML = `
            <h4><i class="fas fa-percentage"></i> Composition de l'alimentation</h4>
            <div class="composition-inputs">
                ${this.selectedCompounds.map((id, index) => {
                    const compound = this.compounds[index];
                    return `
                        <div class="composition-input-group">
                            <label>${compound.displayName}</label>
                            <div class="input-with-slider">
                                <input type="range" class="composition-slider" 
                                       min="0" max="100" value="${equalPercent}" 
                                       data-index="${index}"
                                       oninput="window.app.updateCompositionValue(${index})">
                                <div class="input-with-unit">
                                    <input type="number" class="composition-input" 
                                           value="${equalPercent}" 
                                           min="0" max="100" step="0.1"
                                           data-index="${index}"
                                           onchange="window.app.updateCompositionSlider(${index})">
                                    <span class="unit">%</span>
                                </div>
                            </div>
                            <div class="composition-value" id="comp-value-${index}">
                                ${equalPercent}%
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="composition-summary">
                <p>Total: <span id="composition-total">100.0</span>%</p>
                <button class="btn btn-sm" onclick="window.app.normalizeCompositions()">
                    <i class="fas fa-balance-scale"></i> Normaliser
                </button>
            </div>
        `;
        
        // Mettre à jour le visualiseur avec les nouveaux noms
        const compoundNames = this.compounds.map(c => c.displayName);
        this.visualizer = new DistillationVisualizer(compoundNames);
    }
    
    updateCompositionValue(index) {
        const slider = document.querySelector(`.composition-slider[data-index="${index}"]`);
        const input = document.querySelector(`.composition-input[data-index="${index}"]`);
        const display = document.getElementById(`comp-value-${index}`);
        
        if (slider && input && display) {
            const value = parseFloat(slider.value);
            input.value = value.toFixed(1);
            display.textContent = `${value.toFixed(1)}%`;
            this.updateCompositionTotal();
        }
    }
    
    updateCompositionSlider(index) {
        const slider = document.querySelector(`.composition-slider[data-index="${index}"]`);
        const input = document.querySelector(`.composition-input[data-index="${index}"]`);
        const display = document.getElementById(`comp-value-${index}`);
        
        if (slider && input && display) {
            let value = Math.min(100, Math.max(0, parseFloat(input.value) || 0));
            slider.value = value;
            input.value = value.toFixed(1);
            display.textContent = `${value.toFixed(1)}%`;
            this.updateCompositionTotal();
        }
    }
    
    updateCompositionTotal() {
        const inputs = document.querySelectorAll('.composition-input');
        let total = 0;
        
        inputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        
        const totalElement = document.getElementById('composition-total');
        if (totalElement) {
            totalElement.textContent = total.toFixed(1);
            
            if (Math.abs(total - 100) > 0.1) {
                totalElement.className = 'composition-error';
            } else {
                totalElement.className = 'composition-ok';
            }
        }
    }
    
    normalizeCompositions() {
        const inputs = document.querySelectorAll('.composition-input');
        let total = 0;
        const values = [];
        
        inputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            values.push(value);
            total += value;
        });
        
        if (total === 0) {
            // Répartir également
            const equalValue = 100 / inputs.length;
            inputs.forEach((input, index) => {
                input.value = equalValue.toFixed(1);
                this.updateCompositionSlider(index);
            });
        } else {
            // Normaliser à 100%
            inputs.forEach((input, index) => {
                const normalized = (values[index] / total) * 100;
                input.value = normalized.toFixed(1);
                this.updateCompositionSlider(index);
            });
        }
    }
    
    identifyKeyComponents() {
        if (this.compounds.length < 2) return;
        
        // Trier par température d'ébullition (le plus volatil en premier)
        const sortedIndices = this.compounds
            .map((comp, index) => ({ comp, index, Tb: comp.getTb() }))
            .sort((a, b) => a.Tb - b.Tb)
            .map(item => item.index);
        
        // Le plus volatil = LK, le moins volatil = HK
        this.LK_idx = sortedIndices[0];
        this.HK_idx = sortedIndices[sortedIndices.length - 1];
        
        // Mettre à jour l'affichage des noms LK/HK
        const lkNameElement = document.getElementById('lk-name');
        const hkNameElement = document.getElementById('hk-name');
        
        if (lkNameElement && hkNameElement) {
            lkNameElement.textContent = this.compounds[this.LK_idx].displayName;
            hkNameElement.textContent = this.compounds[this.HK_idx].displayName;
        }
        
        console.log(`Composés clés identifiés: LK=${this.compounds[this.LK_idx].displayName}, HK=${this.compounds[this.HK_idx].displayName}`);
    }
    
    async loadExample(type) {
        let exampleCompounds = [];
        
        switch(type) {
            case 'btx':
                exampleCompounds = ['benzene', 'toluene', 'o-xylene'];
                break;
            case 'alcohols':
                exampleCompounds = ['methanol', 'ethanol', 'propanol'];
                break;
            case 'paraffins':
                exampleCompounds = ['n-hexane', 'n-heptane', 'n-octane'];
                break;
            default:
                exampleCompounds = ['benzene', 'toluene', 'o-xylene'];
        }
        
        // Effacer la sélection actuelle
        this.selectedCompounds = [];
        this.compounds = [];
        
        // Ajouter les composés de l'exemple
        for (const compoundId of exampleCompounds) {
            await this.addCompound(compoundId);
        }
        
        this.showNotification(`Exemple ${type} chargé`, 'success');
    }
    


clearSelection() {
    // Détruire le graphique
    if (this.visualizer) {
        this.visualizer.forceDestroyChart();
    }
    
    this.selectedCompounds = [];
    this.compounds = [];
    this.results = null;
    this.profiles = null;
    
    this.updateSelectedCompoundsList();
    this.updateCompositionInputs();
    
    // Réinitialiser les résultats affichés
    this.resetResultsDisplay();
    
    // Réinitialiser le graphique
    const canvas = document.getElementById('main-chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Afficher un message
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sélectionnez des composés et exécutez une simulation', 
                    canvas.width / 2, canvas.height / 2);
    }
    
    this.showNotification('Sélection effacée', 'info');
}
    
    resetResultsDisplay() {
        // Réinitialiser les cartes récapitulatives
        document.getElementById('total-plates').textContent = '--';
        document.getElementById('reflux-ratio').textContent = '--';
        document.getElementById('reboiler-energy').textContent = '-- kW';
        document.getElementById('steam-consumption').textContent = '-- kg/h';
        
        // Réinitialiser les bilans
        document.getElementById('distillat-total').textContent = '-- kmol/h';
        document.getElementById('residue-total').textContent = '-- kmol/h';
        
        // Réinitialiser les paramètres
        ['n-min', 'r-min', 'n-theoretical', 'efficiency-result', 'feed-stage', 'delta-t']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = '--';
            });
        
        // Réinitialiser le graphique
        const ctx = document.getElementById('main-chart');
        if (ctx) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        }
        
    }
    
  // Dans app.js - Améliorer runSimulation

  async runSimulation() {
    try {
        // Détruire le graphique existant
        if (this.visualizer) {
            this.visualizer.forceDestroyChart();
        }
        
        // Vérifications préliminaires
        if (this.selectedCompounds.length < 2) {
            throw new Error('Sélectionnez au moins 2 composés');
        }
        
        // Vérifier la composition totale
        this.updateCompositionTotal();
        const totalElement = document.getElementById('composition-total');
        if (totalElement && Math.abs(parseFloat(totalElement.textContent) - 100) > 0.1) {
            throw new Error('La composition doit totaliser 100%');
        }
        
        this.updateSimulationStatus('Calcul en cours...', 'warning');
        
        // Récupérer les paramètres avec valeurs par défaut
        const zF = this.getCompositionValues();
        const F = parseFloat(document.getElementById('feed-flow').value) || 100;
        const P = (parseFloat(document.getElementById('pressure').value) || 101.325) * 1000;
        const recovery_LK_D = (parseFloat(document.getElementById('recovery-lk').value) || 95) / 100;
        const recovery_HK_B = (parseFloat(document.getElementById('recovery-hk').value) || 95) / 100;
        const R_factor = parseFloat(document.getElementById('reflux-factor').value) || 1.3;
        const efficiency = (parseFloat(document.getElementById('efficiency').value) || 70) / 100;
        const q = parseFloat(document.getElementById('feed-quality').value) || 1.0;
        
        console.log('Paramètres de simulation:', {
            F, P, zF, recovery_LK_D, recovery_HK_B, R_factor, efficiency, q
        });
        
        // Vérifier que les composés sont chargés
        if (this.compounds.length === 0) {
            throw new Error('Les composés ne sont pas chargés');
        }
        
        // Créer le système thermodynamique
        const { ThermodynamicPackage, ShortcutDistillation } = window.DistillationEngine;
        this.thermo = new ThermodynamicPackage(this.compounds);
        
        // Créer l'objet distillation
        this.distillation = new ShortcutDistillation(this.thermo, F, zF, P);
        
        // Définir les indices LK et HK (basés sur Tb)
        this.identifyKeyComponents();
        this.distillation.LK_idx = this.LK_idx;
        this.distillation.HK_idx = this.HK_idx;
        
        console.log('Running distillation design...');
        
        // Exécuter le design
        this.results = this.distillation.completeDesign(
            recovery_LK_D,
            recovery_HK_B,
            R_factor,
            q,
            efficiency
        );
        
        console.log('Design results:', this.results);
        
        // Vérifier que les résultats sont valides
        if (!this.results || this.results.N_real === undefined) {
            throw new Error('Les calculs ont échoué');
        }
        
        // Estimer les profils
        this.profiles = this.distillation.estimateProfiles(
            this.results.N_real,
            this.results.feed_stage
        );
        
        // Estimer l'énergie
        const energy = this.distillation.estimateEnergy(this.profiles.temperatures);
        
        // Mettre à jour l'interface
        this.updateResultsUI(this.results, energy, this.profiles);
        
        // Mettre à jour le graphique
        this.changeChart('composition');
        
        this.updateSimulationStatus('Simulation terminée', 'success');
        this.showNotification('Simulation terminée avec succès!', 'success');
        
    } catch (error) {
        console.error('Erreur simulation:', error);
        this.updateSimulationStatus('Erreur', 'error');
        this.showNotification(`Erreur: ${error.message}`, 'error');
        
        // Afficher des résultats de démonstration pour le débogage
        this.showDemoResults();
    }
}
    
    getCompositionValues() {
        const inputs = document.querySelectorAll('.composition-input');
        const values = Array.from(inputs).map(input => 
            (parseFloat(input.value) || 0) / 100
        );
        
        // Normaliser au cas où
        const sum = values.reduce((a, b) => a + b, 0);
        return values.map(v => v / sum);
    }
    
 // Dans app.js - Corriger la fonction updateResultsUI

updateResultsUI(results, energy, profiles) {
    console.log('Updating UI with results:', results);
    
    // Helper pour formater les nombres
    const format = (value, decimals = 1, fallback = '--') => {
        if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
            return fallback;
        }
        return value.toFixed(decimals);
    };
    
    try {
        // 1. Cartes récapitulatives
        document.getElementById('total-plates').textContent = format(results.N_real, 0);
        document.getElementById('reflux-ratio').textContent = format(results.R, 3);
        document.getElementById('reboiler-energy').textContent = `${format(energy.Q_reboiler)} kW`;
        document.getElementById('steam-consumption').textContent = `${format(energy.steam_consumption)} kg/h`;
        
        // 2. Bilan matière
        const feedTotal = results.F || 100;
        document.getElementById('feed-total').textContent = `${format(feedTotal)} kmol/h`;
        document.getElementById('distillat-total').textContent = `${format(results.D)} kmol/h`;
        document.getElementById('residue-total').textContent = `${format(results.B)} kmol/h`;
        
        // 3. Compositions
        this.updateCompositionDisplays(results);
        
        // 4. Paramètres de conception
        document.getElementById('n-min').textContent = format(results.N_min, 2);
        document.getElementById('r-min').textContent = format(results.R_min, 3);
        document.getElementById('n-theoretical').textContent = format(results.N_theoretical, 2);
        document.getElementById('efficiency-result').textContent = `${format(results.efficiency * 100, 1)}%`;
        document.getElementById('feed-stage').textContent = format(results.feed_stage, 0);
        
        // 5. ΔT
        if (profiles && profiles.temperatures && profiles.temperatures.length > 1) {
            const deltaT = profiles.temperatures[profiles.temperatures.length - 1] - profiles.temperatures[0];
            document.getElementById('delta-t').textContent = `${format(deltaT, 1)} K`;
        } else {
            document.getElementById('delta-t').textContent = '-- K';
        }
        
        // 6. Distribution détaillée
        this.updateDistributionTable(results, feedTotal);
        
        // 7. Analyse énergétique
        this.updateEnergyAnalysis(energy, profiles);
        
        console.log('UI updated successfully');
        
    } catch (error) {
        console.error('Error updating UI:', error);
        this.showNotification('Erreur lors de l\'affichage des résultats', 'error');
    }
}

updateCompositionDisplays(results) {
    try {
        // Alimentation
        const feedContainer = document.getElementById('feed-composition');
        if (feedContainer && results.zF) {
            feedContainer.innerHTML = this.compounds.map((comp, i) => {
                const percent = (results.zF[i] || 0) * 100;
                return `
                    <div>
                        <span>${comp.displayName}:</span>
                        <span class="composition-value">${percent.toFixed(1)}%</span>
                    </div>
                `;
            }).join('');
        }
        
        // Distillat
        const distillatContainer = document.getElementById('distillat-composition');
        if (distillatContainer && results.xD) {
            distillatContainer.innerHTML = this.compounds.map((comp, i) => {
                const percent = (results.xD[i] || 0) * 100;
                return `
                    <div>
                        <span>${comp.displayName}:</span>
                        <span class="composition-value">${percent.toFixed(1)}%</span>
                    </div>
                `;
            }).join('');
        }
        
        // Résidu
        const residueContainer = document.getElementById('residue-composition');
        if (residueContainer && results.xB) {
            residueContainer.innerHTML = this.compounds.map((comp, i) => {
                const percent = (results.xB[i] || 0) * 100;
                return `
                    <div>
                        <span>${comp.displayName}:</span>
                        <span class="composition-value">${percent.toFixed(1)}%</span>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error updating composition displays:', error);
    }
}

updateDistributionTable(results, feedTotal) {
    try {
        const tbody = document.getElementById('distribution-body');
        if (!tbody || !results.xD || !results.xB) return;
        
        tbody.innerHTML = this.compounds.map((comp, i) => {
            const F_i = (results.zF[i] || 0) * feedTotal;
            const D_i = (results.xD[i] || 0) * (results.D || 0);
            const B_i = (results.xB[i] || 0) * (results.B || 0);
            const recovery = F_i > 0 ? (D_i / F_i) * 100 : 0;
            
            return `
                <tr>
                    <td>${comp.displayName}</td>
                    <td>${F_i.toFixed(2)}</td>
                    <td>${D_i.toFixed(2)}</td>
                    <td>${B_i.toFixed(2)}</td>
                    <td>${recovery.toFixed(1)}%</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error updating distribution table:', error);
    }
}
    
    updateEnergyAnalysis(energy, profiles) {
        // Mettre à jour l'analyse énergétique
        const condenserEnergy = document.getElementById('condenser-energy');
        const reboilerEnergy = document.getElementById('reboiler-energy-detailed');
        const energyRatio = document.getElementById('energy-ratio');
        const steamConsumption = document.getElementById('steam-consumption-detailed');
        const steamCost = document.getElementById('steam-cost');
        
        if (condenserEnergy) condenserEnergy.textContent = `${energy.Q_condenser.toFixed(1)} kW`;
        if (reboilerEnergy) reboilerEnergy.textContent = `${energy.Q_reboiler.toFixed(1)} kW`;
        if (energyRatio) energyRatio.textContent = energy.energy_ratio.toFixed(2);
        if (steamConsumption) steamConsumption.textContent = `${energy.steam_consumption.toFixed(0)} kg/h`;
        if (steamCost) {
            const cost = energy.steam_consumption * 0.02; // $0.02/kg
            steamCost.textContent = `$${cost.toFixed(2)}/h`;
        }
        
        // Mettre à jour les températures
        if (profiles && profiles.temperatures && profiles.temperatures.length > 0) {
            const condenserTemp = document.getElementById('condenser-temp');
            const reboilerTemp = document.getElementById('reboiler-temp');
            
            if (condenserTemp) condenserTemp.textContent = `${(profiles.temperatures[0] - 273.15).toFixed(1)}°C`;
            if (reboilerTemp) reboilerTemp.textContent = `${(profiles.temperatures[profiles.temperatures.length - 1] - 273.15).toFixed(1)}°C`;
        }
    }
    
    showDemoResults() {
        // Résultats de démonstration pour le débogage
        const demoResults = {
            N_real: 24,
            R: 2.15,
            D: 66.6,
            B: 33.4,
            N_min: 12.5,
            R_min: 1.62,
            N_theoretical: 17.2,
            efficiency: 0.7,
            feed_stage: 14,
            zF: this.compounds.map(() => 1/this.compounds.length),
            xD: this.compounds.map((_, i) => i === 0 ? 0.5 : i === 1 ? 0.35 : 0.15),
            xB: this.compounds.map((_, i) => i === 0 ? 0.05 : i === 1 ? 0.45 : 0.5),
            F: 100
        };
        
        const demoEnergy = {
            Q_condenser: 850.5,
            Q_reboiler: 920.3,
            steam_consumption: 1578.5,
            energy_ratio: 1.08
        };
        
        const demoProfiles = {
            stages: Array.from({length: 24}, (_, i) => i + 1),
            temperatures: Array.from({length: 24}, (_, i) => 353 + i * 3)
        };
        
        this.updateResultsUI(demoResults, demoEnergy, demoProfiles);
        this.showNotification('Affichage des résultats de démonstration', 'warning');
    }
    
  // Dans app.js, modifiez la méthode changeChart

changeChart(chartType = null) {
    if (!chartType) {
        const select = document.getElementById('chart-select');
        chartType = select ? select.value : 'composition';
    }
    
    // Détruire le graphique existant
    if (this.visualizer) {
        this.visualizer.forceDestroyChart();
    }
    
    if (!this.results || !this.profiles || !this.visualizer) {
        this.showNotification('Exécutez d\'abord une simulation', 'warning');
        // Afficher un graphique vide
        this.visualizer.showEmptyChart('Exécutez une simulation pour voir les données');
        return;
    }
    
    // Mettre à jour les noms des composés dans le visualiseur
    if (this.compounds && this.compounds.length > 0) {
        this.visualizer.compoundNames = this.compounds.map(c => c.displayName);
    }
    
    switch(chartType) {
        case 'composition':
            this.visualizer.createCompositionChart(
                this.profiles.stages,
                this.profiles.x_profiles,
                this.profiles.y_profiles,
                this.results.feed_stage
            );
            break;
            
        case 'temperature':
            this.visualizer.createTemperatureChart(
                this.profiles.stages,
                this.profiles.temperatures,
                this.results.feed_stage
            );
            break;
            
        case 'shortcut':
            this.visualizer.createShortcutChart(this.results);
            break;
            
        case 'column':
            const compoundNames = this.compounds.map(c => c.displayName);
            this.visualizer.createColumnDiagram(this.results, compoundNames);
            break;
    }
    
    // Mettre à jour les infos du graphique
    this.updateChartInfo(chartType);
}
    
    updateChartInfo(chartType) {
        const info = {
            'composition': 'Profils de composition liquide dans la colonne',
            'temperature': 'Profil de température le long des plateaux',
            'shortcut': 'Courbe de Gilliland montrant la relation reflux/nombre de plateaux',
            'column': 'Schéma de la colonne avec sections de rectification et épuisement'
        };
        
        const infoElement = document.getElementById('chart-info');
        if (infoElement) {
            infoElement.textContent = info[chartType] || '';
        }
    }
    
    openTab(tabName) {
        // Masquer tous les contenus d'onglets
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });
        
        // Désactiver tous les boutons d'onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Afficher l'onglet sélectionné
        const tabId = tabName + '-tab';
        const tabElement = document.getElementById(tabId);
        const buttonElement = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
        
        if (tabElement) {
            tabElement.style.display = 'block';
            tabElement.classList.add('active');
        }
        
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
    }
    
    updateSimulationStatus(status, type = 'info') {
        const badge = document.getElementById('simulation-status');
        if (!badge) return;
        
        const icons = {
            'success': 'check-circle',
            'warning': 'clock',
            'error': 'exclamation-circle',
            'info': 'info-circle'
        };
        
        badge.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${status}`;
        badge.className = `status-badge status-${type}`;
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            <div>
                <strong>${type === 'error' ? 'Erreur' : type === 'warning' ? 'Attention' : 'Information'}</strong>
                <p>${message}</p>
            </div>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Fonctions d'export
    exportPDF() {
        this.showNotification('Fonction PDF en développement', 'info');
    }
    
    exportCSV() {
        if (!this.results) {
            this.showNotification('Aucun résultat à exporter', 'warning');
            return;
        }
        
        let csv = 'Paramètre,Valeur,Unité\n';
        csv += `Nombre de plateaux,${this.results.N_real},-\n`;
        csv += `Reflux opératoire,${this.results.R.toFixed(3)},-\n`;
        csv += `Débit distillat,${this.results.D.toFixed(2)},kmol/h\n`;
        csv += `Débit résidu,${this.results.B.toFixed(2)},kmol/h\n`;
        
        // Créer le fichier
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'distillation_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('Données exportées en CSV', 'success');
    }
    
    generateShareLink() {
        this.showNotification('Partage en développement', 'info');
    }
}

// Exposer l'application globalement
window.app = new DistillationApp();

// Initialiser l'application quand la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    // Masquer l'écran de chargement
    setTimeout(function() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app-container');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        
        // Initialiser l'application
        if (window.app) {
            window.app.initializeApp();
        } else {
            console.error('Application non définie');
            if (appContainer) {
                appContainer.innerHTML = `
                    <div class="error-screen">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <h2>Erreur d'initialisation</h2>
                        <p>L'application n'a pas pu être initialisée. Rechargez la page.</p>
                        <button onclick="location.reload()">
                            <i class="fas fa-redo"></i> Recharger
                        </button>
                    </div>
                `;
            }
        }
    }, 500);
});
