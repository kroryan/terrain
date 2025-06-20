"use strict";

function runif(lo, hi) {
    return lo + Math.random() * (hi - lo);
}

var rnorm = (function () {
    var z2 = null;
    function rnorm() {
        if (z2 != null) {
            var tmp = z2;
            z2 = null;
            return tmp;
        }
        var x1 = 0;
        var x2 = 0;
        var w = 2.0;
        while (w >= 1) {
            x1 = runif(-1, 1);
            x2 = runif(-1, 1);
            w = x1 * x1 + x2 * x2;
        }
        w = Math.sqrt(-2 * Math.log(w) / w);
        z2 = x2 * w;
        return x1 * w;
    }
    return rnorm;
})();

function randomVector(scale) {
    return [scale * rnorm(), scale * rnorm()];
}

var defaultExtent = {
    width: 1,
    height: 1
};

function generatePoints(n, extent) {
    extent = extent || defaultExtent;
    var pts = [];
    for (var i = 0; i < n; i++) {
        pts.push([(Math.random() - 0.5) * extent.width, (Math.random() - 0.5) * extent.height]);
    }
    return pts;
}

function centroid(pts) {
    var x = 0;
    var y = 0;
    for (var i = 0; i < pts.length; i++) {
        x += pts[i][0];
        y += pts[i][1];
    }
    return [x/pts.length, y/pts.length];
}

function improvePoints(pts, n, extent) {
    n = n || 1;
    extent = extent || defaultExtent;
    for (var i = 0; i < n; i++) {
        pts = voronoi(pts, extent)
            .polygons(pts)
            .map(centroid);
    }
    return pts;
}

function generateGoodPoints(n, extent) {
    extent = extent || defaultExtent;
    var pts = generatePoints(n, extent);
    pts = pts.sort(function (a, b) {
        return a[0] - b[0];
    });
    return improvePoints(pts, 1, extent);
}

function voronoi(pts, extent) {
    extent = extent || defaultExtent;
    var w = extent.width/2;
    var h = extent.height/2;
    return d3.voronoi().extent([[-w, -h], [w, h]])(pts);
}

function makeMesh(pts, extent) {
    extent = extent || defaultExtent;
    var vor = voronoi(pts, extent);
    var vxs = [];
    var vxids = {};
    var adj = [];
    var edges = [];
    var tris = [];
    for (var i = 0; i < vor.edges.length; i++) {
        var e = vor.edges[i];
        if (e == undefined) continue;
        var e0 = vxids[e[0]];
        var e1 = vxids[e[1]];
        if (e0 == undefined) {
            e0 = vxs.length;
            vxids[e[0]] = e0;
            vxs.push(e[0]);
        }
        if (e1 == undefined) {
            e1 = vxs.length;
            vxids[e[1]] = e1;
            vxs.push(e[1]);
        }
        adj[e0] = adj[e0] || [];
        adj[e0].push(e1);
        adj[e1] = adj[e1] || [];
        adj[e1].push(e0);
        edges.push([e0, e1, e.left, e.right]);
        tris[e0] = tris[e0] || [];
        if (!tris[e0].includes(e.left)) tris[e0].push(e.left);
        if (e.right && !tris[e0].includes(e.right)) tris[e0].push(e.right);
        tris[e1] = tris[e1] || [];
        if (!tris[e1].includes(e.left)) tris[e1].push(e.left);
        if (e.right && !tris[e1].includes(e.right)) tris[e1].push(e.right);
    }

    var mesh = {
        pts: pts,
        vor: vor,
        vxs: vxs,
        adj: adj,
        tris: tris,
        edges: edges,
        extent: extent
    }
    mesh.map = function (f) {
        var mapped = vxs.map(f);
        mapped.mesh = mesh;
        return mapped;
    }
    return mesh;
}



function generateGoodMesh(n, extent) {
    extent = extent || defaultExtent;
    var pts = generateGoodPoints(n, extent);
    return makeMesh(pts, extent);
}
function isedge(mesh, i) {
    return (mesh.adj[i].length < 3);
}

function isnearedge(mesh, i) {
    var x = mesh.vxs[i][0];
    var y = mesh.vxs[i][1];
    var w = mesh.extent.width;
    var h = mesh.extent.height;
    return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
}

function neighbours(mesh, i) {
    var onbs = mesh.adj[i];
    var nbs = [];
    for (var i = 0; i < onbs.length; i++) {
        nbs.push(onbs[i]);
    }
    return nbs;
}

function distance(mesh, i, j) {
    var p = mesh.vxs[i];
    var q = mesh.vxs[j];
    return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
}

function quantile(h, q) {
    var sortedh = [];
    for (var i = 0; i < h.length; i++) {
        sortedh[i] = h[i];
    }
    sortedh.sort(d3.ascending);
    return d3.quantile(sortedh, q);
}

function zero(mesh) {
    var z = [];
    for (var i = 0; i < mesh.vxs.length; i++) {
        z[i] = 0;
    }
    z.mesh = mesh;
    return z;
}

function slope(mesh, direction) {
    return mesh.map(function (x) {
        return x[0] * direction[0] + x[1] * direction[1];
    });
}

function cone(mesh, slope) {
    return mesh.map(function (x) {
        return Math.pow(x[0] * x[0] + x[1] * x[1], 0.5) * slope;
    });
}

function map(h, f) {
    var newh = h.map(f);
    newh.mesh = h.mesh;
    return newh;
}

function normalize(h) {
    var lo = d3.min(h);
    var hi = d3.max(h);
    return map(h, function (x) {return (x - lo) / (hi - lo)});
}

function peaky(h) {
    return map(normalize(h), Math.sqrt);
}

function add() {
    var n = arguments[0].length;
    var newvals = zero(arguments[0].mesh);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < arguments.length; j++) {
            newvals[i] += arguments[j][i];
        }
    }
    return newvals;
}

function mountains(mesh, n, r) {
    r = r || 0.05;
    var mounts = [];
    for (var i = 0; i < n; i++) {
        mounts.push([mesh.extent.width * (Math.random() - 0.5), mesh.extent.height * (Math.random() - 0.5)]);
    }
    var newvals = zero(mesh);
    for (var i = 0; i < mesh.vxs.length; i++) {
        var p = mesh.vxs[i];
        for (var j = 0; j < n; j++) {
            var m = mounts[j];
            newvals[i] += Math.pow(Math.exp(-((p[0] - m[0]) * (p[0] - m[0]) + (p[1] - m[1]) * (p[1] - m[1])) / (2 * r * r)), 2);
        }
    }
    return newvals;
}

