// compound-search.js - Recherche et sélection des composés

class CompoundSearch {
    constructor() {
        this.allCompounds = [
            'benzene', 'toluene', 'o-xylene', 'p-xylene', 'm-xylene',
            'ethylbenzene', 'cyclohexane', 'n-hexane', 'n-heptane',
            'n-octane', 'isooctane', 'acetone', 'methanol', 'ethanol',
            'propanol', 'water'
        ];
        
        this.compoundNames = {
            'benzene': 'Benzène',
            'toluene': 'Toluène',
            'o-xylene': 'o-Xylène',
            'p-xylene': 'p-Xylène',
            'm-xylene': 'm-Xylène',
            'ethylbenzene': 'Éthylbenzène',
            'cyclohexane': 'Cyclohexane',
            'n-hexane': 'n-Hexane',
            'n-heptane': 'n-Heptane',
            'n-octane': 'n-Octane',
            'isooctane': 'Isooctane (2,2,4-triméthylpentane)',
            'acetone': 'Acétone',
            'methanol': 'Méthanol',
            'ethanol': 'Éthanol',
            'propanol': 'Propanol',
            'water': 'Eau'
        };
    }
    
    search(query) {
        if (!query) return [];
        
        const q = query.toLowerCase();
        return this.allCompounds
            .filter(name => 
                name.toLowerCase().includes(q) || 
                (this.compoundNames[name] && this.compoundNames[name].toLowerCase().includes(q))
            )
            .map(name => ({
                id: name,
                name: this.compoundNames[name] || name,
                formula: this.getFormula(name)
            }));
    }
    
    getFormula(name) {
        const formulas = {
            'benzene': 'C₆H₆',
            'toluene': 'C₇H₈',
            'o-xylene': 'C₈H₁₀',
            'p-xylene': 'C₈H₁₀',
            'm-xylene': 'C₈H₁₀',
            'ethylbenzene': 'C₈H₁₀',
            'cyclohexane': 'C₆H₁₂',
            'n-hexane': 'C₆H₁₄',
            'n-heptane': 'C₇H₁₆',
            'n-octane': 'C₈H₁₈',
            'isooctane': 'C₈H₁₈',
            'acetone': 'C₃H₆O',
            'methanol': 'CH₄O',
            'ethanol': 'C₂H₆O',
            'propanol': 'C₃H₈O',
            'water': 'H₂O'
        };
        return formulas[name] || '';
    }
    
    getProperties(name) {
        return {
            name: this.compoundNames[name] || name,
            formula: this.getFormula(name)
        };
    }
}