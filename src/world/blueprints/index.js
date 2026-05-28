import { createFibonacciSphere }     from './fibonacciSphere.js';
import { createCubicGrid }           from './cubicGrid.js';
import { createTorusKnot }           from './torusKnot.js';
import { createHyperTesseract }      from './hyperTesseract.js';
import { createCone }                from './cone.js';
import { createBreathingTesseract }  from './breathingTesseract.js';
import { createFireSwarm }           from './fireSwarm.js';
import { createHelix }               from './helix.js';

// Order matters: i corresponds to the original 8-iteration loop in main.jsx.
// Compressed depth tracking (zPos = -20 - i*26) fits 8 objects into the ~220-unit corridor.
const factories = [
  createFibonacciSphere,      // i=0
  createCubicGrid,            // i=1
  createTorusKnot,            // i=2
  createHyperTesseract,       // i=3 (dynamic)
  createCone,                 // i=4
  createBreathingTesseract,   // i=5 (dynamic)
  createFireSwarm,            // i=6 (dynamic)
  createHelix,                // i=7
];

export function createBlueprints(scene, isMobile) {
  const blueprints = [];
  const dynamicUpdaters = [];

  for (let i = 0; i < factories.length; i++) {
    const zPos = -20 - (i * 26);
    const xPos = (i % 2 === 0) ? -13 : 13; // Safe lateral boundary avoiding card text
    const result = factories[i](scene, { xPos, zPos, isMobile });
    blueprints.push(result.blueprint);
    if (result.update) dynamicUpdaters.push(result.update);
  }

  return { blueprints, dynamicUpdaters };
}