function relax(h) {
    var newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
        var nbs = neighbours(h.mesh, i);
        if (nbs.length < 3) {
            newh[i] = 0;
            continue;
        }
        newh[i] = d3.mean(nbs.map(function (j) {return h[j]}));
    }
    return newh;
}

function downhill(h) {
    if (h.downhill) return h.downhill;
    function downfrom(i) {
        if (isedge(h.mesh, i)) return -2;
        var best = -1;
        var besth = h[i];
        var nbs = neighbours(h.mesh, i);
        for (var j = 0; j < nbs.length; j++) {
            if (h[nbs[j]] < besth) {
                besth = h[nbs[j]];
                best = nbs[j];
            }
        }
        return best;
    }
    var downs = [];
    for (var i = 0; i < h.length; i++) {
        downs[i] = downfrom(i);
    }
    h.downhill = downs;
    return downs;
}

function findSinks(h) {
    var dh = downhill(h);
    var sinks = [];
    for (var i = 0; i < dh.length; i++) {
        var node = i;
        while (true) {
            if (isedge(h.mesh, node)) {
                sinks[i] = -2;
                break;
            }
            if (dh[node] == -1) {
                sinks[i] = node;
                break;
            }
            node = dh[node];
        }
    }
}

function fillSinks(h, epsilon) {
    epsilon = epsilon || 1e-5;
    var infinity = 999999;
    var newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
        if (isnearedge(h.mesh, i)) {
            newh[i] = h[i];
        } else {
            newh[i] = infinity;
        }
    }
    while (true) {
        var changed = false;
        for (var i = 0; i < h.length; i++) {
            if (newh[i] == h[i]) continue;
            var nbs = neighbours(h.mesh, i);
            for (var j = 0; j < nbs.length; j++) {
                if (h[i] >= newh[nbs[j]] + epsilon) {
                    newh[i] = h[i];
                    changed = true;
                    break;
                }
                var oh = newh[nbs[j]] + epsilon;
                if ((newh[i] > oh) && (oh > h[i])) {
                    newh[i] = oh;
                    changed = true;
                }
            }
        }
        if (!changed) return newh;
    }
}

function getFlux(h) {
    var dh = downhill(h);
    var idxs = [];
    var flux = zero(h.mesh); 
    for (var i = 0; i < h.length; i++) {
        idxs[i] = i;
        flux[i] = 1/h.length;
    }
    idxs.sort(function (a, b) {
        return h[b] - h[a];
    });
    for (var i = 0; i < h.length; i++) {
        var j = idxs[i];
        if (dh[j] >= 0) {
            flux[dh[j]] += flux[j];
        }
    }
    return flux;
}

function getSlope(h) {
    var dh = downhill(h);
    var slope = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
        var s = trislope(h, i);
        slope[i] = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
        continue;
        if (dh[i] < 0) {
            slope[i] = 0;
        } else {
            slope[i] = (h[i] - h[dh[i]]) / distance(h.mesh, i, dh[i]);
        }
    }
    return slope;
}

function erosionRate(h) {
    var flux = getFlux(h);
    var slope = getSlope(h);
    var newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
        var river = Math.sqrt(flux[i]) * slope[i];
        var creep = slope[i] * slope[i];
        var total = 1000 * river + creep;
        total = total > 200 ? 200 : total;
        newh[i] = total;
    }
    return newh;
}

function erode(h, amount) {
    var er = erosionRate(h);
    var newh = zero(h.mesh);
    var maxr = d3.max(er);
    for (var i = 0; i < h.length; i++) {
        newh[i] = h[i] - amount * (er[i] / maxr);
    }
    return newh;
}

function doErosion(h, amount, n) {
    n = n || 1;
    h = fillSinks(h);
    for (var i = 0; i < n; i++) {
        h = erode(h, amount);
        h = fillSinks(h);
    }
    return h;
}

function setSeaLevel(h, q) {
    var newh = zero(h.mesh);
    var delta = quantile(h, q);
    for (var i = 0; i < h.length; i++) {
        newh[i] = h[i] - delta;
    }
    return newh;
}

function cleanCoast(h, iters) {
    for (var iter = 0; iter < iters; iter++) {
        var changed = 0;
        var newh = zero(h.mesh);
        for (var i = 0; i < h.length; i++) {
            newh[i] = h[i];
            var nbs = neighbours(h.mesh, i);
            if (h[i] <= 0 || nbs.length != 3) continue;
            var count = 0;
            var best = -999999;
            for (var j = 0; j < nbs.length; j++) {
                if (h[nbs[j]] > 0) {
                    count++;
                } else if (h[nbs[j]] > best) {
                    best = h[nbs[j]];    
                }
            }
            if (count > 1) continue;
            newh[i] = best / 2;
            changed++;
        }
        h = newh;
        newh = zero(h.mesh);
        for (var i = 0; i < h.length; i++) {
            newh[i] = h[i];
            var nbs = neighbours(h.mesh, i);
            if (h[i] > 0 || nbs.length != 3) continue;
            var count = 0;
            var best = 999999;
            for (var j = 0; j < nbs.length; j++) {
                if (h[nbs[j]] <= 0) {
                    count++;
                } else if (h[nbs[j]] < best) {
                    best = h[nbs[j]];
                }
            }
            if (count > 1) continue;
            newh[i] = best / 2;
            changed++;
        }
        h = newh;
    }
    return h;
}

function trislope(h, i) {
    var nbs = neighbours(h.mesh, i);
    if (nbs.length != 3) return [0,0];
    var p0 = h.mesh.vxs[nbs[0]];
    var p1 = h.mesh.vxs[nbs[1]];
    var p2 = h.mesh.vxs[nbs[2]];

    var x1 = p1[0] - p0[0];
    var x2 = p2[0] - p0[0];
    var y1 = p1[1] - p0[1];
    var y2 = p2[1] - p0[1];

    var det = x1 * y2 - x2 * y1;
    var h1 = h[nbs[1]] - h[nbs[0]];
    var h2 = h[nbs[2]] - h[nbs[0]];

    return [(y2 * h1 - y1 * h2) / det,
            (-x2 * h1 + x1 * h2) / det];
}

