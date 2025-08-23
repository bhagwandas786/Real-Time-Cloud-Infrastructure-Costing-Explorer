import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Card,
  CssBaseline,
  createTheme,
  ThemeProvider,
  Grid,
  IconButton,
  Tooltip,
  Link,
  AppBar,
  Toolbar,
  Autocomplete,
  Fab,
  Skeleton,
} from "@mui/material";

import InfoIcon from "@mui/icons-material/Info";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalculateIcon from "@mui/icons-material/Calculate";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AwsIcon from "@mui/icons-material/Cloud";
import AzureIcon from "@mui/icons-material/CloudQueue";
import GcpIcon from "@mui/icons-material/CloudCircle";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { saveAs } from "file-saver";
import { DataGrid } from "@mui/x-data-grid";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "@fontsource/poppins";
import "@fontsource/raleway";
const API_URL = import.meta.env.VITE_API_URL;
const ACTIVE_COLOR = "#FF9900"; // common yellow
const providers = [
  { name: "AWS", icon: <AwsIcon color="primary" />, color: "#FF9900" },
  { name: "Azure", icon: <AzureIcon color="primary" />, color: "#007FFF" },
  { name: "GCP", icon: <GcpIcon color="primary" />, color: "#4285F4" },
];

// Resources for footer (unchanged)
const resources = {
  AWS: {
    Learn: [
      { label: "What Is AWS?", url: "https://aws.amazon.com/what-is-aws/" },
      { label: "What Is Cloud Computing?", url: "https://aws.amazon.com/what-is-cloud-computing/" },
      { label: "AWS Cloud Security", url: "https://aws.amazon.com/security/" },
      { label: "What's New", url: "https://aws.amazon.com/new/" },
    ],
    Resources: [
      { label: "Getting Started", url: "https://aws.amazon.com/getting-started/" },
      { label: "Training", url: "https://aws.amazon.com/training/" },
      { label: "Architecture Center", url: "https://aws.amazon.com/architecture/" },
      { label: "AWS FAQs", url: "https://aws.amazon.com/faqs/" },
    ],
    Developers: [
      { label: "SDKs & Tools", url: "https://aws.amazon.com/developer/tools/" },
      { label: ".NET on AWS", url: "https://aws.amazon.com/developer/language/net/" },
      { label: "Python on AWS", url: "https://aws.amazon.com/developer/language/python/" },
      { label: "JavaScript on AWS", url: "https://aws.amazon.com/developer/language/javascript/" },
    ],
    Help: [
      { label: "Contact Us", url: "https://aws.amazon.com/contact-us/" },
      { label: "AWS re:Post", url: "https://repost.aws/" },
      { label: "Knowledge Center", url: "https://repost.aws/knowledge-center/" },
      { label: "AWS Support Overview", url: "https://aws.amazon.com/premiumsupport/" },
    ],
  },
  Azure: {
    Learn: [
      { label: "What Is Azure?", url: "https://azure.microsoft.com/en-us/overview/" },
      { label: "Azure Security", url: "https://azure.microsoft.com/en-us/overview/security/" },
      { label: "Azure Architecture Center", url: "https://docs.microsoft.com/en-us/azure/architecture/" },
      { label: "Azure Blog", url: "https://azure.microsoft.com/en-us/blog/" },
    ],
    Resources: [
      { label: "Getting Started with Azure", url: "https://azure.microsoft.com/en-us/get-started/" },
      { label: "Azure Training", url: "https://docs.microsoft.com/en-us/learn/azure/" },
      { label: "Azure FAQs", url: "https://learn.microsoft.com/en-us/azure/azure-faq/" },
      { label: "Azure Compliance", url: "https://learn.microsoft.com/en-us/azure/compliance/" },
    ],
    Developers: [
      { label: "Azure SDKs", url: "https://azure.microsoft.com/en-us/develop/" },
      { label: "Azure Developer Center", url: "https://developer.microsoft.com/en-us/azure/" },
      { label: "JavaScript on Azure", url: "https://azure.microsoft.com/en-us/develop/javascript/" },
    ],
    Help: [
      { label: "Azure Support", url: "https://azure.microsoft.com/en-us/support/" },
      { label: "Azure Forums", url: "https://docs.microsoft.com/en-us/answers/topics/azure.html" },
      { label: "Contact Azure", url: "https://azure.microsoft.com/en-us/contact/" },
    ],
  },
  GCP: {
    Learn: [
      { label: "What Is Google Cloud?", url: "https://cloud.google.com/what-is-cloud-computing" },
      { label: "GCP Security", url: "https://cloud.google.com/security/" },
      { label: "Google Cloud Architecture", url: "https://cloud.google.com/architecture" },
      { label: "Google Cloud Blog", url: "https://cloud.google.com/blog/" },
    ],
    Resources: [
      { label: "Getting Started with Google Cloud", url: "https://cloud.google.com/getting-started" },
      { label: "Google Cloud Training", url: "https://cloud.google.com/training" },
      { label: "Google Cloud FAQs", url: "https://cloud.google.com/docs/faq" },
    ],
    Developers: [
      { label: "Google Cloud SDKs", url: "https://cloud.google.com/sdk" },
      { label: "Google Cloud Developer Tools", url: "https://cloud.google.com/developers" },
    ],
    Help: [
      { label: "Google Cloud Support", url: "https://cloud.google.com/support" },
      { label: "Google Cloud Community", url: "https://cloudcommunity.withgoogle.com" },
      { label: "Contact Google Cloud", url: "https://cloud.google.com/contact" },
    ],
  },
};

