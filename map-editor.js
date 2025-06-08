// ===================== MAP EDITOR AVANZADO =====================
// Sistema completo de edición interactiva para el mapa fantasy

class MapEditor {
    constructor() {
        this.currentTool = 'select';
        this.selectedElement = null;
        this.dragMode = false;
        this.dragStart = null;
        this.editMode = false;
        this.borderEditMode = false;
        this.newBorders = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createToolbar();
        this.setupInteractivity();
    }
    
    // Configurar event listeners para interactividad
    setupEventListeners() {
        const svg = d3.select('#map');
        
        // Drag & Drop para ciudades
        svg.on('mousedown', (event) => this.handleMouseDown(event));
        svg.on('mousemove', (event) => this.handleMouseMove(event));
        svg.on('mouseup', (event) => this.handleMouseUp(event));
        
        // Context menu para elementos
        svg.on('contextmenu', (event) => {
            event.preventDefault();
            this.showContextMenu(event);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => this.handleKeyboard(event));
    }
    
    // Crear toolbar de herramientas
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-section">
                <h4>🛠️ Herramientas de Edición</h4>
                <div class="tool-buttons">
                    <button id="tool-select" class="tool-btn active" data-tool="select" title="Seleccionar/Mover">
                        👆 Seleccionar
                    </button>
                    <button id="tool-add-city" class="tool-btn" data-tool="add-city" title="Añadir Ciudad">
                        🏰 Ciudad
                    </button>
                    <button id="tool-add-event" class="tool-btn" data-tool="add-event" title="Añadir Evento">
                        ⚡ Evento
                    </button>
                    <button id="tool-edit-borders" class="tool-btn" data-tool="edit-borders" title="Editar Fronteras">
                        🗺️ Fronteras
                    </button>
                    <button id="tool-add-territory" class="tool-btn" data-tool="add-territory" title="Añadir Territorio">
                        🏛️ Territorio
                    </button>
                </div>
            </div>
            
            <div class="toolbar-section">
                <h4>⚙️ Modo de Edición</h4>
                <div class="mode-buttons">
                    <button id="mode-view" class="mode-btn active" data-mode="view">
                        👁️ Vista
                    </button>
                    <button id="mode-edit" class="mode-btn" data-mode="edit">
                        ✏️ Edición
                    </button>
                    <button id="mode-border" class="mode-btn" data-mode="border">
                        🖊️ Fronteras
                    </button>
                </div>
            </div>
            
            <div class="toolbar-section">
                <h4>💾 Acciones</h4>
                <div class="action-buttons">
                    <button onclick="mapEditor.saveChanges()" class="action-btn save">
                        💾 Guardar
                    </button>
                    <button onclick="mapEditor.undoLastAction()" class="action-btn undo">
                        ↶ Deshacer
                    </button>
                    <button onclick="mapEditor.redoLastAction()" class="action-btn redo">
                        ↷ Rehacer
                    </button>
                </div>
            </div>
        `;
        
        document.querySelector('.sidebar').appendChild(toolbar);
        
        // Event listeners para herramientas
        toolbar.addEventListener('click', (e) => {
            if (e.target.classList.contains('tool-btn')) {
                this.selectTool(e.target.dataset.tool);
            } else if (e.target.classList.contains('mode-btn')) {
                this.setMode(e.target.dataset.mode);
            }
        });
    }
    
    // Seleccionar herramienta
    selectTool(tool) {
        this.currentTool = tool;
        
        // Actualizar UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tool-${tool}`).classList.add('active');
        
        // Cambiar cursor
        const svg = d3.select('#map');
        switch(tool) {
            case 'select':
                svg.style('cursor', 'default');
                break;
            case 'add-city':
            case 'add-event':
                svg.style('cursor', 'crosshair');
                break;
            case 'edit-borders':
                svg.style('cursor', 'pointer');
                break;
            case 'add-territory':
                svg.style('cursor', 'copy');
                break;
        }
        