function cityScore(h, cities) {
    var score = map(getFlux(h), Math.sqrt);
    for (var i = 0; i < h.length; i++) {
        if (h[i] <= 0 || isnearedge(h.mesh, i)) {
            score[i] = -999999;
            continue;
        }
        score[i] += 0.01 / (1e-9 + Math.abs(h.mesh.vxs[i][0]) - h.mesh.extent.width/2)
        score[i] += 0.01 / (1e-9 + Math.abs(h.mesh.vxs[i][1]) - h.mesh.extent.height/2)
        for (var j = 0; j < cities.length; j++) {
            score[i] -= 0.02 / (distance(h.mesh, cities[j], i) + 1e-9);
        }
    }
    return score;
}
function placeCity(render) {
    render.cities = render.cities || [];
    var score = cityScore(render.h, render.cities);
    var newcity = d3.scan(score, d3.descending);
    render.cities.push(newcity);
}

function placeCities(render) {
    var params = render.params;
    var h = render.h;
    var n = params.ncities;
    for (var i = 0; i < n; i++) {
        placeCity(render);
    }
}

function contour(h, level) {
    level = level || 0;
    var edges = [];
    for (var i = 0; i < h.mesh.edges.length; i++) {
        var e = h.mesh.edges[i];
        if (e[3] == undefined) continue;
        if (isnearedge(h.mesh, e[0]) || isnearedge(h.mesh, e[1])) continue;
        if ((h[e[0]] > level && h[e[1]] <= level) ||
            (h[e[1]] > level && h[e[0]] <= level)) {
            edges.push([e[2], e[3]]);
        }
    }
    return mergeSegments(edges);
}

function getRivers(h, limit) {
    var dh = downhill(h);
    var flux = getFlux(h);
    var links = [];
    var above = 0;
    for (var i = 0; i < h.length; i++) {
        if (h[i] > 0) above++;
    }
    limit *= above / h.length;
    for (var i = 0; i < dh.length; i++) {
        if (isnearedge(h.mesh, i)) continue;
        if (flux[i] > limit && h[i] > 0 && dh[i] >= 0) {
            var up = h.mesh.vxs[i];
            var down = h.mesh.vxs[dh[i]];
            if (h[dh[i]] > 0) {
                links.push([up, down]);
            } else {
                links.push([up, [(up[0] + down[0])/2, (up[1] + down[1])/2]]);
            }
        }
    }
    return mergeSegments(links).map(relaxPath);
}

function getTerritories(render) {
    var h = render.h;
    var cities = render.cities;
    var n = render.params.nterrs;
    if (n > render.cities.length) n = render.cities.length;
    var flux = getFlux(h);
    var terr = [];
    var queue = new PriorityQueue({comparator: function (a, b) {return a.score - b.score}});
    function weight(u, v) {
        var horiz = distance(h.mesh, u, v);
        var vert = h[v] - h[u];
        if (vert > 0) vert /= 10;
        var diff = 1 + 0.25 * Math.pow(vert/horiz, 2);
        diff += 100 * Math.sqrt(flux[u]);
        if (h[u] <= 0) diff = 100;
        if ((h[u] > 0) != (h[v] > 0)) return 1000;
        return horiz * diff;
    }
    for (var i = 0; i < n; i++) {
        terr[cities[i]] = cities[i];
        var nbs = neighbours(h.mesh, cities[i]);
        for (var j = 0; j < nbs.length; j++) {
            queue.queue({
                score: weight(cities[i], nbs[j]),
                city: cities[i],
                vx: nbs[j]
            });
        }
    }
    while (queue.length) {
        var u = queue.dequeue();
        if (terr[u.vx] != undefined) continue;
        terr[u.vx] = u.city;
        var nbs = neighbours(h.mesh, u.vx);
        for (var i = 0; i < nbs.length; i++) {
            var v = nbs[i];
            if (terr[v] != undefined) continue;
            var newdist = weight(u.vx, v);
            queue.queue({
                score: u.score + newdist,
                city: u.city,
                vx: v
            });
        }
    }
    terr.mesh = h.mesh;
    return terr;
}

function getBorders(render) {
    var terr = render.terr;
    var h = render.h;
    var edges = [];
    for (var i = 0; i < terr.mesh.edges.length; i++) {
        var e = terr.mesh.edges[i];
        if (e[3] == undefined) continue;
        if (isnearedge(terr.mesh, e[0]) || isnearedge(terr.mesh, e[1])) continue;
        if (h[e[0]] < 0 || h[e[1]] < 0) continue;
        if (terr[e[0]] != terr[e[1]]) {
            edges.push([e[2], e[3]]);
        }
    }
    return mergeSegments(edges).map(relaxPath);
}

function mergeSegments(segs) {
    var adj = {};
    for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        var a0 = adj[seg[0]] || [];
        var a1 = adj[seg[1]] || [];
        a0.push(seg[1]);
        a1.push(seg[0]);
        adj[seg[0]] = a0;
        adj[seg[1]] = a1;
    }
    var done = [];
    var paths = [];
    var path = null;
    while (true) {
        if (path == null) {
            for (var i = 0; i < segs.length; i++) {
                if (done[i]) continue;
                done[i] = true;
                path = [segs[i][0], segs[i][1]];
                break;
            }
            if (path == null) break;
        }
        var changed = false;
        for (var i = 0; i < segs.length; i++) {
            if (done[i]) continue;
            if (adj[path[0]].length == 2 && segs[i][0] == path[0]) {
                path.unshift(segs[i][1]);
            } else if (adj[path[0]].length == 2 && segs[i][1] == path[0]) {
                path.unshift(segs[i][0]);
            } else if (adj[path[path.length - 1]].length == 2 && segs[i][0] == path[path.length - 1]) {
                path.push(segs[i][1]);
            } else if (adj[path[path.length - 1]].length == 2 && segs[i][1] == path[path.length - 1]) {
                path.push(segs[i][0]);
            } else {
                continue;
            }
            done[i] = true;
            changed = true;
            break;
        }
        if (!changed) {
            paths.push(path);
            path = null;
        }
    }
    return paths;
}

