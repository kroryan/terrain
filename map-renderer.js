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
    if (!events || events.length === 0) return;
    
    const eventGroups = svg.selectAll('.event-group')
        .data(events)
        .enter()
        .append('g')
        .attr('class', 'event-group event-marker')
        .attr('transform', function(d) {
            return `translate(${d.position[0]}, ${d.position[1]})`;
        });
    
    // Círculo base para el evento
    eventGroups.append('circle')
        .attr('class', 'event-circle')
        .attr('r', 6)
        .attr('fill', function(d) {
            // Color según tipo de evento
            const eventColors = {
                'dungeon': '#8D6E63',
                'ruins': '#9C27B0',
                'tower': '#5D4037',
                'cave': '#FF9800',
                'temple': '#F44336',
                'battlefield': '#E91E63',
                'portal': '#D32F2F',
                'dragon': '#607D8B'
            };
            return eventColors[d.type] || '#607D8B';
        })
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5)
        .style('filter', 'drop-shadow(2px 2px 3px rgba(0,0,0,0.6))');
    
    // Ícono del evento
    eventGroups.append('text')
        .attr('class', 'event-icon')
        .attr('y', 3)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', '#FFFFFF')
        .style('pointer-events', 'none')
        .text(function(d) {
            const eventIcons = {
                'dungeon': '🏰',
                'ruins': '🏛️',
                'tower': '🗼',
                'cave': '🕳️',
                'temple': '⛩️',
                'battlefield': '⚔️',
                'portal': '🌀',
                'dragon': '🐉'
            };
            return eventIcons[d.type] || '❓';
        });
    
    // Agregar interactividad
    eventGroups.on('click', function(d) {
        d3.event.stopPropagation();
        if (typeof showEventInfo === 'function') {
            showEventInfo(d);
        }
    });
    
    // Hover effects
    eventGroups.on('mouseenter', function() {
        d3.select(this).select('.event-circle')
            .transition()
            .duration(200)
            .attr('r', 8);
    });
    
    eventGroups.on('mouseleave', function() {
        d3.select(this).select('.event-circle')
            .transition()
            .duration(200)
            .attr('r', 6);
    });
}

// Configurar interactividad para el mapa
function setupMapInteractivity(svg, g) {
    // Configurar drag & zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', function() {
            g.attr('transform', d3.event.transform);
        });
    
    svg.call(zoom);
    
    // Función para resetear la vista
    svg.on('dblclick', function() {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });
}

// Función para preparar SVG para exportación optimizada
function prepareForExport(svg) {
    // Asegurarse de que todos los elementos tengan atributos de estilo explícitos
    
    // Optimizar paths
    svg.selectAll('path').each(function() {
        const path = d3.select(this);
        const computedStyle = window.getComputedStyle(this);
        
        // Asegurar que el fill esté siempre especificado
        if (!path.attr('fill') && computedStyle.fill !== 'none') {
            path.attr('fill', computedStyle.fill);
        }
        
        // Asegurar que el stroke esté siempre especificado
        if (!path.attr('stroke') && computedStyle.stroke !== 'none') {
            path.attr('stroke', computedStyle.stroke);
            path.attr('stroke-width', computedStyle.strokeWidth);
        }
        
        // Asegurar que otros atributos importantes estén explícitos
        if (computedStyle.opacity !== '1' && !path.attr('opacity')) {
            path.attr('opacity', computedStyle.opacity);
        }
        
        if (computedStyle.fillOpacity !== '1' && !path.attr('fill-opacity')) {
            path.attr('fill-opacity', computedStyle.fillOpacity);
        }
    });
    
    // Optimizar círculos y puntos
    svg.selectAll('circle').each(function() {
        const circle = d3.select(this);
        const computedStyle = window.getComputedStyle(this);
        
        if (!circle.attr('fill')) {
            circle.attr('fill', computedStyle.fill);
        }
        
        if (!circle.attr('stroke') && computedStyle.stroke !== 'none') {
            circle.attr('stroke', computedStyle.stroke);
            circle.attr('stroke-width', computedStyle.strokeWidth);
        }
    });
    
    // Optimizar textos
    svg.selectAll('text').each(function() {
        const text = d3.select(this);
        const computedStyle = window.getComputedStyle(this);
        
        if (!text.attr('fill')) {
            text.attr('fill', computedStyle.fill);
        }
        
        if (!text.attr('font-size')) {
            text.attr('font-size', computedStyle.fontSize);
        }
        
        if (!text.attr('font-family')) {
            text.attr('font-family', computedStyle.fontFamily);
        }
        
        if (!text.attr('font-weight') && computedStyle.fontWeight !== 'normal') {
            text.attr('font-weight', computedStyle.fontWeight);
        }
        
        if (!text.attr('text-anchor')) {
            const anchor = computedStyle.textAnchor || 'start';
            text.attr('text-anchor', anchor);
        }
    });
    
    return svg;
}

// Función unificada para actualizar la visualización del mapa
function updateVisualization(svg, render, options) {
    // Aplicar visualización según opciones
    visualizeMap(svg, render, options);
    
    // Si es para exportación, optimizar el SVG
    if (options && options.forExport) {
        prepareForExport(svg);
    }
    
    return svg;
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