        this.showToolInfo(tool);
    }
    
    // Mostrar información de la herramienta
    showToolInfo(tool) {
        const info = {
            'select': 'Haz clic para seleccionar elementos. Arrastra para mover ciudades.',
            'add-city': 'Haz clic en el mapa para añadir una nueva ciudad.',
            'add-event': 'Haz clic en el mapa para añadir un nuevo evento/POI.',
            'edit-borders': 'Haz clic y arrastra para dibujar nuevas fronteras.',
            'add-territory': 'Haz clic en áreas para crear un nuevo territorio.'
        };
        
        showNotification(info[tool] || 'Herramienta seleccionada: ' + tool);
    }
    
    // Configurar modo de edición
    setMode(mode) {
        this.editMode = mode === 'edit';
        this.borderEditMode = mode === 'border';
        
        // Actualizar UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Actualizar elementos interactivos
        this.updateInteractiveElements();
        
        if (mode === 'border') {
            this.enableBorderEditMode();
        } else {
            this.disableBorderEditMode();
        }
    }
    
    // Actualizar elementos interactivos
    updateInteractiveElements() {
        const svg = d3.select('#map');
        
        // Hacer ciudades arrastrables en modo edición
        svg.selectAll('.city-marker')
            .style('cursor', this.editMode ? 'move' : 'pointer')
            .classed('draggable', this.editMode);
        
        // Hacer eventos arrastrables en modo edición
        svg.selectAll('.event-marker')
            .style('cursor', this.editMode ? 'move' : 'pointer')
            .classed('draggable', this.editMode);
    }
    
    // Manejar mouse down
    handleMouseDown(event) {
        if (!this.editMode && this.currentTool !== 'edit-borders') return;
        
        const target = event.target;
        const coords = d3.mouse(event.currentTarget);
        
        if (target.closest('.city-marker') && this.editMode) {
            this.startDragging(target.closest('.city-marker'), coords);
        } else if (target.closest('.event-marker') && this.editMode) {
            this.startDragging(target.closest('.event-marker'), coords);
        } else if (this.currentTool === 'edit-borders') {
            this.startBorderDrawing(coords);
        }
    }
    
    // Iniciar arrastre
    startDragging(element, coords) {
        this.dragMode = true;
        this.selectedElement = element;
        this.dragStart = coords;
        
        d3.select(element).classed('dragging', true);
        d3.select('#map').style('cursor', 'grabbing');
    }
    
    // Manejar mouse move
    handleMouseMove(event) {
        if (!this.dragMode && !this.borderEditMode) return;
        
        const coords = d3.mouse(event.currentTarget);
        
        if (this.dragMode && this.selectedElement) {
            // Actualizar posición del elemento
            const dx = coords[0] - this.dragStart[0];
            const dy = coords[1] - this.dragStart[1];
            
            const currentTransform = d3.select(this.selectedElement).attr('transform') || 'translate(0,0)';
            const match = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
            
            if (match) {
                const x = parseFloat(match[1]) + dx;
                const y = parseFloat(match[2]) + dy;
                d3.select(this.selectedElement).attr('transform', `translate(${x},${y})`);
            }
            
            this.dragStart = coords;
        } else if (this.borderEditMode && this.currentTool === 'edit-borders') {
            // Dibujar línea temporal para fronteras
            this.updateTempBorderLine(coords);
        }
    }
    
    // Manejar mouse up
    handleMouseUp(event) {
        if (this.dragMode) {
            this.finishDragging();
        } else if (this.borderEditMode && this.currentTool === 'edit-borders') {
            const coords = d3.mouse(event.currentTarget);
            this.addBorderPoint(coords);
        } else {
            this.handleMapClick(event);
        }
    }
    
    // Finalizar arrastre
    finishDragging() {
        if (this.selectedElement) {
            d3.select(this.selectedElement).classed('dragging', false);
            
            // Actualizar datos persistentes
            this.updateElementPosition(this.selectedElement);
            
            this.selectedElement = null;
        }
        
        this.dragMode = false;
        d3.select('#map').style('cursor', 'default');
        
        showNotification('Elemento movido correctamente');
    }
    
    // Actualizar posición en datos persistentes
    updateElementPosition(element) {
        const transform = d3.select(element).attr('transform');
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        
        if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            
            if (element.classList.contains('city-marker')) {
                this.updateCityPosition(element, [x, y]);
            } else if (element.classList.contains('event-marker')) {
                this.updateEventPosition(element, [x, y]);
            }
        }
    }
    
    // Actualizar posición de ciudad
    updateCityPosition(element, position) {
        const cityData = d3.select(element).datum();
        if (cityData && cityData.index !== undefined) {
            const cityInfo = appState.persistentNames.cities[cityData.index];
            if (cityInfo) {
                cityInfo.position = position;
                showNotification(`Ciudad "${cityInfo.name}" reubicada`);
            }
        }
    }
    
    // Actualizar posición de evento
    updateEventPosition(element, position) {
        const eventData = d3.select(element).datum();
        if (eventData && eventData.id) {
            const eventIndex = appState.persistentNames.events.findIndex(e => e.id === eventData.id);
            if (eventIndex !== -1) {
                appState.persistentNames.events[eventIndex].position = position;
                showNotification(`Evento "${eventData.name}" reubicado`);
            }
        }
    }
    
    // Manejar click en el mapa
    handleMapClick(event) {
        const coords = d3.mouse(event.currentTarget);
        
        switch(this.currentTool) {
            case 'add-city':
                this.addCityAtPosition(coords);
                break;
            case 'add-event':
                this.addEventAtPosition(coords);
                break;
            case 'add-territory':
                this.addTerritoryAtPosition(coords);
                break;
        }
    }
    
    // Añadir ciudad en posición
    addCityAtPosition(coords) {
        const cityName = prompt('Nombre de la nueva ciudad:');
        if (!cityName) return;
        
        const newCity = {
            name: cityName,
            population: 1000 + Math.floor(Math.random() * 20000),
            specialty: getRandomSpecialty(),
            description: `${cityName} es una nueva ciudad fundada recientemente.`,
            stats: generateCityStats(),
            position: coords
        };
        
        // Añadir a datos persistentes
        appState.persistentNames.cities.push(newCity);
        
        // Renderizar inmediatamente
        this.renderNewCity(newCity, appState.persistentNames.cities.length - 1);
        
        showNotification(`Ciudad "${cityName}" añadida correctamente`);
    }
    
    // Añadir evento en posición
    addEventAtPosition(coords) {
        const eventTypes = [
            { id: 'dungeon', icon: '🏰', name: 'Mazmorra' },
            { id: 'ruins', icon: '🏛️', name: 'Ruinas' },
            { id: 'tower', icon: '🗼', name: 'Torre Mágica' },
            { id: 'cave', icon: '🕳️', name: 'Cueva' },
            { id: 'temple', icon: '⛩️', name: 'Templo' },
            { id: 'battlefield', icon: '⚔️', name: 'Campo de Batalla' }
        ];
        
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const eventName = prompt('Nombre del evento/POI:', randomType.name);
        if (!eventName) return;
        
        const newEvent = {
            id: 'event_' + Date.now(),
            type: randomType.id,
            icon: randomType.icon,
            name: eventName,
            description: `${eventName} es un lugar de interés especial en el mapa.`,
            stats: generateEventStats(),
            position: coords
        };
        
        // Añadir a datos persistentes
        appState.persistentNames.events.push(newEvent);
        
        // Renderizar inmediatamente
        this.renderNewEvent(newEvent);
        
        showNotification(`Evento "${eventName}" añadido correctamente`);
    }
    
    // Renderizar nueva ciudad
    renderNewCity(cityData, index) {
        const svg = d3.select('#map g');
        
        const cityGroup = svg.append('g')
            .attr('class', 'city-marker draggable')
            .attr('transform', `translate(${cityData.position[0]}, ${cityData.position[1]})`)
            .datum({ index: index, ...cityData });
        
        cityGroup.append('circle')
            .attr('r', 8)
            .attr('fill', '#FFE0B2')
            .attr('stroke', '#8B4513')
            .attr('stroke-width', 2)
            .attr('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))');
        
        cityGroup.append('text')
            .attr('class', 'city-label')
            .attr('y', -12)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#FFE0B2')
            .text(cityData.name);
        
        // Event listeners
        cityGroup.on('click', () => {
            if (!this.editMode) {
                this.showCityEditor(index);
            }
        });
        
        cityGroup.on('contextmenu', (event) => {
            event.preventDefault();
            this.showCityContextMenu(event, index);
        });
    }
    
    // Renderizar nuevo evento
    renderNewEvent(eventData) {
        const svg = d3.select('#map g');
        
        const eventGroup = svg.append('g')
            .attr('class', 'event-marker draggable')
            .attr('transform', `translate(${eventData.position[0]}, ${eventData.position[1]})`)
            .datum(eventData);
        
        eventGroup.append('text')
            .attr('font-size', '20')
            .attr('text-anchor', 'middle')
            .attr('y', 6)
            .style('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))')
            .text(eventData.icon);
        
        eventGroup.append('text')
            .attr('class', 'event-label')
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', '#D4AF37')
            .text(eventData.name);
        
        // Event listeners
        eventGroup.on('click', () => {
            if (!this.editMode) {
                this.showEventEditor(eventData);
            }
        });
        
        eventGroup.on('contextmenu', (event) => {
            event.preventDefault();
            this.showEventContextMenu(event, eventData);
        });
    }
    
    // Mostrar editor de ciudad
    showCityEditor(cityIndex) {
        const cityData = appState.persistentNames.cities[cityIndex];
        if (!cityData) return;
        
        const editorHtml = `
            <div class="element-editor">
                <h3>🏰 Editor de Ciudad</h3>
                <div class="editor-form">
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" id="city-name" value="${cityData.name}">
                    </div>
                    <div class="form-group">
                        <label>Población:</label>
                        <input type="number" id="city-population" value="${cityData.population || cityData.stats.population}">
                    </div>
                    <div class="form-group">
                        <label>Especialidad:</label>
                        <select id="city-specialty">
                            <option value="Comercio" ${cityData.specialty === 'Comercio' ? 'selected' : ''}>Comercio</option>
                            <option value="Minería" ${cityData.specialty === 'Minería' ? 'selected' : ''}>Minería</option>
                            <option value="Agricultura" ${cityData.specialty === 'Agricultura' ? 'selected' : ''}>Agricultura</option>
                            <option value="Pesca" ${cityData.specialty === 'Pesca' ? 'selected' : ''}>Pesca</option>
                            <option value="Artesanía" ${cityData.specialty === 'Artesanía' ? 'selected' : ''}>Artesanía</option>
                            <option value="Magia" ${cityData.specialty === 'Magia' ? 'selected' : ''}>Magia</option>
                            <option value="Militar" ${cityData.specialty === 'Militar' ? 'selected' : ''}>Militar</option>
                            <option value="Puerto" ${cityData.specialty === 'Puerto' ? 'selected' : ''}>Puerto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea id="city-description" rows="3">${cityData.description}</textarea>
                    </div>
                    <div class="form-actions">
                        <button onclick="mapEditor.saveCityChanges(${cityIndex})" class="btn-save">💾 Guardar</button>
                        <button onclick="mapEditor.deleteCityConfirm(${cityIndex})" class="btn-delete">🗑️ Eliminar</button>
                        <button onclick="closeModal()" class="btn-cancel">✖️ Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(editorHtml);
    }
    
    // Guardar cambios de ciudad
    saveCityChanges(cityIndex) {
        const cityData = appState.persistentNames.cities[cityIndex];
        if (!cityData) return;
        
        cityData.name = document.getElementById('city-name').value;
        cityData.population = parseInt(document.getElementById('city-population').value);
        cityData.specialty = document.getElementById('city-specialty').value;
        cityData.description = document.getElementById('city-description').value;
        
        // Actualizar stats
        if (!cityData.stats) cityData.stats = {};
        cityData.stats.population = cityData.population;
        
        // Actualizar visualización
        updateMapDisplay();
        closeModal();
        
        showNotification(`Ciudad "${cityData.name}" actualizada`);
    }
    
    // Confirmar eliminación de ciudad
    deleteCityConfirm(cityIndex) {
        const cityData = appState.persistentNames.cities[cityIndex];
        if (!cityData) return;
        
        if (confirm(`¿Estás seguro de eliminar la ciudad "${cityData.name}"?`)) {
            this.deleteCity(cityIndex);
        }
    }
    
    // Eliminar ciudad
    deleteCity(cityIndex) {
        appState.persistentNames.cities.splice(cityIndex, 1);
        updateMapDisplay();
        closeModal();
        showNotification('Ciudad eliminada correctamente');
    }
    
    // Mostrar menú contextual para ciudad
    showCityContextMenu(event, cityIndex) {
        const mouse = d3.mouse(document.body);
        createContextMenu([
            { text: '✏️ Editar ciudad', action: () => this.showCityEditor(cityIndex) },
            { text: '📊 Ver estadísticas', action: () => showCityStatsModal(cityIndex) },
            { text: '🗑️ Eliminar', action: () => this.deleteCityConfirm(cityIndex) },
            { text: '📍 Centrar vista', action: () => this.centerOnElement(cityIndex, 'city') }
        ], mouse[0], mouse[1]);
    }
    
    // Mostrar editor de evento
    showEventEditor(eventData) {
        const editorHtml = `
            <div class="element-editor">
                <h3>⚡ Editor de Evento</h3>
                <div class="editor-form">
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" id="event-name" value="${eventData.name}">
                    </div>
                    <div class="form-group">
                        <label>Tipo:</label>
                        <select id="event-type">
                            <option value="dungeon" ${eventData.type === 'dungeon' ? 'selected' : ''}>🏰 Mazmorra</option>
                            <option value="ruins" ${eventData.type === 'ruins' ? 'selected' : ''}>🏛️ Ruinas</option>
                            <option value="tower" ${eventData.type === 'tower' ? 'selected' : ''}>🗼 Torre</option>
                            <option value="cave" ${eventData.type === 'cave' ? 'selected' : ''}>🕳️ Cueva</option>
                            <option value="temple" ${eventData.type === 'temple' ? 'selected' : ''}>⛩️ Templo</option>
                            <option value="battlefield" ${eventData.type === 'battlefield' ? 'selected' : ''}>⚔️ Campo de Batalla</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea id="event-description" rows="3">${eventData.description}</textarea>
                    </div>
                    <div class="form-actions">
                        <button onclick="mapEditor.saveEventChanges('${eventData.id}')" class="btn-save">💾 Guardar</button>
                        <button onclick="mapEditor.deleteEventConfirm('${eventData.id}')" class="btn-delete">🗑️ Eliminar</button>
                        <button onclick="closeModal()" class="btn-cancel">✖️ Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        showModal(editorHtml);
    }
    
    // Guardar cambios de evento
    saveEventChanges(eventId) {
        const eventIndex = appState.persistentNames.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;
        
        const eventData = appState.persistentNames.events[eventIndex];
        eventData.name = document.getElementById('event-name').value;
        eventData.type = document.getElementById('event-type').value;
        eventData.description = document.getElementById('event-description').value;
        
        // Actualizar icono según tipo
        const typeIcons = {
            'dungeon': '🏰',
            'ruins': '🏛️',
            'tower': '🗼',
            'cave': '🕳️',
            'temple': '⛩️',
            'battlefield': '⚔️'
        };
        
        eventData.icon = typeIcons[eventData.type] || '⚡';
        
        // Actualizar visualización
        updateMapDisplay();
        closeModal();
        
        showNotification(`Evento "${eventData.name}" actualizado`);
    }
    
    // Confirmar eliminación de evento
    deleteEventConfirm(eventId) {
        const eventData = appState.persistentNames.events.find(e => e.id === eventId);
        if (!eventData) return;
        
        if (confirm(`¿Estás seguro de eliminar el evento "${eventData.name}"?`)) {
            this.deleteEvent(eventId);
        }
    }
    
    // Eliminar evento
    deleteEvent(eventId) {
        const eventIndex = appState.persistentNames.events.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            appState.persistentNames.events.splice(eventIndex, 1);
            updateMapDisplay();
            closeModal();
            showNotification('Evento eliminado correctamente');
        }
    }
    
    // Centrar vista en elemento
    centerOnElement(elementIndex, type) {
        let position;
        
        if (type === 'city') {
            const cityData = appState.persistentNames.cities[elementIndex];
            position = cityData.position;
        } else if (type === 'event') {
            const eventData = appState.persistentNames.events[elementIndex];
            position = eventData.position;
        }
        
        if (position) {
            // Centrar el mapa en la posición
            const svg = d3.select('#map');
            const container = document.querySelector('.map-container');
            const centerX = container.clientWidth / 2;
            const centerY = container.clientHeight / 2;
            
            appState.pan.x = centerX - position[0] * appState.zoom;
            appState.pan.y = centerY - position[1] * appState.zoom;
            
            updateMapTransform();
            showNotification('Vista centrada en el elemento');
        }
    }
    
    // Habilitar modo de edición de fronteras
    enableBorderEditMode() {
        this.newBorders = [];
        showNotification('Modo edición de fronteras activado. Haz clic para dibujar.');
    }
    
    // Deshabilitar modo de edición de fronteras
    disableBorderEditMode() {
        this.clearTempBorderElements();
    }
    
    // Añadir punto de frontera
    addBorderPoint(coords) {
        this.newBorders.push(coords);
        this.updateBorderVisualization();
        
        if (this.newBorders.length >= 2) {
            showNotification(`Frontera con ${this.newBorders.length} puntos. Haz doble clic para terminar.`);
        }
    }
    
    // Actualizar visualización de fronteras
    updateBorderVisualization() {
        this.clearTempBorderElements();
        
        if (this.newBorders.length === 0) return;
        
        const svg = d3.select('#map g');
        
        // Dibujar puntos
        svg.selectAll('.temp-border-point')
            .data(this.newBorders)
            .enter()
            .append('circle')
            .attr('class', 'temp-border-point')
            .attr('cx', d => d[0])
            .attr('cy', d => d[1])
            .attr('r', 4)
            .attr('fill', '#FF0000')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2);
        
        // Dibujar líneas conectoras
        if (this.newBorders.length > 1) {
            const line = d3.line()
                .x(d => d[0])
                .y(d => d[1]);
            
            svg.append('path')
                .attr('class', 'temp-border-line')
                .attr('d', line(this.newBorders))
                .attr('stroke', '#FF0000')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '5,5')
                .attr('fill', 'none');
        }
    }
    
    // Limpiar elementos temporales de frontera
    clearTempBorderElements() {
        d3.select('#map').selectAll('.temp-border-point').remove();
        d3.select('#map').selectAll('.temp-border-line').remove();
    }
    
    // Manejar teclado
    handleKeyboard(event) {
        if (event.key === 'Escape') {
            this.cancelCurrentAction();
        } else if (event.key === 'Enter' && this.borderEditMode) {
            this.finishBorderDrawing();
        } else if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.saveChanges();
        } else if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            this.undoLastAction();
        }
    }
    
    // Cancelar acción actual
    cancelCurrentAction() {
        if (this.borderEditMode) {
            this.newBorders = [];
            this.clearTempBorderElements();
            showNotification('Edición de frontera cancelada');
        }
        
        if (this.dragMode) {
            this.finishDragging();
        }
    }
    
    // Finalizar dibujo de frontera
    finishBorderDrawing() {
        if (this.newBorders.length < 2) {
            showNotification('Se necesitan al menos 2 puntos para crear una frontera');
            return;
        }
        
        // Crear nueva frontera
        const newBorder = {
            id: 'border_' + Date.now(),
            points: [...this.newBorders],
            color: '#D32F2F',
            width: 2
        };
        
        // Guardar en datos persistentes
        if (!appState.customBorders) {
            appState.customBorders = [];
        }
        appState.customBorders.push(newBorder);
        
        // Renderizar frontera permanente
        this.renderCustomBorder(newBorder);
        
        // Limpiar elementos temporales
        this.newBorders = [];
        this.clearTempBorderElements();
        
        showNotification('Nueva frontera creada correctamente');
    }
    
    // Renderizar frontera personalizada
    renderCustomBorder(border) {
        const svg = d3.select('#map g');
        const line = d3.line()
            .x(d => d[0])
            .y(d => d[1]);
        
        svg.append('path')
            .attr('class', 'custom-border')
            .attr('d', line(border.points))
            .attr('stroke', border.color)
            .attr('stroke-width', border.width)
            .attr('stroke-dasharray', '10,5')
            .attr('fill', 'none')
            .attr('opacity', 0.8)
            .datum(border);
    }
    
    // Guardar cambios
    saveChanges() {
        try {
            localStorage.setItem('mapEditorData', JSON.stringify(appState));
            showNotification('Cambios guardados correctamente');
        } catch (error) {
            console.error('Error guardando cambios:', error);
            showNotification('Error al guardar cambios');
        }
    }
    
    // Cargar cambios guardados
    loadSavedChanges() {
        try {
            const saved = localStorage.getItem('mapEditorData');
            if (saved) {
                const savedState = JSON.parse(saved);
                // Fusionar con estado actual manteniendo la estructura
                Object.assign(appState, savedState);
                showNotification('Datos cargados correctamente');
                return true;
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
        return false;
    }
    
    // Deshacer última acción
    undoLastAction() {
        // Implementar sistema de deshacer
        showNotification('Función de deshacer en desarrollo');
    }
    
    // Rehacer última acción
    redoLastAction() {
        // Implementar sistema de rehacer
        showNotification('Función de rehacer en desarrollo');
    }
}

// Instancia global del editor
let mapEditor;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    mapEditor = new MapEditor();
});
