require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { google } = require('googleapis');
const NodeCache = require('node-cache');
const { PricingClient, GetProductsCommand } = require('@aws-sdk/client-pricing');
const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { SubscriptionClient } = require('@azure/arm-subscriptions');
const { EC2Client, DescribeRegionsCommand, DescribeInstanceTypeOfferingsCommand } = require("@aws-sdk/client-ec2");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// === AWS ======= //
const awsCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL || '3600') });

// === AZURE Cache ======= //
const azureCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) });

// === GCP Cache ======= //
const gcpCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) });

const pricingClient = new PricingClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Fetch AWS Pricing function with better error handling
async function getAwsPricing(instanceType, locationName) {
  const cacheKey = `awsPrice-${instanceType}-${locationName}`;
  const cached = awsCache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${instanceType} in ${locationName}`);
    return cached;
  }

  console.log(`API call for ${instanceType} in ${locationName}`);

  // Try multiple filter combinations (from most specific to least)
  const filterCombinations = [
    // Most specific - Linux, Shared tenancy
    [
      { Type: 'TERM_MATCH', Field: 'instanceType', Value: instanceType },
      { Type: 'TERM_MATCH', Field: 'location', Value: locationName },
      { Type: 'TERM_MATCH', Field: 'productFamily', Value: 'Compute Instance' },
      { Type: 'TERM_MATCH', Field: 'tenancy', Value: 'Shared' },
      { Type: 'TERM_MATCH', Field: 'operating-system', Value: 'Linux' }
    ],
    // Less specific - No OS filter
    [
      { Type: 'TERM_MATCH', Field: 'instanceType', Value: instanceType },
      { Type: 'TERM_MATCH', Field: 'location', Value: locationName },
      { Type: 'TERM_MATCH', Field: 'productFamily', Value: 'Compute Instance' },
      { Type: 'TERM_MATCH', Field: 'tenancy', Value: 'Shared' }
    ],
    // Even less specific - No tenancy filter
    [
      { Type: 'TERM_MATCH', Field: 'instanceType', Value: instanceType },
      { Type: 'TERM_MATCH', Field: 'location', Value: locationName },
      { Type: 'TERM_MATCH', Field: 'productFamily', Value: 'Compute Instance' }
    ],
    // Most general - Only instance and location
    [
      { Type: 'TERM_MATCH', Field: 'instanceType', Value: instanceType },
      { Type: 'TERM_MATCH', Field: 'location', Value: locationName }
    ]
  ];

  for (let i = 0; i < filterCombinations.length; i++) {
    try {
      console.log(`Trying filter combination ${i + 1}/${filterCombinations.length}`);

      const params = {
        ServiceCode: 'AmazonEC2',
        Filters: filterCombinations[i],
        MaxResults: 20, // Increased from 10
      };

      const command = new GetProductsCommand(params);
      const data = await pricingClient.send(command);

      if (!data.PriceList || data.PriceList.length === 0) {
        console.log(`No data with filter combination ${i + 1}, trying next...`);
        continue;
      }

      console.log(`Found ${data.PriceList.length} products with filter ${i + 1}`);

      // Parse each product in the price list
      for (const priceStr of data.PriceList) {
        try {
          const product = JSON.parse(priceStr);

          if (!product.terms || !product.terms.OnDemand) {
            continue;
          }

          const onDemand = product.terms.OnDemand;
          for (const sku in onDemand) {
            const term = onDemand[sku];
            if (!term.priceDimensions) continue;

            const priceDimensions = term.priceDimensions;
            for (const pdKey in priceDimensions) {
              const dim = priceDimensions[pdKey];

              // Check for hourly pricing
              if (dim.unit && (
                dim.unit.toLowerCase() === 'hrs' ||
                dim.unit.toLowerCase().includes('hour') ||
                dim.unit.toLowerCase() === 'quantity'
              )) {
                const price = dim.pricePerUnit?.USD;
                if (price && parseFloat(price) > 0) {
                  const priceValue = parseFloat(price);
                  console.log(`✅ Found price: ${priceValue}/hr for ${instanceType} (filter ${i + 1})`);

                  awsCache.set(cacheKey, price, 3600); // Cache for 1 hour
                  return price;
                }
              }
            }
          }
        } catch (parseError) {
          console.log('Error parsing product:', parseError.message);
          continue;
        }
      }

      console.log(`No valid price found with filter ${i + 1}, trying next...`);

    } catch (error) {
      console.log(`Error with filter combination ${i + 1}:`, error.message);
      continue;
    }
  }

  // If all filters failed, throw error
  throw new Error(`No pricing data found for ${instanceType} in ${locationName}. This instance type may not be available in this region or may not support on-demand pricing.`);
}
// AWS price endpoint - COMPLETE REGION MAPPING
app.get('/api/aws-price', async (req, res) => {
  const { instanceType, region } = req.query;
  if (!instanceType || !region) {
    return res.status(400).json({ error: 'Missing instanceType or region parameters' });
  }
  try {
    // COMPLETE AWS region to location name mapping
    const regionToLocationName = {
      // US Regions
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',

      // Asia Pacific
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'ap-northeast-2': 'Asia Pacific (Seoul)',
      'ap-northeast-3': 'Asia Pacific (Osaka)',
      'ap-southeast-3': 'Asia Pacific (Jakarta)',
      'ap-east-1': 'Asia Pacific (Hong Kong)',
      'ap-south-2': 'Asia Pacific (Hyderabad)',

      // Europe
      'eu-west-1': 'EU (Ireland)',
      'eu-west-2': 'EU (London)',
      'eu-west-3': 'EU (Paris)',
      'eu-central-1': 'EU (Frankfurt)',
      'eu-central-2': 'EU (Zurich)',
      'eu-north-1': 'EU (Stockholm)',
      'eu-south-1': 'EU (Milan)',
      'eu-south-2': 'EU (Spain)',

      // South America
      'sa-east-1': 'South America (Sao Paulo)',

      // Canada
      'ca-central-1': 'Canada (Central)',
      'ca-west-1': 'Canada (Calgary)',

      // Middle East
      'me-south-1': 'Middle East (Bahrain)',
      'me-central-1': 'Middle East (UAE)',

      // Africa
      'af-south-1': 'Africa (Cape Town)',

      // China (different pricing structure)
      'cn-north-1': 'China (Beijing)',
      'cn-northwest-1': 'China (Ningxia)',

      // AWS GovCloud
      'us-gov-east-1': 'AWS GovCloud (US-East)',
      'us-gov-west-1': 'AWS GovCloud (US-West)',
    };

    let locationName = regionToLocationName[region];

    // If region not found in mapping, try using region as is
    if (!locationName) {
      console.warn(`Region ${region} not found in mapping, trying as-is`);
      locationName = region;
    }

    console.log(`Fetching price for ${instanceType} in ${locationName} (${region})`);

    const price = await getAwsPricing(instanceType, locationName);
    res.json({
      provider: 'AWS',
      instanceType,
      region,
      locationName, // Include for debugging
      pricePerHourUSD: price
    });
  } catch (error) {
    console.error(`AWS pricing error for ${instanceType} in ${region}:`, error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch AWS price',
      instanceType,
      region,
      debug: `Tried to fetch pricing for ${instanceType} in ${region}`
    });
  }
});
// AWS dynamic regions
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || "us-east-1" });
app.get("/api/aws-regions", async (req, res) => {
  try {
    const command = new DescribeRegionsCommand({});
    const data = await ec2Client.send(command);
    const regions = data.Regions.map((r) => r.RegionName);
    res.json({ regions });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch AWS regions" });
  }
});

// AWS instances
app.get("/api/aws-instances", async (req, res) => {
  const region = req.query.region || process.env.DEFAULT_AWS_REGION;
  if (!region) return res.status(400).json({ error: "Missing region parameter" });

  try {
    const regionalEc2Client = new EC2Client({ region });
    const command = new DescribeInstanceTypeOfferingsCommand({
      LocationType: "region",
      Filters: [{ Name: "location", Values: [region] }],
    });
    const data = await regionalEc2Client.send(command);
    const instances = data.InstanceTypeOfferings.map((offering) => ({ name: offering.InstanceType }));
    res.json({ instances });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch AWS instances" });
  }
});

// === AZURE ======= //
const azureCredential = new DefaultAzureCredential();
const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

// Azure regions
app.get('/api/azure-regions', async (req, res) => {
  try {
    const subClient = new SubscriptionClient(azureCredential);
    const locations = [];
    for await (const loc of subClient.subscriptions.listLocations(subscriptionId)) {
      locations.push(loc.name);
    }
    res.json({ regions: locations });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch Azure regions' });
  }
});

//  Realtime Azure SKUs per region (only VMs) — FIXED normalization
app.get('/api/azure-skus', async (req, res) => {
  try {
    const regionRaw = (req.query.region || "").trim();
    if (!regionRaw) {
      return res.status(400).json({ error: 'Missing region parameter' });
    }

    const region = regionRaw.toLowerCase();
    const computeClient = new ComputeManagementClient(azureCredential, subscriptionId);

    console.log(`[AZURE] Region: ${region} => Fetching VM sizes...`);

    // 👇 async iterator se collect karo
    const sizes = [];
    for await (const item of computeClient.virtualMachineSizes.list(region)) {
      if (item?.name) sizes.push(item.name);
    }

    const unique = [...new Set(sizes)].sort();

    console.log(`[AZURE] Region: ${region} => ${unique.length} sizes found`);
    // debug: pehle 5 print
    console.log("Sample sizes:", unique.slice(0, 5));

    res.json({ skus: unique });
  } catch (err) {
    console.error("Azure Sizes Error:", err);
    res.status(500).json({ error: err.message || 'Failed to fetch Azure sizes' });
  }
});

// Azure Price (robust + pagination + safe filtering)
// Azure Price (robust + pagination + safe filtering)
app.get('/api/azure-price', async (req, res) => {
  try {
    let { skuName, region, os } = req.query;
    if (!skuName || !region) {
      return res.status(400).json({ error: "Please provide skuName and region" });
    }

    // Defaults + normalization
    os = (os || "Linux").toLowerCase();                 // default Linux
    const armRegion = region.toLowerCase().replace(/\s+/g, ""); // just in case
    const baseUrl = "https://prices.azure.com/api/retail/prices";

    // Keep filter simple (broader) then filter in code
    const filter = `serviceName eq 'Virtual Machines' and armRegionName eq '${armRegion}' and armSkuName eq '${skuName}'`;
    console.log("[AZURE-PRICE] filter =>", filter);

    // -- Fetch all pages until we find a suitable row (or pages end) --
    let url = baseUrl;
    let items = [];
    let guardPages = 0;

    while (url && guardPages < 20) { // safety: max 20 pages
      const resp = await axios.get(url, {
        params: url === baseUrl ? { $filter: filter } : undefined,
        timeout: 30000,
      });

      const data = resp.data || {};
      const pageItems = Array.isArray(data.Items) ? data.Items : [];

      items = items.concat(pageItems);

      // If we already found a good match, we can break early
      const quickPick = pageItems.find(it =>
        String(it.priceType || '').toLowerCase() === 'consumption' &&
        String(it.unitOfMeasure || '').toLowerCase().includes('hour') &&
        (it.retailPrice || 0) > 0 &&
        !/spot|low priority/i.test(`${it.productName || ''} ${it.meterName || ''}`) &&
        // prefer non-Windows unless os explicitly says windows
        (os === 'windows'
          ? /windows/i.test(`${it.productName || ''} ${it.skuName || ''} ${it.meterName || ''}`)
          : !/windows/i.test(`${it.productName || ''} ${it.skuName || ''} ${it.meterName || ''}`)
        )
      );
      if (quickPick) {
        const result = {
          skuName,
          region: armRegion,
          price: quickPick.retailPrice,
          currency: quickPick.currencyCode,
          unit: quickPick.unitOfMeasure,
          priceType: quickPick.priceType,
          productName: quickPick.productName,
          meterName: quickPick.meterName,
        };
        return res.json(result);
      }

      url = data.NextPageLink || null;
      guardPages++;
    }

    if (items.length === 0) {
      return res.status(404).json({
        error: "No retail price rows returned",
        debug: { filter, region: armRegion, skuName }
      });
    }

    // No quick pick — do a thorough pick from all fetched items
    const notSpot = (s) => !/spot|low priority/i.test(s || "");
    const containsWin = (s) => /windows/i.test(s || "");

    // 1) Best: Consumption + hourly + >0 + not spot + OS preference
    let pick =
      items.find(it =>
        String(it.priceType || '').toLowerCase() === 'consumption' &&
        String(it.unitOfMeasure || '').toLowerCase().includes('hour') &&
        (it.retailPrice || 0) > 0 &&
        notSpot(`${it.productName} ${it.meterName}`) &&
        (os === 'windows'
          ? containsWin(`${it.productName} ${it.skuName} ${it.meterName}`)
          : !containsWin(`${it.productName} ${it.skuName} ${it.meterName}`)
        )
      )
      // 2) Next best: Consumption + hourly + >0 + not spot (OS-agnostic)
      || items.find(it =>
        String(it.priceType || '').toLowerCase() === 'consumption' &&
        String(it.unitOfMeasure || '').toLowerCase().includes('hour') &&
        (it.retailPrice || 0) > 0 &&
        notSpot(`${it.productName} ${it.meterName}`)
      )
      // 3) Fallback: any >0, hourly
      || items.find(it =>
        String(it.unitOfMeasure || '').toLowerCase().includes('hour') &&
        (it.retailPrice || 0) > 0
      )
      // 4) Last resort: first item
      || items[0];

    if (!pick || !pick.retailPrice) {
      return res.status(404).json({
        error: "No price found for given SKU/Region (after scanning pages)",
        debug: { filter, region: armRegion, skuName }
      });
    }

    const result = {
      skuName,
      region: armRegion,
      price: pick.retailPrice,
      currency: pick.currencyCode,
      unit: pick.unitOfMeasure,
      priceType: pick.priceType,
      productName: pick.productName,
      meterName: pick.meterName,
    };
    return res.json(result);

  } catch (error) {
    if (error.response) {
      console.error("Azure Price API Error:", error.response.status, error.response.data);
      return res.status(500).json({
        error: "Azure retail API request failed",
        status: error.response.status,
        data: error.response.data
      });
    }
    console.error("Azure Price API Error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to fetch Azure price" });
  }
});

// === GCP ======= //
const gcpKeyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// GCP Regions - Enhanced with better error handling
app.get('/api/gcp-regions', async (req, res) => {
  try {
    console.log('Fetching GCP regions...');

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const authClient = await auth.getClient();
    const compute = google.compute({ version: 'v1', auth: authClient });

    const project = process.env.GCP_PROJECT_ID;
    const response = await compute.regions.list({ project });

    // Safe mapping with null check
    const regions = response.data.items?.map(region => region.name) || [];

    console.log(`✅ Found ${regions.length} GCP regions`);
    res.json({ regions });
  } catch (error) {
    console.error('❌ Error fetching GCP regions:', error.message);
    res.status(500).json({ error: 'Failed to fetch GCP regions' });
  }
});

// GCP Instances - Improved with caching and better zone handling
app.get('/api/gcp-instances', async (req, res) => {
  try {
    const region = req.query.region || process.env.DEFAULT_GCP_REGION;
    if (!region) {
      return res.status(400).json({ error: 'Missing region parameter' });
    }

    console.log(`Fetching GCP instances for region: ${region}`);

    // Check cache first
    const cacheKey = `gcp-instances-${region}`;
    const cached = gcpCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for GCP instances in ${region}`);
      return res.json({ instances: cached });
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: gcpKeyFilePath,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const compute = google.compute({ version: 'v1', auth: client });

    const project = process.env.GCP_PROJECT_ID;

    // Get zones for the region with error handling
    let zones = [];
    try {
      const regionData = await compute.regions.get({ project, region });
      zones = regionData.data.zones?.map(z => z.split('/').pop()) || [];
      console.log(`Found ${zones.length} zones for region ${region}`);
    } catch (regionError) {
      console.warn(`⚠️ Could not get zones for region ${region}:`, regionError.message);
      // Fallback: construct common zone names
      zones = [`${region}-a`, `${region}-b`, `${region}-c`];
    }

    let allInstances = new Set();
    let processedZones = 0;

    // Fetch machine types from each zone (limit to first 3 zones for performance)
    for (const zone of zones.slice(0, 3)) {
      try {
        console.log(`Fetching machine types from zone: ${zone}`);

        const result = await compute.machineTypes.list({
          project,
          zone,
          maxResults: 50 // Limit results per zone to avoid timeout
        });

        if (result.data.items) {
          result.data.items.forEach(item => {
            if (item.name) {
              allInstances.add(item.name);
            }
          });
          console.log(`✅ Found ${result.data.items.length} machine types in zone ${zone}`);
        }

        processedZones++;
      } catch (zoneError) {
        console.warn(`⚠️ Error fetching instances for zone ${zone}:`, zoneError.message);
        continue;
      }
    }

    // Convert Set to sorted Array
    const instances = Array.from(allInstances).sort();

    console.log(`✅ Total unique machine types found: ${instances.length} from ${processedZones} zones`);

    // Cache results if we got some data
    if (instances.length > 0) {
      gcpCache.set(cacheKey, instances, 3600); // Cache for 1 hour
    }

    res.json({ instances });
  } catch (err) {
    console.error('❌ GCP instances error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch GCP instances' });
  }
});

