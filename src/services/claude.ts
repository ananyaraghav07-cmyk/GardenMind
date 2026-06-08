import type { Plant, CalendarTask, Location, WeatherData, FrostDates } from '../types/garden';

// A helper to clean and parse JSON from Claude's response in case it contains Markdown code blocks
function parseJSONFromResponse(text: string): any {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse JSON from Claude response:', text, error);
    // Attempt to extract anything between { and } if direct parse fails
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        throw new Error('Could not parse any JSON from the response');
      }
    }
    throw error;
  }
}

/**
 * Base64 image details helper
 */
interface ImagePayload {
  base64Data: string; // just the data, no data:image/jpeg;base64,
  mediaType: string;  // e.g. "image/jpeg", "image/png"
}

function extractBase64Data(dataUrl: string): ImagePayload {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return {
      base64Data: dataUrl,
      mediaType: 'image/jpeg'
    };
  }
  return {
    mediaType: match[1],
    base64Data: match[2]
  };
}

/**
 * Real API call helper for Anthropic messages endpoint
 */
async function callClaudeAPI(
  apiKey: string,
  messages: any[],
  systemPrompt?: string,
  proxyUrl?: string
): Promise<string> {
  const endpoint = proxyUrl || 'https://api.anthropic.com/v1/messages';
  
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  // Note: Since browsers block CORS to api.anthropic.com, the user can supply a proxy url.
  // We add dangerously-allow-browser equivalent custom header or let them use CORS proxy.
  const body = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    system: systemPrompt,
    messages: messages
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API Error (${response.status}): ${errText || response.statusText}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

// ==========================================
// MOCK DATA SIMULATION (DEMO MODE)
// ==========================================

const MOCK_PLANTS_DATABASE: Record<string, Partial<Plant>> = {
  tomato: {
    species: 'Solanum lycopersicum',
    commonName: 'Tomato (Roma)',
    healthScore: 9,
    pests: [],
    diseases: [],
  },
  basil: {
    species: 'Ocimum basilicum',
    commonName: 'Sweet Basil',
    healthScore: 8,
    pests: ['Aphids (minor)'],
    diseases: [],
  },
  monstera: {
    species: 'Monstera deliciosa',
    commonName: 'Swiss Cheese Plant',
    healthScore: 5,
    pests: ['Spider Mites'],
    diseases: ['Root Rot (early stage)'],
  },
  rose: {
    species: 'Rosa rubiginosa',
    commonName: 'Garden Rose',
    healthScore: 7,
    pests: [],
    diseases: ['Black Spot Fungus'],
  },
  succulent: {
    species: 'Echeveria elegans',
    commonName: 'Mexican Snowball',
    healthScore: 10,
    pests: [],
    diseases: [],
  }
};

const COMPANION_DATA: Record<string, { companions: string[]; antagonists: string[]; tips: string }> = {
  'tomato': {
    companions: ['Basil', 'Marigolds', 'Carrots', 'Chives', 'Garlic'],
    antagonists: ['Potatoes', 'Fennel', 'Dill', 'Brassicas (Cabbage, Broccoli)'],
    tips: 'Basil repels thrips and hornworms while improving tomato flavor. Marigolds emit root-protecting chemicals.'
  },
  'basil': {
    companions: ['Tomato', 'Peppers', 'Asparagus', 'Oregano'],
    antagonists: ['Rue', 'Sage', 'Fennel'],
    tips: 'Basil improves growth and flavor of tomatoes and peppers. Repels mosquitoes and flies.'
  },
  'monstera': {
    companions: ['Pothos', 'Philodendron', 'Ferns', 'Snake Plant'],
    antagonists: ['Cacti (mismatch in watering needs)'],
    tips: 'Grows well with other tropical understory plants sharing indirect light and humidity requirements.'
  },
  'rose': {
    companions: ['Garlic', 'Chives', 'Lavender', 'Marigolds', 'Geraniums'],
    antagonists: ['Fennel', 'Potatoes'],
    tips: 'Allium family members like garlic and chives repel aphids and black spot spores, protecting sensitive roses.'
  },
  'succulent': {
    companions: ['Sedum', 'Aloes', 'Jade Plant', 'Haworthia'],
    antagonists: ['Ferns', 'Monstera (mismatch in dry watering needs)'],
    tips: 'Pair with other low-water, high-drainage succulents and cacti to prevent overwatering.'
  }
};

// ==========================================
// EXPORTED SERVICES
// ==========================================

export async function identifyPlantFromPhoto(
  photoBase64: string,
  settings: { anthropicApiKey: string; demoMode: boolean; proxyUrl?: string },
  mockSelection?: string // User can choose which mock plant to simulate in demo mode
): Promise<{ species: string; commonName: string; confidence: number; pestsFound: string[]; diseasesFound: string[]; healthScore: number; diagnosisText: string }> {
  
  if (settings.demoMode || !settings.anthropicApiKey) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const choice = mockSelection || 'tomato';
    const mockPlant = MOCK_PLANTS_DATABASE[choice] || MOCK_PLANTS_DATABASE.tomato;
    
    let diagnosis = `Based on a simulated scan of the photo, this plant is healthy and shows good vigor. Keep up the regular watering schedule.`;
    if (mockPlant.pests!.length > 0 || mockPlant.diseases!.length > 0) {
      diagnosis = `Simulated Scan Report: Identified issues with ${mockPlant.pests?.join(', ') || ''} ${mockPlant.diseases?.join(', ') || ''}. We recommend treating with organic neem oil spray and reducing soil moisture to prevent fungal spread.`;
    }
    
    return {
      species: mockPlant.species!,
      commonName: mockPlant.commonName!,
      confidence: 94,
      pestsFound: mockPlant.pests!,
      diseasesFound: mockPlant.diseases!,
      healthScore: mockPlant.healthScore!,
      diagnosisText: diagnosis
    };
  }

  // Real API path
  const imageInfo = extractBase64Data(photoBase64);
  const systemPrompt = "You are an expert botanist and horticulturalist. Analyze the user's uploaded plant image and return a JSON structure describing the plant, any issues, pests, or diseases, and its health score.";
  
  const userMessage = {
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageInfo.mediaType,
          data: imageInfo.base64Data
        }
      },
      {
        type: 'text',
        text: `Analyze this plant photo. Return ONLY a JSON block containing these exact fields:
{
  "species": "Botanical species name",
  "commonName": "Common name",
  "confidence": 95, (integer percent)
  "pestsFound": ["pest1", "pest2"], (empty array if none)
  "diseasesFound": ["disease1", "disease2"], (empty array if none)
  "healthScore": 8, (integer between 1 and 10, 10 being perfect health)
  "diagnosisText": "Brief explanation of health score, identifying features, and treatment advice if diseases or pests are present (2-4 sentences)"
}`
      }
    ]
  };

  const responseText = await callClaudeAPI(settings.anthropicApiKey, [userMessage], systemPrompt, settings.proxyUrl);
  return parseJSONFromResponse(responseText);
}

