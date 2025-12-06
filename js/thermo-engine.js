// thermo-engine.js - Gestion des propriétés thermodynamiques

class ThermodynamicCompound {
    constructor(name) {
        this.name = name;
        this.displayName = this.getDisplayName(name);
        this.properties = this.loadProperties(name);
        this.loaded = true;
    }
    
    getDisplayName(name) {
        const names = {
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
            'isooctane': 'Isooctane',
            'acetone': 'Acétone',
            'methanol': 'Méthanol',
            'ethanol': 'Éthanol',
            'propanol': 'Propanol',
            'water': 'Eau'
        };
        return names[name] || name;
    }
    
    loadProperties(name) {
        // Base de données des propriétés
        const database = {
            'benzene': {
                Tb: 353.15,      // Température d'ébullition (K)
                MW: 78.11,       // Masse molaire (g/mol)
                Hvap: 30800,     // Enthalpie de vaporisation (J/mol)
                Cp: 135,         // Capacité calorifique liquide (J/mol·K)
                antoine: {A: 6.90565, B: 1211.033, C: 220.79}
            },
            'toluene': {
                Tb: 383.75,
                MW: 92.14,
                Hvap: 33200,
                Cp: 157,
                antoine: {A: 6.95334, B: 1343.943, C: 219.33}
            },
            'o-xylene': {
                Tb: 417.58,
                MW: 106.17,
                Hvap: 35700,
                Cp: 182,
                antoine: {A: 6.99891, B: 1474.679, C: 213.69}
            },
            'p-xylene': {
                Tb: 411.51,
                MW: 106.17,
                Hvap: 35700,
                Cp: 182,
                antoine: {A: 6.99052, B: 1453.430, C: 215.31}
            },
            'm-xylene': {
                Tb: 412.27,
                MW: 106.17,
                Hvap: 35700,
                Cp: 182,
                antoine: {A: 7.00908, B: 1462.266, C: 215.11}
            },
            'ethylbenzene': {
                Tb: 409.36,
                MW: 106.17,
                Hvap: 35700,
                Cp: 182,
                antoine: {A: 6.95719, B: 1424.255, C: 213.21}
            },
            'cyclohexane': {
                Tb: 353.85,
                MW: 84.16,
                Hvap: 30000,
                Cp: 154,
                antoine: {A: 6.84130, B: 1201.531, C: 222.65}
            },
            'n-hexane': {
                Tb: 341.88,
                MW: 86.18,
                Hvap: 28800,
                Cp: 195,
                antoine: {A: 6.88555, B: 1175.817, C: 224.87}
            },
            'n-heptane': {
                Tb: 371.58,
                MW: 100.20,
                Hvap: 31700,
                Cp: 224,
                antoine: {A: 6.90240, B: 1268.115, C: 216.90}
            },
            'n-octane': {
                Tb: 398.83,
                MW: 114.23,
                Hvap: 34200,
                Cp: 255,
                antoine: {A: 6.91874, B: 1351.756, C: 209.10}
            },
            'isooctane': {
                Tb: 372.39,
                MW: 114.23,
                Hvap: 30800,
                Cp: 215,
                antoine: {A: 6.81189, B: 1249.13, C: 221.53}
            },
            'acetone': {
                Tb: 329.25,
                MW: 58.08,
                Hvap: 29300,
                Cp: 125,
                antoine: {A: 7.02447, B: 1161.0, C: 224}
            },
            'methanol': {
                Tb: 337.85,
                MW: 32.04,
                Hvap: 35200,
                Cp: 81,
                antoine: {A: 8.08097, B: 1582.271, C: 239.726}
            },
            'ethanol': {
                Tb: 351.45,
                MW: 46.07,
                Hvap: 38500,
                Cp: 113,
                antoine: {A: 8.11220, B: 1592.864, C: 226.184}
            },
            'propanol': {
                Tb: 370.35,
                MW: 60.10,
                Hvap: 41300,
                Cp: 144,
                antoine: {A: 7.74416, B: 1437.686, C: 198.463}
            },
            'water': {
                Tb: 373.15,
                MW: 18.02,
                Hvap: 40600,
                Cp: 75,
                antoine: {A: 8.07131, B: 1730.63, C: 233.426}
            }
        };
        
        return database[name] || {
            Tb: 400,
            MW: 100,
            Hvap: 35000,
            Cp: 150,
            antoine: {A: 7.0, B: 1500, C: 220}
        };
    }
    
    getTb() {
        return this.properties.Tb;
    }
    
    getMW() {
        return this.properties.MW;
    }
    
    vaporPressure(T) {
        const T_C = T - 273.15;
        const antoine = this.properties.antoine;
        
        // Équation d'Antoine : log10(P[mmHg]) = A - B/(T[°C] + C)
        const logP = antoine.A - antoine.B / (T_C + antoine.C);
        const P_mmHg = Math.pow(10, logP);
        const P_Pa = P_mmHg * 133.322; // Convert mmHg to Pa
        
        return Math.max(P_Pa, 1);
    }
    
    KValue(T, P) {
        return this.vaporPressure(T) / P;
    }
    
    enthalpyLiquid(T, Tref = 298.15) {
        return this.properties.Cp * (T - Tref);
    }
    
    enthalpyVapor(T, Tref = 298.15) {
        return this.enthalpyLiquid(T, Tref) + this.properties.Hvap;
    }
    
    getFormula() {
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
        return formulas[this.name] || '';
    }
}