function relaxPath(path) {
    var newpath = [path[0]];
    for (var i = 1; i < path.length - 1; i++) {
        var newpt = [0.25 * path[i-1][0] + 0.5 * path[i][0] + 0.25 * path[i+1][0],
                     0.25 * path[i-1][1] + 0.5 * path[i][1] + 0.25 * path[i+1][1]];
        newpath.push(newpt);
    }
    newpath.push(path[path.length - 1]);
    return newpath;
}
function visualizePoints(svg, pts) {
    var circle = svg.selectAll('circle').data(pts);
    circle.enter()
        .append('circle');
    circle.exit().remove();
    d3.selectAll('circle')
        .attr('cx', function (d) {return 1000*d[0]})
        .attr('cy', function (d) {return 1000*d[1]})
        .attr('r', 100 / Math.sqrt(pts.length));
}

function makeD3Path(path) {
    var p = d3.path();
    p.moveTo(1000*path[0][0], 1000*path[0][1]);
    for (var i = 1; i < path.length; i++) {
        p.lineTo(1000*path[i][0], 1000*path[i][1]);
    }
    return p.toString();
}

// Visualización normal del terreno (blanco y negro original)
function visualizeTerrain(svg, field) {
    var tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true);
    
    tris.exit().remove();

    svg.selectAll('path.field')
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            if (field[i] <= 0) {
                // Agua: solo azul básico según profundidad
                var depth = Math.abs(field[i]);
                if (depth > 0.5) return '#001122'; // Azul muy oscuro para océano profundo
                if (depth > 0.2) return '#003366'; // Azul oscuro para océano
                return '#4169E1'; // Azul básico para aguas poco profundas
            } else {
                // Tierra: SOLO blanco, gris y negro según altura
                var height = field[i];
                if (height > 0.8) return '#FFFFFF'; // Blanco para picos nevados
                if (height > 0.6) return '#CCCCCC'; // Gris claro para montañas altas
                if (height > 0.4) return '#999999'; // Gris medio para colinas
                if (height > 0.2) return '#666666'; // Gris oscuro para llanuras altas
                if (height > 0.1) return '#AAAAAA'; // Gris para llanuras medias
                return '#DDDDDD'; // Gris muy claro para costa
            }
        })
        .style('stroke', 'none');
}

// Visualización de alturas con escala de grises
function visualizeHeight(svg, field) {
    var lo = d3.min(field);
    var hi = d3.max(field);
    var mappedvals = field.map(function (x) {return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo)});
    
    var tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true);
    
    tris.exit().remove();

    svg.selectAll('path.field')
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            var intensity = mappedvals[i];
            if (field[i] <= 0) {
                // Agua: azules más oscuros según profundidad
                var blue = Math.floor(255 * (1 - intensity * 0.8));
                return 'rgb(0,0,' + blue + ')';
            } else {
                // Tierra: escala de grises
                var gray = Math.floor(255 * intensity);
                return 'rgb(' + gray + ',' + gray + ',' + gray + ')';
            }
        })
        .style('stroke', 'none');
}

// Visualización política (territorios con colores)
function visualizePolitical(svg, field, territories, territoryColors) {
    var tris = svg.selectAll('path.field').data(field.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('field', true);
    
    tris.exit().remove();

    svg.selectAll('path.field')
        .attr('d', makeD3Path)
        .style('fill', function (d, i) {
            if (field[i] <= 0) {
                // Agua: mantener colores azules
                var depth = Math.abs(field[i]);
                if (depth > 0.5) return '#000080';
                if (depth > 0.2) return '#4169E1';
                return '#6495ED';
            } else {
                // Tierra: colorear según territorio
                var territory = territories[i];
                return territoryColors[territory] || '#8FBC8F';
            }
        })
        .style('stroke', 'none')
        .style('opacity', 0.8);
}

// Función legacy para compatibilidad (ahora usa escala de grises)
function visualizeVoronoi(svg, field, lo, hi) {
    visualizeHeight(svg, field);
}

function visualizeDownhill(h) {
    var links = getRivers(h, 0.01);
    drawPaths('river', links);
}

function drawPaths(svg, cls, paths) {
    var paths = svg.selectAll('path.' + cls).data(paths)
    paths.enter()
            .append('path')
            .classed(cls, true)
    paths.exit()
            .remove();
    svg.selectAll('path.' + cls)
        .attr('d', makeD3Path);
}

function visualizeSlopes(svg, render) {
    var h = render.h;
    var strokes = [];
    var r = 0.25 / Math.sqrt(h.length);
    for (var i = 0; i < h.length; i++) {
        if (h[i] <= 0 || isnearedge(h.mesh, i)) continue;
        var nbs = neighbours(h.mesh, i);
        nbs.push(i);
        var s = 0;
        var s2 = 0;
        for (var j = 0; j < nbs.length; j++) {
            var slopes = trislope(h, nbs[j]);
            s += slopes[0] / 10;
            s2 += slopes[1];
        }
        s /= nbs.length;
        s2 /= nbs.length;
        if (Math.abs(s) < runif(0.1, 0.4)) continue;
        var l = r * runif(1, 2) * (1 - 0.2 * Math.pow(Math.atan(s), 2)) * Math.exp(s2/100);
        var x = h.mesh.vxs[i][0];
        var y = h.mesh.vxs[i][1];
        if (Math.abs(l*s) > 2 * r) {
            var n = Math.floor(Math.abs(l*s/r));
            l /= n;
            if (n > 4) n = 4;
            for (var j = 0; j < n; j++) {
                var u = rnorm() * r;
                var v = rnorm() * r;
                strokes.push([[x+u-l, y+v+l*s], [x+u+l, y+v-l*s]]);
            }
        } else {
            strokes.push([[x-l, y+l*s], [x+l, y-l*s]]);
        }
    }
    var lines = svg.selectAll('line.slope').data(strokes)
    lines.enter()
            .append('line')
            .classed('slope', true);
    lines.exit()
            .remove();
    svg.selectAll('line.slope')
        .attr('x1', function (d) {return 1000*d[0][0]})
        .attr('y1', function (d) {return 1000*d[0][1]})
        .attr('x2', function (d) {return 1000*d[1][0]})
        .attr('y2', function (d) {return 1000*d[1][1]})
}


function visualizeContour(h, level) {
    level = level || 0;
    var links = contour(h, level);
    drawPaths('coast', links);
}

function visualizeBorders(h, cities, n) {
    var links = getBorders(h, getTerritories(h, cities, n));
    drawPaths('border', links);
}


function visualizeCities(svg, render) {
    // Limpiar ciudades existentes
    svg.selectAll('.city-group').remove();
    
    if (!render.cities) return;
    
    // Crear grupo para ciudades
    var cityGroups = svg.selectAll('.city-group')
        .data(render.cities)
        .enter()
        .append('g')
        .attr('class', 'city-group')
        .attr('transform', function(d) {
            return 'translate(' + (1000 * d[0]) + ',' + (1000 * d[1]) + ')';
        });
    
    // Determinar tamaño de ciudad basado en su importancia
    cityGroups.each(function(d, i) {
        var group = d3.select(this);
        var population = 1000 + Math.random() * 50000;
        var isCapital = i < render.params.nterrs; // Primeras N ciudades son capitales
        var isMajor = population > 30000;
        var radius, strokeWidth, fillColor, strokeColor;
        
        if (isCapital) {
            // Capitales - grandes, cuadradas, doradas
            radius = 10;
            strokeWidth = 3;
            fillColor = '#FFD700';
            strokeColor = '#B8860B';
            
            group.append('rect')
                .attr('x', -radius/2)
                .attr('y', -radius/2)
                .attr('width', radius)
                .attr('height', radius)
                .attr('fill', fillColor)
                .attr('stroke', strokeColor)
                .attr('stroke-width', strokeWidth);
                
            // Corona para capitales
            group.append('circle')
                .attr('r', radius + 3)
                .attr('fill', 'none')
                .attr('stroke', '#FFD700')
                .attr('stroke-width', 1)
                .attr('opacity', 0.6);
                
        } else if (isMajor) {
            // Ciudades grandes - medianas, círculos, plateadas
            radius = 7;
            strokeWidth = 2;
            fillColor = '#C0C0C0';
            strokeColor = '#808080';
            
            group.append('circle')
                .attr('r', radius)
                .attr('fill', fillColor)
                .attr('stroke', strokeColor)
                .attr('stroke-width', strokeWidth);
                
        } else {
            // Pueblos - pequeños, círculos, bronce
            radius = 4;
            strokeWidth = 1;
            fillColor = '#CD7F32';
            strokeColor = '#8B4513';
            
            group.append('circle')
                .attr('r', radius)
                .attr('fill', fillColor)
                .attr('stroke', strokeColor)
                .attr('stroke-width', strokeWidth);
        }
        
        // Agregar glow effect para mejor visibilidad
        group.append('circle')
            .attr('r', radius + 2)
            .attr('fill', 'none')
            .attr('stroke', fillColor)
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.3)
            .attr('filter', 'blur(1px)');
    });
}

