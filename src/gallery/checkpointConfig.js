/**
 * Checkpoint Configuration
 * Maps each of the 8 blueprint corridor objects to gallery data.
 * First 6 objects are interactive with labels, last 2 are decorative.
 * X positions match actual mesh placement in main.jsx.
 */

export const CHECKPOINTS = [
  { index: 0, z: -20,  x: -13,  label: 'ABOUT',             page: '/about/index.html',                         interactive: true,  side: 'left'  },
  { index: 1, z: -46,  x: 13,   label: '3D WEBSITE DESIGN', page: '/services/3d-website-design/index.html',     interactive: true,  side: 'right' },
  { index: 2, z: -72,  x: -13,  label: 'WEBGL DEVELOPMENT', page: '/services/webgl-development/index.html',     interactive: true,  side: 'left'  },
  { index: 3, z: -98,  x: 5.2,  label: 'CASE STUDY',        page: '/work/polyflow-agency/index.html',           interactive: true,  side: 'right' },
  { index: 4, z: -124, x: -13,  label: 'BACKSTAGE',         page: '/work/polyflow-agency/backstage/index.html', interactive: true,  side: 'left'  },
  { index: 5, z: -150, x: 5.2,  label: 'CONTACT',           page: '/contact/index.html',                        interactive: true,  side: 'right' },
  { index: 6, z: -176, x: -13,  label: null,                 page: null,                                         interactive: false, side: 'left'  },
  { index: 7, z: -202, x: 13,   label: null,                 page: null,                                         interactive: false, side: 'right' },
];

// Camera Z range matching main.jsx scroll mapping
export const CAMERA_Z_START = 14;
export const CAMERA_Z_RANGE = 235;

// Gallery activates after the hero section
export const GALLERY_ACTIVATION_Z = -15;

// Proximity range: ±13 from object center Z (objects are 26 units apart)
export const PROXIMITY_RANGE = 13;