export async function fetchCareRecommendations(
  plant: Plant,
  weather: WeatherData,
  location: Location,
  settings: { anthropicApiKey: string; demoMode: boolean; proxyUrl?: string }
): Promise<string[]> {
  
  if (settings.demoMode || !settings.anthropicApiKey) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate simple dynamic guidelines based on weather
    const recommendations = [
      `Care Tip for ${plant.commonName}: Adjust watering schedule for current temperature of ${weather.temp}°C.`,
    ];

    if (weather.temp > 28) {
      recommendations.push(`High Heat Alert: Water deeply in the early morning to prevent evaporation. Consider adding shade cloth.`);
    } else if (weather.temp < 10) {
      recommendations.push(`Cool Temp Alert: Protect the plant from cold night winds. Reduce watering to prevent waterlogging/root rot.`);
    } else {
      recommendations.push(`Optimal Temperature: Weather is comfortable (${weather.temp}°C). Maintain standard watering.`);
    }

    if (weather.humidity > 80) {
      recommendations.push(`High Humidity (${weather.humidity}%): Spores thrive. Prune lower leaves to maximize air circulation and prevent mildew.`);
    } else if (weather.humidity < 40) {
      recommendations.push(`Dry Air (${weather.humidity}%): Mist leaves occasionally (if indoor) or check soil moisture daily.`);
    }

    if (weather.precipitationProbability > 60) {
      recommendations.push(`Heavy Rain Expected (${weather.precipitationProbability}%): Skip watering this week if outdoors. Ensure pots have good drainage.`);
    } else {
      recommendations.push(`Standard watering: Add 2-3cm of water to the base if the top 5cm of soil feels dry.`);
    }

    if (plant.healthScore < 7) {
      recommendations.push(`Recovery Actions: Treat with diluted organic fertilizer and monitor for pest re-emergence daily.`);
    } else {
      recommendations.push(`Maintenance Action: Inspect leaf undersides once a week for early signs of pests.`);
    }

    return recommendations;
  }

  // Real API path
  const prompt = `The plant is ${plant.commonName} (${plant.species}). 
Current conditions in ${location.city}:
- Temperature: ${weather.temp}°C
- Humidity: ${weather.humidity}%
- Weather conditions: ${weather.conditionText}
- Rain chance: ${weather.precipitationProbability}%
- Plant Health Score: ${plant.healthScore}/10
- Diagnosed issues: ${[...plant.pests, ...plant.diseases].join(', ') || 'None'}

Give exactly 5 specific, actionable care recommendations for this week in a bulleted list. Keep each point brief, clear, and highly practical.`;

  const userMessage = { role: 'user', content: prompt };
  const responseText = await callClaudeAPI(
    settings.anthropicApiKey,
    [userMessage],
    "You are a helpful botanical assistant giving highly personalized, environment-aware plant care tasks.",
    settings.proxyUrl
  );
  
  // Split response by bullet points
  return responseText
    .split('\n')
    .map(line => line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 5);
}