function dropEdge(h, p) {
    p = p || 4
    var newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
        var v = h.mesh.vxs[i];
        var x = 2.4*v[0] / h.mesh.extent.width;
        var y = 2.4*v[1] / h.mesh.extent.height;
        newh[i] = h[i] - Math.exp(10*(Math.pow(Math.pow(x, p) + Math.pow(y, p), 1/p) - 1));
    }
    return newh;
}

function generateCoast(params) {
    var mesh = generateGoodMesh(params.npts, params.extent);
    var h = add(
            slope(mesh, randomVector(4)),
            cone(mesh, runif(-1, -1)),
            mountains(mesh, 50)
            );
    for (var i = 0; i < 10; i++) {
        h = relax(h);
    }
    h = peaky(h);
    h = doErosion(h, runif(0, 0.1), 5);
    h = setSeaLevel(h, runif(0.2, 0.6));
    h = fillSinks(h);
    h = cleanCoast(h, 3);
    return h;
}

function terrCenter(h, terr, city, landOnly) {
    var x = 0;
    var y = 0;
    var n = 0;
    for (var i = 0; i < terr.length; i++) {
        if (terr[i] != city) continue;
        if (landOnly && h[i] <= 0) continue;
        x += terr.mesh.vxs[i][0];
        y += terr.mesh.vxs[i][1];
        n++;
    }
    return [x/n, y/n];
}