// SimpleCalculator component unchanged (omitted here for brevity, paste yours)

function SimpleCalculator({ onClose }) {
  const [display, setDisplay] = useState("0");

  const handleButtonClick = (value) => {
    if (display === "0" && value !== ".") setDisplay(value);
    else setDisplay(display + value);
  };

  const handleClear = () => setDisplay("0");

  const handleBackspace = () => {
    if (display.length === 1) setDisplay("0");
    else setDisplay(display.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(display);
      setDisplay(String(result));
    } catch {
      setDisplay("Error");
    }
  };

  const buttons = [
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "C",
    "+",
  ];

  return (
    <Card
      sx={{
        position: "fixed",
        bottom: 80,
        right: 20,
        width: 280,
        bgcolor: "background.paper",
        p: 2,
        borderRadius: 3,
        boxShadow: 6,
        zIndex: 1500,
      }}
      aria-label="Simple calculator"
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Calculator
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={display}
          inputProps={{
            readOnly: true,
            "aria-live": "polite",
            style: { textAlign: "right", fontSize: 24, fontWeight: "bold" },
          }}
          size="small"
        />
      </Box>
      <Grid container spacing={1}>
        {buttons.map((btn) => (
          <Grid item xs={3} key={btn}>
            <Button
              variant="contained"
              onClick={() =>
                btn === "C" ? handleClear() : handleButtonClick(btn)
              }
              sx={{ height: 40, fontWeight: "700" }}
              aria-label={`Calculator button ${btn}`}
              size="small"
            >
              {btn}
            </Button>
          </Grid>
        ))}
        <Grid item xs={6}>
          <Button
            variant="contained"
            color="error"
            onClick={handleBackspace}
            fullWidth
            sx={{ fontWeight: "700" }}
            aria-label="Backspace"
            size="small"
          >
            ⌫
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            color="success"
            onClick={handleCalculate}
            fullWidth
            sx={{ fontWeight: "700" }}
            aria-label="Calculate"
            size="small"
          >
            =
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ textAlign: "right", mt: 1 }}>
        <Button
          size="small"
          onClick={onClose}
          aria-label="Close calculator"
          sx={{ fontWeight: "600" }}
        >
          Close
        </Button>
      </Box>
    </Card>
  );
}

