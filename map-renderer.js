// ===================== SISTEMA DE VISUALIZACIÓN MEJORADO =====================
// Corrige problemas de renderizado y mejora la funcionalidad del mapa

// Funciones de visualización mejoradas que reemplazan las del terrain.js

// Función principal de visualización del mapa
function visualizeMap(svg, render, options) {
    if (!render || !render.h) return;
    
    options = options || {};
    const view = options.view || 'normal';
    
    // Limpiar contenido anterior
    svg.selectAll('*').remove();
    
    // Crear grupo principal con transformaciones
    const g = svg.append('g').attr('class', 'map-group');
    
    // Aplicar vista según el tipo seleccionado
    switch(view) {
        case 'height':
            visualizeHeight(g, render.h);
            break;
        case 'climate':
            visualizeClimate(g, render.h, render.climate);
            break;
        case 'political':
            if (options.political && render.terr) {
                visualizePolitical(g, render.h, render.terr, getTerritoryColors());
            } else {
                visualizeTerrain(g, render.h);
            }
            break;
        case 'biomes':
            if (options.biomes && render.biomes) {
                visualizeBiomes(g, render.h, render.biomes, getBiomeColors());
            } else {
                visualizeTerrain(g, render.h);
            }
            break;
        default:
            visualizeTerrain(g, render.h);
            break;
    }
    
    // Añadir elementos overlay según filtros
    if (options.borders && render.borders) {
        drawPaths(g, 'border', render.borders);
    }
    
    if (options.cities && render.cities) {
        visualizeCitiesEnhanced(g, render);
    }
    
    if (options.events && render.events) {
        renderEvents(g, render.events);
    }
    
    // Configurar interactividad
    setupMapInteractivity(svg, g);
}

// Visualización de terreno mejorada (blanco y negro)
function visualizeTerrain(svg, field) {
    if (!field || !field.mesh || !field.mesh.tris) return;
    
    const tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true)
        .merge(tris)
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            const val = field[i];
            if (val === undefined || val === null) return '#000';
            
            if (val <= 0) {
                // Océano - azules
                return val < -0.5 ? '#000080' : '#4169E1';
            } else {
                // Tierra - escala de grises
                const intensity = Math.min(1, val * 2);
                const gray = Math.floor(255 * (1 - intensity * 0.7));
                return `rgb(${gray},${gray},${gray})`;
            }
        })
        .style('stroke', 'none');
    
    tris.exit().remove();
}

// Visualización de alturas mejorada
function visualizeHeight(svg, field) {
    if (!field || !field.mesh || !field.mesh.tris) return;
    
    const lo = d3.min(field);
    const hi = d3.max(field);
    const range = hi - lo;
    
    const tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true)
        .merge(tris)
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            const val = field[i];
            if (val === undefined || val === null) return '#000';
            
            const normalized = range > 0 ? (val - lo) / range : 0;
            
            if (val <= 0) {
                // Agua
                return val < -0.3 ? '#000080' : '#4169E1';
            } else if (normalized < 0.3) {
                // Tierra baja - verde
                return '#228B22';
            } else if (normalized < 0.6) {
                // Colinas - marrón claro
                return '#8B7355';
            } else if (normalized < 0.85) {
                // Montañas - marrón oscuro
                return '#654321';
            } else {
                // Picos - blanco (nieve)
                return '#FFFFFF';
            }
        })
        .style('stroke', 'none');
    
    tris.exit().remove();
}

// Visualización política mejorada
function visualizePolitical(svg, field, territories, territoryColors) {
    if (!field || !field.mesh || !field.mesh.tris) return;
    
    const tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true)
        .merge(tris)
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            if (territories && territories[i] !== undefined) {
                const territoryIndex = territories[i];
                return territoryColors[territoryIndex] || '#888888';
            }
            return field[i] <= 0 ? '#4169E1' : '#CCCCCC';
        })
        .style('stroke', '#333')
        .style('stroke-width', 0.5)
        .style('opacity', 0.8);
    
    tris.exit().remove();
}

// Visualización de biomas mejorada
function visualizeBiomes(svg, field, biomes, biomeColors) {
    if (!field || !field.mesh || !field.mesh.tris) return;
    
    const tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true)
        .merge(tris)
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            const biome = biomes[i];
            return biomeColors[biome] || '#888888';
        })
        .style('stroke', 'none');
    
    tris.exit().remove();
}

