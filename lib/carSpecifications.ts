/**
 * Car specifications database and estimators
 * Used for compare page: horsepower, torque, acceleration, fuel economy, etc.
 * Falls back to estimates when make/model/year not in database.
 */

export interface CarSpecs {
  horsepower?: number
  torque?: number
  acceleration?: number // 0-60 mph seconds
  topSpeed?: number // mph
  fuelEconomy?: { city: number; highway: number } // mpg
  drivetrain?: 'FWD' | 'RWD' | 'AWD' | '4WD'
  transmission?: string
  cargoSpace?: number // cu ft
  seatingCapacity?: number
  reliabilityRating?: number // 1-5
  safetyRating?: number // 1-5
  estimated?: boolean
}

// Lookup key: "Make Model" (year-specific or base). Prefer "Make Model Year" for year-specific.
const SPECS_DB: Record<string, CarSpecs> = {
  // Toyota
  'Toyota Camry': { horsepower: 203, torque: 184, acceleration: 7.8, topSpeed: 130, fuelEconomy: { city: 28, highway: 39 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 15.1, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Toyota Corolla': { horsepower: 169, torque: 151, acceleration: 8.2, topSpeed: 125, fuelEconomy: { city: 31, highway: 40 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 13.1, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Toyota Avalon': { horsepower: 301, torque: 267, acceleration: 6.5, topSpeed: 143, fuelEconomy: { city: 22, highway: 32 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 16.1, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Toyota RAV4': { horsepower: 203, torque: 184, acceleration: 8.0, topSpeed: 128, fuelEconomy: { city: 27, highway: 35 }, drivetrain: 'AWD', transmission: '8-speed automatic', cargoSpace: 37.6, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Toyota Highlander': { horsepower: 295, torque: 263, acceleration: 7.3, topSpeed: 130, fuelEconomy: { city: 21, highway: 29 }, drivetrain: 'AWD', transmission: '8-speed automatic', cargoSpace: 16, seatingCapacity: 7, reliabilityRating: 5, safetyRating: 5, estimated: false },
  // Honda
  'Honda Accord': { horsepower: 192, torque: 192, acceleration: 7.6, topSpeed: 130, fuelEconomy: { city: 30, highway: 38 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 16.7, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Honda Civic': { horsepower: 158, torque: 138, acceleration: 8.2, topSpeed: 125, fuelEconomy: { city: 30, highway: 37 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 14.4, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Honda CR-V': { horsepower: 190, torque: 179, acceleration: 8.0, topSpeed: 125, fuelEconomy: { city: 28, highway: 34 }, drivetrain: 'AWD', transmission: 'CVT', cargoSpace: 39.2, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  // Ford
  'Ford F-150': { horsepower: 290, torque: 265, acceleration: 7.5, topSpeed: 110, fuelEconomy: { city: 20, highway: 24 }, drivetrain: 'RWD', transmission: '10-speed automatic', cargoSpace: 52.8, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Ford Fusion': { horsepower: 175, torque: 175, acceleration: 8.2, topSpeed: 125, fuelEconomy: { city: 21, highway: 31 }, drivetrain: 'FWD', transmission: '6-speed automatic', cargoSpace: 16, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Ford Mustang': { horsepower: 310, torque: 350, acceleration: 5.2, topSpeed: 155, fuelEconomy: { city: 16, highway: 25 }, drivetrain: 'RWD', transmission: '10-speed automatic', cargoSpace: 13.5, seatingCapacity: 4, reliabilityRating: 4, safetyRating: 4, estimated: false },
  // BMW
  'BMW 3 Series': { horsepower: 255, torque: 295, acceleration: 5.9, topSpeed: 155, fuelEconomy: { city: 25, highway: 34 }, drivetrain: 'RWD', transmission: '8-speed automatic', cargoSpace: 17, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'BMW 5 Series': { horsepower: 248, torque: 258, acceleration: 6.2, topSpeed: 155, fuelEconomy: { city: 25, highway: 33 }, drivetrain: 'RWD', transmission: '8-speed automatic', cargoSpace: 18.7, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  // Nissan
  'Nissan Altima': { horsepower: 188, torque: 180, acceleration: 7.8, topSpeed: 130, fuelEconomy: { city: 28, highway: 39 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 15.4, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Nissan Maxima': { horsepower: 300, torque: 261, acceleration: 5.8, topSpeed: 145, fuelEconomy: { city: 20, highway: 30 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 14.3, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  // Hyundai
  'Hyundai Sonata': { horsepower: 191, torque: 181, acceleration: 7.5, topSpeed: 130, fuelEconomy: { city: 28, highway: 38 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 16.3, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Hyundai Elantra': { horsepower: 147, torque: 132, acceleration: 8.5, topSpeed: 120, fuelEconomy: { city: 31, highway: 41 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 14.2, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  // Kia
  'Kia Optima': { horsepower: 185, torque: 178, acceleration: 7.8, topSpeed: 130, fuelEconomy: { city: 27, highway: 37 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 15.9, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Kia Sportage': { horsepower: 187, torque: 178, acceleration: 8.2, topSpeed: 125, fuelEconomy: { city: 23, highway: 30 }, drivetrain: 'AWD', transmission: '8-speed automatic', cargoSpace: 30.7, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  // Chevrolet
  'Chevrolet Malibu': { horsepower: 160, torque: 184, acceleration: 8.2, topSpeed: 125, fuelEconomy: { city: 29, highway: 36 }, drivetrain: 'FWD', transmission: 'CVT', cargoSpace: 15.7, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Chevrolet Silverado': { horsepower: 285, torque: 305, acceleration: 7.2, topSpeed: 110, fuelEconomy: { city: 18, highway: 24 }, drivetrain: 'RWD', transmission: '8-speed automatic', cargoSpace: 71.7, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  // Mercedes
  'Mercedes-Benz C-Class': { horsepower: 255, torque: 273, acceleration: 5.9, topSpeed: 155, fuelEconomy: { city: 23, highway: 35 }, drivetrain: 'RWD', transmission: '9-speed automatic', cargoSpace: 12.6, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Mercedes-Benz E-Class': { horsepower: 255, torque: 273, acceleration: 6.2, topSpeed: 155, fuelEconomy: { city: 23, highway: 31 }, drivetrain: 'RWD', transmission: '9-speed automatic', cargoSpace: 13.1, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  // Audi
  'Audi A4': { horsepower: 201, torque: 236, acceleration: 6.3, topSpeed: 130, fuelEconomy: { city: 24, highway: 31 }, drivetrain: 'AWD', transmission: '7-speed dual-clutch', cargoSpace: 13.7, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Audi A6': { horsepower: 248, torque: 273, acceleration: 5.8, topSpeed: 155, fuelEconomy: { city: 23, highway: 32 }, drivetrain: 'AWD', transmission: '7-speed dual-clutch', cargoSpace: 13.7, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  // Volkswagen
  'Volkswagen Passat': { horsepower: 174, torque: 184, acceleration: 7.8, topSpeed: 130, fuelEconomy: { city: 24, highway: 36 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 15.9, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  'Volkswagen Golf': { horsepower: 147, torque: 184, acceleration: 7.5, topSpeed: 130, fuelEconomy: { city: 29, highway: 36 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 17.4, seatingCapacity: 5, reliabilityRating: 4, safetyRating: 5, estimated: false },
  // Mazda
  'Mazda 3': { horsepower: 186, torque: 186, acceleration: 7.2, topSpeed: 130, fuelEconomy: { city: 27, highway: 36 }, drivetrain: 'FWD', transmission: '6-speed automatic', cargoSpace: 13.2, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Mazda 6': { horsepower: 187, torque: 186, acceleration: 7.4, topSpeed: 130, fuelEconomy: { city: 26, highway: 35 }, drivetrain: 'FWD', transmission: '6-speed automatic', cargoSpace: 14.7, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  // Lexus
  'Lexus ES': { horsepower: 302, torque: 267, acceleration: 6.6, topSpeed: 131, fuelEconomy: { city: 22, highway: 32 }, drivetrain: 'FWD', transmission: '8-speed automatic', cargoSpace: 16.7, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
  'Lexus IS': { horsepower: 241, torque: 258, acceleration: 6.1, topSpeed: 143, fuelEconomy: { city: 21, highway: 31 }, drivetrain: 'RWD', transmission: '8-speed automatic', cargoSpace: 10.8, seatingCapacity: 5, reliabilityRating: 5, safetyRating: 5, estimated: false },
}

// Engine size (L) to typical horsepower range for estimation
const ENGINE_HP: Record<number, { min: number; max: number; typical: number }> = {
  1.5: { min: 130, max: 180, typical: 150 },
  1.6: { min: 120, max: 170, typical: 140 },
  2.0: { min: 140, max: 250, typical: 180 },
  2.4: { min: 170, max: 190, typical: 180 },
  2.5: { min: 175, max: 205, typical: 190 },
  3.0: { min: 240, max: 330, typical: 280 },
  3.5: { min: 260, max: 300, typical: 280 },
  3.6: { min: 285, max: 310, typical: 295 },
  4.0: { min: 270, max: 400, typical: 320 },
  5.0: { min: 395, max: 460, typical: 420 },
  5.7: { min: 370, max: 395, typical: 375 },
  6.2: { min: 420, max: 650, typical: 455 },
}

// Drivetrain by make (common defaults)
const MAKE_DRIVETRAIN: Record<string, CarSpecs['drivetrain']> = {
  'Toyota': 'FWD', 'Honda': 'FWD', 'Nissan': 'FWD', 'Hyundai': 'FWD', 'Kia': 'FWD',
  'Ford': 'RWD', 'Chevrolet': 'RWD', 'BMW': 'RWD', 'Mercedes-Benz': 'RWD', 'Mercedes': 'RWD',
  'Audi': 'AWD', 'Subaru': 'AWD', 'Volvo': 'AWD', 'Mazda': 'FWD', 'Lexus': 'RWD',
  'Volkswagen': 'FWD', 'Jeep': '4WD', 'Land Rover': 'AWD', 'Range Rover': 'AWD',
}

function roundEngine(engine: number): number {
  const e = Math.round(engine * 10) / 10
  if (e <= 1.6) return 1.5
  if (e <= 2.2) return 2.0
  if (e <= 2.7) return 2.5
  if (e <= 3.3) return 3.0
  if (e <= 3.8) return 3.5
  if (e <= 4.5) return 4.0
  if (e <= 5.5) return 5.0
  if (e <= 6.0) return 5.7
  return 6.2
}

function getEngineHp(engineSize: number, cylinders: number): number {
  const bucket = Object.keys(ENGINE_HP).map(Number).sort((a, b) => a - b).find(k => k >= engineSize) ?? 2.5
  const r = ENGINE_HP[bucket as keyof typeof ENGINE_HP] ?? ENGINE_HP[2.5]
  // Cylinders: 4cyl -> min, 6 -> typical, 8+ -> max
  if (cylinders >= 8) return r.max
  if (cylinders >= 6) return Math.round((r.typical + r.max) / 2)
  return r.typical
}

export function getCarSpecs(params: {
  make: string
  model: string
  year?: number
  engine_size?: number
  cylinders?: number
  fuel_type?: string
  transmission?: string
}): CarSpecs & { estimated: boolean } {
  const { make, model, year, engine_size, cylinders, fuel_type, transmission } = params
  const makeClean = (make || '').trim()
  const modelClean = (model || '').trim()
  const key = `${makeClean} ${modelClean}`

  const exact = SPECS_DB[key]
  if (exact) {
    return { ...exact, estimated: exact.estimated ?? false }
  }

  // Try without model (make-only averages) - we don't have that, so estimate from engine
  const engine = engine_size ?? 2.0
  const cyl = cylinders ?? 4
  const hp = getEngineHp(engine, cyl)
  // Torque ~= hp * 0.9 to 1.1 for gas
  const torque = Math.round(hp * (fuel_type?.toLowerCase() === 'diesel' ? 1.4 : 1.0))
  // 0-60: rough ~ 7 + (400 - hp) / 80
  const acceleration = Math.min(10.5, Math.max(5.0, 9.5 - (hp - 150) / 60))
  // Top speed ~ 100 + hp/4
  const topSpeed = Math.min(180, Math.round(100 + hp / 3.5))
  // MPG: diesel better, big engine worse
  const baseMpg = fuel_type?.toLowerCase() === 'diesel' ? 4 : 0
  const enginePenalty = Math.max(0, (engine - 2.0) * 4)
  const city = Math.round(Math.max(18, 32 - enginePenalty + baseMpg))
  const highway = Math.round(Math.max(26, 42 - enginePenalty + baseMpg))

  const drivetrain = MAKE_DRIVETRAIN[makeClean] ?? (engine >= 3.5 ? 'RWD' : 'FWD')

  return {
    horsepower: hp,
    torque,
    acceleration: Math.round(acceleration * 10) / 10,
    topSpeed,
    fuelEconomy: { city, highway },
    drivetrain,
    transmission: transmission || (cyl >= 6 ? '6-speed automatic' : 'CVT'),
    cargoSpace: 14,
    seatingCapacity: 5,
    reliabilityRating: 4,
    safetyRating: 5,
    estimated: true,
  }
}

/** 5-year ownership cost estimates (maintenance, fuel, insurance, optional: depreciation) */
export function estimateOwnershipCosts(params: {
  price: number
  mileage: number
  fuelEconomyCity: number
  fuelEconomyHighway: number
  fuelType?: string
  annualMiles?: number
}): { maintenance: number; fuel: number; insurance: number; total5yr: number; fuelYearly: number } {
  const { price, mileage, fuelEconomyCity, fuelEconomyHighway, fuelType } = params
  const annualMiles = params.annualMiles ?? 12000
  const avgMpg = (fuelEconomyCity * 0.45 + fuelEconomyHighway * 0.55) || 28
  const pricePerGallon = fuelType?.toLowerCase() === 'diesel' ? 3.8 : 3.5
  const fuelYearly = Math.round((annualMiles / avgMpg) * pricePerGallon)
  const fuel5 = fuelYearly * 5

  // Maintenance: ~$600/year base + $0.05/mile for older/high mileage
  const mileRate = mileage > 80000 ? 0.07 : mileage > 50000 ? 0.05 : 0.03
  const maintenanceYearly = 600 + (mileage / 1000) * mileRate
  const maintenance5 = Math.round(maintenanceYearly * 5)

  // Insurance: ~4–6% of car value per year; use 5%
  const insuranceYearly = price * 0.05
  const insurance5 = Math.round(insuranceYearly * 5)

  return {
    maintenance: Math.round(maintenanceYearly),
    fuel: fuel5,
    insurance: Math.round(insuranceYearly),
    total5yr: Math.round(fuel5 + maintenance5 + insurance5),
    fuelYearly,
  }
}

/** Price per horsepower, price per 10k miles (value metrics) */
export function valueMetrics(price: number, horsepower: number, mileage: number): {
  pricePerHp: number
  pricePer10kMiles: number
} {
  return {
    pricePerHp: horsepower > 0 ? Math.round(price / horsepower) : 0,
    pricePer10kMiles: mileage > 0 ? Math.round(price / (mileage / 10000)) : 0,
  }
}