function App() {
  const [themeMode, setThemeMode] = useState("dark");
  const [zoom, setZoom] = useState(1);
  const [selectedProviders, setSelectedProviders] = useState([providers[0].name]);

  // Dynamic state for regions and instances loaded from backend
  const [regionsData, setRegionsData] = useState({
    AWS: [],
    Azure: [],
    GCP: [],
  });

  const [instancesData, setInstancesData] = useState({
    AWS: [],
    Azure: [],
    GCP: [],
  });

  const [selectedInstances, setSelectedInstances] = useState({
    AWS: "",
    Azure: "",
    GCP: "",
  });

  // Updated config: Removed storage, cpu, ram from state
  const [config, setConfig] = useState({
    AWS: { region: "" },
    Azure: { region: "" },
    GCP: { region: "" },
  });

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState({
    AWS: false,
    Azure: false,
    GCP: false,
  });
  const [loadingPrices, setLoadingPrices] = useState(false);
// Prevent stale results when user switches regions quickly
 const fetchStampRef = useRef({ AWS: 0, Azure: 0, GCP: 0 });
  const [results, setResults] = useState({});
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);

  // Fetch regions for all providers on mount
  useEffect(() => {
    async function fetchRegions() {
      setLoadingRegions(true);
      try {
        const awsRes = await fetch(`${API_URL}/api/aws-regions`);
        const awsData = await awsRes.json();

        const azureRes = await fetch(`${API_URL}/api/azure-regions`);
        const azureData = await azureRes.json();

        const gcpRes = await fetch(`${API_URL}/api/gcp-regions`);
        const gcpData = await gcpRes.json();

        setRegionsData({
          AWS: awsData.regions || [],
          Azure: azureData.regions || [],
          GCP: gcpData.regions || [],
        });

setConfig((prev) => ({
  AWS: { ...prev.AWS, region: awsData.regions?.[0] || "" },
  Azure: { ...prev.Azure, region: azureData.regions?.[0] || "" },
  GCP: { ...prev.GCP, region: gcpData.regions?.[0] || "" },
}));

      } catch (err) {
        console.error("Error fetching regions", err);
      } finally {
        setLoadingRegions(false);
      }
    }
    fetchRegions();
  }, []);

  // Fetch instances when region changes
// AWS
useEffect(() => {
  if (config.AWS?.region) {
    fetchInstances("AWS", config.AWS.region);
  }
}, [config.AWS?.region]);

// Azure
useEffect(() => {
  if (config.Azure?.region) {
    fetchInstances("Azure", config.Azure.region);
  }
}, [config.Azure?.region]);

