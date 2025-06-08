// ===================== SISTEMA DE EXPORTACIÓN SVG MEJORADO =====================
// Optimiza la exportación de mapas SVG para garantizar consistencia visual

/**
 * Prepara y optimiza el SVG para una exportación correcta
 * @param {Object} svg - El elemento SVG D3 a optimizar
 */
function prepareSvgForExport(svg) {
    // Asegurar que todas las clases y estilos estén correctamente aplicados
    svg.selectAll('path.field')
        .each(function() {
            const path = d3.select(this);
            // Asegurarse de que los atributos de estilo sean explícitos en lugar de calculados
            const fillColor = window.getComputedStyle(this).fill;
            const strokeColor = window.getComputedStyle(this).stroke;
            const strokeWidth = window.getComputedStyle(this).strokeWidth;
            
            path.style('fill', fillColor)
                .style('stroke', strokeColor)
                .style('stroke-width', strokeWidth);
        });
        
    // Asegurar que los textos tienen los estilos correctos
    svg.selectAll('text')
        .each(function() {
            const text = d3.select(this);
            const computedStyle = window.getComputedStyle(this);
            
            text.style('font-family', computedStyle.fontFamily)
                .style('font-size', computedStyle.fontSize)
                .style('font-weight', computedStyle.fontWeight)
                .style('fill', computedStyle.fill);
                
            // Preservar sombras de texto si existen
            if (computedStyle.textShadow && computedStyle.textShadow !== 'none') {
                text.style('text-shadow', computedStyle.textShadow);
            }
        });
    
    // Asegurar que los círculos de ciudades tienen los estilos correctos
    svg.selectAll('circle')
        .each(function() {
            const circle = d3.select(this);
            const computedStyle = window.getComputedStyle(this);
            
            circle.style('fill', computedStyle.fill)
                .style('stroke', computedStyle.stroke)
                .style('stroke-width', computedStyle.strokeWidth);
        });
}

/**
 * Convierte un color en formato rgba(r,g,b,a) a formato hexadecimal
 * @param {string} rgba - Color en formato rgba
 * @return {string} Color en formato hexadecimal
 */
function rgbaToHex(rgba) {
    if (!rgba || !rgba.startsWith('rgba(')) {
        return rgba;
    }
    
    const parts = rgba.substring(5, rgba.length - 1).split(',');
    const r = parseInt(parts[0].trim(), 10);
    const g = parseInt(parts[1].trim(), 10);
    const b = parseInt(parts[2].trim(), 10);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Limpia y optimiza los atributos SVG para garantizar compatibilidad
 * @param {string} svgString - Cadena SVG a optimizar
 * @return {string} Cadena SVG optimizada
 */
function cleanSvgString(svgString) {
    // Reemplazar referencias a estilos RGBA con HEX cuando sea necesario
    svgString = svgString.replace(/rgba\([^)]+\)/g, function(match) {
        return rgbaToHex(match);
    });
    
    // Eliminar atributos que puedan causar problemas
    svgString = svgString.replace(/data-[\w-]+(="[^"]*")?/g, '');
    
    return svgString;
}