// GCP SKUs - Enhanced for better filtering
app.get('/api/azure-skus', async (req, res) => {
  try {
    const regionRaw = (req.query.region || "").trim();
    if (!regionRaw) {
      return res.status(400).json({ error: 'Missing region parameter' });
    }

    const region = regionRaw.toLowerCase(); // normalize
    const computeClient = new ComputeManagementClient(azureCredential, subscriptionId);

    console.log(`[AZURE] Region: ${region} => Fetching VM sizes...`);

    const sizes = [];
    for await (const s of computeClient.virtualMachineSizes.list(region)) {
      if (s?.name) sizes.push(s.name);
    }

    const list = [...new Set(sizes)].sort();

    console.log(`[AZURE] Region: ${region} => ${list.length} sizes found`);

    res.json({ skus: list });
  } catch (err) {
    console.error("Azure Sizes Error:", err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch Azure sizes' });
  }
});

// GCP Price - REAL-TIME DYNAMIC PRICING Root

app.get('/api/gcp-price', async (req, res) => {
  const { instanceType, region } = req.query;
  if (!instanceType || !region) {
    return res.status(400).json({ error: 'Missing instanceType or region parameters' });
  }

  console.log(`🔥 Fetching REAL-TIME GCP price for: ${instanceType} in ${region}`);

  try {
    // Step 1: Get machine specifications
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const computeClient = await auth.getClient();
    const compute = google.compute({ version: 'v1', auth: computeClient });
    const project = process.env.GCP_PROJECT_ID;

    // Find available zone in the region
    let machineTypeData = null;
    const zones = [`${region}-a`, `${region}-b`, `${region}-c`];

    for (const zone of zones) {
      try {
        const response = await compute.machineTypes.get({
          project: project,
          zone: zone,
          machineType: instanceType
        });
        machineTypeData = response.data;
        console.log(`✅ Found machine type ${instanceType} in zone ${zone}`);
        break;
      } catch (err) {
        console.log(`Zone ${zone} not available, trying next...`);
        continue;
      }
    }

    if (!machineTypeData) {
      throw new Error(`Machine type ${instanceType} not available in region ${region}`);
    }

    const vCpus = machineTypeData.guestCpus;
    const memoryMb = machineTypeData.memoryMb;
    const memoryGb = memoryMb / 1024;

    console.log(`Machine specs - vCPUs: ${vCpus}, Memory: ${memoryGb} GB`);

    // Step 2: Get real-time pricing from Cloud Billing API
    const billingAuth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/cloud-billing.readonly']
    });
    const billingClient = await billingAuth.getClient();
    const cloudbilling = google.cloudbilling({ version: 'v1', auth: billingClient });

    // Fetch all Compute Engine SKUs
    const skuResponse = await cloudbilling.services.skus.list({
      parent: 'services/6F81-5844-456A', // Compute Engine service ID
      pageSize: 5000
    });

    const skus = skuResponse.data.skus || [];
    console.log(`📊 Fetched ${skus.length} total SKUs from GCP`);

    // Step 3: Find pricing for vCPU and Memory
    let cpuHourlyRate = 0;
    let memoryHourlyRate = 0;

    // Get instance family (n1, n2, e2, etc.)
    const instanceFamily = instanceType.split('-')[0].toLowerCase();
    console.log(`Instance family: ${instanceFamily}`);

    for (const sku of skus) {
      const description = sku.description || '';
      const regions = sku.geoTaxonomy?.regions || [];

      // Check if SKU applies to our region
      const regionApplies = regions.length === 0 ||
                           regions.includes(region) ||
                           regions.some(r => region.includes(r));

      if (!regionApplies) continue;
      if (description.toLowerCase().includes('preemptible')) continue;
      if (description.toLowerCase().includes('spot')) continue;

      // Look for CPU pricing
      const isCpuSku = description.toLowerCase().includes('instance core') ||
                       description.toLowerCase().includes('vcpu') ||
                       (description.toLowerCase().includes(instanceFamily) &&
                        description.toLowerCase().includes('core'));

      // Look for Memory pricing
      const isMemorySku = description.toLowerCase().includes('instance ram') ||
                          description.toLowerCase().includes('memory') ||
                          (description.toLowerCase().includes(instanceFamily) &&
                           description.toLowerCase().includes('ram'));

      if (isCpuSku && cpuHourlyRate === 0) {
        const pricingInfo = sku.pricingInfo?.[0];
        if (pricingInfo?.pricingExpression?.tieredRates?.[0]?.unitPrice) {
          const unitPrice = pricingInfo.pricingExpression.tieredRates[0].unitPrice;
          const units = parseFloat(unitPrice.units || '0');
          const nanos = parseFloat(unitPrice.nanos || '0');
          cpuHourlyRate = units + (nanos / 1000000000);
          console.log(`✅ Found CPU rate: $${cpuHourlyRate}/hour per vCPU - ${description}`);
        }
      }

      if (isMemorySku && memoryHourlyRate === 0) {
        const pricingInfo = sku.pricingInfo?.[0];
        if (pricingInfo?.pricingExpression?.tieredRates?.[0]?.unitPrice) {
          const unitPrice = pricingInfo.pricingExpression.tieredRates[0].unitPrice;
          const units = parseFloat(unitPrice.units || '0');
          const nanos = parseFloat(unitPrice.nanos || '0');
          memoryHourlyRate = units + (nanos / 1000000000);
          console.log(`✅ Found Memory rate: $${memoryHourlyRate}/hour per GB - ${description}`);
        }
      }

      // Stop searching if we found both rates
      if (cpuHourlyRate > 0 && memoryHourlyRate > 0) {
        break;
      }
    }

    // Fallback to standard GCP pricing if not found
    if (cpuHourlyRate === 0 || memoryHourlyRate === 0) {
      console.log('⚠️  Using fallback pricing...');

      const fallbackRates = {
        'n1': { cpu: 0.0475, memory: 0.0063 },
        'n2': { cpu: 0.031, memory: 0.0041 },
        'e2': { cpu: 0.022, memory: 0.003 },
        'c2': { cpu: 0.0441, memory: 0.0059 },
        'default': { cpu: 0.035, memory: 0.0047 }
      };

      const rates = fallbackRates[instanceFamily] || fallbackRates['default'];
      if (cpuHourlyRate === 0) cpuHourlyRate = rates.cpu;
      if (memoryHourlyRate === 0) memoryHourlyRate = rates.memory;
    }

    // Step 4: Calculate total cost
    const totalCpuCost = vCpus * cpuHourlyRate;
    const totalMemoryCost = memoryGb * memoryHourlyRate;
    const totalHourlyCost = totalCpuCost + totalMemoryCost;

    console.log(`💰 Cost Breakdown:
    - ${vCpus} vCPUs × $${cpuHourlyRate.toFixed(4)} = $${totalCpuCost.toFixed(4)}
    - ${memoryGb} GB × $${memoryHourlyRate.toFixed(4)} = $${totalMemoryCost.toFixed(4)}
    - Total: $${totalHourlyCost.toFixed(4)}/hour`);

    // Return response
    res.json({
      provider: 'GCP',
      instanceType: instanceType,
      region: region,
      pricePerHourUSD: totalHourlyCost.toFixed(4),
      specs: {
        vCpus: vCpus,
        memoryGb: memoryGb.toFixed(1),
        cpuCostPerHour: totalCpuCost.toFixed(4),
        memoryCostPerHour: totalMemoryCost.toFixed(4)
      }
    });

  } catch (error) {
    console.error('❌ GCP Pricing Error:', error.message);
    res.status(500).json({
      error: `Failed to fetch GCP price for ${instanceType} in ${region}: ${error.message}`,
      instanceType: instanceType,
      region: region
    });
  }
});
//Root
app.get('/', (req, res) => res.json({ message: 'Cloud Pricing API server running ✅' }));

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
// Start server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
