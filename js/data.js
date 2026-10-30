/**
 * BigTunnel - Educational Data & Curated Antipode Presets
 * solvepao research
 */

export const FAMOUS_ANTIPODES = [
  {
    id: "madrid-weber",
    name: "Madrid, Spain ⇄ Weber, New Zealand",
    tag: "Classic Land-to-Land",
    description: "One of the rarest antipodal city pairs on Earth. If you dig from the Spanish capital, you emerge near Palmerston North & Weber on New Zealand's North Island.",
    departure: { name: "Madrid, Spain", lat: 40.4168, lon: -3.7038 },
    antipode: { name: "Weber / Palmerston North, New Zealand", lat: -40.4168, lon: 176.2962 },
    isLandToLand: true
  },
  {
    id: "buenosaires-shanghai",
    name: "Buenos Aires, Argentina ⇄ Shanghai, China",
    tag: "Metropolis Antipodes",
    description: "Digging straight from the pampas of Argentina takes you right into Jiangsu province, directly adjacent to the bustling megalopolis of Shanghai.",
    departure: { name: "Buenos Aires, Argentina", lat: -34.6037, lon: -58.3816 },
    antipode: { name: "Wuhu / Shanghai Region, China", lat: 34.6037, lon: 121.6184 },
    isLandToLand: true
  },
  {
    id: "taipei-formosa",
    name: "Taipei, Taiwan ⇄ Formosa, Argentina",
    tag: "Poetic Twin",
    description: "A bizarre historical coincidence: Taiwan's historical name was 'Ilha Formosa' (Beautiful Island). Its exact antipode is the province and city of Formosa in Argentina!",
    departure: { name: "Taipei, Taiwan", lat: 25.0330, lon: 121.5654 },
    antipode: { name: "Formosa, Argentina", lat: -25.0330, lon: -58.4346 },
    isLandToLand: true
  },
  {
    id: "valdivia-wuhai",
    name: "Valdivia, Chile ⇄ Wuhai, China",
    tag: "Pacific Rim to Gobi Desert",
    description: "Chile and China share the longest land-to-land antipodal alignment of any two nations on Earth.",
    departure: { name: "Valdivia, Chile", lat: -39.8142, lon: -73.2459 },
    antipode: { name: "Wuhai, Inner Mongolia, China", lat: 39.8142, lon: 106.7541 },
    isLandToLand: true
  },
  {
    id: "tangier-whangarei",
    name: "Tangier, Morocco ⇄ Whangarei, New Zealand",
    tag: "North Africa to Kiwi Land",
    description: "From the Strait of Gibraltar straight through Earth's nickel-iron core to the subtropical beaches of New Zealand's Northland.",
    departure: { name: "Tangier, Morocco", lat: 35.7595, lon: -5.8340 },
    antipode: { name: "Whangarei, New Zealand", lat: -35.7595, lon: 174.1660 },
    isLandToLand: true
  },
  {
    id: "honolulu-botswana",
    name: "Honolulu, Hawaii ⇄ Kalahari Desert, Botswana",
    tag: "Island to Desert",
    description: "Diving down from the volcanic Hawaiian hotspot plunges through the core and surfaces in the dry sands of the Kalahari Desert in Southern Africa.",
    departure: { name: "Honolulu, Hawaii, USA", lat: 21.3069, lon: -157.8583 },
    antipode: { name: "Kalahari Desert, Botswana", lat: -21.3069, lon: 22.1417 },
    isLandToLand: true
  },
  {
    id: "palembang-neiva",
    name: "Palembang, Indonesia ⇄ Neiva, Colombia",
    tag: "Equatorial Cross",
    description: "Sumatra's tropical rainforests directly oppose Colombia's Magdalena River valley near the Andes mountains.",
    departure: { name: "Palembang, Indonesia", lat: -2.9761, lon: 104.7754 },
    antipode: { name: "Neiva / Huila, Colombia", lat: 2.9761, lon: -75.2246 },
    isLandToLand: true
  },
  {
    id: "nyc-indianocean",
    name: "New York City ⇄ South Indian Ocean",
    tag: "The Ocean Trap",
    description: "Over 85% of Earth's land emerges in vast oceans! Digging from Times Square in NYC pops you out thousands of kilometers from land in the deep South Indian Ocean.",
    departure: { name: "New York City, USA", lat: 40.7128, lon: -74.0060 },
    antipode: { name: "South Indian Ocean (Open Waters)", lat: -40.7128, lon: 105.9940 },
    isLandToLand: false
  },
  {
    id: "london-pacific",
    name: "London, UK ⇄ South Pacific Ocean",
    tag: "The Ocean Trap",
    description: "Digging from Big Ben drops you into the empty expanses of the South Pacific, about 800 km southeast of Dunedin, New Zealand.",
    departure: { name: "London, United Kingdom", lat: 51.5074, lon: -0.1278 },
    antipode: { name: "South Pacific Ocean", lat: -51.5074, lon: 179.8722 },
    isLandToLand: false
  },
  {
    id: "tokyo-atlantic",
    name: "Tokyo, Japan ⇄ South Atlantic Ocean",
    tag: "The Ocean Trap",
    description: "Digging from Shibuya crossing emerges in the chilly deep Atlantic waters between Argentina and South Africa.",
    departure: { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
    antipode: { name: "South Atlantic Ocean", lat: -35.6762, lon: -40.3497 },
    isLandToLand: false
  }
];

export const EARTH_GEOLOGY_LAYERS = [
  {
    id: "crust",
    name: "Continental & Oceanic Crust",
    depthStartKm: 0,
    depthEndKm: 35,
    thicknessKm: 35,
    tempRange: "15°C – 600°C",
    pressureRange: "1 atm – 1 GPa",
    state: "Solid brittle rock",
    composition: "Granite (continents), Basalt (oceanic floor), Silicates",
    color: "#4ade80",
    description: "The wafer-thin outer shell of Earth where all human civilization exists. The deepest borehole ever dug by humanity (Kola Superdeep) reached only 12.26 km—barely a third into the crust!"
  },
  {
    id: "upper-mantle",
    name: "Upper Mantle & Asthenosphere",
    depthStartKm: 35,
    depthEndKm: 660,
    thicknessKm: 625,
    tempRange: "600°C – 1,500°C",
    pressureRange: "1 – 24 GPa",
    state: "Plastic / ductile solid",
    composition: "Peridotite, Olivine, Pyroxene minerals",
    color: "#facc15",
    description: "Under immense pressure, rock behaves like stiff warm asphalt over geological timescales. Convection currents here drive continental drift, mountain building, and earthquakes."
  },
  {
    id: "lower-mantle",
    name: "Lower Mantle (Mesosphere)",
    depthStartKm: 660,
    depthEndKm: 2890,
    thicknessKm: 2230,
    tempRange: "1,500°C – 3,700°C",
    pressureRange: "24 – 136 GPa",
    state: "High-density solid",
    composition: "Bridgmanite & Ferropericlase (most abundant mineral on Earth)",
    color: "#fb923c",
    description: "Encompasses 55% of Earth's total volume. Despite scorching temperatures, rock remains solid due to crushing hydrostatic pressure millions of times greater than the surface."
  },
  {
    id: "outer-core",
    name: "Liquid Outer Core",
    depthStartKm: 2890,
    depthEndKm: 5150,
    thicknessKm: 2260,
    tempRange: "3,700°C – 5,000°C",
    pressureRange: "136 – 330 GPa",
    state: "Violently churning liquid metal",
    composition: "Molten Iron (85%), Nickel (5%), Sulfur, Silicon, Oxygen",
    color: "#f87171",
    description: "A swirling ocean of white-hot liquid metal. Thermal convection and Coriolis force turn the liquid outer core into a planetary dynamo that generates Earth's magnetic shield, protecting our atmosphere from solar radiation."
  },
  {
    id: "inner-core",
    name: "Solid Inner Core (Center)",
    depthStartKm: 5150,
    depthEndKm: 6371,
    thicknessKm: 1221,
    tempRange: "5,400°C – 6,000°C",
    pressureRange: "330 – 364 GPa",
    state: "Solid crystalline metallic sphere",
    composition: "Solid Iron-Nickel crystal lattice",
    color: "#ffffff",
    description: "As hot as the surface of the Sun (~5,700 K), yet compressed into a dense solid sphere by 3.6 million atmospheres of pressure. At the exact geometric center (6,371 km), gravity cancels out from all directions to zero!"
  }
];