// Visualización de clima
function visualizeClimate(svg, field, climate) {
    if (!field || !field.mesh || !field.mesh.tris) return;
    
    climate = climate || generateClimate(field);
    
    const tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true)
        .merge(tris)
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            const temp = climate.temperature[i] || 0;
            
            if (field[i] <= 0) return '#4169E1'; // Agua
            
            // Escala de colores por temperatura
            if (temp < 0.2) return '#0000FF'; // Muy frío
            if (temp < 0.4) return '#4169E1'; // Frío
            if (temp < 0.6) return '#00FF00'; // Templado
            if (temp < 0.8) return '#FFD700'; // Cálido
            return '#FF0000'; // Caliente
        })
        .style('stroke', 'none');
    
    tris.exit().remove();
}

// Función mejorada para visualizar ciudades con puntos clicables
function visualizeCitiesEnhanced(svg, render, cityData) {
    if (!render.cities) return;
    
    // Limpiar ciudades existentes
    svg.selectAll('.city-group').remove();
    
    // Crear grupos para cada ciudad
    const cityGroups = svg.selectAll('.city-group')
        .data(render.cities)
        .enter()
        .append('g')
        .attr('class', 'city-group city-marker')
        .attr('transform', function(d, i) {
            const pos = appState.cityData[i] ? appState.cityData[i].position : d;
            return `translate(${pos[0]}, ${pos[1]})`;
        });
    
    // Añadir círculo principal para cada ciudad
    cityGroups.append('circle')
        .attr('class', 'city-circle')
        .attr('r', function(d, i) {
            const population = appState.cityData[i] ? appState.cityData[i].population : 5000;
            return Math.max(4, Math.min(12, Math.sqrt(population / 1000) + 3));
        })
        .attr('fill', '#FFE0B2')
        .attr('stroke', '#8B4513')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))')
        .style('cursor', 'pointer');
    
    // Añadir texto con nombre de ciudad
    cityGroups.append('text')
        .attr('class', 'city-label')
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#FFE0B2')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
        .style('pointer-events', 'none')
        .text(function(d, i) {
            return appState.cityData[i] ? appState.cityData[i].name : `Ciudad ${i + 1}`;
        });
    
    // Event listeners para interactividad
    cityGroups.on('click', function(d, i) {
        d3.event.stopPropagation();
        showCityInfo(appState.cityData[i] || { name: `Ciudad ${i + 1}`, position: d });
    });
    
    cityGroups.on('contextmenu', function(d, i) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        showCityContextMenu(d3.event, i);
    });
    
    // Hover effects
    cityGroups.on('mouseenter', function() {
        d3.select(this).select('.city-circle')
            .transition()
            .duration(200)
            .attr('r', function() {
                return parseFloat(d3.select(this).attr('r')) * 1.2;
            });
    });
    
    cityGroups.on('mouseleave', function() {
        d3.select(this).select('.city-circle')
            .transition()
            .duration(200)
            .attr('r', function(d, i) {
                const population = appState.cityData[i] ? appState.cityData[i].population : 5000;
                return Math.max(4, Math.min(12, Math.sqrt(population / 1000) + 3));
            });
    });
}

// Función para renderizar eventos con puntos clicables
function renderEvents(svg, events) {
    if (!events || !Array.isArray(events)) return;
    
    // Limpiar eventos existentes
    svg.selectAll('.event-group').remove();
    
    const eventGroups = svg.selectAll('.event-group')
        .data(events)
        .enter()
        .append('g')
        .attr('class', 'event-group event-marker')
        .attr('transform', d => `translate(${d.position[0]}, ${d.position[1]})`);
    
    // Círculo de fondo para mejor visibilidad
    eventGroups.append('circle')
        .attr('r', 12)
        .attr('fill', 'rgba(0,0,0,0.6)')
        .attr('stroke', '#D4AF37')
        .attr('stroke-width', 1.5);
    
    // Icono del evento
    eventGroups.append('text')
        .attr('class', 'event-icon')
        .attr('font-size', '16')
        .attr('text-anchor', 'middle')
        .attr('y', 5)
        .style('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))')
        .style('cursor', 'pointer')
        .text(d => d.icon);
    
    // Etiqueta del evento (opcional, aparece en hover)
    eventGroups.append('text')
        .attr('class', 'event-label')
        .attr('y', -18)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', '#D4AF37')
        .style('opacity', 0)
        .style('pointer-events', 'none')
        .text(d => d.name);
    
    // Event listeners
    eventGroups.on('click', function(d) {
        d3.event.stopPropagation();
        showEventInfo(d);
    });
    
    eventGroups.on('contextmenu', function(d) {
        d3.event.preventDefault();
        d3.event.stopPropagation();
        showEventContextMenu(d3.event, d);
    });
    
    // Mostrar etiqueta en hover
    eventGroups.on('mouseenter', function() {
        d3.select(this).select('.event-label')
            .transition()
            .duration(200)
            .style('opacity', 1);
    });
    
    eventGroups.on('mouseleave', function() {
        d3.select(this).select('.event-label')
            .transition()
            .duration(200)
            .style('opacity', 0);
    });
}

