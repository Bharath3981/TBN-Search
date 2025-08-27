import { useState, useEffect, useCallback } from "react";
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import useDebounce from "./hooks/useDebounce";

// ---- Mock data (series + episodes) ----
type Item = {
  id: string;
  kind: "series" | "episode";
  title: string;
  description?: string;
  image: string;
  raw?: ApiItem; // keep full API record for dialog
};

// ---- API response shape (subset) ----
type ApiItem = {
  id: string;
  externalId?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  tags?: string[];
  documentType: "media" | "playlist";
};
type ApiResponse = {
  message: string;
  data: {
    engine: string;
    limit: number;
    page: number;
    results: ApiItem[];
    total: number;
  };
};

// Dark theme similar to the reference UI
const theme = createTheme({
  palette: { mode: "dark", background: { default: "#0e0e0e", paper: "#121212" } },
  shape: { borderRadius: 10 },
});

// Base API URL can be changed globally via env: VITE_API_BASE_URL (fallback '/api')
const API_BASE = "http://localhost:3000/api";

// Map API item -> UI Item
function mapApiToItem(ai: ApiItem): Item {
  return {
    id: ai.id,
    kind: ai.documentType === "playlist" ? "series" : "episode",
    title: ai.title,
    description: ai.description || "",
    image:
      ai.thumbnailUrl ||
      "",
    raw: ai,
  };
}

function MediaCard({ item, onClick }: { item: Item; onClick?: (item: Item) => void }) {
  return (
    <Card sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
      <CardActionArea onClick={onClick ? () => onClick(item) : undefined}>
        <Box sx={{ position: "relative" }}>
          <CardMedia component="img" height={180} image={item.image} alt={item.title} loading="lazy" />
          <Chip
            label={item.kind === "series" ? "Series" : "Episode"}
            size="small"
            color="primary"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>
        <CardContent sx={{ pt: 1.5 }}>
          <Typography variant="subtitle2" noWrap title={item.title}>
            {item.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            title={item.description || ""}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mt: 0.25,
            }}
          >
            {item.description || " "}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function App() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"episodes" | "series">("series");
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{ series: number; episodes: number }>({ series: 0, episodes: 0 });
  const [seriesItems, setSeriesItems] = useState<Item[]>([]);
  const [episodeItems, setEpisodeItems] = useState<Item[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);
  const debouncedQ = useDebounce(q, 500);
  const [engine, setEngine] = useState<"al" | "es">("al"); // Algolia (al) or Elasticsearch (es)
  const [language, setLanguage] = useState<string>("en");

  const visible = tab === "series" ? seriesItems : episodeItems;

  async function fetchOne(documentType: "playlist" | "media", qv: string) {
    const params = new URLSearchParams();
    params.set("q", qv);
    params.set("documentType", documentType);
    if (language) params.set("language", language);
    const url = `${API_BASE}/search/${engine}?${params.toString()}`;
    const res = await fetch(url);
    const data: ApiResponse = await res.json();
    const arr = data?.data?.results ?? [];
    return {
      mapped: arr.map(mapApiToItem),
      total: data?.data?.total ?? 0,
    };
  }

  const fetchData = useCallback(async () => {
    // Only query when user typed something
    const qv = debouncedQ.trim();
    if (!qv) {
      setLoading(true);
      try {
        const [seriesAll, episodesAll] = await Promise.all([
          fetchOne("playlist", ""),
          fetchOne("media", ""),
        ]);
        setCounts({ series: seriesAll.total, episodes: episodesAll.total });
        setSeriesItems(seriesAll.mapped);
        setEpisodeItems(episodesAll.mapped);
      } catch (err) {
        console.error("Fetch all failed", err);
        setSeriesItems([]);
        setEpisodeItems([]);
        setCounts({ series: 0, episodes: 0 });
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      // Always fetch both totals in parallel so tab counts stay accurate.
      const [seriesRes, episodesRes] = await Promise.all([
        fetchOne("playlist", qv),
        fetchOne("media", qv),
      ]);

      // Update counts from totals returned by API
      setCounts({ series: seriesRes.total, episodes: episodesRes.total });
      setSeriesItems(seriesRes.mapped);
      setEpisodeItems(episodesRes.mapped);
    } catch (err) {
      console.error("Search fetch failed", err);
      setSeriesItems([]);
      setEpisodeItems([]);
      setCounts({ series: 0, episodes: 0 });
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, engine, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCardClick = (it: Item) => {
    // prefer full raw from API; fallback to minimal Item
    setDialogData(it.raw ?? it);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh" }}>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            top: 0,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backdropFilter: "saturate(180%) blur(8px)",
            backgroundColor: "rgba(18,18,18,0.72)",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Container maxWidth={false} sx={{ py: 1.5, px: 3 }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <TextField
                fullWidth
                size="small" // reduce height
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                slotProps={{
                  input: {
                    sx: { bgcolor: "transparent" },
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: q ? (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setQ("")}>
                          <CloseIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
              />
              <TextField
                select
                label="Engine"
                size="small"
                value={engine}
                onChange={(e) => setEngine(e.target.value as "al" | "es")}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="al">Algolia</MenuItem>
                <MenuItem value="es">Elasticsearch</MenuItem>
              </TextField>
              <TextField
                select
                label="Lang"
                size="small"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="en">English (en)</MenuItem>
                <MenuItem value="es">English Africa (es)</MenuItem>
                <MenuItem value="fr">French (fr)</MenuItem>
                <MenuItem value="de">German (de)</MenuItem>
                <MenuItem value="uk">Ukrainian (uk)</MenuItem>
                <MenuItem value="en-gb">British English (en-gb)</MenuItem>
                <MenuItem value="uk">Ukrainian (uk)</MenuItem>
              </TextField>
            </Box>
          </Container>
        </AppBar>

        <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
          {/* Tabs header line with counts */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label={`Series (${counts.series})`} value="series" />
              <Tab label={`Episodes (${counts.episodes})`} value="episodes" />
            </Tabs>
          </Box>

          {/* Grid of placeholder cards */}
          {loading && (
            <Typography variant="body2" sx={{ mb: 1, px: 0.5 }}>
              Loading…
            </Typography>
          )}
          <Box sx={{ width: "100%", maxWidth: 1480 }}>
            <Grid container spacing={2}>
              {visible.map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
                  <MediaCard item={item} onClick={handleCardClick} />
                </Grid>
              ))}
            </Grid>
          </Box>
          <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
            <DialogTitle>Record JSON</DialogTitle>
            <DialogContent dividers>
              <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", fontSize: 12 }}>
                {dialogData ? JSON.stringify(dialogData, null, 2) : "No data"}
              </Box>
            </DialogContent>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
