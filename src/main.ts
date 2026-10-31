/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { AngularMomentumScreen } from "./angular-momentum/AngularMomentumScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { OrbitalsScreen } from "./orbitals/OrbitalsScreen.js";
import { OscillatorScreen } from "./oscillator/OscillatorScreen.js";
import { QuantumAtom3DPreferencesModel } from "./preferences/QuantumAtom3DPreferencesModel.js";
import { QuantumAtom3DPreferencesNode } from "./preferences/QuantumAtom3DPreferencesNode.js";
import QuantumAtom3DColors from "./QuantumAtom3DColors.js";
import { SuperpositionScreen } from "./superposition/SuperpositionScreen.js";
import { ZeemanScreen } from "./zeeman/ZeemanScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from quantumAtom3DQueryParameters.
  const simPreferences = new QuantumAtom3DPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new OrbitalsScreen({
      name: stringManager.getScreenNames().orbitalsStringProperty,
      tandem: Tandem.ROOT.createTandem("orbitalsScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new SuperpositionScreen({
      name: stringManager.getScreenNames().superpositionStringProperty,
      tandem: Tandem.ROOT.createTandem("superpositionScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new AngularMomentumScreen({
      name: stringManager.getScreenNames().angularMomentumStringProperty,
      tandem: Tandem.ROOT.createTandem("angularMomentumScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new ZeemanScreen({
      name: stringManager.getScreenNames().zeemanStringProperty,
      tandem: Tandem.ROOT.createTandem("zeemanScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
    new OscillatorScreen({
      name: stringManager.getScreenNames().oscillatorStringProperty,
      tandem: Tandem.ROOT.createTandem("oscillatorScreen"),
      backgroundColorProperty: QuantumAtom3DColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new QuantumAtom3DPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