// Función para configurar interactividad del mapa
function setupMapInteractivity(svg, g) {
    // Zoom y pan
    const zoom = d3.zoom()
        .scaleExtent([0.3, 8])
        .on('zoom', function() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.ctrlKey) {
                // Solo zoom con Ctrl presionado
                g.attr('transform', d3.event.transform);
                appState.zoom = d3.event.transform.k;
                appState.pan = { x: d3.event.transform.x, y: d3.event.transform.y };
            }
        });
    
    svg.call(zoom);
    
    // Click en el mapa para herramientas
    svg.on('click', function() {
        if (appState.currentTool !== 'select') {
            const coords = d3.mouse(g.node());
            handleToolClick(coords);
        }
    });
}

// Manejar clicks de herramientas
function handleToolClick(coords) {
    switch(appState.currentTool) {
        case 'city':
            addCityAtPosition(coords);
            break;
        case 'event':
            addEventAtPosition(coords);
            break;
        case 'territory':
            // Implementar lógica de territorio
            break;
    }
}

// Función para aplicar filtros visuales
function applyMapFilters(svg, filters) {
    // Mostrar/ocultar ciudades
    svg.selectAll('.city-marker')
        .style('display', filters.cities ? 'block' : 'none');
    
    // Mostrar/ocultar eventos
    svg.selectAll('.event-marker')
        .style('display', filters.events ? 'block' : 'none');
    
    // Mostrar/ocultar fronteras
    svg.selectAll('.border')
        .style('display', filters.borders ? 'block' : 'none');
}

// Función para obtener colores de territorios
function getTerritoryColors() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'];
    return appState.territories.map((territory, index) => territory.color || colors[index % colors.length]);
}

// Función para obtener colores de biomas
function getBiomeColors() {
    return {
        'ocean': '#2E5984',
        'deepOcean': '#1A365D',
        'coast': '#4A90E2',
        'beach': '#F4E4BC',
        'grassland': '#7CB342',
        'forest': '#388E3C',
        'mountain': '#6D4C41',
        'snow': '#E3F2FD',
        'desert': '#FFB74D',
        'jungle': '#2E7D32',
        'swamp': '#4E342E',
        'tundra': '#90A4AE'
    };
}

// Función para generar datos de clima
function generateClimate(h) {
    const temperature = [];
    const humidity = [];
    
    for (let i = 0; i < h.length; i++) {
        const height = h[i];
        const lat = Math.abs(h.mesh.vxs[i][1] / h.mesh.extent.height);
        
        // Temperatura basada en latitud y altura
        let temp = 1 - lat; // Más caliente cerca del ecuador
        temp -= Math.max(0, height) * 0.5; // Más frío en altura
        temp = Math.max(0, Math.min(1, temp));
        
        // Humedad basada en proximidad al agua
        let humid = height <= 0 ? 1 : Math.random() * 0.8 + 0.2;
        
        temperature[i] = temp;
        humidity[i] = humid;
    }
    
    return { temperature, humidity };
}

// Función principal para actualizar visualización
function updateVisualization(svg, mapData, options) {
    if (!mapData) return;
    
    const render = {
        h: mapData.h,
        cities: appState.persistentNames.cities.map(city => city.position),
        events: appState.persistentNames.events,
        terr: mapData.terr,
        borders: mapData.borders,
        biomes: mapData.biomes,
        climate: mapData.climate
    };
    
    visualizeMap(svg, render, options);
}

// Función mejorada doMap que corrige problemas de renderización
function doMap(svg, params, options) {
    try {
        // Generar mapa base
        const h = generateCoast(params);
        
        // Generar territorios si es necesario
        let terr = null;
        if (options.political || appState.activeFilters.political) {
            terr = getTerritories({
                h: h,
                cities: appState.persistentNames.cities.map(city => city.position).slice(0, params.ncities),
                params: params
            });
        }
        
        // Generar biomas si es necesario
        let biomes = null;
        if (options.biomes || appState.activeFilters.biomes) {
            biomes = getBiomes(h);
        }
        
        // Generar fronteras
        let borders = null;
        if (terr) {
            borders = getBorders({ h: h, terr: terr });
        }
        
        // Generar clima
        const climate = generateClimate(h);
        
        const mapData = {
            h: h,
            cities: appState.persistentNames.cities.map(city => city.position).slice(0, params.ncities),
            terr: terr,
            borders: borders,
            biomes: biomes,
            climate: climate,
            params: params
        };
        
        // Renderizar el mapa
        updateVisualization(svg, mapData, options);
        
        return mapData;
    } catch (error) {
        console.error('Error in doMap:', error);
        throw error;
    }
}