export async function generatePlantingCalendar(
  plants: string[],
  frostDates: FrostDates,
  settings: { anthropicApiKey: string; demoMode: boolean; proxyUrl?: string }
): Promise<CalendarTask[]> {

  if (settings.demoMode || !settings.anthropicApiKey) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Local calendar generation
    const mockTasks: CalendarTask[] = [];
    const currentYear = new Date().getFullYear();
    
    plants.forEach((plantName, idx) => {
      const plantId = `plant-${idx}`;
      const basePlantKey = plantName.toLowerCase();
      
      // Let's create indoor sowing, transplanting, and harvesting tasks based on spring frost date
      // Default frost date parse or estimate: Apr 10
      // We'll generate dates relative to the current year
      
      let indoorSowMonth = 2; // March
      let transplantMonth = 4; // May
      let harvestMonth = 7; // August
      
      if (basePlantKey.includes('tomato')) {
        indoorSowMonth = 2; // 6 weeks before frost (Feb/Mar)
        transplantMonth = 4; // after frost (May)
        harvestMonth = 7; // Aug/Sept
      } else if (basePlantKey.includes('basil')) {
        indoorSowMonth = 3;
        transplantMonth = 4;
        harvestMonth = 6;
      } else if (basePlantKey.includes('rose') || basePlantKey.includes('monstera')) {
        // perennial house/garden plant - prune and fertilize
        mockTasks.push({
          taskId: `task-${plantName}-prune`,
          plantId: plantId,
          plantName: plantName,
          taskType: 'prune',
          taskName: `Prune and clean leaves of ${plantName}`,
          dueDate: `${currentYear}-03-15`,
          completed: false,
          notes: 'Trim dead branches and dust leaves to maximize light absorption.'
        });
        mockTasks.push({
          taskId: `task-${plantName}-fertilize`,
          plantId: plantId,
          plantName: plantName,
          taskType: 'fertilize',
          taskName: `Apply organic fertilizer to ${plantName}`,
          dueDate: `${currentYear}-05-01`,
          completed: false,
          notes: 'Use balanced NPK ratio fertilizer at half-strength.'
        });
        return;
      }
      
      mockTasks.push({
        taskId: `task-${plantName}-sow`,
        plantId: plantId,
        plantName: plantName,
        taskType: 'sow_indoor',
        taskName: `Start ${plantName} seeds indoors`,
        dueDate: `${currentYear}-0${indoorSowMonth}-10`,
        completed: false,
        notes: `Sow seeds 6-8 weeks before last spring frost (${frostDates.lastSpring}). Keep soil warm.`
      });
      
      mockTasks.push({
        taskId: `task-${plantName}-transplant`,
        plantId: plantId,
        plantName: plantName,
        taskType: 'transplant',
        taskName: `Transplant ${plantName} seedlings outdoors`,
        dueDate: `${currentYear}-0${transplantMonth}-20`,
        completed: false,
        notes: `Transplant to the garden once night temps stay consistently above 10°C, after the last frost.`
      });
      
      mockTasks.push({
        taskId: `task-${plantName}-harvest`,
        plantId: plantId,
        plantName: plantName,
        taskType: 'harvest',
        taskName: `Harvest ${plantName}`,
        dueDate: `${currentYear}-0${harvestMonth}-15`,
        completed: false,
        notes: 'Harvest regularly to encourage continuous fruit and foliage production.'
      });
    });

    return mockTasks;
  }

  // Real API path
  const prompt = `Generate a monthly planting calendar from January to December for a garden with the following parameters:
- Location Frost Dates: Last Spring Frost is ${frostDates.lastSpring}, First Fall Frost is ${frostDates.firstFall}.
- Plants to grow: ${plants.join(', ')}

Return ONLY a JSON array of task objects matching this structure:
[
  {
    "taskId": "unique-slug-id-1",
    "plantId": "plant-0",
    "plantName": "Tomato",
    "taskType": "sow_indoor", // must be one of: sow_indoor, transplant, harvest, water, fertilize, prune, general
    "taskName": "Start Tomato seeds indoors",
    "dueDate": "2026-03-01", // YYYY-MM-DD format, set the date realistic for the current year 2026 based on frost dates
    "notes": "Brief instruction tip"
  }
]`;

  const userMessage = { role: 'user', content: prompt };
  const responseText = await callClaudeAPI(
    settings.anthropicApiKey,
    [userMessage],
    "You are a gardening calendar engine. You generate formatted JSON arrays of gardening calendar tasks based on local climate and desired plants.",
    settings.proxyUrl
  );
  
  const parsed = parseJSONFromResponse(responseText);
  return parsed.map((item: any, idx: number) => ({
    ...item,
    taskId: item.taskId || `task-api-${idx}`,
    completed: false
  }));
}