function drawLabels(svg, render) {
    var params = render.params;
    var h = render.h;
    var terr = render.terr;
    var cities = render.cities;
    var nterrs = render.params.nterrs;
    var avoids = [render.rivers, render.coasts, render.borders];
    var lang = makeRandomLanguage();
    var citylabels = [];
    
    // Use persistent names from appState if available
    var persistentCities = (typeof appState !== 'undefined' && appState.persistentNames && appState.persistentNames.cities) ? appState.persistentNames.cities : [];
    var persistentTerritories = (typeof appState !== 'undefined' && appState.persistentNames && appState.persistentNames.territories) ? appState.persistentNames.territories : [];
    function penalty(label) {
        var pen = 0;
        if (label.x0 < -0.45 * h.mesh.extent.width) pen += 100;
        if (label.x1 > 0.45 * h.mesh.extent.width) pen += 100;
        if (label.y0 < -0.45 * h.mesh.extent.height) pen += 100;
        if (label.y1 > 0.45 * h.mesh.extent.height) pen += 100;
        for (var i = 0; i < citylabels.length; i++) {
            var olabel = citylabels[i];
            if (label.x0 < olabel.x1 && label.x1 > olabel.x0 &&
                label.y0 < olabel.y1 && label.y1 > olabel.y0) {
                pen += 100;
            }
        }

        for (var i = 0; i < cities.length; i++) {
            var c = h.mesh.vxs[cities[i]];
            if (label.x0 < c[0] && label.x1 > c[0] && label.y0 < c[1] && label.y1 > c[1]) {
                pen += 100;
            }
        }
        for (var i = 0; i < avoids.length; i++) {
            var avoid = avoids[i];
            for (var j = 0; j < avoid.length; j++) {
                var avpath = avoid[j];
                for (var k = 0; k < avpath.length; k++) {
                    var pt = avpath[k];
                    if (pt[0] > label.x0 && pt[0] < label.x1 && pt[1] > label.y0 && pt[1] < label.y1) {
                        pen++;
                    }
                }
            }
        }
        return pen;
    }    for (var i = 0; i < cities.length; i++) {
        var x = h.mesh.vxs[cities[i]][0];
        var y = h.mesh.vxs[cities[i]][1];
        
        // Use persistent city name if available, otherwise generate new
        var text = (persistentCities[i] && persistentCities[i].name) ? persistentCities[i].name : makeName(lang, 'city');
        
        var size = i < nterrs ? params.fontsizes.city : params.fontsizes.town;
        var sx = 0.65 * size/1000 * text.length;
        var sy = size/1000;
        var posslabels = [
        {
            x: x + 0.8 * sy,
            y: y + 0.3 * sy,
            align: 'start',
            x0: x + 0.7 * sy,
            y0: y - 0.6 * sy,
            x1: x + 0.7 * sy + sx,
            y1: y + 0.6 * sy
        },
        {
            x: x - 0.8 * sy,
            y: y + 0.3 * sy,
            align: 'end',
            x0: x - 0.9 * sy - sx,
            y0: y - 0.7 * sy,
            x1: x - 0.9 * sy,
            y1: y + 0.7 * sy
        },
        {
            x: x,
            y: y - 0.8 * sy,
            align: 'middle',
            x0: x - sx/2,
            y0: y - 1.9*sy,
            x1: x + sx/2,
            y1: y - 0.7 * sy
        },
        {
            x: x,
            y: y + 1.2 * sy,
            align: 'middle',
            x0: x - sx/2,
            y0: y + 0.1*sy,
            x1: x + sx/2,
            y1: y + 1.3*sy
        }
        ];
        var label = posslabels[d3.scan(posslabels, function (a, b) {return penalty(a) - penalty(b)})];
        label.text = text;
        label.size = size;
        citylabels.push(label);
    }
    var texts = svg.selectAll('text.city').data(citylabels);
    texts.enter()
        .append('text')
        .classed('city', true);
    texts.exit()
        .remove();
    svg.selectAll('text.city')
        .attr('x', function (d) {return 1000*d.x})
        .attr('y', function (d) {return 1000*d.y})
        .style('font-size', function (d) {return d.size})
        .style('text-anchor', function (d) {return d.align})
        .text(function (d) {return d.text})
        .raise();    var reglabels = [];
    for (var i = 0; i < nterrs; i++) {
        var city = cities[i];
        
        // Use persistent territory name if available, otherwise generate new
        var text = (persistentTerritories[i] && persistentTerritories[i].name) ? persistentTerritories[i].name : makeName(lang, 'region');
        
        // Make territory names larger in political view
        var isPolitalView = (typeof appState !== 'undefined' && appState.filters && appState.filters.political);
        var regionFontSize = isPolitalView ? params.fontsizes.region * 1.5 : params.fontsizes.region;
        
        var sy = regionFontSize / 1000;
        var sx = 0.6 * text.length * sy;
        var lc = terrCenter(h, terr, city, true);
        var oc = terrCenter(h, terr, city, false);
        var best = 0;
        var bestscore = -999999;
        for (var j = 0; j < h.length; j++) {
            var score = 0;
            var v = h.mesh.vxs[j];
            score -= 3000 * Math.sqrt((v[0] - lc[0]) * (v[0] - lc[0]) + (v[1] - lc[1]) * (v[1] - lc[1]));
            score -= 1000 * Math.sqrt((v[0] - oc[0]) * (v[0] - oc[0]) + (v[1] - oc[1]) * (v[1] - oc[1]));
            if (terr[j] != city) score -= 3000;
            for (var k = 0; k < cities.length; k++) {
                var u = h.mesh.vxs[cities[k]];
                if (Math.abs(v[0] - u[0]) < sx && 
                    Math.abs(v[1] - sy/2 - u[1]) < sy) {
                    score -= k < nterrs ? 4000 : 500;
                }
                if (v[0] - sx/2 < citylabels[k].x1 &&
                    v[0] + sx/2 > citylabels[k].x0 &&
                    v[1] - sy < citylabels[k].y1 &&
                    v[1] > citylabels[k].y0) {
                    score -= 5000;
                }
            }
            for (var k = 0; k < reglabels.length; k++) {
                var label = reglabels[k];
                if (v[0] - sx/2 < label.x + label.width/2 &&
                    v[0] + sx/2 > label.x - label.width/2 &&
                    v[1] - sy < label.y &&
                    v[1] > label.y - label.size) {
                    score -= 20000;
                }
            }
            if (h[j] <= 0) score -= 500;
            if (v[0] + sx/2 > 0.5 * h.mesh.extent.width) score -= 50000;
            if (v[0] - sx/2 < -0.5 * h.mesh.extent.width) score -= 50000;
            if (v[1] > 0.5 * h.mesh.extent.height) score -= 50000;
            if (v[1] - sy < -0.5 * h.mesh.extent.height) score -= 50000;
            if (score > bestscore) {
                bestscore = score;
                best = j;
            }
        }        reglabels.push({
            text: text, 
            x: h.mesh.vxs[best][0], 
            y: h.mesh.vxs[best][1], 
            size: sy, 
            width: sx
        });
    }
    texts = svg.selectAll('text.region').data(reglabels);
    texts.enter()
        .append('text')
        .classed('region', true);
    texts.exit()
        .remove();
    svg.selectAll('text.region')
        .attr('x', function (d) {return 1000*d.x})
        .attr('y', function (d) {return 1000*d.y})
        .style('font-size', function (d) {return 1000*d.size})
        .style('text-anchor', 'middle')
        .text(function (d) {return d.text})
        .raise();

}

// Sistema de biomas mejorado
function calculateBiome(height, distance_to_water, temperature, humidity, latitude) {
    // Normalizar valores
    var temp_factor = temperature / 100;
    var humid_factor = humidity / 100;
    var lat_factor = Math.abs(latitude);
    
    // Biomas oceánicos
    if (height <= 0) {
        if (height < -0.5) return 'deepOcean';
        if (distance_to_water === 0) return 'ocean';
        return 'coast';
    }
    
    // Biomas terrestres
    if (height < 0.1 && distance_to_water < 0.1) return 'beach';
    
    // Biomas de altura
    if (height > 0.7) {
        if (temp_factor < 0.3 || lat_factor > 0.7) return 'snow';
        return 'mountain';
    }
    
    // Biomas basados en temperatura y humedad
    if (temp_factor < 0.2) return 'tundra';
    if (temp_factor > 0.8 && humid_factor < 0.3) return 'desert';
    if (humid_factor > 0.7 && temp_factor > 0.6) return 'jungle';
    if (humid_factor < 0.4 && height < 0.3) return 'swamp';
    if (humid_factor > 0.5) return 'forest';
    
    return 'grassland';
}

