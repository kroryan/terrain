// Translation system for Fantasy Map Generator
const translations = {
    es: {
        // Main titles
        title: "Generador de Mapas Fantasy",
        mapGenerator: "🗺️ Generador de Mapas Fantasy",
        
        // Generation section
        generation: "⚙️ Generación",
        generateNewMap: "🎲 Generar Nuevo Mapa",
        downloadSvg: "💾 Descargar SVG",
        detailLevel: "Nivel de Detalle:",
        numberOfCities: "Número de Ciudades:",
        territories: "Territorios:",
        eventsPoI: "Eventos/POI:",
        
        // Map filters
        mapFilters: "🔍 Filtros de Mapa",
        physical: "Físico",
        political: "Político",
        biomes: "Biomas",
        cities: "Ciudades",
        events: "Eventos",
        borders: "Fronteras",
        
        // Tools
        tools: "🛠️ Herramientas",
        select: "👆 Seleccionar",
        city: "🏰 Ciudad",
        event: "⚡ Evento",
        territory: "🏛️ Territorio",
        
        // Territory management
        territoryManagement: "🏛️ Territorios",
        newTerritory: "➕ Nuevo Territorio",
        
        // Biome configuration
        biomeConfig: "🌍 Configuración Biomas",
        temperatureRange: "Rango de Temperatura:",
        humidity: "Humedad:",
        
        // Views
        view: "Vista:",
        normal: "Normal",
        height: "Altura",
        climate: "Clima",
        
        // Navigation controls
        zoomIn: "🔍 Zoom +",
        zoomOut: "🔍 Zoom -",
        resetView: "🏠 Centrar",
        fullscreen: "🖥️ Pantalla completa",
        exitFullscreen: "↩️ Salir",
        collapse: "←",
        expand: "→",
        language: "🌐 Idioma",
        
        // City information
        cityInfo: "🏰 Información de Ciudad",
        population: "Población:",
        inhabitants: "habitantes",
        specialty: "Especialidad:",
        description: "Descripción:",
        resources: "Recursos:",
        government: "Gobierno:",
        wealth: "Riqueza:",
        defense: "Defensa:",
        trade: "Comercio:",
        magic: "Magia:",
        alliances: "Alianzas:",
        editCity: "✏️ Editar Ciudad",
        deleteCity: "🗑️ Eliminar Ciudad",
        cityStats: "📊 Estadísticas",
        cityLevel: "Nivel:",
        
        // Event information
        eventInfo: "⚡ Información de Evento",
        difficulty: "Dificultad:",
        rewards: "Recompensas:",
        legend: "Leyenda:",
        participants: "Participantes:",
        duration: "Duración:",
        editEvent: "✏️ Editar Evento",
        deleteEvent: "🗑️ Eliminar Evento",
        eventStats: "📊 Detalles",
        
        // Territory information
        territoryInfo: "🏛️ Información de Territorio",
        area: "Área:",
        totalPopulation: "Población Total:",
        militaryPower: "Poder Militar:",
        relations: "Relaciones:",
        citiesCount: "Ciudades:",
        editTerritory: "✏️ Editar Territorio",
        deleteTerritory: "🗑️ Eliminar Territorio",
        territoryStats: "📊 Estadísticas",
        
        // Specialties
        commerce: "Comercio",
        mining: "Minería",
        agriculture: "Agricultura",
        fishing: "Pesca",
        crafts: "Artesanía",
        magical: "Magia",
        military: "Militar",
        academic: "Académica",
        port: "Puerto",
        fortress: "Fortaleza",
        
        // Governments
        kingdom: "Reino",
        republic: "República",
        cityState: "Ciudad-Estado",
        duchy: "Ducado",
        principality: "Principado",
        confederation: "Confederación",
        
        // Difficulty levels
        novice: "Novato",
        intermediate: "Intermedio",
        advanced: "Avanzado",
        expert: "Experto",
        legendary: "Legendario",
        
        // Rewards
        gold: "Oro",
        magicalArtifacts: "Artefactos Mágicos",
        ancientBooks: "Libros Antiguos",
        rareGems: "Gemas Raras",
        enchantedWeapons: "Armas Encantadas",
        arcaneKnowledge: "Conocimiento Arcano",
        
        // Biomes
        ocean: "Océano",
        deepOcean: "Océano Profundo",
        coast: "Costa",
        beach: "Playa",
        grassland: "Pradera",
        forest: "Bosque",
        mountain: "Montaña",
        snow: "Nieve",
        desert: "Desierto",
        jungle: "Selva",
        swamp: "Pantano",
        tundra: "Tundra",
        lowLand: "Tierra baja",
        hills: "Colinas",
        mountains: "Montañas",
        snowPeaks: "Picos nevados",
        
        // Messages
        mapGenerated: "Mapa generado exitosamente",
        mapError: "Error generando mapa",
        cityRenamed: "Ciudad renombrada",
        cityDeleted: "Ciudad eliminada",
        eventUpdated: "Evento actualizado",
        territoryUpdated: "Territorio actualizado",
        confirmDelete: "¿Estás seguro de eliminar?",
        enterNewName: "Introduce el nuevo nombre:",
        changesSaved: "Cambios guardados correctamente",
        
        // Actions
        close: "✖️ Cerrar",
        edit: "✏️ Editar",
        save: "💾 Guardar",
        cancel: "❌ Cancelar",
        delete: "🗑️ Eliminar",
        confirm: "✅ Confirmar",
        
        // Legend
        legendTitle: "Leyenda",
        village: "Aldea",
        town: "Pueblo",
        greatCity: "Gran Ciudad",
        metropolis: "Metrópolis",
        
        // City levels
        modest: "Modesta",
        moderate: "Moderada",
        rich: "Rica",
        veryRich: "Muy Rica",
        extremelyRich: "Extremadamente Rica",
        
        // Event types
        ruins: "Ruinas",
        tower: "Torre Mágica",
        cave: "Cueva",
        temple: "Templo",
        battlefield: "Campo de Batalla",
        portal: "Portal",
        dragon: "Guarida de Dragón",
        
        // Editor
        cityEditor: "🏰 Editor de Ciudad",
        eventEditor: "⚡ Editor de Evento",
        name: "Nombre:",
        type: "Tipo:",
        newCityName: "Nombre de la nueva ciudad:",
        newEventName: "Nombre del evento/POI:",
        
        // Climate
        cold: "Frío",
        temperate: "Templado",
        warm: "Cálido",
        hot: "Caliente",
        veryHot: "Muy caliente"
    },
    
    en: {
        // Main titles
        title: "Fantasy Map Generator",
        mapGenerator: "🗺️ Fantasy Map Generator",
        
        // Generation section
        generation: "⚙️ Generation",
        generateNewMap: "🎲 Generate New Map",
        downloadSvg: "💾 Download SVG",
        detailLevel: "Detail Level:",
        numberOfCities: "Number of Cities:",
        territories: "Territories:",
        eventsPoI: "Events/POI:",
        
        // Map filters
        mapFilters: "🔍 Map Filters",
        physical: "Physical",
        political: "Political",
        biomes: "Biomes",
        cities: "Cities",
        events: "Events",
        borders: "Borders",
        
        // Tools
        tools: "🛠️ Tools",
        select: "👆 Select",
        city: "🏰 City",
        event: "⚡ Event",
        territory: "🏛️ Territory",
        
        // Territory management
        territoryManagement: "🏛️ Territories",
        newTerritory: "➕ New Territory",
        
        // Biome configuration
        biomeConfig: "🌍 Biome Configuration",
        temperatureRange: "Temperature Range:",
        humidity: "Humidity:",
        
        // Views
        view: "View:",
        normal: "Normal",
        height: "Height",
        climate: "Climate",
        
        // Navigation controls
        zoomIn: "🔍 Zoom +",
        zoomOut: "🔍 Zoom -",
        resetView: "🏠 Center",
        fullscreen: "🖥️ Fullscreen",
        exitFullscreen: "↩️ Exit",
        collapse: "←",
        expand: "→",
        language: "🌐 Language",
        
        // City information
        cityInfo: "🏰 City Information",
        population: "Population:",
        inhabitants: "inhabitants",
        specialty: "Specialty:",
        description: "Description:",
        resources: "Resources:",
        government: "Government:",
        wealth: "Wealth:",
        defense: "Defense:",
        trade: "Trade:",
        magic: "Magic:",
        alliances: "Alliances:",
        editCity: "✏️ Edit City",
        deleteCity: "🗑️ Delete City",
        cityStats: "📊 Statistics",
        cityLevel: "Level:",
        
        // Event information
        eventInfo: "⚡ Event Information",
        difficulty: "Difficulty:",
        rewards: "Rewards:",
        legend: "Legend:",
        participants: "Participants:",
        duration: "Duration:",
        editEvent: "✏️ Edit Event",
        deleteEvent: "🗑️ Delete Event",
        eventStats: "📊 Details",
        
        // Territory information
        territoryInfo: "🏛️ Territory Information",
        area: "Area:",
        totalPopulation: "Total Population:",
        militaryPower: "Military Power:",
        relations: "Relations:",
        citiesCount: "Cities:",
        editTerritory: "✏️ Edit Territory",
        deleteTerritory: "🗑️ Delete Territory",
        territoryStats: "📊 Statistics",
        
        // Specialties
        commerce: "Commerce",
        mining: "Mining",
        agriculture: "Agriculture",
        fishing: "Fishing",
        crafts: "Crafts",
        magical: "Magic",
        military: "Military",
        academic: "Academic",
        port: "Port",
        fortress: "Fortress",
        
        // Governments
        kingdom: "Kingdom",
        republic: "Republic",
        cityState: "City-State",
        duchy: "Duchy",
        principality: "Principality",
        confederation: "Confederation",
        
        // Difficulty levels
        novice: "Novice",
        intermediate: "Intermediate",
        advanced: "Advanced",
        expert: "Expert",
        legendary: "Legendary",
        
        // Rewards
        gold: "Gold",
        magicalArtifacts: "Magical Artifacts",
        ancientBooks: "Ancient Books",
        rareGems: "Rare Gems",
        enchantedWeapons: "Enchanted Weapons",
        arcaneKnowledge: "Arcane Knowledge",
        
        // Biomes
        ocean: "Ocean",
        deepOcean: "Deep Ocean",
        coast: "Coast",
        beach: "Beach",
        grassland: "Grassland",
        forest: "Forest",
        mountain: "Mountain",
        snow: "Snow",
        desert: "Desert",
        jungle: "Jungle",
        swamp: "Swamp",
        tundra: "Tundra",
        lowLand: "Lowland",
        hills: "Hills",
        mountains: "Mountains",
        snowPeaks: "Snow peaks",
        
        // Messages
        mapGenerated: "Map generated successfully",
        mapError: "Error generating map",
        cityRenamed: "City renamed",
        cityDeleted: "City deleted",
        eventUpdated: "Event updated",
        territoryUpdated: "Territory updated",
        confirmDelete: "Are you sure you want to delete?",
        enterNewName: "Enter new name:",
        changesSaved: "Changes saved successfully",
        
        // Actions
        close: "✖️ Close",
        edit: "✏️ Edit",
        save: "💾 Save",
        cancel: "❌ Cancel",
        delete: "🗑️ Delete",
        confirm: "✅ Confirm",
        
        // Legend
        legendTitle: "Legend",
        village: "Village",
        town: "Town",
        greatCity: "Great City",
        metropolis: "Metropolis",
        
        // City levels
        modest: "Modest",
        moderate: "Moderate",
        rich: "Rich",
        veryRich: "Very Rich",
        extremelyRich: "Extremely Rich",
        
        // Event types
        ruins: "Ruins",
        tower: "Magic Tower",
        cave: "Cave",
        temple: "Temple",
        battlefield: "Battlefield",
        portal: "Portal",
        dragon: "Dragon's Lair",
        
        // Editor
        cityEditor: "🏰 City Editor",
        eventEditor: "⚡ Event Editor",
        name: "Name:",
        type: "Type:",
        newCityName: "Name of the new city:",
        newEventName: "Name of the event/POI:",
        
        // Climate
        cold: "Cold",
        temperate: "Temperate",
        warm: "Warm",
        hot: "Hot",
        veryHot: "Very hot"
    }
};

// Current language state
let currentLanguage = 'es';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Language switching function
function switchLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        updateUI();
        localStorage.setItem('mapGeneratorLanguage', lang);
    }
}

// Update UI with current language
function updateUI() {
    // Update all translatable elements
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' && element.type === 'button') {
                element.value = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    // Update placeholders
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
    
    // Update titles
    const titleElements = document.querySelectorAll('[data-translate-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-translate-title');
        if (translations[currentLanguage][key]) {
            element.title = translations[currentLanguage][key];
        }
    });
}

// Initialize language on page load
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('mapGeneratorLanguage');
    if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
    }
    updateUI();
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, t, switchLanguage, updateUI, initializeLanguage };
}