// GCP
useEffect(() => {
  if (config.GCP?.region) {
    fetchInstances("GCP", config.GCP.region);
  }
}, [config.GCP?.region]);
async function fetchInstances(provider, region) {
  // Add immediate feedback
  setLoadingInstances((prev) => ({ ...prev, [provider]: true }));
  setInstancesData((prev) => ({ ...prev, [provider]: [] }));
  setSelectedInstances((prev) => ({ ...prev, [provider]: "" }));

  // Stamp this request to avoid race/stale updates
  const stamp = Date.now();
  fetchStampRef.current[provider] = stamp;

  try {
    let endpoint = "";
    if (provider === "AWS") {
      endpoint = `${API_URL}/api/aws-instances?region=${encodeURIComponent(region)}`;
    } else if (provider === "Azure") {
      endpoint = `${API_URL}/api/azure-skus?region=${encodeURIComponent(region)}`;
    } else if (provider === "GCP") {
      endpoint = `${API_URL}/api/gcp-instances?region=${encodeURIComponent(region)}`;
    } else {
      return;
    }

    let res;
if (provider === "Azure") {
  // Azure data is huge, give it more time
  res = await fetch(endpoint, {
    cache: "no-store",
    signal: AbortSignal.timeout(60000) // 60 seconds for Azure
  });
} else {
  res = await fetch(endpoint, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });
}
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // ---- normalize to array<string> ----
    let instancesList = [];
    if (provider === "AWS") {
      const raw = data.instances || [];
      instancesList = raw.map((it) =>
        typeof it === "string"
          ? it
          : it?.name || it?.InstanceType || it?.instanceType || String(it)
      );
    } else if (provider === "GCP") {
      const raw = data.instances || data.items || data.Items || [];
      instancesList = raw.map((it) => {
        if (typeof it === "string") return it;
        return (
          it?.name ||
          it?.id ||
          (it?.machineType && String(it.machineType).split("/").pop()) ||
          String(it)
        );
      });
} else if (provider === "Azure") {
  // Azure API returns { skus: [...] }
  const raw = data.skus || [];
  instancesList = raw.map((it) => {
    if (typeof it === "string") return it;
    return it?.name || it?.size || String(it);
  });
}
    instancesList = Array.from(new Set(instancesList.filter(Boolean))).sort();

    // If another newer fetch started, drop this result (race protection)
    if (fetchStampRef.current[provider] !== stamp) return;

    setInstancesData((prev) => ({ ...prev, [provider]: instancesList }));
    // Always set the first option as default for this region
    setSelectedInstances((prev) => ({
      ...prev,
      [provider]: instancesList[0] || "",
    }));
  } catch (err) {
   console.error(`Error fetching instances for ${provider}`, err);
    if (fetchStampRef.current[provider] !== stamp) return; // race protection
    setInstancesData((prev) => ({ ...prev, [provider]: [] }));
    setSelectedInstances((prev) => ({ ...prev, [provider]: "" }));
  } finally {
    if (fetchStampRef.current[provider] === stamp) {
      setLoadingInstances((prev) => ({ ...prev, [provider]: false }));
    }
  }
}
  // Handle toggling providers
  const toggleProvider = (providerName) => {
    setSelectedProviders((prev) => {
      if (prev.includes(providerName)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== providerName);
      }
      return [...prev, providerName];
    });
  };

  // Handle instance selection change
  const handleInstanceChange = (provider, instanceName) => {
    setSelectedInstances((prev) => ({ ...prev, [provider]: instanceName }));
  };

  // Handle config changes (region only now)