function getBiomes(h, temperature, humidity) {
    temperature = temperature || 50;
    humidity = humidity || 50;
    
    var biomes = [];
    var water_distance = getWaterDistance(h);
    
    for (var i = 0; i < h.length; i++) {
        var pos = h.mesh.vxs[i];
        var height = h[i];
        var dist_water = water_distance[i];
        var latitude = Math.abs(pos[1] / h.mesh.extent.height);
        
        biomes[i] = calculateBiome(height, dist_water, temperature, humidity, latitude);
    }
    
    biomes.mesh = h.mesh;
    return biomes;
}

function getWaterDistance(h) {
    var distances = new Array(h.length);
    var queue = [];
    
    // Inicializar con puntos de agua
    for (var i = 0; i < h.length; i++) {
        if (h[i] <= 0) {
            distances[i] = 0;
            queue.push(i);
        } else {
            distances[i] = Infinity;
        }
    }
    
    // BFS para calcular distancias
    var queueIndex = 0;
    while (queueIndex < queue.length) {
        var current = queue[queueIndex++];
        var currentDist = distances[current];
        var nbs = neighbours(h.mesh, current);
        
        for (var i = 0; i < nbs.length; i++) {
            var neighbor = nbs[i];
            var newDist = currentDist + distance(h.mesh, current, neighbor);
            
            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                queue.push(neighbor);
            }
        }
    }
    
    // Normalizar distancias
    var maxDist = Math.max.apply(Math, distances.filter(d => d !== Infinity));
    for (var i = 0; i < distances.length; i++) {
        if (distances[i] === Infinity) distances[i] = maxDist;
        distances[i] = distances[i] / maxDist;
    }
    
    return distances;
}

// Función mejorada de visualización con biomas
function visualizeBiomes(svg, h, biomes, biomeColors) {
    if (!biomes || !biomeColors) return;
    
    // Usar la estructura de triangulación existente
    var tris = svg.selectAll('path.biome').data(h.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('biome', true);
    
    tris.exit().remove();
    
    svg.selectAll('path.biome')
        .attr('d', makeD3Path)
        .style('fill', function(d, i) {
            var biome = biomes[i];
            return biomeColors[biome] || '#8FBC8F';
        })
        .style('stroke', 'none')
        .style('opacity', 0.8);
}

// Función para renderizar eventos/POIs
function renderEvents(svg, events) {
    var eventGroups = svg.selectAll('g.event-marker')
        .data(events);
    
    var enterGroups = eventGroups.enter()
        .append('g')
        .classed('event-marker', true);
    
    enterGroups.append('circle')
        .attr('r', 8)
        .style('fill', 'rgba(255, 255, 255, 0.9)')
        .style('stroke', '#8B4513')
        .style('stroke-width', 2);
    
    enterGroups.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 4)
        .style('font-size', '12px')
        .style('pointer-events', 'none');
    
    eventGroups.exit().remove();
    
    svg.selectAll('g.event-marker')
        .attr('transform', function(d) {
            return 'translate(' + (1000 * d.position[0]) + ',' + (1000 * d.position[1]) + ')';
        })
        .style('cursor', 'pointer');
    
    svg.selectAll('g.event-marker text')
        .text(function(d) { return d.icon; });
}

// Función mejorada para ciudades con diferentes tamaños
function visualizeCitiesEnhanced(svg, render, cityData) {
    var cities = render.cities;
    var h = render.h;
    var n = render.params.nterrs;

    var cityGroups = svg.selectAll('g.city-marker')
        .data(cities);
    
    var enterGroups = cityGroups.enter()
        .append('g')
        .classed('city-marker', true);
    
    // Círculo de la ciudad
    enterGroups.append('circle')
        .classed('city-circle', true);
    
    // Texto del nombre
    enterGroups.append('text')
        .classed('city', true);
    
    cityGroups.exit().remove();
    
    svg.selectAll('g.city-marker')
        .attr('transform', function(d) {
            return 'translate(' + (1000 * h.mesh.vxs[d][0]) + ',' + (1000 * h.mesh.vxs[d][1]) + ')';
        })
        .style('cursor', 'pointer');
    
    svg.selectAll('circle.city-circle')
        .attr('r', function(d, i) {
            var pop = cityData[i] ? cityData[i].population : 5000;
            var baseSize = i >= n ? 4 : 10;
            var sizeMultiplier = Math.log(pop / 1000) / 3;
            return Math.max(baseSize, baseSize * sizeMultiplier);
        })
        .style('fill', function(d, i) {
            return i >= n ? '#FFE0B2' : '#FFD700';
        })
        .style('stroke-width', 3)
        .style('stroke-linecap', 'round')
        .style('stroke', '#8B4513');
    
    svg.selectAll('text.city')
        .attr('y', -15)
        .text(function(d, i) {
            return cityData[i] ? cityData[i].name : 'Ciudad ' + i;
        });
}

// Función para aplicar filtros visuales
function applyMapFilters(svg, filters) {
    // Handle biome/terrain background toggle (handled in updateMapVisualization)
    
    // Handle other feature toggles
    svg.selectAll('g.city-marker').style('display', filters.cities ? 'block' : 'none');
    svg.selectAll('g.event-marker').style('display', filters.events ? 'block' : 'none');
    svg.selectAll('path.border').style('display', filters.borders ? 'block' : 'none');
    svg.selectAll('path.river').style('display', filters.physical ? 'block' : 'none');
    svg.selectAll('path.coast').style('display', filters.physical ? 'block' : 'none');
    svg.selectAll('line.slope').style('display', filters.physical ? 'block' : 'none');
}