export async function fetchCompanionPlantingAdvice(
  myPlants: string[],
  settings: { anthropicApiKey: string; demoMode: boolean; proxyUrl?: string }
): Promise<{ companionRecommendations: string; pestControlList: string[]; productivityList: string[]; suggestedLayout: { gridWidth: number; gridHeight: number; layoutGrid: { x: number; y: number; plantName: string; role: string; color: string }[] } }> {

  if (settings.demoMode || !settings.anthropicApiKey) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate companion suggestions for whatever plants they have
    const primaryPlant = myPlants[0] || 'Tomato';
    const normalizedKey = primaryPlant.toLowerCase();
    
    let info = COMPANION_DATA.tomato;
    let name = 'Tomato';
    
    if (normalizedKey.includes('basil')) {
      info = COMPANION_DATA.basil;
      name = 'Basil';
    } else if (normalizedKey.includes('monstera')) {
      info = COMPANION_DATA.monstera;
      name = 'Monstera';
    } else if (normalizedKey.includes('rose')) {
      info = COMPANION_DATA.rose;
      name = 'Rose';
    } else if (normalizedKey.includes('succulent')) {
      info = COMPANION_DATA.succulent;
      name = 'Succulent';
    }

    const pestList = info.companions.slice(0, 2).map(c => `${c} (Repels pests for ${name})`);
    const prodList = info.companions.slice(2, 4).map(c => `${c} (Improves growth of ${name})`);
    
    // Construct a beautiful layout grid
    const layoutGrid = [
      { x: 1, y: 1, plantName: primaryPlant, role: 'Target Crop', color: '#10b981' },
    ];
    
    if (info.companions[0]) {
      layoutGrid.push({ x: 0, y: 1, plantName: info.companions[0], role: 'Companion (Pests)', color: '#3b82f6' });
    }
    if (info.companions[1]) {
      layoutGrid.push({ x: 2, y: 1, plantName: info.companions[1], role: 'Companion (Pests)', color: '#3b82f6' });
    }
    if (info.companions[2]) {
      layoutGrid.push({ x: 1, y: 0, plantName: info.companions[2], role: 'Companion (Growth)', color: '#eab308' });
    }
    
    return {
      companionRecommendations: `For growing **${primaryPlant}**, we highly recommend planting **${info.companions.join(', ')}** nearby. Avoid placing **${info.antagonists.join(', ')}** in the same bed. ${info.tips}`,
      pestControlList: pestList.length ? pestList : ['Garlic (repels aphids)', 'Marigolds (repels nematodes)'],
      productivityList: prodList.length ? prodList : ['Basil (improves vigor)', 'Chives (boosts flavor)'],
      suggestedLayout: {
        gridWidth: 3,
        gridHeight: 3,
        layoutGrid: layoutGrid
      }
    };
  }

  // Real API path
  const prompt = `I am growing: ${myPlants.join(', ')}.
Recommend:
1. Companion plants for pest control (at least 3).
2. Companion plants for productivity and growth (at least 3).
3. A visual garden layout suggested on a grid coordinates system.

Return ONLY a JSON object matching this structure:
{
  "companionRecommendations": "General guidance markdown text about what to grow together and what to avoid.",
  "pestControlList": ["Marigolds (repels tomato hornworms)", "Basil (mosquitoes/flies)"],
  "productivityList": ["Carrots (loosens soil)", "Lettuce (acts as living mulch)"],
  "suggestedLayout": {
    "gridWidth": 3,
    "gridHeight": 3,
    "layoutGrid": [
      { "x": 1, "y": 1, "plantName": "Tomato", "role": "Main Crop", "color": "#ef4444" },
      { "x": 0, "y": 1, "plantName": "Marigolds", "role": "Companion (Pest Control)", "color": "#f97316" },
      { "x": 2, "y": 1, "plantName": "Basil", "role": "Companion (Productivity)", "color": "#22c55e" }
    ]
  }
}`;

  const userMessage = { role: 'user', content: prompt };
  const responseText = await callClaudeAPI(
    settings.anthropicApiKey,
    [userMessage],
    "You are a permaculture companion-planting designer. You output clean JSON containing gardening tips and layouts.",
    settings.proxyUrl
  );

  return parseJSONFromResponse(responseText);
}