const handleConfigChange = (provider, field, value) => {
    if (field === "region") {
      // 1) Update region
      setConfig((prev) => ({
        ...prev,
        [provider]: { region: value },
      }));
      // 2) Clear current instances list to avoid showing stale options
      setInstancesData((prev) => ({ ...prev, [provider]: [] }));
      // 3) Clear current selection
      setSelectedInstances((prev) => ({ ...prev, [provider]: "" }));
      // 4) Drop any shown result for this provider (optional but avoids confusion)
      setResults((prev) => {
        const copy = { ...prev };
        delete copy[provider];
        return copy;
      });
    }
 };  // Fetch prices (updated - no storage, cpu, ram used in calculation)
  const fetchPrices = async () => {
    setLoadingPrices(true);
    const newResults = {};
    try {
      for (const prov of selectedProviders) {
        const region = config[prov]?.region;
        const instance = selectedInstances[prov];

        if (!region || !instance) continue;

        let priceResponse;
        if (prov === "AWS") {
          const query = new URLSearchParams({
            instanceType: instance,
            region,
          }).toString();
          priceResponse = await fetch(`${API_URL}/api/aws-price?${query}`);
          const data = await priceResponse.json();
          if (!priceResponse.ok)
            throw new Error(data.error || "AWS price fetch error");

          const pricePerHour = parseFloat(data.pricePerHourUSD);
          newResults[prov] = {
            price: pricePerHour.toFixed(4),
            specs: `Instance: ${instance}, Region: ${region}`,
            instanceName: instance,
            cpu: null,
            ram: null,
            storage: null,
            region,
            onDemandPrice: pricePerHour,
            reservedPrice: null,
            storagePricePerGBMonth: null,
          };
        } else if (prov === "Azure") {
          const query = new URLSearchParams({
            skuName: instance,
            region,
          }).toString();
          priceResponse = await fetch(`${API_URL}/api/azure-price?${query}`);
          const data = await priceResponse.json();
          if (!priceResponse.ok)
            throw new Error(data.error || "Azure price fetch error");

          const pricePerHour = parseFloat(data.price);
          newResults[prov] = {
            price: pricePerHour.toFixed(4),
            specs: `SKU: ${instance}, Region: ${region}`,
            instanceName: instance,
            cpu: null,
            ram: null,
            storage: null,
            region,
            onDemandPrice: pricePerHour,
            reservedPrice: null,
            storagePricePerGBMonth: null,
          };

}  else if (prov === "GCP") {
  const query = new URLSearchParams({
    instanceType: instance,
    region: region
  }).toString();
  priceResponse = await fetch(`${API_URL}/api/gcp-price?${query}`);
  const data = await priceResponse.json();
  if (!priceResponse.ok)
    throw new Error(data.error || "GCP price fetch error");

  const pricePerHour = parseFloat(data.pricePerHourUSD);
  newResults[prov] = {
    price: pricePerHour.toFixed(4),
    specs: `Instance: ${instance}, Region: ${region}`,
    instanceName: instance,
    cpu: null,
    ram: null,
    storage: null,
    region,
    onDemandPrice: pricePerHour,
    reservedPrice: null,
    storagePricePerGBMonth: null,
  };
}
      }
      setResults(newResults);
      setPriceHistory((prev) => [...prev, { time: new Date(), data: newResults }]);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Export CSV (adjust to reflect no cpu/ram/storage)
  const exportCSV = () => {
    let rows = [
["Provider","Instance Name","Region","On-Demand Price/hr","Reserved Price/hr","Estimated Total Price/hr","Specs"]
    ];
    selectedProviders.forEach((prov) => {
      const r = results[prov];
      if (r) {
        rows.push([
          prov,
          r.instanceName,
          r.region,
          r.onDemandPrice ?? "",
          r.reservedPrice ?? "N/A",
          r.price ?? "",
          r.specs ?? ""
        ]);
      }
    });
    const csv = rows.map(row =>
      row.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "cloud-pricing.csv");
  };

  // Theme creation unchanged (copy as is)
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          background:
            themeMode === "dark"
              ? { default: "#0a1e2e", paper: "#142c44" }
              : { default: "#e3f2fd", paper: "#ffffff" },
          primary: {
            main: themeMode === "dark" ? "#90caf9" : "#1976d2",
          },
          text: {
            primary: themeMode === "dark" ? "#e0e0e0" : "#121212",
            secondary: themeMode === "dark" ? "#b0bec5" : "#555555",
          },
        },
        typography: {
          fontFamily: "'Poppins', sans-serif",
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                transition: "transform 0.2s ease-in-out",
                "&:hover": {
                  transform: "scale(1.05)",
                },
                "&:focus-visible": {
                  outline: `3px solid ${
                    themeMode === "dark" ? "#90caf9" : "#1976d2"
                  }`,
                  outlineOffset: "2px",
                },
                borderRadius: 3,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                transition:
                  "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out",
                boxShadow:
                  themeMode === "dark"
                    ? "0 10px 30px rgba(144,202,249,0.7)"
                    : "0 10px 30px rgba(33,150,243,0.5)",
                borderRadius: 6,
                bgcolor: themeMode === "dark" ? "#142c44" : "#e3f2fd",
                "&:hover": {
                  boxShadow:
                    themeMode === "dark"
                      ? "0 15px 45px rgba(144,202,249,0.85)"
                      : "0 15px 45px rgba(33,150,243,0.7)",
                  transform: "translateY(-5px)",
                },
              },
            },
          },
          MuiLink: {
            styleOverrides: {
              root: {
                transition: "color 0.3s ease",
                fontWeight: 500,
                color: themeMode === "dark" ? "#e0e0e0" : "#1976d2",
                textDecoration: "none",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                  color: themeMode === "dark" ? "#90caf9" : "#0d47a1",
                },
              },
            },
          },
        },
      }),
    [themeMode]
  );

  // Styles for bottom-right icons container
  const iconsContainerStyles = {
    position: "fixed",
    bottom: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1.5,
    zIndex: 2000,
  };

  // Shared styles for icons (BackToTop & Calculator)
  const sharedIconStyles = {
    bgcolor: "primary.main",
    color: "primary.contrastText",
    width: 48,
    height: 48,
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    "&:hover": {
      transform: "scale(1.2)",
      boxShadow:
        "0 8px 24px rgba(33,150,243,0.9), 0 0 15px 3px rgba(66,165,245,0.7)",
      filter: "drop-shadow(0 0 8px #2196f3)",
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          height: "100vh",
          width: "100vw",
          overflowX: "hidden",
          background: theme.palette.background.default,
          display: "flex",
          flexDirection: "column",
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          transition: "transform 0.3s ease",
          position: "relative",
          minHeight: "100vh",
          pb: 6,
        }}
      >
        {/* Navigation bar */}
        <AppBar position="sticky" color="default" elevation={4}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === "dark" ? "#90caf9" : "#1976d2",
                fontWeight: 700,
                fontFamily: "'Raleway', serif",
              }}
            >
              Cloud Infra Explorer
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Zoom Out">
                <IconButton
                  onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
                  aria-label="Zoom out"
                  color="primary"
                  size="large"
                >
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Zoom">
                <IconButton
                  onClick={() => setZoom(1)}
                  aria-label="Reset zoom"
                  color="primary"
                  size="large"
                >
                  <ZoomOutMapIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom In">
                <IconButton
                  onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}
                  aria-label="Zoom in"
                  color="primary"
                  size="large"
                >
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                <IconButton
                  onClick={() => setThemeMode((t) => (t === "dark" ? "light" : "dark"))}
                  aria-label="Toggle theme"
                  color="primary"
                  size="large"
                >
                  {themeMode === "dark" ? <Brightness7Icon /> : <NightsStayIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Container
          maxWidth={false}
          sx={{
            flexGrow: 1,
            px: { xs: 2, sm: 4, md: 6 },
            py: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Title */}
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{
              color: theme.palette.primary.main,
              fontFamily: "'Raleway', serif",
              textTransform: "capitalize",
              textShadow:
                theme.palette.mode === "dark"
                  ? "2px 2px 4px rgba(0,0,0,0.7), 0 0 10px rgba(144, 202, 249, 0.7)"
                  : "2px 2px 4px rgba(255,255,255,0.8), 0 0 10px rgba(25, 118, 210, 0.7)",
              userSelect: "none",
              mb: 6,
              textAlign: "center",
              flexWrap: "wrap",
              display: "flex",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            Cloud Infrastructure Cost & Specification Explorer
          </Typography>

          {/* Provider selection buttons */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            {providers.map(({ name, icon, color }) => (
<Button
  key={name}
  variant={selectedProviders.includes(name) ? "contained" : "outlined"}
  startIcon={icon}
  onClick={() => toggleProvider(name)}
  sx={{
    textTransform: "none",
    minWidth: 130,
    fontWeight: "600",
    borderColor: selectedProviders.includes(name) ? ACTIVE_COLOR : color,
    color: selectedProviders.includes(name) ? "#fff" : color,
    "&.MuiButton-contained": {
      bgcolor: ACTIVE_COLOR,
      color: "#fff",
      "&:hover": { bgcolor: ACTIVE_COLOR },
    },
  }}
>
  {name}
</Button>

            ))}
          </Box>

          {/* Configuration cards */}
          <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
            {selectedProviders.map((prov) => (
              <Grid item xs={12} sm={6} md={4} key={prov}>
                <Card
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    p: 3,
                    borderRadius: 6,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 10px 30px rgba(144,202,249,0.7)"
                        : "0 10px 30px rgba(33,150,243,0.5)",
                  }}
                >
                  <Typography variant="h6" textAlign="center" gutterBottom fontWeight={700}>
                    {prov} Configuration
                  </Typography>

                  {/* Region select first */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id={`${prov}-region-label`}>Region</InputLabel>
                    <Select
                      labelId={`${prov}-region-label`}
                      value={config[prov]?.region || ""}
                      label="Region"
                      onChange={(e) => handleConfigChange(prov, "region", e.target.value)}
                      size="small"
                    >
                      {loadingRegions ? (
                        <MenuItem disabled>Loading regions...</MenuItem>
                      ) : regionsData[prov].length === 0 ? (
                        <MenuItem disabled>No regions found</MenuItem>
                      ) : (
                        regionsData[prov].map((regionCode) => (
                          <MenuItem key={regionCode} value={regionCode}>
                            {regionCode}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>

                  {/* Instance Type */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                    <InputLabel id={`${prov}-instance-label`}>Instance Type</InputLabel>
                    <Tooltip title="Select an instance to compare specs side-by-side">
                      <InfoIcon fontSize="small" color="info" sx={{ cursor: "pointer" }} />
                    </Tooltip>
                  </Box>

<Autocomplete
  key={`${prov}-${config[prov]?.region || ""}`}
  disablePortal
  options={instancesData[prov] || []}
  getOptionLabel={(option) => option || ""}
  isOptionEqualToValue={(o, v) => o === v}
  value={selectedInstances[prov] || null}
  onChange={(e, newVal) => handleInstanceChange(prov, newVal || "")}
  loading={loadingInstances[prov]}  // ✅ YE IMPORTANT HAI
  loadingText="Loading instances..."
  noOptionsText={
    loadingInstances[prov]
      ? "Loading instances..."
      : (config[prov]?.region ? "No instances for this region" : "Select a region first")
  }
  disabled={loadingInstances[prov]}  // ✅ LOADING TIME DISABLE
  renderInput={(params) => (
    <TextField
      {...params}
      label="Instance Type"
      fullWidth
      size="small"
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loadingInstances[prov] ? <CircularProgress color="inherit" size={20} /> : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  )}
  sx={{ mb: 2 }}
  clearOnEscape
  disableClearable={false}
/>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Buttons */}
          <Box sx={{ mb: 6 }}>
            <Button
              variant="contained"
              size="large"
              onClick={fetchPrices}
              disabled={loadingPrices}
              sx={{ fontWeight: "700", px: 6 }}
            >
              {loadingPrices ? <CircularProgress size={24} color="inherit" /> : "Get Pricing"}
            </Button>
            <Tooltip
              title={Object.keys(results).length ? "Export results as CSV" : "No data to export"}
            >
              <span>
                <IconButton
                  onClick={exportCSV}
                  disabled={!Object.keys(results).length}
                  color="primary"
                  size="large"
                  sx={{ ml: 2 }}
                >
                  <FileDownloadIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Loading skeleton */}
          {loadingPrices && (
            <Grid container spacing={4} justifyContent="center">
              {Array.from({ length: selectedProviders.length }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Results Cards */}
          {!loadingPrices &&
            !loadingRegions &&
            selectedProviders.map((prov) => {
              const r = results[prov];
              if (!r) return null;
              return (
                <Grid item xs={12} sm={6} md={4} key={`result-${prov}`}>
                  <Card
                    sx={{
                      bgcolor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      p: 3,
                      borderRadius: 6,
                      boxShadow:
                        theme.palette.mode === "dark"
                          ? "0 10px 30px rgba(144,202,249,0.7)"
                          : "0 10px 30px rgba(33,150,243,0.5)",
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {prov} Pricing & Specifications
                    </Typography>
                    <Typography>
                      <strong>Instance:</strong> {r.instanceName}
                    </Typography>
                    <Typography>
                      <strong>Region:</strong> {r.region}
                    </Typography>
                    <Typography>
                      <strong>Estimated Price:</strong> ${r.price} per hour
                    </Typography>
                    <Typography>
                      <strong>Specs:</strong> {r.specs}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}

          {/* Comparison Table */}
          {!loadingPrices &&
            Object.keys(results).length > 1 && (
              <Box sx={{ mt: 4, width: "100%" }}>
                <Typography variant="h5" gutterBottom>
                  Comparison Table
                </Typography>
                <DataGrid
                  autoHeight
                  rows={Object.entries(results).map(([prov, r], i) => ({
                    id: i,
                    provider: prov,
                    instance: r.instanceName,
                    price: r.price,
                  }))}
                  columns={[
                    { field: "provider", headerName: "Provider", flex: 1 },
                    { field: "instance", headerName: "Instance", flex: 2 },
                    { field: "price", headerName: "Price/hr", flex: 1 },
                  ]}
                  disableColumnMenu
                  sx={{ borderRadius: 2, boxShadow: 2 }}
                />
              </Box>
            )}

          {/* Price History Chart */}
          {priceHistory.length > 0 && (
            <Box sx={{ mt: 6, width: "100%" }}>
              <Typography variant="h5" gutterBottom>
                Price History
              </Typography>
              <Line
                data={{
                  labels: priceHistory.map((p) => p.time.toLocaleTimeString()),
                  datasets: Object.keys(results).map((prov) => ({
                    label: prov,
                    data: priceHistory.map((p) => p.data[prov]?.price || null),
                    borderColor:
                      prov === "AWS" ? "gold" : prov === "Azure" ? "blue" : "red",
                    fill: false,
                    tension: 0.3,
                  })),
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
                height={200}
              />
            </Box>
          )}
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            py: 4,
            px: { xs: 2, sm: 4, md: 6 },
            width: "100%",
          }}
        >
          <Grid container sx={{ maxWidth: 1200 }} spacing={4}>
            {Object.entries(resources).map(([cloud, categories]) => (
              <Grid
                item
                xs={12}
                sm={4}
                key={cloud}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={theme.palette.mode === "dark" ? "#fff" : "#000"}
                  mb={2}
                  sx={{
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {cloud}{" "}
                  {cloud === "AWS" ? (
                    <AwsIcon color="primary" />
                  ) : cloud === "Azure" ? (
                    <AzureIcon color="primary" />
                  ) : (
                    <GcpIcon color="primary" />
                  )}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, maxWidth: 300 }}>
                  {Object.values(categories)
                    .flat()
                    .map(({ label, url }) => (
                      <Link
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                            color: theme.palette.primary.main,
                          },
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                </Box>
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            © 2025, Cloud Infra Explorer. All rights reserved.
          </Typography>
        </Box>

        {/* Bottom right icons container */}
        <Box sx={iconsContainerStyles}>
          {/* Back to Top Button */}
          <Tooltip title="Back to Top">
            <Fab
              size="small"
              aria-label="Back to top"
              color="primary"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              sx={sharedIconStyles}
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Tooltip>
          {/* Calculator toggle */}
          <Tooltip title={calculatorOpen ? "Close calculator" : "Open calculator"}>
            <IconButton
              aria-label={calculatorOpen ? "Close calculator" : "Open calculator"}
              onClick={() => setCalculatorOpen((o) => !o)}
              sx={sharedIconStyles}
            >
              <CalculateIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Calculator popup fixed just above the calculator icon */}
        {calculatorOpen && (
          <Box sx={{ position: "fixed", bottom: 80, right: 20, zIndex: 1500 }}>
            <SimpleCalculator onClose={() => setCalculatorOpen(false)} />
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