// Función para generar datos de clima
function generateClimate(h) {
    var climate = new Array(h.length);
    
    for (var i = 0; i < h.length; i++) {
        var pos = h.mesh.vxs[i];
        var height = h[i];
        var latitude = Math.abs(pos[1] / h.mesh.extent.height);
        
        // Temperatura basada en latitud y altitud
        var temperature = (1 - latitude) * 100 - height * 30;
        temperature = Math.max(0, Math.min(100, temperature));
        
        // Humedad basada en proximidad al agua
        var humidity = height <= 0 ? 100 : 30 + Math.random() * 40;
        
        climate[i] = {
            temperature: temperature,
            humidity: humidity,
            precipitation: humidity * 0.8 + Math.random() * 20
        };
    }
    
    climate.mesh = h.mesh;
    return climate;
}

// Función para visualizar clima
function visualizeClimate(svg, h, climate) {
    if (!climate || !h.mesh) return;
    
    var tris = svg.selectAll('path.climate').data(h.mesh.tris);
    
    tris.enter()
        .append('path')
        .classed('climate', true);
    
    tris.exit().remove();
    
    svg.selectAll('path.climate')
        .attr('d', makeD3Path)
        .style('fill', function(d, i) {
            if (i >= climate.length) return '#666';
            var temp = climate[i].temperature;
            // Color gradient from blue (cold) to red (hot)
            var normalized = temp / 100;
            var r = Math.floor(normalized * 255);
            var b = Math.floor((1 - normalized) * 255);
            var g = Math.floor(128 * (1 - Math.abs(normalized - 0.5) * 2));
            return 'rgb(' + r + ',' + g + ',' + b + ')';
        })
        .style('stroke', 'none')
        .style('opacity', 0.8);
}

function visualizeMap(svg, render, options) {
    // Generate core map data ONLY if not already generated
    if (!render.rivers) render.rivers = getRivers(render.h, 0.01);
    if (!render.coasts) render.coasts = contour(render.h, 0);
    if (!render.terr) render.terr = getTerritories(render);
    if (!render.borders) render.borders = getBorders(render);
    if (!render.biomes) render.biomes = getBiomes(render.h, 50, 50);
    if (!render.climate) render.climate = generateClimate(render.h);
    
    // Generate territory colors for political view ONLY if not already generated
    if (!render.territoryColors) {
        render.territoryColors = {};
        var colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'];
        var cities = render.cities;
        for (var i = 0; i < cities.length && i < colors.length; i++) {
            render.territoryColors[cities[i]] = colors[i];
        }
    }
    
    // Default biome colors
    var biomeColors = {
        'ocean': '#4682B4',
        'deepOcean': '#191970',
        'coast': '#6495ED',
        'beach': '#F4A460',
        'grassland': '#9ACD32',
        'forest': '#228B22',
        'jungle': '#006400',
        'desert': '#F4A460',
        'tundra': '#B0C4DE',
        'swamp': '#556B2F',
        'mountain': '#8B7D6B',
        'snow': '#FFFAFA'
    };
    
    // Clear all existing terrain visualizations
    svg.selectAll('path.field').remove();
    svg.selectAll('path.biome').remove();
    svg.selectAll('path.cell').remove();
    svg.selectAll('path.climate').remove();
    
    // Render background based on view mode and filters
    var viewMode = options && options.view ? options.view : 'normal';
    var showBiomes = options && options.biomes;
    var showPolitical = options && options.political;
    
    if (viewMode === 'height') {
        // Vista de alturas (escala de grises)
        visualizeHeight(svg, render.h);
    } else if (viewMode === 'climate') {
        // Vista de clima (colores de temperatura)
        visualizeClimate(svg, render.h, render.climate);
    } else if (showPolitical) {
        // Vista política (colores por territorio)
        visualizePolitical(svg, render.h, render.terr, render.territoryColors);
    } else if (showBiomes) {
        // Vista con biomas
        visualizeBiomes(svg, render.h, render.biomes, biomeColors);
    } else {
        // Vista normal (terreno natural)
        visualizeTerrain(svg, render.h);
    }
    
    // Render features on top based on filters
    if (options && options.physical) {
        drawPaths(svg, 'river', render.rivers);
        drawPaths(svg, 'coast', render.coasts);
        visualizeSlopes(svg, render);
    }
    
    if (options && options.borders) {
        drawPaths(svg, 'border', render.borders);
    }
    
    if (options && options.cities) {
        visualizeCities(svg, render);
    }
    
    // Draw labels ONLY if not specifically disabled
    if (!options || options.labels !== false) {
        drawLabels(svg, render);
    }
}

function doMap(svg, params, options) {
    var render = {
        params: params
    };
    var width = svg.attr('width');
    if (!width || width === "100%") {
        width = 1000; // Default width
    }
    svg.attr('height', width * params.extent.height / params.extent.width);
    svg.attr('viewBox', -1000 * params.extent.width/2 + ' ' + 
                        -1000 * params.extent.height/2 + ' ' + 
                        1000 * params.extent.width + ' ' + 
                        1000 * params.extent.height);
    
    // Crear grupo principal para transformaciones
    var mainGroup = svg.append('g').attr('class', 'map-group');
    
    render.h = params.generator(params);
    placeCities(render);
    visualizeMap(mainGroup, render, options);    // Retornar datos del mapa para uso en la interfaz
    return {
        mesh: render.h.mesh,
        heights: render.h,
        cities: render.cities,
        rivers: render.rivers,
        coasts: render.coasts,
        territories: render.terr,
        territoryColors: render.territoryColors,
        borders: render.borders,
        biomes: render.biomes,
        climate: render.climate,
        params: params
    };
}

// Función para actualizar visualización con nuevos filtros
function updateVisualization(svg, mapData, options) {
    if (!mapData || !svg) return;
    
    var render = {
        h: mapData.heights,
        cities: mapData.cities,
        rivers: mapData.rivers,
        coasts: mapData.coasts,
        terr: mapData.territories,
        territoryColors: mapData.territoryColors,
        borders: mapData.borders,
        biomes: mapData.biomes,
        climate: mapData.climate,
        params: mapData.params
    };
    
    // Clear and re-render with new options
    var mainGroup = svg.select('g.map-group');
    if (mainGroup.empty()) {
        mainGroup = svg.append('g').attr('class', 'map-group');
    } else {
        mainGroup.selectAll('*').remove();
    }
    
    visualizeMap(mainGroup, render, options);
}

